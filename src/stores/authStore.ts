import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { AppRole } from '@/types/database';

/**
 * 인증 세션 상태 (0_rules.md / 14_auth.md 14.2).
 * Supabase JS 의 localStorage 세션을 미러링해 라우트 가드와 헤더 표시에 사용한다.
 * 실제 세션 ↔ store 동기화는 useAuthSync 훅이 담당한다.
 */
interface AuthState {
  /** 현재 Supabase 세션 (미인증 시 null) */
  session: Session | null;
  /** 시스템 역할 (current_user_role RPC 결과) */
  role: AppRole | null;
  /** 임시 비밀번호 로그인 → 최초 비밀번호 변경 강제 플래그 (14_auth.md 14.2) */
  mustChangePassword: boolean;
  /** 최초 세션 조회 완료 여부 (가드의 로딩 분기용) */
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setRole: (role: AppRole | null) => void;
  setMustChangePassword: (value: boolean) => void;
  setInitialized: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  role: null,
  mustChangePassword: false,
  initialized: false,
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setMustChangePassword: (value) => set({ mustChangePassword: value }),
  setInitialized: (value) => set({ initialized: value }),
  reset: () => set({ session: null, role: null, mustChangePassword: false }),
}));
