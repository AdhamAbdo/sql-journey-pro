// ══════════════════════════════════════════
// SQL Journey Pro — 50 Challenges
// ══════════════════════════════════════════

export const CHALLENGES = [
  // ──────────────────────────────────────
  // EASY 1–25
  // ──────────────────────────────────────
  {
    id: 1, title: 'Meet the Customers', category: 'SELECT Basics',
    difficulty: 'easy', pts: 50, xp: 100,
    scenario: 'The sales team just joined and needs to see all customer records to start onboarding. Pull everything from the customers table.',
    task: 'Select all columns from the customers table.',
    hint: 'Use SELECT * FROM table_name to get all columns.',
    answer: 'SELECT * FROM customers;',
    validate: (rows) => rows.length > 1 && rows[0].map(c => c.toLowerCase()).includes('customer_id'),
  },
  {
    id: 2, title: 'Customer Directory', category: 'SELECT Basics',
    difficulty: 'easy', pts: 50, xp: 100,
    scenario: 'The marketing team needs a simple directory — just names, emails, and countries. No extra noise.',
    task: 'Select only name, email, and country from the customers table.',
    hint: 'List the specific column names after SELECT, separated by commas.',
    answer: 'SELECT name, email, country FROM customers;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.includes('name') && h.includes('email') && h.includes('country') && h.length === 3;
    },
  },
  {
    id: 3, title: 'US Customers Only', category: 'WHERE Filter',
    difficulty: 'easy', pts: 60, xp: 120,
    scenario: 'The US account team wants a list of only American customers before their quarterly review.',
    task: 'Retrieve all customers where country is "USA".',
    hint: 'Use WHERE country = \'USA\' to filter rows.',
    answer: "SELECT * FROM customers WHERE country = 'USA';",
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ci = rows[0].map(c => c.toLowerCase()).indexOf('country');
      return rows.slice(1).every(r => r[ci] === 'USA');
    },
  },
  {
    id: 4, title: 'Churned Customer List', category: 'WHERE Filter',
    difficulty: 'easy', pts: 60, xp: 120,
    scenario: 'Customer success flagged a churn spike. Pull every churned customer so the win-back team can start outreach.',
    task: 'Select name, email, plan from customers where churned equals 1.',
    hint: 'Use WHERE churned = 1',
    answer: "SELECT name, email, plan FROM customers WHERE churned = 1;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.includes('name') && h.includes('email');
    },
  },
  {
    id: 5, title: 'Alphabetical Customer List', category: 'ORDER BY',
    difficulty: 'easy', pts: 60, xp: 120,
    scenario: 'Support wants customers sorted A–Z by name to find them faster in their CRM.',
    task: 'Select all customers sorted by name in ascending order.',
    hint: 'Add ORDER BY column_name ASC at the end of your query.',
    answer: 'SELECT * FROM customers ORDER BY name ASC;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ni = rows[0].map(c => c.toLowerCase()).indexOf('name');
      const names = rows.slice(1).map(r => r[ni]);
      return JSON.stringify(names) === JSON.stringify([...names].sort());
    },
  },
  {
    id: 6, title: 'Top 10 Recent Orders', category: 'LIMIT',
    difficulty: 'easy', pts: 60, xp: 120,
    scenario: 'The finance team wants to quickly audit the 10 most recent orders without downloading the full export.',
    task: 'Select all columns from orders, sorted by order_date descending, limited to 10 rows.',
    hint: 'Combine ORDER BY order_date DESC with LIMIT 10',
    answer: 'SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;',
    validate: (rows) => rows.length === 11, // header + 10 rows
  },
  {
    id: 7, title: 'Count All Customers', category: 'Aggregation',
    difficulty: 'easy', pts: 70, xp: 140,
    scenario: 'The CEO asked: "How many customers do we have?" Give the board a single number.',
    task: 'Return the total count of customers with an alias "total_customers".',
    hint: 'Use COUNT(*) AS alias_name',
    answer: 'SELECT COUNT(*) AS total_customers FROM customers;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length === 2 && h.some(c => c.includes('total') || c.includes('count'));
    },
  },
  {
    id: 8, title: 'Total Revenue', category: 'Aggregation',
    difficulty: 'easy', pts: 70, xp: 140,
    scenario: 'Finance needs the total revenue figure from all completed orders for the annual report.',
    task: 'Calculate the sum of total_amount from orders where status is "completed". Alias it as total_revenue.',
    hint: 'Use SUM(total_amount) AS total_revenue with a WHERE status = \'completed\' filter',
    answer: "SELECT SUM(total_amount) AS total_revenue FROM orders WHERE status = 'completed';",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length === 2 && h.some(c => c.includes('revenue') || c.includes('sum'));
    },
  },
  {
    id: 9, title: 'Average Order Value', category: 'Aggregation',
    difficulty: 'easy', pts: 70, xp: 140,
    scenario: 'The growth team wants the average order value (AOV) to benchmark against competitors.',
    task: 'Calculate the average total_amount from orders. Alias it as avg_order_value.',
    hint: 'AVG() calculates the mean of a numeric column.',
    answer: 'SELECT AVG(total_amount) AS avg_order_value FROM orders;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length === 2 && h.some(c => c.includes('avg') || c.includes('average'));
    },
  },
  {
    id: 10, title: 'Largest & Smallest Order', category: 'Aggregation',
    difficulty: 'easy', pts: 70, xp: 140,
    scenario: 'Sales wants to know the biggest and smallest single orders for their bonus calculation report.',
    task: 'Return max_order and min_order from the orders table (total_amount).',
    hint: 'Use MAX() and MIN() in the same SELECT statement.',
    answer: 'SELECT MAX(total_amount) AS max_order, MIN(total_amount) AS min_order FROM orders;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length === 2 && h.some(c => c.includes('max')) && h.some(c => c.includes('min'));
    },
  },
  {
    id: 11, title: 'UK or Germany Customers', category: 'WHERE Multi-condition',
    difficulty: 'easy', pts: 70, xp: 140,
    scenario: 'The EMEA team needs a list of customers from either UK or Germany for a regional campaign.',
    task: 'Select name, email, country from customers where country is "UK" or "Germany".',
    hint: 'Use IN (\'UK\', \'Germany\') or combine with OR.',
    answer: "SELECT name, email, country FROM customers WHERE country IN ('UK', 'Germany');",
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ci = rows[0].map(c => c.toLowerCase()).indexOf('country');
      return rows.slice(1).every(r => r[ci] === 'UK' || r[ci] === 'Germany');
    },
  },
  {
    id: 12, title: 'High-Value Orders', category: 'WHERE Multi-condition',
    difficulty: 'easy', pts: 70, xp: 140,
    scenario: 'The account management team wants to identify premium transactions — completed orders over $400.',
    task: 'Select order_id, customer_id, total_amount from orders where status = "completed" AND total_amount > 400.',
    hint: 'Combine two conditions with AND.',
    answer: "SELECT order_id, customer_id, total_amount FROM orders WHERE status = 'completed' AND total_amount > 400;",
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ai = rows[0].map(c => c.toLowerCase()).indexOf('total_amount');
      return rows.slice(1).every(r => Number(r[ai]) > 400);
    },
  },
  {
    id: 13, title: 'Email Domain Search', category: 'LIKE',
    difficulty: 'easy', pts: 75, xp: 150,
    scenario: 'The security team wants to audit all customers using .io domains before a compliance review.',
    task: 'Select name and email from customers where email ends with ".io".',
    hint: 'Use LIKE \'%.io\' — the % wildcard matches anything before the pattern.',
    answer: "SELECT name, email FROM customers WHERE email LIKE '%.io';",
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ei = rows[0].map(c => c.toLowerCase()).indexOf('email');
      return rows.slice(1).every(r => String(r[ei]).endsWith('.io'));
    },
  },
  {
    id: 14, title: 'Enterprise Plan Customers', category: 'WHERE Filter',
    difficulty: 'easy', pts: 75, xp: 150,
    scenario: 'The enterprise sales director needs a list of all enterprise-tier customers for QBR preparation.',
    task: 'Find all customers on the "enterprise" plan. Return name, email, country, and signup_date.',
    hint: 'Filter on the plan column with WHERE plan = \'enterprise\'',
    answer: "SELECT name, email, country, signup_date FROM customers WHERE plan = 'enterprise';",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.includes('name') && h.includes('email');
    },
  },
  {
    id: 15, title: 'Unique Countries', category: 'DISTINCT',
    difficulty: 'easy', pts: 75, xp: 150,
    scenario: 'Marketing wants to know every unique country in the customer base before running a geo-targeting campaign.',
    task: 'Return a list of all unique countries from the customers table, sorted A–Z.',
    hint: 'DISTINCT removes duplicate values from results.',
    answer: 'SELECT DISTINCT country FROM customers ORDER BY country ASC;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      const vals = rows.slice(1).map(r => r[0]);
      return h.includes('country') && new Set(vals).size === vals.length;
    },
  },
  {
    id: 16, title: 'Customers per Country', category: 'GROUP BY',
    difficulty: 'easy', pts: 80, xp: 160,
    scenario: 'The CMO wants a breakdown of customer counts per country to plan budget allocation for the next quarter.',
    task: 'Count customers per country. Return country and customer_count, sorted by count descending.',
    hint: 'Use GROUP BY country with COUNT(*). Remember to alias and ORDER BY.',
    answer: 'SELECT country, COUNT(*) AS customer_count FROM customers GROUP BY country ORDER BY customer_count DESC;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('country')) && h.some(c => c.includes('count'));
    },
  },
  {
    id: 17, title: 'Revenue by Payment Method', category: 'GROUP BY',
    difficulty: 'easy', pts: 80, xp: 160,
    scenario: 'Finance is reviewing payment processing fees. They need total revenue broken down by payment method.',
    task: 'Group completed orders by payment_method and return the total revenue (total_amount) per method.',
    hint: 'Filter WHERE status = \'completed\', then GROUP BY payment_method with SUM().',
    answer: "SELECT payment_method, SUM(total_amount) AS total_revenue FROM orders WHERE status = 'completed' GROUP BY payment_method ORDER BY total_revenue DESC;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('payment') || c.includes('method')) && h.some(c => c.includes('rev') || c.includes('sum'));
    },
  },
  {
    id: 18, title: 'Orders per Status', category: 'GROUP BY',
    difficulty: 'easy', pts: 80, xp: 160,
    scenario: 'Ops needs a status breakdown of all orders to monitor the refund and cancellation rate.',
    task: 'Count the number of orders per status. Return status and order_count.',
    hint: 'GROUP BY status with COUNT(*) AS order_count.',
    answer: 'SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('status')) && h.some(c => c.includes('count'));
    },
  },
  {
    id: 19, title: 'Orders Between Dates', category: 'BETWEEN',
    difficulty: 'easy', pts: 80, xp: 160,
    scenario: 'The finance team needs Q1 2024 orders for the quarterly reconciliation report.',
    task: 'Find all orders placed between "2024-01-01" and "2024-03-31" (inclusive). Return all columns.',
    hint: 'Use BETWEEN \'2024-01-01\' AND \'2024-03-31\'.',
    answer: "SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31';",
    validate: (rows) => {
      if (rows.length < 2) return false;
      const di = rows[0].map(c => c.toLowerCase()).indexOf('order_date');
      return rows.slice(1).every(r => r[di] >= '2024-01-01' && r[di] <= '2024-03-31');
    },
  },
  {
    id: 20, title: 'Average Order by Plan', category: 'GROUP BY + AVG',
    difficulty: 'easy', pts: 85, xp: 170,
    scenario: 'The pricing team hypothesizes that higher plan tiers drive higher spend. Validate this with data.',
    task: 'Calculate the average order total per customer plan. Return plan and avg_order_value.',
    hint: 'JOIN customers and orders, then GROUP BY c.plan with AVG(o.total_amount).',
    answer: 'SELECT c.plan, ROUND(AVG(o.total_amount), 2) AS avg_order_value FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.plan ORDER BY avg_order_value DESC;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('plan')) && h.some(c => c.includes('avg') || c.includes('value'));
    },
  },
  {
    id: 21, title: 'Customer Order History', category: 'INNER JOIN',
    difficulty: 'easy', pts: 90, xp: 180,
    scenario: 'The account team needs to see which customers placed which orders, combining both tables.',
    task: 'Join customers and orders to return: customer name, order_id, order_date, total_amount.',
    hint: 'Use INNER JOIN orders o ON c.customer_id = o.customer_id.',
    answer: 'SELECT c.name, o.order_id, o.order_date, o.total_amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id ORDER BY o.order_date DESC;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('name')) && h.some(c => c.includes('order_id'));
    },
  },
  {
    id: 22, title: 'Products with Categories', category: 'INNER JOIN',
    difficulty: 'easy', pts: 90, xp: 180,
    scenario: 'The product catalog page needs each product\'s name displayed alongside its category name.',
    task: 'Join products and categories to return product name, price, and category name.',
    hint: 'JOIN categories ON products.category_id = categories.category_id.',
    answer: 'SELECT p.name AS product_name, p.price, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.category_id ORDER BY c.name, p.price;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('name') || c.includes('product')) && h.some(c => c.includes('price'));
    },
  },
  {
    id: 23, title: 'Order Line Items Detail', category: 'Three-Table JOIN',
    difficulty: 'easy', pts: 90, xp: 180,
    scenario: 'Support received a refund request and needs full order line details including the product name.',
    task: 'Join orders, order_items, and products. Return order_id, product name, quantity, and unit_price.',
    hint: 'Chain two JOINs: orders → order_items → products.',
    answer: 'SELECT o.order_id, p.name AS product_name, oi.quantity, oi.unit_price FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN products p ON oi.product_id = p.product_id ORDER BY o.order_id;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('order_id') || c.includes('order')) && h.some(c => c.includes('name') || c.includes('product'));
    },
  },
  {
    id: 24, title: 'Products Ordered in 2024', category: 'JOIN + WHERE + Date',
    difficulty: 'easy', pts: 90, xp: 180,
    scenario: 'The product team wants to know which products were actually purchased in 2024.',
    task: 'Return distinct product names that appear in orders placed in 2024.',
    hint: 'JOIN order_items and products, filter orders by year using strftime or LIKE \'2024%\'.',
    answer: "SELECT DISTINCT p.name FROM products p JOIN order_items oi ON p.product_id = oi.product_id JOIN orders o ON oi.order_id = o.order_id WHERE o.order_date LIKE '2024%';",
    validate: (rows) => {
      if (rows.length < 2) return false;
      const h = rows[0].map(c => c.toLowerCase());
      return h.some(c => c.includes('name'));
    },
  },
  {
    id: 25, title: 'Monthly Order Count', category: 'Date Functions',
    difficulty: 'easy', pts: 90, xp: 180,
    scenario: 'The ops dashboard needs a monthly breakdown of order volume to track growth trends.',
    task: 'Group orders by month (YYYY-MM format) and count them. Return month and order_count, sorted chronologically.',
    hint: "Use strftime('%Y-%m', order_date) AS month.",
    answer: "SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS order_count FROM orders GROUP BY month ORDER BY month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('month') || c.includes('date')) && h.some(c => c.includes('count'));
    },
  },

  // ──────────────────────────────────────
  // INTERMEDIATE 26–40
  // ──────────────────────────────────────
  {
    id: 26, title: 'High-Revenue Countries', category: 'HAVING',
    difficulty: 'mid', pts: 120, xp: 240,
    scenario: 'Marketing only wants to invest in countries that generated over $1,000 in total revenue.',
    task: 'Find countries where total order revenue exceeds $1,000. Return country and total_revenue.',
    hint: 'HAVING filters after aggregation — unlike WHERE which filters rows.',
    answer: 'SELECT c.country, SUM(o.total_amount) AS total_revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.country HAVING total_revenue > 1000 ORDER BY total_revenue DESC;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ri = rows[0].map(c => c.toLowerCase()).findIndex(c => c.includes('rev') || c.includes('total'));
      return rows.slice(1).every(r => Number(r[ri]) > 1000);
    },
  },
  {
    id: 27, title: 'Plans with 5+ Customers', category: 'HAVING',
    difficulty: 'mid', pts: 120, xp: 240,
    scenario: 'Product wants to know which subscription plans have significant adoption (5 or more customers).',
    task: 'Return plans that have at least 5 customers. Show plan and customer_count.',
    hint: 'GROUP BY plan, then HAVING COUNT(*) >= 5.',
    answer: 'SELECT plan, COUNT(*) AS customer_count FROM customers GROUP BY plan HAVING customer_count >= 5 ORDER BY customer_count DESC;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ci = rows[0].map(c => c.toLowerCase()).findIndex(c => c.includes('count'));
      return rows.slice(1).every(r => Number(r[ci]) >= 5);
    },
  },
  {
    id: 28, title: 'Customers Without Orders', category: 'LEFT JOIN',
    difficulty: 'mid', pts: 130, xp: 260,
    scenario: 'The activation team needs to find customers who signed up but never placed an order.',
    task: 'Find all customers who have no orders. Return their name and email.',
    hint: 'LEFT JOIN orders and filter WHERE o.order_id IS NULL.',
    answer: 'SELECT c.name, c.email FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const h = rows[0].map(c => c.toLowerCase());
      return h.includes('name') && h.includes('email');
    },
  },
  {
    id: 29, title: 'Unused Products', category: 'LEFT JOIN',
    difficulty: 'mid', pts: 130, xp: 260,
    scenario: 'The inventory manager suspects some products have never been ordered. Find them so they can be deprecated.',
    task: 'Find all active products that appear in zero orders. Return product name and price.',
    hint: 'LEFT JOIN order_items and filter WHERE oi.item_id IS NULL. Also filter is_active = 1.',
    answer: 'SELECT p.name, p.price FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id WHERE oi.item_id IS NULL AND p.is_active = 1;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('name'));
    },
  },
  {
    id: 30, title: 'Customer Spend Tier', category: 'CASE WHEN',
    difficulty: 'mid', pts: 130, xp: 260,
    scenario: 'The CX team wants to segment customers into spend tiers: High (>$500), Medium ($200–$500), Low (<$200).',
    task: 'Return customer name, total_spent, and a spend_tier column using CASE WHEN.',
    hint: 'Use CASE WHEN total > 500 THEN \'High\' WHEN total >= 200 THEN \'Medium\' ELSE \'Low\' END.',
    answer: "SELECT c.name, SUM(o.total_amount) AS total_spent, CASE WHEN SUM(o.total_amount) > 500 THEN 'High' WHEN SUM(o.total_amount) >= 200 THEN 'Medium' ELSE 'Low' END AS spend_tier FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name ORDER BY total_spent DESC;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('tier') || c.includes('segment'));
    },
  },
  {
    id: 31, title: 'Order Status Labels', category: 'CASE WHEN',
    difficulty: 'mid', pts: 130, xp: 260,
    scenario: 'The support portal displays human-friendly status labels. Map technical values to display names.',
    task: 'Return order_id, total_amount, and a status_label: "✓ Done" for completed, "✗ Cancelled" for cancelled, "↩ Refunded" for refunded, "⏳ Pending" otherwise.',
    hint: 'Use CASE WHEN status = \'completed\' THEN ... in the SELECT.',
    answer: "SELECT order_id, total_amount, CASE WHEN status = 'completed' THEN '✓ Done' WHEN status = 'cancelled' THEN '✗ Cancelled' WHEN status = 'refunded' THEN '↩ Refunded' ELSE '⏳ Pending' END AS status_label FROM orders;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('label') || c.includes('status'));
    },
  },
  {
    id: 32, title: 'Top 5 Revenue Products', category: 'Subquery',
    difficulty: 'mid', pts: 140, xp: 280,
    scenario: 'The CEO slide needs the five highest-grossing products. Use a subquery to make it clean.',
    task: 'Using a subquery or aggregation, return the top 5 products by total revenue from order_items.',
    hint: 'SUM(quantity * unit_price) per product, join products for the name, LIMIT 5.',
    answer: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS total_revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id, p.name ORDER BY total_revenue DESC LIMIT 5;',
    validate: (rows) => rows.length === 6, // header + 5
  },
  {
    id: 33, title: 'Above Average Orders', category: 'Subquery',
    difficulty: 'mid', pts: 140, xp: 280,
    scenario: 'Sales wants to flag orders that are larger than the average to prioritize for upsell follow-ups.',
    task: 'Return all orders where total_amount exceeds the average order amount. Use a subquery.',
    hint: 'WHERE total_amount > (SELECT AVG(total_amount) FROM orders)',
    answer: 'SELECT * FROM orders WHERE total_amount > (SELECT AVG(total_amount) FROM orders) ORDER BY total_amount DESC;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ai = rows[0].map(c => c.toLowerCase()).indexOf('total_amount');
      const avg = rows.slice(1).reduce((s, r) => s + Number(r[ai]), 0) / (rows.length - 1);
      // All rows should be above the overall avg
      return rows.slice(1).every(r => Number(r[ai]) >= avg * 0.7);
    },
  },
  {
    id: 34, title: 'Customer Revenue Rank (CTE)', category: 'CTE',
    difficulty: 'mid', pts: 150, xp: 300,
    scenario: 'Sales ops wants to rank customers by lifetime revenue for the VIP loyalty program.',
    task: 'Use a CTE to calculate each customer\'s total revenue, then select name, total_revenue, ranked by total.',
    hint: 'WITH cte AS (SELECT ... FROM ...) SELECT * FROM cte ORDER BY total_revenue DESC.',
    answer: 'WITH customer_revenue AS (SELECT c.customer_id, c.name, SUM(o.total_amount) AS total_revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name) SELECT name, total_revenue FROM customer_revenue ORDER BY total_revenue DESC;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('name')) && h.some(c => c.includes('revenue') || c.includes('total'));
    },
  },
  {
    id: 35, title: 'Monthly Revenue CTE', category: 'CTE',
    difficulty: 'mid', pts: 150, xp: 300,
    scenario: 'The finance team wants a clean monthly revenue report. Use a CTE for readability.',
    task: 'Write a CTE that computes monthly revenue, then select from it ordered chronologically.',
    hint: "WITH monthly AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders GROUP BY month) SELECT * FROM monthly ORDER BY month;",
    answer: "WITH monthly_revenue AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) SELECT month, revenue FROM monthly_revenue ORDER BY month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('month')) && h.some(c => c.includes('revenue') || c.includes('sum'));
    },
  },
  {
    id: 36, title: 'Row Number per Customer', category: 'Window Functions',
    difficulty: 'mid', pts: 160, xp: 320,
    scenario: 'The data team wants to number each customer\'s orders in chronological order to track purchase sequences.',
    task: 'Add a row_num column using ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) to the orders table.',
    hint: 'ROW_NUMBER() OVER (PARTITION BY col ORDER BY col) AS row_num.',
    answer: 'SELECT order_id, customer_id, order_date, total_amount, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS row_num FROM orders ORDER BY customer_id, order_date;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('row') || c.includes('num'));
    },
  },
  {
    id: 37, title: 'Rank Products by Revenue', category: 'Window Functions',
    difficulty: 'mid', pts: 160, xp: 320,
    scenario: 'Product wants a ranking of all products by total sales so they can see the pecking order.',
    task: 'Use RANK() to rank products by total revenue from order_items. Return name, total_revenue, and rank.',
    hint: 'RANK() OVER (ORDER BY total_revenue DESC) AS revenue_rank.',
    answer: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS total_revenue, RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS revenue_rank FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id, p.name ORDER BY revenue_rank;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('rank'));
    },
  },
  {
    id: 38, title: 'Running Revenue Total', category: 'Window Functions',
    difficulty: 'mid', pts: 170, xp: 340,
    scenario: 'Finance wants to see how cumulative revenue grows month over month throughout the year.',
    task: 'Calculate monthly revenue and add a running_total column using SUM() as a window function.',
    hint: "SUM(revenue) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING).",
    answer: "WITH monthly AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) SELECT month, revenue, SUM(revenue) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) AS running_total FROM monthly ORDER BY month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('running') || c.includes('cumul'));
    },
  },
  {
    id: 39, title: 'Previous Month Revenue (LAG)', category: 'Window Functions',
    difficulty: 'mid', pts: 170, xp: 340,
    scenario: 'The dashboard needs MoM revenue comparison: current month vs the previous month side by side.',
    task: 'Use LAG() to add a prev_revenue column showing the prior month\'s revenue alongside each month.',
    hint: "LAG(revenue, 1) OVER (ORDER BY month) AS prev_revenue.",
    answer: "WITH monthly AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) SELECT month, revenue, LAG(revenue, 1) OVER (ORDER BY month) AS prev_revenue FROM monthly ORDER BY month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('prev') || c.includes('lag'));
    },
  },
  {
    id: 40, title: 'First Order Per Customer', category: 'Window Functions',
    difficulty: 'mid', pts: 180, xp: 360,
    scenario: 'The growth team is analyzing first-order behavior to improve the onboarding experience.',
    task: 'Return only the first order for each customer (earliest order_date). Use a window function approach.',
    hint: 'Use ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) = 1 in a subquery.',
    answer: 'SELECT order_id, customer_id, order_date, total_amount FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn FROM orders) WHERE rn = 1 ORDER BY order_date;',
    validate: (rows) => {
      if (rows.length < 2) return false;
      const ci = rows[0].map(c => c.toLowerCase()).indexOf('customer_id');
      const ids = rows.slice(1).map(r => r[ci]);
      return new Set(ids).size === ids.length; // each customer_id appears once
    },
  },

  // ──────────────────────────────────────
  // HARD 41–50
  // ──────────────────────────────────────
  {
    id: 41, title: 'Customer Cohort Analysis', category: 'Cohort Analysis',
    difficulty: 'hard', pts: 200, xp: 400,
    scenario: 'The growth team wants a cohort table: which signup month cohorts are placing orders, and how many orders per cohort.',
    task: 'Build a cohort analysis: for each signup_month cohort, show how many customers placed at least one order. Return signup_month, cohort_size, and customers_with_orders.',
    hint: "Use strftime('%Y-%m', signup_date) for cohort month. Left join orders and COUNT DISTINCT.",
    answer: "SELECT strftime('%Y-%m', c.signup_date) AS signup_month, COUNT(DISTINCT c.customer_id) AS cohort_size, COUNT(DISTINCT o.customer_id) AS customers_with_orders FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY signup_month ORDER BY signup_month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('cohort') || c.includes('month') || c.includes('signup'));
    },
  },
  {
    id: 42, title: 'Conversion Funnel', category: 'Funnel Analysis',
    difficulty: 'hard', pts: 200, xp: 400,
    scenario: 'Product needs a funnel: how many customers signed up, how many placed an order, and how many placed 2+ orders.',
    task: 'Build a 3-stage funnel showing: total_signups, customers_with_orders, repeat_customers. Use a single query with CTEs.',
    hint: 'Use multiple CTEs — one for signups count, one for orders count, one for 2+ orders count — then combine with SELECT.',
    answer: "WITH signups AS (SELECT COUNT(*) AS total FROM customers), first_orders AS (SELECT COUNT(DISTINCT customer_id) AS total FROM orders), repeat_orders AS (SELECT COUNT(*) AS total FROM (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 2)) SELECT signups.total AS total_signups, first_orders.total AS customers_with_orders, repeat_orders.total AS repeat_customers FROM signups, first_orders, repeat_orders;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length === 2 && h.length >= 2;
    },
  },
  {
    id: 43, title: 'Repeat Purchase Rate', category: 'Cohort Analysis',
    difficulty: 'hard', pts: 210, xp: 420,
    scenario: 'The retention team needs the repeat purchase rate per plan — what percentage of customers in each plan placed 2+ orders.',
    task: 'Calculate the repeat_rate (%) per plan. Return plan, total_customers, repeat_customers, and repeat_rate.',
    hint: 'Use a CTE to find customers with 2+ orders, then join back to customers and compute percentage.',
    answer: "WITH repeat_cust AS (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 2) SELECT c.plan, COUNT(DISTINCT c.customer_id) AS total_customers, COUNT(DISTINCT rc.customer_id) AS repeat_customers, ROUND(100.0 * COUNT(DISTINCT rc.customer_id) / COUNT(DISTINCT c.customer_id), 1) AS repeat_rate FROM customers c LEFT JOIN repeat_cust rc ON c.customer_id = rc.customer_id GROUP BY c.plan ORDER BY repeat_rate DESC;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('rate') || c.includes('repeat'));
    },
  },
  {
    id: 44, title: 'Revenue Percentile Buckets', category: 'Window Functions',
    difficulty: 'hard', pts: 220, xp: 440,
    scenario: 'The data science team wants customers segmented into 4 revenue quartiles using NTILE for a targeting model.',
    task: 'Use NTILE(4) to split customers into 4 revenue quartiles. Return name, total_spent, and quartile (1=lowest).',
    hint: 'NTILE(4) OVER (ORDER BY total_spent ASC) AS quartile.',
    answer: 'SELECT name, total_spent, NTILE(4) OVER (ORDER BY total_spent ASC) AS quartile FROM (SELECT c.name, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name) ORDER BY total_spent DESC;',
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('quartile') || c.includes('ntile') || c.includes('bucket'));
    },
  },
  {
    id: 45, title: 'Month-over-Month Growth', category: 'Window Functions + Date',
    difficulty: 'hard', pts: 220, xp: 440,
    scenario: 'The board wants MoM revenue growth rate (%) for the investor update. Show month, revenue, and growth_pct.',
    task: 'Calculate MoM revenue growth percentage. Return month, revenue, prev_revenue, and growth_pct rounded to 1 decimal.',
    hint: 'Use LAG() for previous revenue, then (revenue - prev) / prev * 100 for growth_pct.',
    answer: "WITH monthly AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month), with_lag AS (SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue FROM monthly) SELECT month, revenue, prev_revenue, ROUND((revenue - prev_revenue) * 100.0 / prev_revenue, 1) AS growth_pct FROM with_lag ORDER BY month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('growth') || c.includes('pct') || c.includes('percent'));
    },
  },
  {
    id: 46, title: 'Product Revenue by Category', category: 'Pivot-style CASE WHEN',
    difficulty: 'hard', pts: 230, xp: 460,
    scenario: 'The analytics team needs a pivot-style report: categories as rows and revenue displayed with a tier label.',
    task: 'For each category, calculate total revenue from order_items, and label it: "Premium" if >$2000, "Standard" if >$1000, else "Basic".',
    hint: 'JOIN categories → products → order_items. Use CASE WHEN on the aggregated SUM.',
    answer: "SELECT cat.name AS category, SUM(oi.quantity * oi.unit_price) AS total_revenue, CASE WHEN SUM(oi.quantity * oi.unit_price) > 2000 THEN 'Premium' WHEN SUM(oi.quantity * oi.unit_price) > 1000 THEN 'Standard' ELSE 'Basic' END AS tier FROM categories cat JOIN products p ON cat.category_id = p.category_id JOIN order_items oi ON p.product_id = oi.product_id GROUP BY cat.category_id, cat.name ORDER BY total_revenue DESC;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('tier') || c.includes('label'));
    },
  },
  {
    id: 47, title: 'Correlated Subquery: Above-Avg Spenders', category: 'Correlated Subquery',
    difficulty: 'hard', pts: 240, xp: 480,
    scenario: 'The VIP team wants customers who spend more than the average for their country.',
    task: 'Using a correlated subquery, find customers whose total spend exceeds the average spend of customers in their country.',
    hint: 'Use a correlated subquery in the HAVING clause that references the outer customer\'s country.',
    answer: "SELECT c.name, c.country, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name, c.country HAVING total_spent > (SELECT AVG(o2.total_amount) FROM orders o2 JOIN customers c2 ON o2.customer_id = c2.customer_id WHERE c2.country = c.country) ORDER BY total_spent DESC;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('name')) && h.some(c => c.includes('spent') || c.includes('total'));
    },
  },
  {
    id: 48, title: 'Customer Lifetime Value Segments', category: 'Multi-CTE + CASE',
    difficulty: 'hard', pts: 250, xp: 500,
    scenario: 'Finance is building a CLV model. They need customers bucketed into 5 LTV tiers with order count and average order.',
    task: 'Build a CLV report: customer name, order_count, total_spent, avg_order, and ltv_tier (Platinum >$1000, Gold >$600, Silver >$300, Bronze >$100, otherwise Prospect).',
    hint: 'Use a CTE to aggregate, then wrap in a SELECT with CASE WHEN for the tier.',
    answer: "WITH clv AS (SELECT c.name, COUNT(o.order_id) AS order_count, SUM(o.total_amount) AS total_spent, ROUND(AVG(o.total_amount), 2) AS avg_order FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name) SELECT name, order_count, total_spent, avg_order, CASE WHEN total_spent > 1000 THEN 'Platinum' WHEN total_spent > 600 THEN 'Gold' WHEN total_spent > 300 THEN 'Silver' WHEN total_spent > 100 THEN 'Bronze' ELSE 'Prospect' END AS ltv_tier FROM clv ORDER BY total_spent DESC;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('tier') || c.includes('ltv'));
    },
  },
  {
    id: 49, title: 'Rolling 3-Month Revenue', category: 'Advanced Window',
    difficulty: 'hard', pts: 260, xp: 520,
    scenario: 'Finance wants a smoothed revenue chart using a 3-month rolling average to remove seasonal spikes.',
    task: 'Calculate monthly revenue and add a 3-month rolling average column (rolling_avg_3m).',
    hint: "AVG(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_avg_3m.",
    answer: "WITH monthly AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) SELECT month, revenue, ROUND(AVG(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS rolling_avg_3m FROM monthly ORDER BY month;",
    validate: (rows) => {
      const h = rows[0]?.map(c => c.toLowerCase()) || [];
      return rows.length > 1 && h.some(c => c.includes('rolling') || c.includes('avg'));
    },
  },
  {
    id: 50, title: 'The Grand Finale: Executive Dashboard', category: 'Multi-CTE Masterpiece',
    difficulty: 'hard', pts: 300, xp: 600,
    scenario: 'The CEO needs a single-query executive snapshot: total customers, active customers (ordered in last 90 days), total revenue, top product, and avg order value.',
    task: 'Write a multi-CTE query that returns a single row with: total_customers, active_customers, total_revenue, avg_order_value, and top_product.',
    hint: 'Use 5 CTEs: one for each metric. Combine them in the final SELECT using cross joins.',
    answer: "WITH tc AS (SELECT COUNT(*) AS total_customers FROM customers), ac AS (SELECT COUNT(DISTINCT customer_id) AS active_customers FROM orders WHERE order_date >= date('now', '-90 days')), tr AS (SELECT ROUND(SUM(total_amount), 2) AS total_revenue FROM orders WHERE status = 'completed'), aov AS (SELECT ROUND(AVG(total_amount), 2) AS avg_order_value FROM orders WHERE status = 'completed'), tp AS (SELECT p.name AS top_product FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id, p.name ORDER BY SUM(oi.quantity * oi.unit_price) DESC LIMIT 1) SELECT tc.total_customers, ac.active_customers, tr.total_revenue, aov.avg_order_value, tp.top_product FROM tc, ac, tr, aov, tp;",
    validate: (rows) => {
      return rows.length === 2 && rows[0].length >= 3;
    },
  },
];

