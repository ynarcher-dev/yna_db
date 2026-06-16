import { App } from 'antd';

/**
 * 공통 얼럿/피드백 훅 (0_ui_ux.md 1.3 / 1.4)
 * - 토스트 얼럿: 3초 내 휘발성 피드백 (success/info/warning/error)
 * - 모달 얼럿: 삭제/권한 회수 등 명시적 컨펌이 필요한 경우
 * antd <App> 컨텍스트 기반이라 ConfigProvider 테마 토큰을 그대로 따른다.
 * 시스템 로우 에러코드는 화면에 노출하지 않고 console.error 로만 기록한다.
 */
const DEFAULT_ERROR_MESSAGE =
  '데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

export function useAppToast() {
  const { message, modal } = App.useApp();

  return {
    success: (content: string) => message.success(content),
    info: (content: string) => message.info(content),
    warning: (content: string) => message.warning(content),
    /** 비동기 조회 실패 시 사용자 안내. 원본 에러는 콘솔에만 기록한다. */
    error: (content: string = DEFAULT_ERROR_MESSAGE, cause?: unknown) => {
      if (cause !== undefined) {
        console.error(content, cause);
      }
      return message.error(content);
    },
    /** 복구가 어려운 동작(삭제 등) 전 확인 모달 */
    confirm: (title: string, content: string, onOk: () => void | Promise<void>) =>
      modal.confirm({
        title,
        content,
        okText: '확인',
        cancelText: '취소',
        okButtonProps: { danger: true },
        onOk,
      }),
  };
}
