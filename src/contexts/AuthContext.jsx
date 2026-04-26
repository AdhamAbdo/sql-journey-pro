import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  STORAGE LAYER
//  When Supabase is configured  → use Supabase exclusively, ZERO localStorage.
//  When Supabase is NOT config  → localStorage fallback (dev / offline mode).
// ─────────────────────────────────────────────────────────────────────────────

const LS_USERS   = 'sqljp_users_v2';
const LS_SESSION = 'sqljp_session_v2';

const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ── localStorage helpers (fallback only) ─────────────────────────────────────
function lsSignup(name, email, password) {
  const users = lsGet(LS_USERS, {});
  if (users[email]) throw new Error('An account with this email already exists.');
  const u = {
    id: crypto.randomUUID(), name, email,
    pts: 0, coins: 30, streak: 0,
    joined: new Date().toISOString().split('T')[0],
    completed: [], achievements: [], hintedLevels: [],
    certificate: null, certificate_unlocked: false,
    password,
  };
  users[email] = u;
  lsSet(LS_USERS, users);
  lsSet(LS_SESSION, { email });
  const { password: _, ...safe } = u;
  return safe;
}

function lsLogin(email, password) {
  const users = lsGet(LS_USERS, {});
  const u = users[email];
  if (!u) throw new Error('No account found with this email.');
  if (u.password !== password) throw new Error('Incorrect password.');
  lsSet(LS_SESSION, { email });
  const { password: _, ...safe } = u;
  return safe;
}

function lsLogout() {
  localStorage.removeItem(LS_SESSION);
}

function lsGetUser() {
  const s = lsGet(LS_SESSION, null);
  if (!s?.email) return null;
  const users = lsGet(LS_USERS, {});
  const u = users[s.email];
  if (!u) return null;
  const { password: _, ...safe } = u;
  return safe;
}

