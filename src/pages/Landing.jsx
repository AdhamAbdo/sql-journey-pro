import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Landing.css';

const FEATURES = [
  { icon: '⚡', title: '50 Real Challenges', desc: 'From SELECT basics to multi-CTE masterpieces — all based on actual business scenarios.' },
  { icon: '🎮', title: 'Gamified Learning', desc: 'Earn points, unlock levels, build streaks, and collect achievement badges as you progress.' },
  { icon: '🔬', title: 'Live SQL Engine', desc: 'Execute real SQL in-browser with sql.js. Instant feedback on every query you write.' },
  { icon: '📜', title: 'Shareable Certificate', desc: 'Earn a downloadable certificate on completion. Share it directly to LinkedIn.' },
  { icon: '🧠', title: 'All SQL Concepts', desc: 'CTEs, window functions, cohort analysis, subqueries, funnels — every concept covered.' },
  { icon: '🪙', title: 'Hint Economy', desc: 'Spend coins to unlock hints when you\'re stuck. Earn coins by completing challenges.' },
];

const SKILLS = [
  'SELECT / WHERE', 'JOINs', 'GROUP BY / HAVING',
  'Subqueries', 'CTEs', 'Window Functions',
  'CASE WHEN', 'Date Functions', 'Cohort Analysis',
  'Funnel Analysis', 'ROW_NUMBER / RANK', 'LAG / LEAD',
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  return (
    <div className="landing">
      {/* BG */}
      <div className="landing-bg">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="grid-bg" />
      </div>

      {/* Nav */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="nav-logo-mark-lg">⚡</div>
          <span className="landing-nav-brand">SQL Journey <span>Pro</span></span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Start Free →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <div className="dot-teal" />
          <span>50 challenges · Real SQL · No fluff</span>
        </div>

        <h1 className="hero-h1">
          Master SQL<br />
          <span className="hero-accent">Like a Pro.</span>
        </h1>

        <p className="hero-sub">
          The gamified SQL platform built for data analysts and BI specialists.<br />
          Real business scenarios. Live query execution. Certificate on completion.
        </p>

        <div className="hero-cta">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Begin Your Journey →
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            I have an account
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-n">50</span>
            <span className="stat-l">SQL Challenges</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-n">5</span>
            <span className="stat-l">Table Dataset</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-n">100%</span>
            <span className="stat-l">Browser-based</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-n">∞</span>
            <span className="stat-l">Retries</span>
          </div>
        </div>
      </section>

      {/* Skills strip */}
      <div className="skills-strip">
        <div className="skills-track">
          {[...SKILLS, ...SKILLS].map((s, i) => (
            <span key={i} className="skill-pill">{s}</span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="features-section">
        <div className="section-inner">
          <p className="section-eyebrow">Everything you need</p>
          <h2 className="section-h2">Built for serious analysts.</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SQL Preview */}
      <section className="preview-section">
        <div className="section-inner">
          <div className="preview-card">
            <div className="preview-top">
              <div className="preview-dots">
                <span /><span /><span />
              </div>
              <span className="preview-label">SQL Editor</span>
            </div>
            <div className="preview-code">
              <div className="code-line"><span className="kw">WITH</span> <span className="fn">monthly_revenue</span> <span className="kw">AS</span> (</div>
              <div className="code-line pl-2"><span className="kw">SELECT</span></div>
              <div className="code-line pl-4"><span className="fn">strftime</span>(<span className="str">'%Y-%m'</span>, order_date) <span className="kw">AS</span> month,</div>
              <div className="code-line pl-4"><span className="fn">SUM</span>(total_amount) <span className="kw">AS</span> revenue</div>
              <div className="code-line pl-2"><span className="kw">FROM</span> orders</div>
              <div className="code-line pl-2"><span className="kw">WHERE</span> status = <span className="str">'completed'</span></div>
              <div className="code-line pl-2"><span className="kw">GROUP BY</span> month</div>
              <div className="code-line">)</div>
              <div className="code-line"><span className="kw">SELECT</span> month, revenue,</div>
              <div className="code-line pl-2"><span className="fn">LAG</span>(revenue) <span className="kw">OVER</span> (<span className="kw">ORDER BY</span> month) <span className="kw">AS</span> prev_revenue</div>
              <div className="code-line"><span className="kw">FROM</span> monthly_revenue;</div>
            </div>
            <div className="preview-result">
              <div className="result-header">✓ Query executed — 12 rows returned in 2ms</div>
              <div className="result-table">
                <div className="rt-row rt-head"><span>month</span><span>revenue</span><span>prev_revenue</span></div>
                <div className="rt-row"><span>2023-01</span><span>$749.97</span><span>—</span></div>
                <div className="rt-row"><span>2023-02</span><span>$199.99</span><span>$749.97</span></div>
                <div className="rt-row"><span>2023-03</span><span>$499.98</span><span>$199.99</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="cta-section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 className="section-h2">Ready to level up?</h2>
          <p className="hero-sub" style={{ marginBottom: 36 }}>
            Join analysts who are sharpening their SQL skills through real challenges.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Start Your Journey — It's Free →
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>⚡ SQL Journey Pro</span>
        <span>·</span>
        <span>Built for data analysts</span>
      </footer>
    </div>
  );
}
