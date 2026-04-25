import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection, dropCursor } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { highlightSelectionMatches } from '@codemirror/search';
import './SqlEditor.css';

const SQL_TABLES = {
  customers:   ['customer_id','name','email','country','city','plan','signup_date','churned','referral_id'],
  orders:      ['order_id','customer_id','order_date','status','total_amount','payment_method','coupon_code'],
  order_items: ['item_id','order_id','product_id','quantity','unit_price','discount'],
  products:    ['product_id','name','category_id','price','cost','stock','is_active'],
  categories:  ['category_id','name','description'],
};

export default function SqlEditor({ value, onChange, onRun, disabled }) {
  const containerRef = useRef(null);
  const viewRef      = useRef(null);
  const latestOnChange = useRef(onChange);
  const latestOnRun    = useRef(onRun);

  useEffect(() => { latestOnChange.current = onChange; }, [onChange]);
  useEffect(() => { latestOnRun.current    = onRun;    }, [onRun]);

  useEffect(() => {
    if (!containerRef.current) return;

    // SQL autocomplete schema
    const sqlCompletion = sql({
      schema: SQL_TABLES,
      tables: Object.keys(SQL_TABLES).map(name => ({ label: name, type: 'keyword' })),
    });

    // Ctrl+Enter run shortcut
    const runKeymap = keymap.of([{
      key: 'Ctrl-Enter', mac: 'Cmd-Enter',
      run: () => { latestOnRun.current?.(); return true; },
    }]);

    const startState = EditorState.create({
      doc: value || '',
      extensions: [
        oneDark,
        sqlCompletion,
        lineNumbers(),
        history(),
        drawSelection(),
        dropCursor(),
        highlightActiveLineGutter(),
        highlightSelectionMatches(),
        autocompletion(),
        runKeymap,
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) latestOnChange.current?.(update.state.doc.toString());
        }),
        EditorView.theme({
          '&': { height: '100%', minHeight: '220px', fontSize: '13.5px', fontFamily: "'JetBrains Mono', monospace" },
          '.cm-content': { padding: '14px 4px', lineHeight: '1.75' },
          '.cm-gutters': { background: '#0d1117', border: 'none', paddingRight: '8px' },
          '.cm-lineNumbers .cm-gutterElement': { color: '#3d5a73', minWidth: '32px' },
          '.cm-activeLine': { backgroundColor: 'rgba(0,230,180,.04)' },
          '.cm-cursor': { borderLeftColor: '#00e6b4' },
          '.cm-selectionBackground, ::selection': { background: 'rgba(0,230,180,.15) !important' },
          '.cm-scroller': { borderRadius: '0 0 12px 12px', overflowX: 'auto' },
          '&.cm-focused': { outline: 'none' },
        }),
        EditorView.editable.of(!disabled),
      ],
    });

    const view = new EditorView({ state: startState, parent: containerRef.current });
    viewRef.current = view;

    return () => { view.destroy(); viewRef.current = null; };
  }, []); // eslint-disable-line

  // Sync external value changes (e.g. "Show Answer" button)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value || '' } });
    }
  }, [value]);

  return (
    <div className="sql-editor-wrap">
      <div ref={containerRef} className="cm-container" />
    </div>
  );
}