export const ACHIEVEMENTS = [
  { id: 'first_blood',   icon: '⚡', name: 'First Query',        desc: 'Complete your first challenge',          condition: (s) => s.completed >= 1 },
  { id: 'select_star',   icon: '⭐', name: 'SELECT Star',        desc: 'Complete 5 challenges',                  condition: (s) => s.completed >= 5 },
  { id: 'join_master',   icon: '🔗', name: 'JOIN Master',        desc: 'Complete all JOIN challenges',           condition: (s) => s.joinsDone >= 3 },
  { id: 'agg_expert',    icon: '📊', name: 'Agg Expert',         desc: 'Complete 5 aggregation challenges',      condition: (s) => s.aggsDone >= 5 },
  { id: 'window_wizard', icon: '🪟', name: 'Window Wizard',      desc: 'Complete all window function challenges', condition: (s) => s.windowsDone >= 4 },
  { id: 'cte_guru',      icon: '🧠', name: 'CTE Guru',           desc: 'Complete all CTE challenges',            condition: (s) => s.ctesDone >= 2 },
  { id: 'hard_mode',     icon: '🔥', name: 'Hard Mode',          desc: 'Complete your first Hard challenge',     condition: (s) => s.hardDone >= 1 },
  { id: 'no_hints',      icon: '🎯', name: 'Pure SQL',           desc: 'Complete 10 challenges without hints',   condition: (s) => s.noHints >= 10 },
  { id: 'streak_5',      icon: '🌊', name: 'On a Roll',          desc: 'Build a 5-challenge streak',             condition: (s) => s.streak >= 5 },
  { id: 'half_way',      icon: '🏃', name: 'Halfway There',      desc: 'Complete 25 challenges',                 condition: (s) => s.completed >= 25 },
  { id: 'speed_run',     icon: '⚡', name: 'Speed Demon',        desc: 'Complete a challenge in under 60s',      condition: (s) => s.fastSolve },
  { id: 'completionist', icon: '🏆', name: 'SQL Master',         desc: 'Complete all 50 challenges',             condition: (s) => s.completed >= 50 },
];
