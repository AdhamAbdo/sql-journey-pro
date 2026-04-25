import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Download, Share2, Trophy, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CHALLENGES } from '../data/challenges';
import './Certificate.css';

const TOTAL = CHALLENGES.length;

export default function Certificate() {
  const { user, issueCertificate } = useAuth();
  const canvasRef = useRef(null);
  const [confetti, setConfetti] = useState(false);
  const [certReady, setCertReady] = useState(false);

  const completed = user?.completed || [];
  const totalPts  = user?.pts || 0;
  const pct       = Math.round((completed.length / TOTAL) * 100);
  const allDone   = completed.length >= TOTAL;
  const date      = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  useEffect(() => {
    if (!allDone) return;
    renderCertificate();
    if (!user?.certificate) issueCertificate(completed.length, totalPts);
    setTimeout(() => setConfetti(true), 300);
    setTimeout(() => setConfetti(false), 6000);
  }, [allDone, user?.name]);

  // ── Canvas rendering ──────────────────────────────────
  const renderCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1200, H = 820;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = '#060a0f'; ctx.fillRect(0,0,W,H);

    // Radial BG glow
    const rg = ctx.createRadialGradient(600,400,0,600,400,700);
    rg.addColorStop(0,'rgba(0,230,180,.10)'); rg.addColorStop(.6,'rgba(34,211,238,.04)'); rg.addColorStop(1,'transparent');
    ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);

    // Outer border
    const lg = ctx.createLinearGradient(0,0,W,H);
    lg.addColorStop(0,'#00e6b4'); lg.addColorStop(.5,'#22d3ee'); lg.addColorStop(1,'#00e6b4');
    ctx.strokeStyle=lg; ctx.lineWidth=3;
    rr(ctx,16,16,W-32,H-32,24); ctx.stroke();
    ctx.strokeStyle='rgba(0,230,180,.15)'; ctx.lineWidth=1;
    rr(ctx,40,40,W-80,H-80,14); ctx.stroke();

    // Corner marks
    [[56,56,0],[W-56,56,Math.PI/2],[W-56,H-56,Math.PI],[56,H-56,-Math.PI/2]].forEach(([x,y,a])=>{
      ctx.save(); ctx.translate(x,y); ctx.rotate(a);
      ctx.strokeStyle='#00e6b4'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(55,0); ctx.moveTo(0,0); ctx.lineTo(0,55); ctx.stroke();
      ctx.restore();
    });

    // Hex patterns
    ctx.save(); ctx.globalAlpha=.035; ctx.strokeStyle='#00e6b4'; ctx.lineWidth=1;
    [[130,145],[1070,145],[80,675],[1120,675],[600,65],[600,755]].forEach(([hx,hy])=>hex(ctx,hx,hy,60));
    ctx.restore();

    // Brand
    ctx.textAlign='center'; ctx.font='bold 13px "DM Sans",sans-serif';
    ctx.fillStyle='#00e6b4'; ctx.letterSpacing='5px';
    ctx.fillText('SQL JOURNEY PRO',W/2,98); ctx.letterSpacing='0px';

    divLine(ctx,200,116,W-200);

    // Trophy
    ctx.font='78px serif'; ctx.fillText('🏆',W/2,210);

    // Subtitle
    ctx.font='italic 19px Georgia,serif'; ctx.fillStyle='rgba(221,238,255,.5)';
    ctx.fillText('Certificate of Completion',W/2,252);

    // Name
    const name = user?.name || 'SQL Analyst';
    ctx.font=`bold 62px "Syne","DM Sans",sans-serif`; ctx.fillStyle='#ffffff';
    ctx.fillText(name,W/2,340);

    // Name underline
    const nm=ctx.measureText(name).width;
    const ug=ctx.createLinearGradient(W/2-nm/2,0,W/2+nm/2,0);
    ug.addColorStop(0,'transparent'); ug.addColorStop(.5,'#00e6b4'); ug.addColorStop(1,'transparent');
    ctx.strokeStyle=ug; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W/2-nm/2,358); ctx.lineTo(W/2+nm/2,358); ctx.stroke();

    ctx.font='19px "DM Sans",sans-serif'; ctx.fillStyle='rgba(221,238,255,.75)';
    ctx.fillText('has successfully completed all 50 SQL Journey Pro challenges',W/2,400);
    ctx.font='14px "DM Sans",sans-serif'; ctx.fillStyle='rgba(221,238,255,.42)';
    ctx.fillText('demonstrating mastery of SQL for real-world data analytics and business intelligence',W/2,426);

    // Stats
    [
      {v:`${TOTAL}/${TOTAL}`,l:'Challenges',c:'#00e6b4',x:280},
      {v:totalPts.toLocaleString(),l:'Total Points',c:'#22d3ee',x:600},
      {v:'100%',l:'Completion',c:'#a78bfa',x:920},
    ].forEach(({v,l,c,x})=>{
      ctx.strokeStyle=c+'40'; ctx.lineWidth=1;
      rr(ctx,x-90,465,180,88,14); ctx.stroke();
      ctx.font=`bold 34px "Syne",sans-serif`; ctx.fillStyle=c; ctx.textAlign='center';
      ctx.fillText(v,x,508);
      ctx.font='11px "DM Sans",sans-serif'; ctx.fillStyle='rgba(221,238,255,.38)';
      ctx.letterSpacing='1px'; ctx.fillText(l.toUpperCase(),x,536); ctx.letterSpacing='0px';
    });

    divLine(ctx,200,582,W-200);

    // Skills
    const skills=['SELECT/WHERE','JOINs','GROUP BY','CTEs','Window Fns','Cohorts & Funnels'];
    let sx=(W - skills.length*148-(skills.length-1)*8)/2;
    ctx.font='bold 11px "DM Sans",sans-serif';
    skills.forEach(s=>{
      ctx.fillStyle='rgba(0,230,180,.07)'; rr(ctx,sx,602,148,26,6); ctx.fill();
      ctx.fillStyle='rgba(0,230,180,.65)'; ctx.textAlign='center';
      ctx.fillText(s,sx+74,620); sx+=156;
    });

    ctx.font='13px "DM Sans",sans-serif'; ctx.fillStyle='rgba(221,238,255,.28)'; ctx.textAlign='center';
    ctx.fillText(`Issued on ${date}  ·  sqljourneypro.io  ·  Powered by sql.js`,W/2,658);

    ctx.font='bold 18px "Syne",sans-serif'; ctx.fillStyle='#00e6b4';
    ctx.fillText('⚡ SQL Journey Pro',W/2,710);

    setCertReady(true);
  };

  function rr(ctx,x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
  }
  function hex(ctx,x,y,r){ ctx.beginPath(); for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6; i===0?ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a)):ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));} ctx.closePath(); ctx.stroke(); }
  function divLine(ctx,x1,y,x2){ const dg=ctx.createLinearGradient(x1,0,x2,0); dg.addColorStop(0,'transparent'); dg.addColorStop(.5,'rgba(0,230,180,.4)'); dg.addColorStop(1,'transparent'); ctx.strokeStyle=dg; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke(); }

  const download = () => {
    if (!allDone) return;
    const a=document.createElement('a');
    a.download=`SQL-Journey-Pro-${(user?.name||'Analyst').replace(/\s+/g,'-')}.png`;
    a.href=canvasRef.current.toDataURL('image/png'); a.click();
  };

  const shareText = encodeURIComponent(
    `🏆 Just completed all 50 challenges on SQL Journey Pro!\n\nMastered window functions, CTEs, cohort analysis, funnel metrics and more. Earned ${totalPts.toLocaleString()} points.\n\nFree browser-based SQL learning: https://sqljourneypro.io\n\n#SQL #DataAnalytics #DataEngineering #BusinessIntelligence`
  );
  const shareLinkedIn  = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fsqljourneypro.io&summary=${shareText}`,'_blank');
  const shareWhatsApp  = () => window.open(`https://wa.me/?text=${shareText}`,'_blank');
  const shareFacebook  = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fsqljourneypro.io&quote=${shareText}`,'_blank');
  const shareTwitter   = () => window.open(`https://twitter.com/intent/tweet?text=${shareText}`,'_blank');

  // ── Locked state ─────────────────────────────
  if (!allDone) {
    const remaining = TOTAL - completed.length;
    return (
      <div className="cert-page page-enter">
        <div className="cert-locked card">
          <div className="cl-icon"><Lock size={48} /></div>
          <h1 className="cl-title">Certificate Locked</h1>
          <p className="cl-desc">
            Complete all 50 challenges to unlock your certificate. 🏆
          </p>
          <div className="cl-progress">
            <div className="cl-prog-nums">
              <span>{completed.length} completed</span>
              <span>{remaining} remaining</span>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="cl-pct">{pct}% done</div>
          </div>
          <div className="cl-challenges">
            {[
              { label: 'Easy (25)',         done: completed.filter(id=>CHALLENGES.find(c=>c.id===id)?.difficulty==='easy').length,  total:25, color:'var(--easy)' },
              { label: 'Intermediate (15)', done: completed.filter(id=>CHALLENGES.find(c=>c.id===id)?.difficulty==='mid').length,   total:15, color:'var(--mid)'  },
              { label: 'Hard (10)',         done: completed.filter(id=>CHALLENGES.find(c=>c.id===id)?.difficulty==='hard').length,  total:10, color:'var(--hard)' },
            ].map(t=>(
              <div key={t.label} className="cl-tier">
                <span className="cl-tier-lbl">{t.label}</span>
                <div className="progress-track" style={{ height:6, flex:1 }}>
                  <div className="progress-fill" style={{ width:`${(t.done/t.total)*100}%`, background:t.color }} />
                </div>
                <span className="cl-tier-frac">{t.done}/{t.total}</span>
              </div>
            ))}
          </div>
          <div className="cl-actions">
            <Link to="/journey" className="btn btn-primary">
              Continue Journey <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
          </div>
          <p className="cl-motivate">
            "You're thinking like an analyst now — keep going!" 💪
          </p>
        </div>
      </div>
    );
  }

  // ── Unlocked state ────────────────────────────
  return (
    <div className="cert-page page-enter">
      {confetti && <Confetti />}
      <div className="cert-inner">
        <div className="cert-top">
          <div>
            <h1 className="cert-title"><Trophy size={32} className="text-teal" /> Journey Complete!</h1>
            <p className="cert-sub">
              Congratulations, <strong>{user?.name}</strong>! You've mastered all 50 SQL challenges.
            </p>
          </div>
          <div className="cert-actions">
            <button className="btn btn-primary" onClick={download} disabled={!certReady}>
              <Download size={15} /> Download PNG
            </button>
            <button className="btn btn-secondary icon-btn" onClick={shareLinkedIn} title="Share on LinkedIn">
              <Share2 size={15} /> LinkedIn
            </button>
            <button className="btn btn-secondary icon-btn" onClick={shareWhatsApp} title="Share on WhatsApp">
              <Share2 size={15} /> WhatsApp
            </button>
            <button className="btn btn-secondary icon-btn" onClick={shareFacebook} title="Share on Facebook">
              <Share2 size={15} /> Facebook
            </button>
            <button className="btn btn-ghost icon-btn" onClick={shareTwitter}>𝕏 Twitter</button>
          </div>
        </div>

        <div className="cert-canvas-wrap">
          <canvas ref={canvasRef} className="cert-canvas" />
          {!certReady && <div className="cert-loading"><span className="spinner" style={{width:32,height:32,borderWidth:3}} /></div>}
        </div>

        <div className="cert-share-guide card">
          <h3>📤 How to share on LinkedIn</h3>
          <ol>
            <li>Click <strong>Download PNG</strong> to save your certificate.</li>
            <li>Click <strong>LinkedIn</strong> — it will open a pre-filled post.</li>
            <li>Attach your certificate image in the LinkedIn post.</li>
            <li>Post and celebrate! 🎉</li>
          </ol>
        </div>

        <div className="cert-stats card">
          <div className="css-grid">
            {[
              { icon: <Trophy size={22} />,        val: `${TOTAL}/${TOTAL}`, label: 'Challenges Done' },
              { icon: <Star size={22} />,           val: totalPts.toLocaleString(), label: 'Points Earned' },
              { icon: <CheckCircle size={22} />,    val: (user?.achievements?.length||0), label: 'Achievements' },
            ].map(s=>(
              <div key={s.label} className="css-item">
                <div className="css-icon">{s.icon}</div>
                <div className="css-val">{s.val}</div>
                <div className="css-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#00e6b4','#22d3ee','#f59e0b','#f87171','#a78bfa','#ffffff'];
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:999}}>
      {Array.from({length:90}).map((_,i)=>(
        <div key={i} style={{
          position:'absolute', left:`${Math.random()*100}vw`, top:'-12px',
          width:`${Math.random()*10+4}px`, height:`${Math.random()*10+4}px`,
          borderRadius: Math.random()>.5 ? '50%' : '2px',
          background: colors[~~(Math.random()*colors.length)],
          animation:`confettiFall ${Math.random()*3+2}s linear ${Math.random()*2}s forwards`,
        }}/>
      ))}
    </div>
  );
}
