import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Map, Play, Lightbulb, Eye, Trash2,
  CheckCircle, XCircle, BookOpen, Database, Clock, Star, Coins,
  Flame, ArrowRight, RotateCcw, Trophy
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../hooks/useDatabase';
import { CHALLENGES, ACHIEVEMENTS } from '../data/challenges';
import SqlEditor from '../components/SqlEditor';
import SchemaViewer from '../components/SchemaViewer';
import './Challenge.css';

const DIFF_LABEL  = { easy: 'Easy', mid: 'Intermediate', hard: 'Hard' };
const WIN_MSGS    = [
  { em: '🎉', h: 'Perfect Query!',        s: 'Clean, correct, and professional. Nice work.' },
  { em: '🚀', h: 'Nailed It!',            s: "You're thinking like a senior analyst." },
  { em: '⚡', h: 'Outstanding!',          s: 'Your query would pass any code review.' },
  { em: '🏆', h: 'SQL Master Move!',      s: 'The data team would hire you on the spot.' },
  { em: '🎯', h: "Bulls-eye!",            s: 'Spot on — the results match perfectly.' },
];
const FAIL_MSGS = [
  { em: '🤔', h: 'Not quite right',       s: '' },
  { em: '💡', h: 'Check your logic',      s: "Re-read the task — something's off." },
  { em: '🔍', h: 'Almost there',          s: 'Double-check your columns and filters.' },
];

