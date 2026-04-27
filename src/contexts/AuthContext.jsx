import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // RESTORE SESSION
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // GET FULL USER
  // ─────────────────────────────────────────────
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
      name: profile?.name || authUser.email.split('@')[0],
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

  // ─────────────────────────────────────────────
  // SIGNUP (FIXED - NO DOUBLE PROFILE INSERT ISSUES)
  // ─────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("User creation failed");

    // IMPORTANT: profile is created by DB trigger (NOT here)
    const fullUser = await sbGetFullUser(user);
    setUser(fullUser);

    return fullUser;
  }, []);

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const fullUser = await sbGetFullUser(data.user);
    setUser(fullUser);

    return fullUser;
  }, []);

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ─────────────────────────────────────────────
  // UPDATE USER
  // ─────────────────────────────────────────────
  const updateUser = useCallback(async (updates) => {
    setUser(prev => {
      if (!prev) return prev;

      supabase
        .from('profiles')
        .update(updates)
        .eq('id', prev.id);

      return { ...prev, ...updates };
    });
  }, []);

  // ─────────────────────────────────────────────
  // COMPLETE CHALLENGE
  // ─────────────────────────────────────────────
  const completeChallenge = useCallback((challengeId, pts, usedHint) => {
    setUser(prev => {
      if (!prev || prev.completed.includes(challengeId)) return prev;

      const earned = Math.round(pts * (usedHint ? 0.8 : 1));

      const updated = {
        ...prev,
        pts: prev.pts + earned,
        coins: prev.coins + 5,
        streak: prev.streak + 1,
        completed: [...prev.completed, challengeId],
        hintedLevels: usedHint
          ? [...prev.hintedLevels, challengeId]
          : prev.hintedLevels,
      };

      supabase.from('progress').upsert({
        user_id: prev.id,
        challenge_id: challengeId,
        used_hint: usedHint,
        pts_earned: earned,
      });

      supabase.from('profiles')
        .update({
          pts: updated.pts,
          coins: updated.coins,
          streak: updated.streak,
        })
        .eq('id', prev.id);

      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────
  // USE HINT
  // ─────────────────────────────────────────────
  const useHintFor = useCallback((challengeId) => {
    setUser(prev => {
      if (!prev || prev.coins < 5) return prev;
      if (prev.hintedLevels.includes(challengeId)) return prev;

      const updated = {
        ...prev,
        coins: prev.coins - 5,
        hintedLevels: [...prev.hintedLevels, challengeId],
      };

      supabase
        .from('profiles')
        .update({ coins: updated.coins })
        .eq('id', prev.id);

      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────
  // UNLOCK ACHIEVEMENT
  // ─────────────────────────────────────────────
  const unlockAchievement = useCallback((achievementId) => {
    setUser(prev => {
      if (!prev || prev.achievements.includes(achievementId)) return prev;

      const updated = {
        ...prev,
        achievements: [...prev.achievements, achievementId],
      };

      supabase.from('achievements').upsert({
        user_id: prev.id,
        achievement_id: achievementId,
      });

      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────
  // ISSUE CERTIFICATE
  // ─────────────────────────────────────────────
  const issueCertificate = useCallback((finalScore, totalPts) => {
    setUser(prev => {
      if (!prev || prev.certificate_unlocked) return prev;

      const cert = {
        certificate_unlocked: true,
        final_score: finalScore,
        total_pts: totalPts,
        issued_at: new Date().toISOString(),
      };

      supabase.from('certificates').upsert({
        user_id: prev.id,
        ...cert,
      });

      return { ...prev, certificate: cert, certificate_unlocked: true };
    });
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
