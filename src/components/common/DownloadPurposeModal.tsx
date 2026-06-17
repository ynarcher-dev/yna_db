import { useState } from 'react';
import { Modal, Radio, Input } from 'antd';
import {
  DOWNLOAD_PURPOSE_OPTIONS,
  DOWNLOAD_PURPOSE_OTHER,
  DOWNLOAD_PURPOSE_VALUES,
  type DownloadPurpose,
} from '@/lib/labels';

/**
 * 다운로드 목적 입력 모달 (17_conventions.md 4장 — 업무 파일 다운로드 전 목적 선택/입력).
 * 선택지 중 하나를 고르거나 '기타'에서 자유 사유를 입력하면, 확정 시 목적 원문을 onConfirm 으로 넘긴다.
 * 실제 다운로드/로그 기록은 호출부(onConfirm)에서 처리한다.
 */
export function DownloadPurposeModal({
  open,
  fileName,
  confirming,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  /** 다운로드 대상 표기(단일 파일명 또는 "N개 파일") */
  fileName?: string;
  confirming?: boolean;
  onConfirm: (purpose: string) => void;
  onCancel: () => void;
}) {
  const [choice, setChoice] = useState<DownloadPurpose>(DOWNLOAD_PURPOSE_VALUES[0]);
  const [etc, setEtc] = useState('');

  const isOther = choice === DOWNLOAD_PURPOSE_OTHER;
  const resolved = isOther ? etc.trim() : choice;
  const canConfirm = resolved.length > 0;

  const handleOk = () => {
    if (!canConfirm) return;
    onConfirm(resolved);
  };

  return (
    <Modal
      title="다운로드 목적 선택"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="다운로드"
      cancelText="취소"
      okButtonProps={{ disabled: !canConfirm, loading: confirming }}
      destroyOnClose
      afterClose={() => {
        setChoice(DOWNLOAD_PURPOSE_VALUES[0]);
        setEtc('');
      }}
    >
      {fileName ? (
        <p className="mb-3 truncate text-sm text-yna-sub">
          대상: <span className="text-yna-main">{fileName}</span>
        </p>
      ) : null}
      <p className="mb-2 text-sm text-yna-main">
        업무 파일 다운로드는 목적을 남깁니다. 어떤 목적인가요?
      </p>
      <Radio.Group
        className="flex flex-col gap-2"
        options={DOWNLOAD_PURPOSE_OPTIONS}
        value={choice}
        onChange={(e) => setChoice(e.target.value as DownloadPurpose)}
      />
      {isOther ? (
        <Input.TextArea
          className="mt-3"
          rows={2}
          maxLength={200}
          placeholder="다운로드 사유를 입력해 주세요."
          value={etc}
          onChange={(e) => setEtc(e.target.value)}
        />
      ) : null}
    </Modal>
  );
}