function lsSave(email, updates) {
  const users = lsGet(LS_USERS, {});
  if (users[email]) {
    users[email] = { ...users[email], ...updates };
    lsSet(LS_USERS, users);
  }
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGetFullUser(authUser) {
  if (!supabase) return null;
  const [{ data: profile }, { data: progress }, { data: achievements }, { data: cert }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).single(),
      supabase.from('progress').select('challenge_id, used_hint, pts_earned').eq('user_id', authUser.id),
      supabase.from('achievements').select('achievement_id').eq('user_id', authUser.id),
      supabase.from('certificates').select('*').eq('user_id', authUser.id).maybeSingle(),
    ]);

  const completedIds   = (progress || []).map(p => p.challenge_id);
  const hintedIds      = (progress || []).filter(p => p.used_hint).map(p => p.challenge_id);
  const achievementIds = (achievements || []).map(a => a.achievement_id);

  return {
    id:                  authUser.id,
    email:               authUser.email,
    name:                profile?.name  || authUser.email.split('@')[0],
    pts:                 profile?.pts   || 0,
    coins:               profile?.coins || 30,
    streak:              profile?.streak || 0,
    joined:              profile?.joined || new Date().toISOString().split('T')[0],
    completed:           completedIds,
    hintedLevels:        hintedIds,
    achievements:        achievementIds,
    certificate:         cert || null,
    certificate_unlocked: cert?.certificate_unlocked || false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session ───────────────────────────────────────────────────────
  useEffect(() => {
    if (SUPABASE_CONFIGURED && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) setUser(await sbGetFullUser(session.user));
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) setUser(await sbGetFullUser(session.user));
        else setUser(null);
      });
      return () => subscription.unsubscribe();
    } else {
      // localStorage fallback
      setUser(lsGetUser());
      setLoading(false);
    }
  }, []);

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    if (SUPABASE_CONFIGURED && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id, name, email,
          pts: 0, coins: 30, streak: 0,
          joined: new Date().toISOString().split('T')[0],
        });
        if (profileError) {
          console.error('[v0] Failed to create profile in Supabase:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        const u = await sbGetFullUser(data.user);
        setUser(u); return u;
      }
    } else {
      const u = lsSignup(name, email, password);
      setUser(u); return u;
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    if (SUPABASE_CONFIGURED && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const u = await sbGetFullUser(data.user);
      setUser(u); return u;
    } else {
      const u = lsLogin(email, password);
      setUser(u); return u;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (SUPABASE_CONFIGURED && supabase) await supabase.auth.signOut();
    else lsLogout();
    setUser(null);
  }, []);

  // ── Update profile fields ─────────────────────────────────────────────────
  const updateUser = useCallback(async (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (SUPABASE_CONFIGURED && supabase) {
        supabase.from('profiles').update(updates).eq('id', prev.id);
      } else {
        lsSave(prev.email, updates);
      }
      return next;
    });
  }, []);

  // ── Complete a challenge ──────────────────────────────────────────────────
  const completeChallenge = useCallback((challengeId, pts, usedHint) => {
    setUser(prev => {
      if (!prev) return prev;
      if (prev.completed?.includes(challengeId)) return prev;

      const earned       = Math.round(pts * (usedHint ? 0.8 : 1));
      const newPts       = (prev.pts   || 0) + earned;
      const newCoins     = (prev.coins || 0) + 5;
      const newStreak    = (prev.streak|| 0) + 1;
      const completed    = [...(prev.completed    || []), challengeId];
      const hintedLevels = usedHint
        ? [...(prev.hintedLevels || []), challengeId]
        : (prev.hintedLevels || []);

      const next = { ...prev, pts: newPts, coins: newCoins, streak: newStreak, completed, hintedLevels };

      if (SUPABASE_CONFIGURED && supabase) {
        // Write to Supabase — no localStorage touched
        Promise.all([
          supabase.from('progress').upsert({
            user_id: prev.id, challenge_id: challengeId,
            used_hint: usedHint, pts_earned: earned,
          }),
          supabase.from('profiles').update({
            pts: newPts, coins: newCoins, streak: newStreak,
          }).eq('id', prev.id),
        ]);
      } else {
        lsSave(prev.email, { pts: newPts, coins: newCoins, streak: newStreak, completed, hintedLevels });
      }
      return next;
    });
  }, []);

  // ── Use hint ──────────────────────────────────────────────────────────────
  const useHintFor = useCallback((challengeId) => {
    setUser(prev => {
      if (!prev) return prev;
      if ((prev.coins || 0) < 5) return prev;
      if (prev.hintedLevels?.includes(challengeId)) return prev;

      const coins        = (prev.coins || 0) - 5;
      const hintedLevels = [...(prev.hintedLevels || []), challengeId];
      const next = { ...prev, coins, hintedLevels };

      if (SUPABASE_CONFIGURED && supabase) {
        supabase.from('profiles').update({ coins }).eq('id', prev.id);
        // Hint flag tracked in progress upsert when challenge completes
      } else {
        lsSave(prev.email, { coins, hintedLevels });
      }
      return next;
    });
  }, []);

  // ── Unlock achievement ────────────────────────────────────────────────────
  const unlockAchievement = useCallback((achievementId) => {
    setUser(prev => {
      if (!prev) return prev;
      if (prev.achievements?.includes(achievementId)) return prev;

      const achievements = [...(prev.achievements || []), achievementId];
      const next = { ...prev, achievements };

      if (SUPABASE_CONFIGURED && supabase) {
        supabase.from('achievements').upsert({ user_id: prev.id, achievement_id: achievementId });
      } else {
        lsSave(prev.email, { achievements });
      }
      return next;
    });
  }, []);

  // ── Issue certificate (all challenges done) ───────────────────────────────
  const issueCertificate = useCallback((finalScore, totalPts) => {
    setUser(prev => {
      if (!prev || prev.certificate_unlocked) return prev;

      const certData = {
        issued_at:             new Date().toISOString(),
        final_score:           finalScore,
        total_pts:             totalPts,
        certificate_unlocked:  true,
      };
      const next = { ...prev, certificate: certData, certificate_unlocked: true };

      if (SUPABASE_CONFIGURED && supabase) {
        supabase.from('certificates').upsert({
          user_id:              prev.id,
          certificate_unlocked: true,
          issued_at:            certData.issued_at,
          final_score:          finalScore,
          total_pts:            totalPts,
        });
      } else {
        lsSave(prev.email, { certificate: certData, certificate_unlocked: true });
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      signup, login, logout,
      updateUser, completeChallenge, useHintFor,
      unlockAchievement, issueCertificate,
      supabaseEnabled: SUPABASE_CONFIGURED,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
