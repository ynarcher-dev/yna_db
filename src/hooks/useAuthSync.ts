import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import type { AppRole } from '@/types/database';

/**
 * Supabase 세션 ↔ authStore 미러링 (14_auth.md 14.2).
 * - 최초 1회 현재 세션을 조회한 뒤 onAuthStateChange 를 구독한다.
 * - 세션이 있으면 current_user_role() RPC 로 역할을 가져오고,
 *   user_metadata.must_change_password 플래그를 store 에 반영한다.
 * App 루트에서 1회 호출한다.
 */
async function resolveRole(): Promise<AppRole | null> {
  try {
    const { data, error } = await supabase.rpc('current_user_role');
    if (error) throw error;
    return (data as AppRole | null) ?? null;
  } catch (err) {
    console.error('[auth] 역할 조회 실패', err);
    return null;
  }
}

export function useAuthSync(): void {
  useEffect(() => {
    let active = true;
    const { setSession, setRole, setMustChangePassword, setInitialized, reset } =
      useAuthStore.getState();

    async function applySession(session: Session | null): Promise<void> {
      if (!active) return;
      if (!session) {
        reset();
        setInitialized(true);
        return;
      }
      setSession(session);
      setMustChangePassword(Boolean(session.user.user_metadata?.must_change_password));
      const role = await resolveRole();
      if (!active) return;
      setRole(role);
      setInitialized(true);
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
}
