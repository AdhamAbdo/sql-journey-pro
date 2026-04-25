import { Link } from 'react-router-dom';
import {
  Star, Coins, Flame, Trophy, CheckSquare, Zap,
  ArrowRight, BookOpen, Map, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CHALLENGES, ACHIEVEMENTS } from '../data/challenges';
import './Dashboard.css';

const GREETINGS = [
  'Welcome back','Good to see you','Ready to query',
  'Level up time','Let\'s write some SQL',
];

export default function Dashboard() {
  const { user } = useAuth();
  const greeting  = GREETINGS[new Date().getDay() % GREETINGS.length];

  const completed = user?.completed || [];
  const pct       = Math.round((completed.length / CHALLENGES.length) * 100);
  const nextId    = CHALLENGES.find(c => !completed.includes(c.id))?.id || 1;

  const byDiff = (d) => {
    const all  = CHALLENGES.filter(c => c.difficulty === d);
    const done = all.filter(c => completed.includes(c.id));
    return { total: all.length, done: done.length, pct: Math.round(done.length/all.length*100) };
  };
  const easy = byDiff('easy'), mid = byDiff('mid'), hard = byDiff('hard');

  const recentChallenges = [...completed]
    .reverse().slice(0, 5)
    .map(id => CHALLENGES.find(c => c.id === id)).filter(Boolean);

  const earnedBadges = ACHIEVEMENTS.filter(a => (user?.achievements || []).includes(a.id));

  const totalXP = completed.reduce((s, id) => {
    const c = CHALLENGES.find(ch => ch.id === id);
    return s + (c?.xp || 0);
  }, 0);

  const allDone = completed.length >= CHALLENGES.length;

  return (
    <div className="dashboard page-enter">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <p className="dash-greeting">{greeting},</p>
          <h1 className="dash-name">{user?.name} 👋</h1>
          <p className="dash-sub">
            {completed.length === 0
              ? 'Your SQL journey starts now. Write your first query and earn your first points.'
              : allDone
              ? '🏆 You\'ve mastered all 50 challenges. Download your certificate!'
              : `${completed.length} of ${CHALLENGES.length} challenges completed — keep the momentum going!`}
          </p>
          <div className="dash-hero-btns">
            {!allDone
              ? <Link to={`/challenge/${nextId}`} className="btn btn-primary">
                  {completed.length === 0 ? <><Zap size={15}/> Start Journey</> : <><ArrowRight size={15}/> Continue Journey</>}
                </Link>
              : <Link to="/certificate" className="btn btn-primary"><Trophy size={15}/> Get Certificate</Link>
            }
            <Link to="/learn" className="btn btn-secondary"><BookOpen size={15}/> Study SQL</Link>
          </div>
        </div>

        <div className="dash-progress-card card">
          <div className="dpc-top">
            <span className="dpc-label">Overall Progress</span>
            <span className="dpc-pct">{pct}%</span>
          </div>
          <div className="progress-track" style={{ height:10, marginBottom:22 }}>
            <div className="progress-fill" style={{ width:`${pct}%` }} />
          </div>
          <div className="dpc-tiers">
            {[
              { label:'Easy',         data:easy, color:'var(--easy)' },
              { label:'Intermediate', data:mid,  color:'var(--mid)'  },
              { label:'Hard',         data:hard, color:'var(--hard)' },
            ].map(({ label, data, color }) => (
              <div key={label} className="tier-row">
                <span className="tier-label" style={{ color }}>{label}</span>
                <span className="tier-frac">{data.done}/{data.total}</span>
                <div className="tier-track">
                  <div className="tier-fill" style={{ width:`${data.pct}%`, background:color }} />
                </div>
                <span className="tier-pct" style={{ color }}>{data.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        {[
          { icon:<Star size={20}/>,        label:'Points',       val:(user?.pts||0).toLocaleString(), color:'teal'   },
          { icon:<Coins size={20}/>,       label:'Coins',        val:user?.coins||0,                  color:'gold'   },
          { icon:<Flame size={20}/>,       label:'Streak',       val:user?.streak||0,                 color:'red'    },
          { icon:<Trophy size={20}/>,      label:'Achievements', val:earnedBadges.length,             color:'purple' },
          { icon:<CheckSquare size={20}/>, label:'Completed',    val:completed.length,                color:'teal'   },
          { icon:<Zap size={20}/>,         label:'XP Earned',    val:totalXP.toLocaleString(),        color:'cyan'   },
        ].map(s => (
          <div key={s.label} className={`stat-card card color-${s.color}`}>
            <div className="sc-icon">{s.icon}</div>
            <div className="sc-val">{s.val}</div>
            <div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-bottom">
        {/* Recent activity */}
        <div className="dash-section">
          <div className="flex-sb" style={{ marginBottom:18 }}>
            <h2 className="dash-section-title">Recent Activity</h2>
            <Link to="/journey" className="btn btn-ghost btn-sm"><Map size={13}/> View All</Link>
          </div>
          {recentChallenges.length === 0 ? (
            <div className="empty-state card">
              <div className="es-icon">🎯</div>
              <p>No challenges completed yet.</p>
              <Link to="/challenge/1" className="btn btn-primary btn-sm" style={{ marginTop:14 }}>
                <Zap size={13}/> Start Challenge #1
              </Link>
            </div>
          ) : (
            <div className="recent-list">
              {recentChallenges.map(c => (
                <Link key={c.id} to={`/challenge/${c.id}`} className="recent-item card">
                  <div className="ri-num">#{c.id}</div>
                  <div className="ri-info">
                    <div className="ri-title">{c.title}</div>
                    <div className="ri-cat">{c.category}</div>
                  </div>
                  <span className={`badge badge-${c.difficulty==='easy'?'easy':c.difficulty==='mid'?'mid':'hard'}`}>
                    {c.difficulty}
                  </span>
                  <span className="ri-pts"><Star size={11}/> +{c.pts}</span>
                  <span className="ri-check">✓</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="dash-section">
          <div className="flex-sb" style={{ marginBottom:18 }}>
            <h2 className="dash-section-title">Achievements</h2>
            <span className="text-muted" style={{ fontSize:13 }}>
              {earnedBadges.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="badges-grid">
            {ACHIEVEMENTS.map(a => {
              const earned = (user?.achievements||[]).includes(a.id);
              return (
                <div key={a.id} className={`badge-card card ${earned?'earned':'locked'}`} title={a.desc}>
                  <div className="bc-icon">{earned ? a.icon : '🔒'}</div>
                  <div className="bc-name">{a.name}</div>
                  <div className="bc-desc">{a.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="quick-links">
        {[
          { to:'/journey',    icon:<Map size={18}/>,      label:'Journey Map',    desc:'All 50 challenges' },
          { to:'/learn',      icon:<BookOpen size={18}/>, label:'Study SQL',      desc:'Business-first lessons' },
          { to:'/certificate',icon:<Award size={18}/>,    label:'Certificate',    desc:allDone?'Download yours':'50/50 to unlock' },
          { to:'/profile',    icon:<Star size={18}/>,     label:'Your Profile',   desc:'Stats & achievements' },
        ].map(l => (
          <Link key={l.to} to={l.to} className="quick-link card">
            <div className="ql-icon">{l.icon}</div>
            <div className="ql-info">
              <div className="ql-label">{l.label}</div>
              <div className="ql-desc">{l.desc}</div>
            </div>
            <ArrowRight size={15} className="ql-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