export default function Challenge() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user, completeChallenge, useHintFor, unlockAchievement } = useAuth();
  const { ready, error: dbError, runQuery, validateAgainstAnswer } = useDatabase();

  const chId = parseInt(id);
  const ch   = CHALLENGES.find(c => c.id === chId);
  const prev = CHALLENGES.find(c => c.id === chId - 1);
  const next = CHALLENGES.find(c => c.id === chId + 1);

  const [sql,        setSql]        = useState('');
  const [result,     setResult]     = useState(null);
  const [expected,   setExpected]   = useState(null);
  const [queryError, setQueryError] = useState('');
  const [valReason,  setValReason]  = useState('');
  const [feedback,   setFeedback]   = useState(null); // null | 'correct' | 'incorrect'
  const [fbData,     setFbData]     = useState(null);
  const [running,    setRunning]    = useState(false);
  const [hintShown,  setHintShown]  = useState(false);
  const [hintUsed,   setHintUsed]   = useState(false);
  const [answerShown,setAnswerShown]= useState(false);
  const [activeTab,  setActiveTab]  = useState('scenario');
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [startTime]                 = useState(Date.now());
  const toastTimer = useRef(null);

  const completed = user?.completed || [];
  const isDone    = completed.includes(chId);
  const hinted    = (user?.hintedLevels || []).includes(chId);

  useEffect(() => {
    setSql(''); setResult(null); setExpected(null);
    setQueryError(''); setValReason('');
    setFeedback(null); setFbData(null);
    setHintShown(hinted); setHintUsed(false);
    setAnswerShown(false); setActiveTab('scenario');
  }, [chId]);

  if (!ch) return (
    <div className="challenge-404">
      <h2>Challenge not found</h2>
      <Link to="/journey" className="btn btn-primary"><Map size={16} /> Back to Map</Link>
    </div>
  );

  const handleRun = useCallback(() => {
    if (!ready || running) return;
    const q = sql.trim();
    if (!q) { setQueryError('Write a SQL query first.'); return; }
    setRunning(true); setQueryError(''); setResult(null); setExpected(null);
    setFeedback(null); setFbData(null); setValReason('');

    setTimeout(() => {
      try {
        // ── Validate by comparing result sets ──────────
        const { correct, reason, userResult, expectedResult } =
          validateAgainstAnswer(q, ch.answer);

        setResult(userResult);
        setExpected(expectedResult);
        setValReason(reason);

        if (correct) {
          const fastSolve = Date.now() - startTime < 60_000;
          const msg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
          setFbData(msg); setFeedback('correct');
          if (!isDone) {
            completeChallenge(chId, ch.pts, hintUsed);
            runAchievementCheck(fastSolve);
            flashPoints(`+${ch.pts}`);
          }
        } else {
          const msg = FAIL_MSGS[Math.floor(Math.random() * FAIL_MSGS.length)];
          msg.s = reason; // use specific reason from comparator
          setFbData({ ...msg }); setFeedback('incorrect');
        }
      } catch (e) {
        setQueryError(e.message);
      }
      setRunning(false);
    }, 300);
  }, [sql, ready, running, ch, isDone, hintUsed]);

  const runAchievementCheck = (fastSolve) => {
    const newCompleted = [...completed, chId];
    import('../data/challenges').then(({ ACHIEVEMENTS }) => {
      const s = {
        completed: newCompleted.length,
        joinsDone:   newCompleted.filter(id => CHALLENGES.find(c=>c.id===id)?.category?.includes('JOIN')).length,
        aggsDone:    newCompleted.filter(id => ['Aggregation','GROUP BY','GROUP BY + AVG'].includes(CHALLENGES.find(c=>c.id===id)?.category)).length,
        windowsDone: newCompleted.filter(id => CHALLENGES.find(c=>c.id===id)?.category?.includes('Window')).length,
        ctesDone:    newCompleted.filter(id => CHALLENGES.find(c=>c.id===id)?.category?.includes('CTE')).length,
        hardDone:    newCompleted.filter(id => CHALLENGES.find(c=>c.id===id)?.difficulty==='hard').length,
        noHints:     newCompleted.filter(id => !(user?.hintedLevels||[]).includes(id)).length,
        streak:      (user?.streak || 0) + 1,
        fastSolve,
      };
      ACHIEVEMENTS.forEach(a => {
        if (!(user?.achievements||[]).includes(a.id) && a.condition(s)) {
          unlockAchievement(a.id);
          showToast(`🏆 Achievement: ${a.name}`);
        }
      });
    });
  };

  const flashPoints = (text) => {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
      position:'fixed', left:'50%', top:'42%',
      transform:'translate(-50%,-50%)',
      fontFamily:'var(--font-display)', fontSize:'34px', fontWeight:'900',
      color:'var(--teal)', pointerEvents:'none', zIndex:'9999',
      animation:'ptFlash 1.4s var(--ease) forwards',
      textShadow:'0 0 24px var(--teal-glow)',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  };

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    const old = document.querySelector('.toast');
    old?.remove();
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el);
    toastTimer.current = setTimeout(() => el.remove(), 3500);
  };

  const handleHint = () => {
    if (hintShown) return;
    if ((user?.coins || 0) < 5) { showToast('Not enough coins! Earn more by completing challenges. 🪙'); return; }
    useHintFor(chId);
    setHintShown(true); setHintUsed(true);
  };

  const handleShowAnswer = () => {
    setSql(ch.answer); setAnswerShown(true);
    showToast('📖 Answer loaded — study it, then try writing your own!');
  };

  const diffClass = { easy: 'badge-easy', mid: 'badge-mid', hard: 'badge-hard' };
  const progPct   = Math.round((completed.length / CHALLENGES.length) * 100);

  return (
    <div className="challenge-page page-enter">
      {/* ── Top bar ── */}
      <div className="ch-topbar">
        <Link to="/journey" className="btn btn-ghost btn-sm icon-btn">
          <Map size={15} /> Map
        </Link>
        <div className="ch-progress-mini">
          <span className="ch-prog-txt">{completed.length}/{CHALLENGES.length}</span>
          <div className="progress-track" style={{ width: 140, height: 6 }}>
            <div className="progress-fill" style={{ width: `${progPct}%` }} />
          </div>
          <span className="ch-prog-txt">{progPct}%</span>
        </div>
        <div className="ch-nav-btns">
          {prev && <Link to={`/challenge/${prev.id}`} className="btn btn-ghost btn-sm icon-btn"><ChevronLeft size={15} />#{prev.id}</Link>}
          {next && <Link to={`/challenge/${next.id}`} className="btn btn-ghost btn-sm icon-btn">#{next.id}<ChevronRight size={15}/></Link>}
        </div>
        <div className="ch-hud">
          <span className="hud-chip"><Star size={13} /> {user?.pts?.toLocaleString() || 0}</span>
          <span className="hud-chip gold"><Coins size={13} /> {user?.coins || 0}</span>
          <span className="hud-chip red"><Flame size={13} /> {user?.streak || 0}</span>
        </div>
      </div>

      <div className="ch-layout">
        {/* ── LEFT: Scenario + feedback ── */}
        <div className="ch-left">
          <div className="ch-header card">
            <div className="ch-header-top">
              <div className="ch-id-badge">#{chId}</div>
              <span className={`badge ${diffClass[ch.difficulty]}`}>{DIFF_LABEL[ch.difficulty]}</span>
              <span className="badge badge-teal">{ch.category}</span>
              {isDone && <span className="badge badge-teal"><CheckCircle size={11} /> Done</span>}
              <span className="ch-pts-badge"><Star size={12} /> +{ch.pts}</span>
            </div>
            <h1 className="ch-title">{ch.title}</h1>

            <div className="ch-tabs">
              <button className={`ch-tab ${activeTab==='scenario'?'active':''}`} onClick={()=>setActiveTab('scenario')}>
                <BookOpen size={14} /> Scenario
              </button>
              <button className="ch-tab schema-tab" onClick={() => setSchemaOpen(true)}>
                <Database size={14} /> View Schema
              </button>
            </div>

            {activeTab === 'scenario' && (
              <div className="ch-scenario fade-in">
                <p className="ch-scene-desc">{ch.scenario}</p>
                <div className="task-box">
                  <div className="task-label">Your Task</div>
                  <p className="task-text">{ch.task}</p>
                </div>
                <div className="hint-area">
                  {!hintShown ? (
                    <button className="hint-btn" onClick={handleHint}>
                      <Lightbulb size={14} />
                      <span>Reveal Hint</span>
                      <span className="hint-cost">–5 coins</span>
                    </button>
                  ) : (
                    <div className="hint-reveal fade-in">
                      <div className="hint-label"><Lightbulb size={12} /> Hint</div>
                      <p>{ch.hint}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Schema modal */}
          {schemaOpen && <SchemaViewer onClose={() => setSchemaOpen(false)} />}

          {/* Feedback */}
          {feedback && fbData && (
            <div className={`feedback-card card fade-in ${feedback}`}>
              <div className="fb-em">{fbData.em}</div>
              <div className="fb-content">
                <div className="fb-heading">{fbData.h}</div>
                <div className="fb-sub">{fbData.s}</div>
                {feedback === 'correct' && !isDone && (
                  <div className="fb-reward">
                    <span><Star size={12} /> +{ch.pts} pts</span>
                    <span><Coins size={12} /> +5 coins</span>
                    {hintUsed && <span className="fb-hint-note"><Lightbulb size={12} /> –20% hint penalty</span>}
                  </div>
                )}
                {feedback === 'correct' && (
                  next
                    ? <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={()=>navigate(`/challenge/${next.id}`)}>
                        Next Challenge <ArrowRight size={14} />
                      </button>
                    : <Link to="/certificate" className="btn btn-primary btn-sm" style={{ marginTop:12 }}>
                        <Trophy size={14} /> Get Certificate
                      </Link>
                )}
              </div>
            </div>
          )}

          {/* Expected output when wrong */}
          {feedback === 'incorrect' && expected && expected.rows?.length > 0 && (
            <div className="expected-panel card fade-in">
              <div className="ep-hdr"><Eye size={13} /> Expected Output (first 5 rows)</div>
              <div className="result-table-wrap">
                <table className="result-table">
                  <thead><tr>{expected.columns.map(c=><th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {expected.rows.slice(0,5).map((row,i)=>(
                      <tr key={i}>{row.map((cell,j)=><td key={j}>{cell??'NULL'}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Editor + results ── */}
        <div className="ch-right">
          <div className="editor-panel card">
            <div className="ep-header">
              <span className="ep-title">SQL Editor</span>
              <span className="ep-shortcut"><kbd>Ctrl</kbd>+<kbd>↵</kbd> run</span>
            </div>
            <div className="ep-body">
              <SqlEditor
                value={sql}
                onChange={setSql}
                onRun={handleRun}
                disabled={running}
              />
              <div className="ep-actions">
                <button className="run-btn" onClick={handleRun} disabled={!ready || running}>
                  {running
                    ? <><span className="spinner" style={{width:14,height:14}} /> Running…</>
                    : <><Play size={14} /> Run Query</>}
                </button>
                <button className="btn btn-ghost btn-sm icon-btn" onClick={()=>setSql('')} title="Clear">
                  <Trash2 size={14} /> Clear
                </button>
                <button className="btn btn-ghost btn-sm icon-btn" onClick={handleShowAnswer} title="Show answer">
                  <Eye size={14} /> {answerShown ? 'Answer shown' : 'Show Answer'}
                </button>
                {isDone && (
                  <span className="already-done"><CheckCircle size={13} /> Already solved</span>
                )}
              </div>

              {!ready && !dbError && (
                <div className="db-loading"><span className="spinner" /> Initialising SQL engine…</div>
              )}
              {dbError    && <div className="error-box"><XCircle size={14} /> Database error: {dbError}</div>}
              {queryError && <div className="error-box shake"><XCircle size={14} /> {queryError}</div>}

              {result && (
                <div className="result-panel fade-in">
                  <div className="rp-header">
                    <span className="rp-title">Results</span>
                    <span className="rp-count">{result.rows.length} row{result.rows.length!==1?'s':''}</span>
                    {feedback === 'correct'   && <span className="rp-correct"><CheckCircle size={13} /> Correct</span>}
                    {feedback === 'incorrect' && <span className="rp-incorrect"><XCircle size={13} /> {valReason}</span>}
                  </div>
                  <div className="result-table-wrap">
                    <table className="result-table">
                      <thead><tr>{result.columns.map(c=><th key={c}>{c}</th>)}</tr></thead>
                      <tbody>
                        {result.rows.slice(0,100).map((row,i)=>(
                          <tr key={i}>{row.map((cell,j)=><td key={j}>{cell??<span className="null-val">NULL</span>}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                    {result.rows.length > 100 && (
                      <div className="result-truncated">Showing 100 of {result.rows.length} rows</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

