import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Lock, CheckCircle, ArrowRight, Play,
  Lightbulb, Star, Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CHALLENGES } from '../data/challenges';
import './JourneyMap.css';

const DIFF_LABEL = { easy:'Easy', mid:'Intermediate', hard:'Hard' };
const DIFF_COLOR = { easy:'easy', mid:'mid', hard:'hard' };

export default function JourneyMap() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');

  const completed = user?.completed || [];
  const pct       = Math.round((completed.length / CHALLENGES.length) * 100);
  const nextId    = CHALLENGES.find(c => !completed.includes(c.id))?.id || 1;

  const isUnlocked = (ch) => {
    if (ch.id === 1) return true;
    if (completed.includes(ch.id)) return true;
    const maxDone = completed.length > 0 ? Math.max(...completed) : 0;
    return ch.id <= maxDone + 3;
  };

  const filtered = CHALLENGES.filter(c => {
    if (filter !== 'all' && c.difficulty !== filter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    easy: CHALLENGES.filter(c=>c.difficulty==='easy').length,
    mid:  CHALLENGES.filter(c=>c.difficulty==='mid').length,
    hard: CHALLENGES.filter(c=>c.difficulty==='hard').length,
  };
  const done = {
    easy: completed.filter(id=>CHALLENGES.find(c=>c.id===id)?.difficulty==='easy').length,
    mid:  completed.filter(id=>CHALLENGES.find(c=>c.id===id)?.difficulty==='mid').length,
    hard: completed.filter(id=>CHALLENGES.find(c=>c.id===id)?.difficulty==='hard').length,
  };

  return (
    <div className="journey-map page-enter">
      {/* Header */}
      <div className="jm-header">
        <div className="jm-header-row">
          <div>
            <h1 className="jm-title">Journey Map</h1>
            <p className="jm-sub">
              {completed.length} of {CHALLENGES.length} challenges completed · {pct}% mastery
            </p>
          </div>
          <div className="jm-header-right">
            <div className="progress-track" style={{ width:240, height:8 }}>
              <div className="progress-fill" style={{ width:`${pct}%` }} />
            </div>
            <Link to={`/challenge/${nextId}`} className="btn btn-primary btn-sm">
              <Play size={13}/> Continue
            </Link>
          </div>
        </div>

        {/* Diff summary */}
        <div className="jm-summary">
          {[
            { diff:'easy', color:'var(--easy)',   label:'Easy' },
            { diff:'mid',  color:'var(--mid)',    label:'Intermediate' },
            { diff:'hard', color:'var(--hard)',   label:'Hard' },
          ].map(({ diff, color, label }) => (
            <div key={diff} className="jm-sum-item">
              <span className="jms-label" style={{ color }}>{label}</span>
              <div className="progress-track" style={{ height:6, width:80 }}>
                <div className="progress-fill"
                  style={{ width:`${(done[diff]/counts[diff])*100}%`, background:color }} />
              </div>
              <span className="jms-frac">{done[diff]}/{counts[diff]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="jm-controls">
        <div className="search-wrap">
          <Search size={14} className="search-icon"/>
          <input
            className="search-input"
            placeholder="Search challenges…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          <Filter size={13} style={{ color:'var(--text-3)' }}/>
          {['all','easy','mid','hard'].map(f => (
            <button
              key={f}
              className={`fpill ${filter===f?'active':''} ${f}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All (50)' : `${DIFF_LABEL[f]} (${counts[f]})`}
            </button>
          ))}
        </div>
        <div className="jm-legend">
          <span className="leg-item"><span className="leg-dot done"/><CheckCircle size={11}/>Done</span>
          <span className="leg-item"><span className="leg-dot unlocked"/>Unlocked</span>
          <span className="leg-item"><span className="leg-dot locked"/><Lock size={10}/>Locked</span>
        </div>
      </div>

      {/* Grid */}
      <div className="jm-grid">
        {filtered.map((ch, i) => {
          const done2     = completed.includes(ch.id);
          const unlocked2 = isUnlocked(ch);
          const hinted    = (user?.hintedLevels||[]).includes(ch.id);

          return (
            <div
              key={ch.id}
              className={`ch-card card ${done2?'done':unlocked2?'unlocked':'locked'}`}
              onClick={() => unlocked2 && navigate(`/challenge/${ch.id}`)}
              style={{ animationDelay:`${(i % 25)*0.025}s` }}
            >
              <div className="ch-num">
                {done2
                  ? <CheckCircle size={18} className="done-check"/>
                  : unlocked2
                  ? <span>{ch.id}</span>
                  : <Lock size={14}/>
                }
              </div>
              <div className="ch-info">
                <div className="ch-cat">{ch.category}</div>
                <div className="ch-title">{ch.title}</div>
                <div className="ch-meta">
                  <span className={`badge badge-${DIFF_COLOR[ch.difficulty]}`}>
                    {DIFF_LABEL[ch.difficulty]}
                  </span>
                  <span className="ch-pts"><Star size={10}/> {ch.pts}</span>
                  {hinted && <span className="ch-hinted"><Lightbulb size={10}/> hint</span>}
                </div>
              </div>
              <div className="ch-right">
                {done2     && <span className="done-label">Done</span>}
                {!done2 && unlocked2 && <ArrowRight size={15} className="ch-arrow"/>}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card" style={{ maxWidth:400, margin:'60px auto', padding:48 }}>
          <div className="es-icon"><Search size={36}/></div>
          <p>No challenges match your search.</p>
          <button
            className="btn btn-ghost btn-sm" style={{ marginTop:14 }}
            onClick={()=>{ setSearch(''); setFilter('all'); }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
