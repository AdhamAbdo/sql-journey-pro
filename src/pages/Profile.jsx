import { useState } from "react";
import { User, Star, Coins, Flame, Trophy, CheckSquare, Zap, Edit2, Check } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { CHALLENGES, ACHIEVEMENTS } from '../data/challenges';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(user?.name || '');
  const [saved, setSaved]       = useState(false);

  const completed = user?.completed || [];
  const pct = Math.round((completed.length / CHALLENGES.length) * 100);
  const totalPts = user?.pts || 0;
  const earned = ACHIEVEMENTS.filter(a => (user?.achievements || []).includes(a.id));
  const totalXP = completed.reduce((s, id) => {
    const c = CHALLENGES.find(ch => ch.id === id);
    return s + (c?.xp || 0);
  }, 0);

  const handleSave = () => {
    if (!name.trim()) return;
    updateUser({ name: name.trim() });
    setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const byDiff = (d) => {
    const all = CHALLENGES.filter(c => c.difficulty === d);
    const done = all.filter(c => completed.includes(c.id));
    return { total: all.length, done: done.length, pct: Math.round(done.length/all.length*100) };
  };
  const easy = byDiff('easy'), mid = byDiff('mid'), hard = byDiff('hard');

  return (
    <div className="profile-page page-enter">
      <div className="profile-inner">
        {/* Hero card */}
        <div className="profile-card card">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="profile-main">
            {editing ? (
              <div className="profile-edit-row">
                <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ maxWidth: 260 }} />
                <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            ) : (
              <div className="profile-name-row">
                <h1 className="profile-name">{user?.name}</h1>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
                {saved && <span className="save-badge">✓ Saved</span>}
              </div>
            )}
            <p className="profile-email">{user?.email}</p>
            <p className="profile-joined">Member since {user?.joined || 'today'}</p>
          </div>
          <div className="profile-rank">
            <div className="rank-badge">
              {pct >= 100 ? '🏆 SQL Master' : pct >= 60 ? '🔥 Advanced' : pct >= 30 ? '⚡ Intermediate' : '🌱 Beginner'}
            </div>
            <div className="rank-sub">{pct}% complete</div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          {[
            { icon: <Star size={20}/>,        val: totalPts.toLocaleString(), label: 'Points Earned'    },
            { icon: <Coins size={20}/>,       val: user?.coins || 0,          label: 'Coins Available'  },
            { icon: <Flame size={20}/>,       val: user?.streak || 0,         label: 'Current Streak'   },
            { icon: <CheckSquare size={20}/>, val: completed.length,          label: 'Completed'        },
            { icon: <Trophy size={20}/>,      val: earned.length,             label: 'Achievements'     },
            { icon: <Zap size={20}/>,         val: totalXP.toLocaleString(),  label: 'XP Earned'        },
          ].map(s => (
            <div key={s.label} className="ps-card card">
              <div className="ps-icon">{s.icon}</div>
              <div className="ps-val">{s.val}</div>
              <div className="ps-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="profile-grid">
          {/* Progress breakdown */}
          <div className="prog-breakdown card">
            <h2 className="section-title">Mastery Progress</h2>
            <div className="prog-items">
              {[
                { label: 'Easy',         data: easy, color: 'var(--easy)' },
                { label: 'Intermediate', data: mid,  color: 'var(--mid)' },
                { label: 'Hard',         data: hard, color: 'var(--hard)' },
              ].map(({ label, data, color }) => (
                <div key={label} className="prog-item">
                  <div className="pi-top">
                    <span className="pi-label">{label}</span>
                    <span className="pi-frac">{data.done}/{data.total}</span>
                    <span className="pi-pct" style={{ color }}>{data.pct}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${data.pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="achievements-section card">
            <h2 className="section-title">Achievements <span className="ach-count">{earned.length}/{ACHIEVEMENTS.length}</span></h2>
            <div className="ach-grid">
              {ACHIEVEMENTS.map(a => {
                const got = (user?.achievements || []).includes(a.id);
                return (
                  <div key={a.id} className={`ach-item ${got ? 'earned' : 'locked'}`} title={a.desc}>
                    <div className="ach-icon">{got ? a.icon : '🔒'}</div>
                    <div className="ach-name">{a.name}</div>
                    <div className="ach-desc">{a.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed list */}
          <div className="comp-list card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="section-title">Completed Challenges</h2>
            {completed.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 14 }}>No challenges completed yet. Start your journey!</p>
            ) : (
              <div className="comp-grid">
                {[...completed].sort((a,b) => a-b).map(id => {
                  const c = CHALLENGES.find(ch => ch.id === id);
                  if (!c) return null;
                  const hinted = (user?.hintedLevels || []).includes(id);
                  return (
                    <div key={id} className="comp-item">
                      <span className="comp-num font-mono">#{id}</span>
                      <span className="comp-title">{c.title}</span>
                      <span className={`badge badge-${c.difficulty === 'easy' ? 'easy' : c.difficulty === 'mid' ? 'mid' : 'hard'}`} style={{ fontSize: 11 }}>
                        {c.difficulty}
                      </span>
                      <span className="comp-pts text-gold font-mono">+{c.pts}</span>
                      {hinted && <span className="text-faint" style={{ fontSize: 11 }}>💡</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
