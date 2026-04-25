import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, RotateCcw, BarChart2, Layers,
  ChevronRight, ChevronDown, BookOpen, ArrowRight, Zap
} from 'lucide-react';
import './Learn.css';

const MODULES = [
  {
    id: 'sales',
    icon: <TrendingUp size={22} />,
    title: 'SQL for Sales Analysis',
    color: 'teal',
    tagline: 'Turn raw transactions into revenue insights.',
    lessons: [
      {
        title: 'Total & Average Revenue',
        concept: 'Aggregations are your first tool. SUM, AVG, COUNT, MAX, and MIN collapse many rows into a single meaningful number.',
        scenario: 'The VP of Sales wants to know total Q1 revenue and the average deal size to set realistic quotas.',
        query: `SELECT
  SUM(total_amount)        AS q1_revenue,
  AVG(total_amount)        AS avg_deal_size,
  COUNT(*)                 AS total_orders,
  MAX(total_amount)        AS largest_deal
FROM orders
WHERE status = 'completed'
  AND order_date BETWEEN '2024-01-01' AND '2024-03-31';`,
        output: 'One row: q1_revenue=4827.43, avg_deal_size=482.74, total_orders=10, largest_deal=799.99',
        insight: 'With a single query you answer four exec questions simultaneously. Note: always filter by status = \'completed\' to exclude refunds from revenue figures.',
      },
      {
        title: 'Revenue by Segment',
        concept: 'GROUP BY partitions your data into groups. Combine it with HAVING to filter those groups — like WHERE but applied after aggregation.',
        scenario: 'Marketing wants to know which customer plan generates the most revenue, and which plans to double-down on.',
        query: `SELECT
  c.plan,
  COUNT(DISTINCT c.customer_id)  AS customers,
  SUM(o.total_amount)            AS total_revenue,
  AVG(o.total_amount)            AS avg_order
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.plan
HAVING COUNT(*) >= 3
ORDER BY total_revenue DESC;`,
        output: 'Rows per plan: enterprise=highest revenue, pro=mid, starter=lowest. HAVING removes plans with <3 orders.',
        insight: 'HAVING is GROUP BY\'s WHERE. Use it to filter aggregate results — you can\'t use WHERE here because totals don\'t exist yet when WHERE runs.',
      },
      {
        title: 'Month-over-Month Growth',
        concept: 'Window functions like LAG() let you reference the previous row — perfect for calculating growth rates without self-joins.',
        scenario: 'The board wants a MoM revenue growth chart for the investor deck.',
        query: `WITH monthly AS (
  SELECT
    strftime('%Y-%m', order_date)  AS month,
    SUM(total_amount)              AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY month
)
SELECT
  month,
  revenue,
  LAG(revenue) OVER (ORDER BY month)                            AS prev_month,
  ROUND(
    (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0
    / LAG(revenue) OVER (ORDER BY month), 1
  )                                                             AS growth_pct
FROM monthly
ORDER BY month;`,
        output: 'Each row shows month, revenue, previous month\'s revenue, and % growth. First row has NULL for prev_month.',
        insight: 'LAG(col, 1) looks one row back in the window. LEAD() looks forward. These are irreplaceable for time-series comparisons.',
      },
    ],
  },
  {
    id: 'product',
    icon: <BarChart2 size={22} />,
    title: 'SQL for Product Metrics',
    color: 'cyan',
    tagline: 'Understand what users buy, use, and abandon.',
    lessons: [
      {
        title: 'Top Products by Revenue',
        concept: 'JOINs combine related tables. INNER JOIN returns only rows that have matches in both tables. Use this to link purchases to product metadata.',
        scenario: 'The product team wants to know which products drive the most revenue to prioritise the roadmap.',
        query: `SELECT
  p.name                            AS product_name,
  cat.name                          AS category,
  COUNT(oi.item_id)                 AS times_ordered,
  SUM(oi.quantity * oi.unit_price)  AS total_revenue,
  RANK() OVER (
    ORDER BY SUM(oi.quantity * oi.unit_price) DESC
  )                                 AS revenue_rank
FROM products p
JOIN categories     cat ON p.category_id   = cat.category_id
JOIN order_items    oi  ON p.product_id    = oi.product_id
GROUP BY p.product_id, p.name, cat.name
ORDER BY revenue_rank;`,
        output: 'Ranked product list with category, order count, and total revenue. RANK() handles ties.',
        insight: 'Combining RANK() with GROUP BY is a common pattern for leaderboard queries. RANK() gives tied rows the same rank; ROW_NUMBER() doesn\'t.',
      },
      {
        title: 'Products Never Purchased',
        concept: 'LEFT JOIN returns all rows from the left table, with NULLs where no match exists on the right. Filtering WHERE right.id IS NULL finds the unmatched rows.',
        scenario: 'The inventory team suspects some products were listed but never sold. Find dead stock.',
        query: `SELECT
  p.name,
  p.price,
  cat.name  AS category
FROM products p
LEFT JOIN categories  cat ON p.category_id  = cat.category_id
LEFT JOIN order_items oi  ON p.product_id   = oi.product_id
WHERE oi.item_id IS NULL
  AND p.is_active = 1
ORDER BY p.price DESC;`,
        output: 'Products listed with no order_items matches — these have never been purchased.',
        insight: 'LEFT JOIN + IS NULL is more readable and often faster than NOT IN (subquery). It\'s the go-to pattern for "find things that don\'t have a related record".',
      },
      {
        title: 'CASE WHEN Segmentation',
        concept: 'CASE WHEN is SQL\'s if/else. Use it to create derived columns: labels, tiers, flags — anything that needs conditional logic.',
        scenario: 'The analytics team wants products labelled as Premium, Standard, or Basic based on price.',
        query: `SELECT
  p.name,
  p.price,
  cat.name  AS category,
  CASE
    WHEN p.price >= 300 THEN 'Premium'
    WHEN p.price >= 150 THEN 'Standard'
    ELSE                     'Basic'
  END       AS price_tier,
  ROUND(p.price - p.cost, 2)          AS gross_margin,
  ROUND((p.price - p.cost) / p.price * 100, 1) AS margin_pct
FROM products p
JOIN categories cat ON p.category_id = cat.category_id
WHERE p.is_active = 1
ORDER BY p.price DESC;`,
        output: 'Each product with its tier label, gross margin £ and % — ready for a BI dashboard.',
        insight: 'You can use CASE WHEN inside GROUP BY, ORDER BY, and even HAVING. It\'s one of the most versatile tools in SQL.',
      },
    ],
  },
  {
    id: 'retention',
    icon: <RotateCcw size={22} />,
    title: 'SQL for Retention & Cohorts',
    color: 'purple',
    tagline: 'Measure loyalty, spot churn, understand lifetime value.',
    lessons: [
      {
        title: 'Cohort Analysis',
        concept: 'A cohort is a group of users who share a common characteristic in a time period — typically their sign-up month. Cohort analysis reveals how each group behaves over time.',
        scenario: 'The growth team wants to know how many customers from each signup cohort placed at least one order.',
        query: `SELECT
  strftime('%Y-%m', c.signup_date)  AS cohort_month,
  COUNT(DISTINCT c.customer_id)     AS cohort_size,
  COUNT(DISTINCT o.customer_id)     AS converted,
  ROUND(
    COUNT(DISTINCT o.customer_id) * 100.0
    / COUNT(DISTINCT c.customer_id), 1
  )                                 AS conversion_rate_pct
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY cohort_month
ORDER BY cohort_month;`,
        output: 'Per-cohort table: how many signed up, how many converted, and the conversion rate %.',
        insight: 'This is the foundation of cohort analysis. Once you have this, you can slice by plan, country, or channel. The LEFT JOIN ensures even zero-order cohorts appear.',
      },
      {
        title: 'Repeat Purchase Rate',
        concept: 'CTEs (WITH clauses) let you write modular SQL — define a named result set, then query it like a table. Essential for multi-step analysis.',
        scenario: 'Customer success wants to know what percentage of customers in each plan placed 2+ orders.',
        query: `WITH repeat_buyers AS (
  SELECT customer_id
  FROM   orders
  GROUP  BY customer_id
  HAVING COUNT(*) >= 2
)
SELECT
  c.plan,
  COUNT(DISTINCT c.customer_id)   AS total_customers,
  COUNT(DISTINCT rb.customer_id)  AS repeat_buyers,
  ROUND(
    COUNT(DISTINCT rb.customer_id) * 100.0
    / COUNT(DISTINCT c.customer_id), 1
  )                               AS repeat_rate_pct
FROM customers c
LEFT JOIN repeat_buyers rb ON c.customer_id = rb.customer_id
GROUP BY c.plan
ORDER BY repeat_rate_pct DESC;`,
        output: 'Per-plan breakdown: which plan has the highest repeat purchase rate. Enterprise typically leads.',
        insight: 'CTEs keep complex logic readable. This query would be a tangled mess as a single statement. Name your CTEs descriptively — future-you will thank you.',
      },
      {
        title: 'Customer LTV Segments',
        concept: 'Window functions like NTILE() distribute rows into buckets. ROW_NUMBER() and RANK() number rows within partitions.',
        scenario: 'Finance wants customers bucketed into 4 LTV quartiles for targeted upsell campaigns.',
        query: `WITH lifetime_value AS (
  SELECT
    c.customer_id,
    c.name,
    c.plan,
    COUNT(o.order_id)        AS order_count,
    SUM(o.total_amount)      AS total_spent,
    AVG(o.total_amount)      AS avg_order
  FROM customers c
  JOIN orders o ON c.customer_id = o.customer_id
  GROUP BY c.customer_id, c.name, c.plan
)
SELECT
  name, plan, order_count,
  ROUND(total_spent, 2)  AS total_spent,
  NTILE(4) OVER (ORDER BY total_spent DESC)  AS ltv_quartile,
  CASE NTILE(4) OVER (ORDER BY total_spent DESC)
    WHEN 1 THEN 'Platinum'
    WHEN 2 THEN 'Gold'
    WHEN 3 THEN 'Silver'
    ELSE        'Bronze'
  END                    AS ltv_tier
FROM lifetime_value
ORDER BY total_spent DESC;`,
        output: 'Each customer with their LTV quartile (1=top 25%) and a human-readable tier label.',
        insight: 'NTILE(4) splits rows into 4 equal groups by the ORDER BY column. Combine it with CASE WHEN to add readable labels. This pattern drives most CLV segmentation models.',
      },
    ],
  },
  {
    id: 'analyst',
    icon: <Layers size={22} />,
    title: 'How Analysts Think in SQL',
    color: 'gold',
    tagline: 'Mental models and professional patterns.',
    lessons: [
      {
        title: 'The Analyst\'s Query Blueprint',
        concept: 'Senior analysts write SQL in a consistent pattern: define what you need (SELECT), where it lives (FROM/JOIN), filter (WHERE), group (GROUP BY), filter groups (HAVING), and sort (ORDER BY).',
        scenario: 'A new analyst joins the team and needs to understand the standard approach for business queries.',
        query: `-- Step 1: Start with the grain (what is one row?)
-- Here: one row = one customer plan
-- Step 2: List what you need
SELECT
  c.plan,
  COUNT(DISTINCT c.customer_id)  AS customers,
  SUM(o.total_amount)            AS revenue,
  AVG(o.total_amount)            AS avg_order,
  MIN(o.order_date)              AS first_order,
  MAX(o.order_date)              AS last_order

-- Step 3: Define your tables
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id

-- Step 4: Filter rows BEFORE aggregation
WHERE o.status = 'completed'
  AND o.order_date >= '2023-01-01'

-- Step 5: Aggregate
GROUP BY c.plan

-- Step 6: Filter GROUPS (after aggregation)
HAVING COUNT(*) > 2

-- Step 7: Sort
ORDER BY revenue DESC;`,
        output: 'A plan-level summary table — the exact structure a business stakeholder would ask for.',
        insight: 'Always think about "grain" first: what does one row represent? Everything else follows. Comments in SQL are professional, not optional.',
      },
      {
        title: 'Subqueries vs CTEs',
        concept: 'Both subqueries and CTEs let you nest queries. CTEs (WITH) are preferred for readability. Subqueries work for quick inline filters and EXISTS checks.',
        scenario: 'Find customers who spent more than the overall average — written both ways.',
        query: `-- METHOD 1: Subquery (inline)
SELECT name, email
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM   orders
  GROUP  BY customer_id
  HAVING SUM(total_amount) > (
    SELECT AVG(total_amount) FROM orders
  )
);

-- METHOD 2: CTE (preferred for readability)
WITH avg_spend AS (
  SELECT AVG(total_amount) AS avg_val FROM orders
),
high_spenders AS (
  SELECT customer_id
  FROM   orders
  GROUP  BY customer_id
  HAVING SUM(total_amount) > (SELECT avg_val FROM avg_spend)
)
SELECT c.name, c.email
FROM   customers c
JOIN   high_spenders hs ON c.customer_id = hs.customer_id;`,
        output: 'Same result, two approaches. The CTE version is far easier to debug and extend.',
        insight: 'In interviews and code reviews, CTEs signal seniority. They\'re self-documenting and can be reused multiple times in the same query.',
      },
      {
        title: 'Window Functions: The Analyst\'s Superpower',
        concept: 'Window functions perform calculations across a set of rows related to the current row — without collapsing them. They\'re what separate intermediate from advanced SQL.',
        scenario: 'Show each order alongside the customer\'s running total and their rank among all customers.',
        query: `SELECT
  c.name,
  o.order_date,
  o.total_amount,

  -- Running total per customer
  SUM(o.total_amount) OVER (
    PARTITION BY c.customer_id
    ORDER BY o.order_date
    ROWS UNBOUNDED PRECEDING
  )  AS customer_running_total,

  -- Rank this customer by their total spend
  RANK() OVER (
    ORDER BY SUM(o.total_amount) OVER (PARTITION BY c.customer_id)
    DESC
  )  AS spend_rank,

  -- What % of this customer's orders is this one?
  ROUND(
    o.total_amount * 100.0 /
    SUM(o.total_amount) OVER (PARTITION BY c.customer_id)
  , 1)  AS pct_of_customer_total

FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
ORDER BY c.customer_id, o.order_date;`,
        output: 'Row-level detail with cumulative context — impossible with GROUP BY alone.',
        insight: 'PARTITION BY is "GROUP BY for window functions". Without it, the window spans the entire result set. ROWS UNBOUNDED PRECEDING means "from the first row up to this one".',
      },
    ],
  },
];

