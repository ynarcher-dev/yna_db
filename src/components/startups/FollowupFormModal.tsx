import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Input, Select, Button } from 'antd';
import { startupFollowupSchema, type StartupFollowupInput } from '@/schemas/startupFollowup';
import { REPORT_TYPE_OPTIONS } from '@/lib/labels';
import { FollowupFileUploader } from './FollowupFileUploader';
import type { StartupFollowup } from '@/types/startupFollowup';

/**
 * 후속관리 등록/수정 Drawer (6_startups.md). 복수 첨부파일 + 코멘트.
 * 제출 완료 여부는 카드의 토글에서 관리(여기서 다루지 않음).
 */
const EMPTY: StartupFollowupInput = {
  title: '',
  reportType: 'quarterly',
  reportingPeriod: '',
  comment: '',
  files: [],
};

function toInput(f: StartupFollowup): StartupFollowupInput {
  return {
    title: f.title,
    reportType: f.reportType,
    reportingPeriod: f.reportingPeriod,
    comment: f.comment,
    files: f.files,
  };
}

function err(message?: string) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

interface FollowupFormModalProps {
  open: boolean;
  /** 업로드 경로용 스타트업 id */
  startupId: string;
  /** edit 모드면 전달 */
  followup?: StartupFollowup;
  submitting: boolean;
  onSubmit: (values: StartupFollowupInput) => void;
  onClose: () => void;
}

export function FollowupFormModal({
  open,
  startupId,
  followup,
  submitting,
  onSubmit,
  onClose,
}: FollowupFormModalProps) {
  const isEdit = Boolean(followup);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StartupFollowupInput>({
    resolver: zodResolver(startupFollowupSchema),
    mode: 'onBlur',
    defaultValues: followup ? toInput(followup) : EMPTY,
  });

  return (
    <Drawer
      title={isEdit ? '후속관리 수정' : '후속관리 추가'}
      width={520}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">보고 제목 *</label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input {...field} placeholder="예: 2026 2분기 보고" />}
            />
            {err(errors.title?.message)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-yna-main">보고 유형 *</label>
              <Controller
                name="reportType"
                control={control}
                render={({ field }) => (
                  <Select {...field} className="w-full" options={REPORT_TYPE_OPTIONS} />
                )}
              />
              {err(errors.reportType?.message)}
            </div>
            <div>
              <label className="mb-1 block text-sm text-yna-main">보고 기간 *</label>
              <Controller
                name="reportingPeriod"
                control={control}
                render={({ field }) => <Input {...field} placeholder="예: 2026-Q2" />}
              />
              {err(errors.reportingPeriod?.message)}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">제출 파일</label>
            <Controller
              name="files"
              control={control}
              render={({ field }) => (
                <FollowupFileUploader value={field.value} folder={startupId} onChange={field.onChange} />
              )}
            />
            {err(errors.files?.message)}
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">코멘트</label>
            <Controller
              name="comment"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={3} placeholder="제출 자료에 대한 코멘트" />
              )}
            />
            {err(errors.comment?.message)}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
