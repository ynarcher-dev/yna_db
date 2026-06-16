import { Modal } from 'antd';
import type { ReactNode } from 'react';

/**
 * 컨펌 모달 (0_ui_ux.md 1.4 — 모달 얼럿).
 * 삭제·권한 회수 등 복구가 어려운 동작 전 명시적 확인을 받는 선언형 컴포넌트.
 * 즉석 확인이 필요하면 useAppToast().confirm(명령형)을 사용한다.
 */
interface ConfirmModalProps {
  open: boolean;
  title: string;
  content?: ReactNode;
  okText?: string;
  cancelText?: string;
  /** 위험 동작 강조(빨간 확인 버튼). 기본 true. */
  danger?: boolean;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  content,
  okText = '확인',
  cancelText = '취소',
  danger = true,
  confirmLoading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger }}
      confirmLoading={confirmLoading}
      onOk={onConfirm}
      onCancel={onCancel}
      centered
    >
      {content}
    </Modal>
  );
}