export default function Learn() {
  const [openModule,  setOpenModule]  = useState(null);
  const [openLesson,  setOpenLesson]  = useState(null);

  const toggle = (modId, lessonIdx=null) => {
    if (lessonIdx !== null) {
      setOpenLesson(openLesson === `${modId}-${lessonIdx}` ? null : `${modId}-${lessonIdx}`);
    } else {
      setOpenModule(openModule === modId ? null : modId);
      setOpenLesson(null);
    }
  };

  return (
    <div className="learn-page page-enter">
      {/* Header */}
      <div className="learn-header">
        <div className="learn-badge"><BookOpen size={14}/> SQL Reference</div>
        <h1 className="learn-title">Study SQL</h1>
        <p className="learn-sub">
          Business-first SQL lessons. Each lesson shows a real scenario, the exact query,
          and what a senior analyst is thinking when they write it.
        </p>
        <div className="learn-meta">
          <span><Zap size={14}/> {MODULES.length} modules</span>
          <span>·</span>
          <span><BookOpen size={14}/> {MODULES.reduce((s,m)=>s+m.lessons.length,0)} lessons</span>
          <span>·</span>
          <Link to="/journey" className="learn-link">Practice in challenges <ArrowRight size={13}/></Link>
        </div>
      </div>

      {/* Modules */}
      <div className="modules-list">
        {MODULES.map((mod) => {
          const isModOpen = openModule === mod.id;
          return (
            <div key={mod.id} className={`module-card card ${isModOpen ? 'open' : ''} color-${mod.color}`}>
              <button className="module-header" onClick={() => toggle(mod.id)}>
                <div className={`module-icon-wrap color-${mod.color}`}>{mod.icon}</div>
                <div className="module-info">
                  <div className="module-title">{mod.title}</div>
                  <div className="module-tagline">{mod.tagline}</div>
                </div>
                <div className="module-right">
                  <span className="module-count">{mod.lessons.length} lessons</span>
                  {isModOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                </div>
              </button>

              {isModOpen && (
                <div className="lessons-list fade-in">
                  {mod.lessons.map((lesson, idx) => {
                    const lessonKey = `${mod.id}-${idx}`;
                    const isOpen = openLesson === lessonKey;
                    return (
                      <div key={idx} className={`lesson-item ${isOpen ? 'open' : ''}`}>
                        <button className="lesson-header" onClick={() => toggle(mod.id, idx)}>
                          <span className="lesson-num">{idx + 1}</span>
                          <span className="lesson-title">{lesson.title}</span>
                          {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                        </button>

                        {isOpen && (
                          <div className="lesson-body fade-in">
                            <div className="lesson-section concept-section">
                              <div className="ls-label"><Zap size={12}/> Core Concept</div>
                              <p>{lesson.concept}</p>
                            </div>

                            <div className="lesson-section scenario-section">
                              <div className="ls-label">💼 Business Scenario</div>
                              <p>{lesson.scenario}</p>
                            </div>

                            <div className="lesson-section query-section">
                              <div className="ls-label-row">
                                <div className="ls-label">⌨ SQL Query</div>
                                <button
                                  className="copy-btn"
                                  onClick={() => {
                                    navigator.clipboard.writeText(lesson.query);
                                    const btn = document.activeElement;
                                    const orig = btn.textContent;
                                    btn.textContent = '✓ Copied!';
                                    setTimeout(() => btn.textContent = orig, 1500);
                                  }}
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className="query-pre"><code>{lesson.query}</code></pre>
                            </div>

                            <div className="lesson-section output-section">
                              <div className="ls-label">📊 Expected Output</div>
                              <p className="output-text">{lesson.output}</p>
                            </div>

                            <div className="lesson-section insight-section">
                              <div className="ls-label">🧠 Analyst Insight</div>
                              <p>{lesson.insight}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="learn-cta card">
        <div className="lc-icon">⚡</div>
        <div>
          <h3>Ready to practice?</h3>
          <p>Apply what you've learned in the Journey — 50 real business SQL challenges.</p>
        </div>
        <Link to="/journey" className="btn btn-primary">Go to Journey <ArrowRight size={16}/></Link>
      </div>
    </div>
  );
}
