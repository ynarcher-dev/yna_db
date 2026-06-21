import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Select, DatePicker, InputNumber } from 'antd';
import dayjs from 'dayjs';
import {
  matchingApplicationSchema,
  type MatchingApplicationInput,
} from '@/schemas/matchingApplication';
import { useStartupOptions } from '@/hooks/useStartups';
import { useManagerOptions } from '@/hooks/useManagers';
import { MATCHING_APPLICATION_STATUS_OPTIONS } from '@/lib/labels';
import type { MatchingApplication } from '@/types/matchingApplication';

/**
 * 매칭 신청/연계 등록·수정 팝업 폼 (21_matching_programs.md 21.3 스타트업 매칭 팝업).
 * 스타트업 검색 + 담당 심사역 선택 + 신청일·진행 상태 지정 + (선택) 선정일·매칭 지원금.
 * 추가 시 이미 신청된 스타트업은 제외(excludeStartupIds), 수정 시 현재 스타트업은 유지한다.
 */
const EMPTY: MatchingApplicationInput = {
  startupId: '',
  managerId: '',
  status: 'applied',
  applyDate: '',
  selectionDate: '',
  matchingAmount: 0,
};

function toInput(a: MatchingApplication): MatchingApplicationInput {
  return {
    startupId: a.startupId,
    managerId: a.managerId,
    status: a.status,
    applyDate: a.applyDate,
    selectionDate: a.selectionDate,
    matchingAmount: a.matchingAmount,
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

interface MatchingApplicationFormModalProps {
  open: boolean;
  /** 수정 대상(없으면 신규 등록) */
  application?: MatchingApplication;
  /** 신규 등록 시 제외할 이미 신청된 스타트업 id 목록 */
  excludeStartupIds?: string[];
  submitting?: boolean;
  onSubmit: (values: MatchingApplicationInput) => void;
  onClose: () => void;
}

export function MatchingApplicationFormModal({
  open,
  application,
  excludeStartupIds = [],
  submitting,
  onSubmit,
  onClose,
}: MatchingApplicationFormModalProps) {
  const isEdit = Boolean(application);
  const { data: startupOptions = [] } = useStartupOptions();
  const { data: managerOptions = [] } = useManagerOptions();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MatchingApplicationInput>({
    resolver: zodResolver(matchingApplicationSchema),
    mode: 'onBlur',
    defaultValues: application ? toInput(application) : EMPTY,
  });

  // 같은 모달을 신규/수정으로 재사용하므로 열릴 때마다 대상에 맞춰 초기화한다.
  useEffect(() => {
    if (open) reset(application ? toInput(application) : EMPTY);
  }, [open, application, reset]);

  // 수정 중인 스타트업은 유지하고, 신규 등록 시 이미 신청된 스타트업만 제외.
  const exclude = new Set(excludeStartupIds.filter((id) => id !== application?.startupId));
  const availableStartups = startupOptions.filter((o) => !exclude.has(o.value));

  return (
    <Modal
      title={isEdit ? '매칭 신청 수정' : '스타트업 매칭 추가'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      okText={isEdit ? '수정' : '추가'}
      cancelText="취소"
      confirmLoading={submitting}
      destroyOnClose
    >
      <div className="space-y-3 pt-2">
        <div>
          <label className="mb-1 block text-sm text-yna-main">스타트업 *</label>
          <Controller
            name="startupId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                className="w-full"
                placeholder="스타트업 검색·선택"
                options={availableStartups}
                disabled={isEdit}
              />
            )}
          />
          <FieldError message={errors.startupId?.message} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-yna-main">담당 심사역 *</label>
          <Controller
            name="managerId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                className="w-full"
                placeholder="추천/담당 심사역 선택"
                options={managerOptions}
              />
            )}
          />
          <FieldError message={errors.managerId?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-yna-main">진행 상태 *</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} className="w-full" options={MATCHING_APPLICATION_STATUS_OPTIONS} />
              )}
            />
            <FieldError message={errors.status?.message} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-yna-main">신청일 *</label>
            <Controller
              name="applyDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                  onBlur={field.onBlur}
                />
              )}
            />
            <FieldError message={errors.applyDate?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-yna-main">선정일</label>
            <Controller
              name="selectionDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  className="w-full"
                  placeholder="선정 시 입력"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                  onBlur={field.onBlur}
                />
              )}
            />
            <FieldError message={errors.selectionDate?.message} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-yna-main">매칭 지원금</label>
            <Controller
              name="matchingAmount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  className="w-full"
                  min={0}
                  value={field.value}
                  onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                  onBlur={field.onBlur}
                  formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number((v ?? '').replace(/,/g, '')) || 0}
                  addonAfter="원"
                />
              )}
            />
            <FieldError message={errors.matchingAmount?.message} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
