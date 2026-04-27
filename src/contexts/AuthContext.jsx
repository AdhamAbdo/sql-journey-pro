import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref so callbacks always read the latest user without stale closures
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ─── RESTORE SESSION ───────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const fullUser = await sbGetFullUser(session.user);
        setUser(fullUser);
      }
      setLoading(false);
    };

    if (SUPABASE_CONFIGURED) {
      init();
      const { data: { subscription } } =
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const fullUser = await sbGetFullUser(session.user);
            setUser(fullUser);
          } else {
            setUser(null);
          }
        });
      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // ─── GET FULL USER ─────────────────────────────────────────
  const sbGetFullUser = async (authUser) => {
    const [{ data: profile }, { data: progress }, { data: achievements }, { data: cert }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('progress').select('challenge_id, used_hint').eq('user_id', authUser.id),
        supabase.from('achievements').select('achievement_id').eq('user_id', authUser.id),
        supabase.from('certificates').select('*').eq('user_id', authUser.id).maybeSingle(),
      ]);

    return {
      id: authUser.id,
      email: authUser.email,
      // FIX #2b: also check auth metadata for name (set during signup)
      name: profile?.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
      pts: profile?.pts || 0,
      coins: profile?.coins || 30,
      streak: profile?.streak || 0,
      joined: profile?.joined,
      completed: progress?.map(p => p.challenge_id) || [],
      hintedLevels: progress?.filter(p => p.used_hint).map(p => p.challenge_id) || [],
      achievements: achievements?.map(a => a.achievement_id) || [],
      certificate: cert || null,
      certificate_unlocked: cert?.certificate_unlocked || false,
    };
  };

  // ─── SIGNUP ────────────────────────────────────────────────
  // FIX #2: pass name in user_metadata so DB trigger receives it
  const signup = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // was missing — name was never sent to Supabase
      },
    });

    if (error) throw error;
    const authUser = data.user;
    if (!authUser) throw new Error('User creation failed');

    const fullUser = await sbGetFullUser(authUser);
    setUser(fullUser);
    return fullUser;
  }, []);

  // ─── LOGIN ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const fullUser = await sbGetFullUser(data.user);
    setUser(fullUser);
    return fullUser;
  }, []);

  // ─── LOGOUT ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ─── UPDATE USER ───────────────────────────────────────────
  // FIX #3: Supabase call was inside setUser callback (React anti-pattern —
  // state updaters must be pure/side-effect-free). Now we await the DB write,
  // then update local state separately.
  const updateUser = useCallback(async (updates) => {
    const current = userRef.current;
    if (!current) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', current.id);

    if (error) throw error;
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  // ─── COMPLETE CHALLENGE ────────────────────────────────────
  // FIX #4a: Supabase calls moved outside setUser callback
  const completeChallenge = useCallback(async (challengeId, pts, usedHint) => {
    const prev = userRef.current;
    if (!prev || prev.completed.includes(challengeId)) return;

    const earned = Math.round(pts * (usedHint ? 0.8 : 1));
    const updated = {
      ...prev,
      pts: prev.pts + earned,
      coins: prev.coins + 5,
      streak: prev.streak + 1,
      completed: [...prev.completed, challengeId],
      hintedLevels: usedHint ? [...prev.hintedLevels, challengeId] : prev.hintedLevels,
    };

    setUser(updated);

    await Promise.all([
      supabase.from('progress').upsert({
        user_id: prev.id,
        challenge_id: challengeId,
        used_hint: usedHint,
        pts_earned: earned,
      }),
      supabase.from('profiles')
        .update({ pts: updated.pts, coins: updated.coins, streak: updated.streak })
        .eq('id', prev.id),
    ]);
  }, []);

  // ─── USE HINT ──────────────────────────────────────────────
  // FIX #4b: Supabase call moved outside setUser callback
  const useHintFor = useCallback(async (challengeId) => {
    const prev = userRef.current;
    if (!prev || prev.coins < 5 || prev.hintedLevels.includes(challengeId)) return;

    const updated = { ...prev, coins: prev.coins - 5, hintedLevels: [...prev.hintedLevels, challengeId] };
    setUser(updated);

    await supabase.from('profiles').update({ coins: updated.coins }).eq('id', prev.id);
  }, []);

  // ─── UNLOCK ACHIEVEMENT ────────────────────────────────────
  // FIX #4c: Supabase call moved outside setUser callback
  const unlockAchievement = useCallback(async (achievementId) => {
    const prev = userRef.current;
    if (!prev || prev.achievements.includes(achievementId)) return;

    setUser({ ...prev, achievements: [...prev.achievements, achievementId] });

    await supabase.from('achievements').upsert({ user_id: prev.id, achievement_id: achievementId });
  }, []);

  // ─── ISSUE CERTIFICATE ─────────────────────────────────────
  // FIX #4d: Supabase call moved outside setUser callback
  const issueCertificate = useCallback(async (finalScore, totalPts) => {
    const prev = userRef.current;
    if (!prev || prev.certificate_unlocked) return;

    const cert = {
      certificate_unlocked: true,
      final_score: finalScore,
      total_pts: totalPts,
      issued_at: new Date().toISOString(),
    };

    setUser({ ...prev, certificate: cert, certificate_unlocked: true });

    await supabase.from('certificates').upsert({ user_id: prev.id, ...cert });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signup,
      login,
      logout,
      updateUser,
      completeChallenge,
      useHintFor,
      unlockAchievement,
      issueCertificate,
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
