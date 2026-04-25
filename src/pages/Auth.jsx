import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Auth() {
  const location  = useLocation();
  const isSignup  = location.pathname === '/signup';
  const navigate  = useNavigate();
  const { login, signup } = useAuth();

  const [form,    setForm]    = useState({ name:'', email:'', password:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isSignup) {
        if (!form.name.trim()) throw new Error('Name is required.');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        await signup(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      } else {
        await login(form.email.trim().toLowerCase(), form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb1"/><div className="auth-orb2"/>
        <div className="grid-bg"/>
      </div>

      <Link to="/" className="auth-back"><ArrowLeft size={15}/> Back</Link>

      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-mark"><Zap size={16}/></div>
          <span>SQL Journey <span className="text-teal">Pro</span></span>
        </div>

        <h1 className="auth-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="auth-sub">
          {isSignup
            ? 'Start your SQL mastery journey. Free forever, no credit card needed.'
            : 'Continue where you left off.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {isSignup && (
            <div className="field">
              <label className="label">Your name</label>
              <input className="input" placeholder="Ada Lovelace"
                value={form.name} onChange={e=>set('name',e.target.value)}
                required autoFocus/>
            </div>
          )}
          <div className="field">
            <label className="label">Email address</label>
            <input type="email" className="input" placeholder="you@company.com"
              value={form.email} onChange={e=>set('email',e.target.value)}
              required autoFocus={!isSignup}/>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <div className="pw-wrap">
              <input type={showPw?'text':'password'} className="input"
                placeholder={isSignup?'At least 6 characters':'••••••••'}
                value={form.password} onChange={e=>set('password',e.target.value)}
                required style={{ paddingRight:44 }}/>
              <button type="button" className="pw-toggle" onClick={()=>setShowPw(!showPw)}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <button className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:'14px' }}
            disabled={loading}>
            {loading
              ? <span className="spinner"/>
              : isSignup ? 'Create Account →' : 'Log In →'}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup
            ? <>Already have an account? <Link to="/login">Log in</Link></>
            : <>New here? <Link to="/signup">Create a free account</Link></>}
        </div>

        {isSignup && (
          <div className="auth-perks">
            {['50 real SQL challenges','Gamified progress + achievements','Completion certificate'].map(p=>(
              <div key={p} className="auth-perk">✓ {p}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
