import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Database, Table2, Hash, Type, ToggleLeft } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import './SchemaViewer.css';

// Full schema definition with column types
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

export default function SchemaViewer({ onClose }) {
  const { runQuery, ready } = useDatabase();
  const [expanded,   setExpanded]   = useState({ customers: true });
  const [previewTbl, setPreviewTbl] = useState(null);
  const [previewData,setPreviewData]= useState(null);
  const [loadingPrev,setLoadingPrev]= useState(false);

  const toggleExpand = (tbl) => {
    setExpanded(e => ({ ...e, [tbl]: !e[tbl] }));
  };

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

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="schema-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="schema-modal fade-in">
        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-left">
            <Database size={18} className="sm-header-icon" />
            <div>
              <div className="sm-title">Database Schema</div>
              <div className="sm-subtitle">5 tables · Click a table to expand · Preview rows below</div>
            </div>
          </div>
          <button className="sm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="sm-body">
          {/* Table list */}
          <div className="sm-tables">
            {Object.entries(SCHEMA).map(([tblName, tbl]) => {
              const isExp  = !!expanded[tblName];
              const isPrev = previewTbl === tblName;

              return (
                <div key={tblName} className={`sm-table ${isExp ? 'expanded' : ''} ${isPrev ? 'previewing' : ''}`}>
                  {/* Table header row */}
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

                  {/* Table description */}
                  {isExp && (
                    <div className="sm-table-desc">{tbl.desc}</div>
                  )}

                  {/* Columns */}
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
                            {col.fk && <span className="col-fk-ref">→ {col.fk}</span>}
                            <span className={`col-type ${TYPE_COLOR[col.type] || ''}`}>{col.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row preview */}
                  {isPrev && (
                    <div className="sm-preview-wrap">
                      {loadingPrev ? (
                        <div className="sm-preview-loading"><span className="spinner" style={{width:14,height:14}}/> Loading…</div>
                      ) : previewData ? (
                        <div className="sm-preview-table-wrap">
                          <table className="sm-preview-table">
                            <thead>
                              <tr>{previewData.columns.map(c => <th key={c}>{c}</th>)}</tr>
                            </thead>
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

          {/* ERD relationships legend */}
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
      </div>
    </div>
  );
}
