import { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Database, Table2, Copy, Check, Code2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import './SchemaViewer.css';

// ─── SQL Schema definition ────────────────────────────────────
const SCHEMA = {
  customers: {
    icon: '👤',
    desc: 'Registered platform customers',
    columns: [
      { name: 'customer_id', type: 'INTEGER', pk: true,  nullable: false },
      { name: 'name',        type: 'TEXT',    pk: false, nullable: false },
      { name: 'email',       type: 'TEXT',    pk: false, nullable: false, unique: true },
      { name: 'country',     type: 'TEXT',    pk: false, nullable: false },
      { name: 'city',        type: 'TEXT',    pk: false, nullable: true  },
      { name: 'plan',        type: 'TEXT',    pk: false, nullable: false, note: 'starter | pro | enterprise' },
      { name: 'signup_date', type: 'TEXT',    pk: false, nullable: false, note: 'YYYY-MM-DD' },
      { name: 'churned',     type: 'INTEGER', pk: false, nullable: false, note: '0 or 1' },
      { name: 'referral_id', type: 'INTEGER', pk: false, nullable: true,  fk: 'customers.customer_id' },
    ],
  },
  orders: {
    icon: '📦',
    desc: 'Customer purchase transactions',
    columns: [
      { name: 'order_id',       type: 'INTEGER', pk: true,  nullable: false },
      { name: 'customer_id',    type: 'INTEGER', pk: false, nullable: false, fk: 'customers.customer_id' },
      { name: 'order_date',     type: 'TEXT',    pk: false, nullable: false, note: 'YYYY-MM-DD' },
      { name: 'status',         type: 'TEXT',    pk: false, nullable: false, note: 'completed | refunded | cancelled' },
      { name: 'total_amount',   type: 'REAL',    pk: false, nullable: false },
      { name: 'payment_method', type: 'TEXT',    pk: false, nullable: true,  note: 'card | paypal | wire' },
      { name: 'coupon_code',    type: 'TEXT',    pk: false, nullable: true  },
    ],
  },
  order_items: {
    icon: '🧾',
    desc: 'Individual line items within orders',
    columns: [
      { name: 'item_id',    type: 'INTEGER', pk: true,  nullable: false },
      { name: 'order_id',   type: 'INTEGER', pk: false, nullable: false, fk: 'orders.order_id' },
      { name: 'product_id', type: 'INTEGER', pk: false, nullable: false, fk: 'products.product_id' },
      { name: 'quantity',   type: 'INTEGER', pk: false, nullable: false },
      { name: 'unit_price', type: 'REAL',    pk: false, nullable: false },
      { name: 'discount',   type: 'REAL',    pk: false, nullable: false, note: 'percentage 0–100' },
    ],
  },
  products: {
    icon: '🛒',
    desc: 'Product catalog',
    columns: [
      { name: 'product_id',  type: 'INTEGER', pk: true,  nullable: false },
      { name: 'name',        type: 'TEXT',    pk: false, nullable: false },
      { name: 'category_id', type: 'INTEGER', pk: false, nullable: false, fk: 'categories.category_id' },
      { name: 'price',       type: 'REAL',    pk: false, nullable: false },
      { name: 'cost',        type: 'REAL',    pk: false, nullable: false },
      { name: 'stock',       type: 'INTEGER', pk: false, nullable: false },
      { name: 'is_active',   type: 'INTEGER', pk: false, nullable: false, note: '0 or 1' },
    ],
  },
  categories: {
    icon: '🏷️',
    desc: 'Product category taxonomy',
    columns: [
      { name: 'category_id', type: 'INTEGER', pk: true,  nullable: false },
      { name: 'name',        type: 'TEXT',    pk: false, nullable: false },
      { name: 'description', type: 'TEXT',    pk: false, nullable: true  },
    ],
  },
};

const TYPE_COLOR = {
  INTEGER: 'type-int',
  REAL:    'type-real',
  TEXT:    'type-text',
  BOOLEAN: 'type-bool',
};

// ─── JSON Schema converter ────────────────────────────────────
const SQL_TYPE_MAP = {
  INTEGER: 'integer',
  REAL:    'number',
  TEXT:    'string',
  BOOLEAN: 'boolean',
};

const SCHEMA_URLS = {
  'draft-2020-12': 'https://json-schema.org/draft/2020-12/schema',
  'draft-07':      'http://json-schema.org/draft-07/schema#',
  'draft-04':      'http://json-schema.org/draft-04/schema#',
  'openapi-3.0':   null, // no $schema in OpenAPI
};

function tableToObjectSchema(tableName, table, target) {
  const properties = {};
  const required = [];

  for (const col of table.columns) {
    const prop = {};
    const jsonType = SQL_TYPE_MAP[col.type] ?? 'string';

    if (target === 'openapi-3.0' && col.nullable && !col.pk) {
      prop.type = jsonType;
      prop.nullable = true;
    } else if (!col.nullable || col.pk) {
      prop.type = jsonType;
    } else {
      // nullable in draft targets → anyOf [type, null]
      if (target === 'draft-2020-12') {
        prop.type = [jsonType, 'null'];
      } else {
        prop.anyOf = [{ type: jsonType }, { type: 'null' }];
      }
    }

    if (col.pk)     prop.description = 'Primary key';
    else if (col.fk) prop.description = `Foreign key → ${col.fk}`;
    else if (col.note) prop.description = col.note;

    if (col.unique) prop['x-unique'] = true;

    properties[col.name] = prop;
    if (!col.nullable) required.push(col.name);
  }

  const obj = { type: 'object', properties };
  if (required.length) obj.required = required;
  if (target !== 'openapi-3.0') obj.additionalProperties = false;
  obj.title = tableName;
  obj.description = table.desc;

  return obj;
}

function buildJSONSchema(selectedTable, target) {
  const schemaUrl = SCHEMA_URLS[target];
  const defsKey   = target === 'draft-2020-12' ? '$defs' : 'definitions';

  if (selectedTable === '__all') {
    const defs = {};
    for (const [tblName, tbl] of Object.entries(SCHEMA)) {
      defs[tblName] = tableToObjectSchema(tblName, tbl, target);
    }
    const result = {};
    if (schemaUrl) result.$schema = schemaUrl;
    result[defsKey] = defs;
    return result;
  }

  const tbl = SCHEMA[selectedTable];
  if (!tbl) return {};
  const obj = tableToObjectSchema(selectedTable, tbl, target);
  const result = {};
  if (schemaUrl) result.$schema = schemaUrl;
  return { ...result, ...obj };
}

// ─── Syntax highlighter ───────────────────────────────────────
function syntaxHighlight(json) {
  return json.replace(
    /("(\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        return /:$/.test(match)
          ? `<span class="jk">${match}</span>`
          : `<span class="jv">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="jb">${match}</span>`;
      if (/null/.test(match))       return `<span class="jn">${match}</span>`;
      return `<span class="ji">${match}</span>`;
    }
  );
}

// ─── Component ────────────────────────────────────────────────
export default function SchemaViewer({ onClose }) {
  const { runQuery, ready } = useDatabase();

  // tabs
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'json'

  // tables tab state
  const [expanded,    setExpanded]    = useState({ customers: true });
  const [previewTbl,  setPreviewTbl]  = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPrev, setLoadingPrev] = useState(false);

  // json schema tab state
  const [target,        setTarget]        = useState('draft-2020-12');
  const [selectedTable, setSelectedTable] = useState('__all');
  const [copied,        setCopied]        = useState(false);

  const jsonSchema   = buildJSONSchema(selectedTable, target);
  const jsonString   = JSON.stringify(jsonSchema, null, 2);
  const highlighted  = syntaxHighlight(jsonString);

  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [jsonString]);

  const toggleExpand = (tbl) => setExpanded(e => ({ ...e, [tbl]: !e[tbl] }));

  const loadPreview = (tbl) => {
    if (previewTbl === tbl) { setPreviewTbl(null); setPreviewData(null); return; }
    if (!ready) return;
    setLoadingPrev(true);
    setPreviewTbl(tbl);
    try {
      const data = runQuery(`SELECT * FROM ${tbl} LIMIT 5`);
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    }
    setLoadingPrev(false);
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="schema-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="schema-modal fade-in">

        {/* ── Header ── */}
        <div className="sm-header">
          <div className="sm-header-left">
            <Database size={18} className="sm-header-icon" />
            <div>
              <div className="sm-title">Database Schema</div>
              <div className="sm-subtitle">5 tables · 3 relationships</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="sm-tabs">
            <button
              className={`sm-tab ${activeTab === 'tables' ? 'active' : ''}`}
              onClick={() => setActiveTab('tables')}
            >
              <Table2 size={13} /> Tables
            </button>
            <button
              className={`sm-tab ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <Code2 size={13} /> JSON Schema
            </button>
          </div>

          <button className="sm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ════════════ TABLES TAB ════════════ */}
        {activeTab === 'tables' && (
          <div className="sm-body">
            <div className="sm-tables">
              {Object.entries(SCHEMA).map(([tblName, tbl]) => {
                const isExp  = !!expanded[tblName];
                const isPrev = previewTbl === tblName;
                return (
                  <div key={tblName} className={`sm-table ${isExp ? 'expanded' : ''} ${isPrev ? 'previewing' : ''}`}>
                    <div className="sm-table-hdr" onClick={() => toggleExpand(tblName)}>
                      <span className="sm-table-toggle">
                        {isExp ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                      </span>
                      <span className="sm-table-icon">{tbl.icon}</span>
                      <span className="sm-table-name">{tblName}</span>
                      <span className="sm-table-count">{tbl.columns.length} cols</span>
                      <button
                        className={`sm-preview-btn ${isPrev ? 'active' : ''}`}
                        onClick={e => { e.stopPropagation(); loadPreview(tblName); }}
                        title="Preview rows"
                      >
                        <Table2 size={12}/> {isPrev ? 'Hide' : 'Preview'}
                      </button>
                    </div>

                    {isExp && <div className="sm-table-desc">{tbl.desc}</div>}

                    {isExp && (
                      <div className="sm-cols">
                        {tbl.columns.map(col => (
                          <div key={col.name} className="sm-col-row">
                            <div className="sm-col-left">
                              {col.pk
                                ? <span className="col-pk-icon" title="Primary Key">🔑</span>
                                : col.fk
                                ? <span className="col-fk-icon" title={`FK → ${col.fk}`}>🔗</span>
                                : <span className="col-plain-icon" />
                              }
                              <span className="col-name">{col.name}</span>
                              {col.unique && <span className="col-tag unique">unique</span>}
                              {!col.nullable && !col.pk && <span className="col-tag notnull">not null</span>}
                            </div>
                            <div className="sm-col-right">
                              {col.note && <span className="col-note">{col.note}</span>}
                              {col.fk   && <span className="col-fk-ref">→ {col.fk}</span>}
                              <span className={`col-type ${TYPE_COLOR[col.type] || ''}`}>{col.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isPrev && (
                      <div className="sm-preview-wrap">
                        {loadingPrev ? (
                          <div className="sm-preview-loading"><span className="spinner" style={{width:14,height:14}}/> Loading…</div>
                        ) : previewData ? (
                          <div className="sm-preview-table-wrap">
                            <table className="sm-preview-table">
                              <thead><tr>{previewData.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                              <tbody>
                                {previewData.rows.map((row, i) => (
                                  <tr key={i}>
                                    {row.map((cell, j) => (
                                      <td key={j}>{cell === null ? <span className="null-val">NULL</span> : String(cell).slice(0, 32)}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="sm-preview-empty">No data available</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sm-erd-hint">
              <div className="sm-erd-title">Relationships</div>
              <div className="sm-erd-rows">
                <div className="sm-erd-row"><span>customers</span><span className="erd-arrow">→</span><span>orders</span><span className="erd-via">via customer_id</span></div>
                <div className="sm-erd-row"><span>orders</span><span className="erd-arrow">→</span><span>order_items</span><span className="erd-via">via order_id</span></div>
                <div className="sm-erd-row"><span>products</span><span className="erd-arrow">→</span><span>order_items</span><span className="erd-via">via product_id</span></div>
                <div className="sm-erd-row"><span>categories</span><span className="erd-arrow">→</span><span>products</span><span className="erd-via">via category_id</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ JSON SCHEMA TAB ════════════ */}
        {activeTab === 'json' && (
          <div className="sm-body sm-json-body">

            {/* Controls bar */}
            <div className="js-controls">
              {/* Target selector */}
              <div className="js-ctrl-group">
                <span className="js-ctrl-label">target</span>
                <div className="js-target-pills">
                  {['draft-2020-12', 'draft-07', 'draft-04', 'openapi-3.0'].map(t => (
                    <button
                      key={t}
                      className={`js-pill ${target === t ? 'active' : ''}`}
                      onClick={() => setTarget(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table selector */}
              <div className="js-ctrl-group">
                <span className="js-ctrl-label">table</span>
                <select
                  className="js-table-select"
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                >
                  <option value="__all">All tables ($defs)</option>
                  {Object.entries(SCHEMA).map(([tblName, tbl]) => (
                    <option key={tblName} value={tblName}>{tbl.icon} {tblName}</option>
                  ))}
                </select>
              </div>

              {/* Copy button */}
              <button className={`js-copy-btn ${copied ? 'copied' : ''}`} onClick={copyJSON}>
                {copied ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Copy</>}
              </button>
            </div>

            {/* JSON output */}
            <div className="js-output-wrap">
              <pre
                className="js-output"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>

            {/* Footer hint */}
            <div className="js-footer">
              <span className="js-footer-info">
                Matches <code>toJSONSchema()</code> output format ·{' '}
                {target === 'draft-2020-12' && 'uses $defs + type arrays for nullable'}
                {target === 'draft-07'      && 'uses definitions + anyOf for nullable'}
                {target === 'draft-04'      && 'uses definitions + anyOf for nullable'}
                {target === 'openapi-3.0'   && 'uses nullable:true · no $schema header'}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
