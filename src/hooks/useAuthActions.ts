import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

/**
 * 인증 동작 래퍼 (14_auth.md). 모든 호출을 try-catch 로 감싸고(0_rules.md 3장)
 * 원본 에러는 console.error 로만 남긴다(0_ui_ux.md 1.3).
 * 성공 시 null, 실패 시 사용자 안내 문구(string)를 반환해 화면이 인라인 표시한다.
 */
const LOGIN_FAIL = '이메일 또는 비밀번호가 올바르지 않습니다.';
const GENERIC_FAIL = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

export function useAuthActions() {
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword);
  const reset = useAuthStore((s) => s.reset);

  return {
    /** 이메일+비밀번호 로그인. 실패 사유는 계정 존재 여부 비노출을 위해 단일 문구로 통일. */
    async signIn(email: string, password: string): Promise<string | null> {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        return null;
      } catch (err) {
        console.error('[auth] 로그인 실패', err);
        return LOGIN_FAIL;
      }
    },

    /** 로그아웃 후 store 초기화. 호출부에서 /login 이동을 처리한다. */
    async signOut(): Promise<void> {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[auth] 로그아웃 실패', err);
      } finally {
        reset();
      }
    },

    /** 비밀번호 변경 + must_change_password 플래그 해제 (온보딩/복구 공용). */
    async updatePassword(password: string): Promise<string | null> {
      try {
        const { error } = await supabase.auth.updateUser({
          password,
          data: { must_change_password: false },
        });
        if (error) throw error;
        setMustChangePassword(false);
        return null;
      } catch (err) {
        console.error('[auth] 비밀번호 변경 실패', err);
        return GENERIC_FAIL;
      }
    },

    /** 재설정 메일 발송. 계정 열거 방지를 위해 실패해도 화면에는 동일 문구로 응답한다. */
    async sendResetEmail(email: string): Promise<void> {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      } catch (err) {
        console.error('[auth] 재설정 메일 발송 실패', err);
      }
    },
  };
}
