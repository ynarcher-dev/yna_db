import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Button, InputNumber, DatePicker, Switch } from 'antd';
import dayjs from 'dayjs';
import { capitalCallSchema, type CapitalCallInput } from '@/schemas/capitalCall';
import { useCapitalCallMutations } from '@/hooks/useCapitalCalls';
import { useAppToast } from '@/components/common/useAppToast';
import type { CapitalCall } from '@/types/capitalCall';

const EMPTY: CapitalCallInput = {
  callRound: 1,
  requestedAmount: 0,
  requestedDate: '',
  isCompleted: false,
  completedDate: '',
};

function toInput(c: CapitalCall): CapitalCallInput {
  return {
    callRound: c.callRound,
    requestedAmount: c.requestedAmount,
    requestedDate: c.requestedDate,
    isCompleted: c.isCompleted,
    completedDate: c.completedDate,
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

/**
 * Capital Call 등록/수정 Drawer (Admin). 같은 차수는 DB UNIQUE(fund_id, call_round)로 막힌다.
 */
export function CapitalCallFormDrawer({
  open,
  fundId,
  call,
  onClose,
  onSaved,
}: {
  open: boolean;
  fundId: string;
  call?: CapitalCall;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(call);
  const { create, update } = useCapitalCallMutations(fundId);
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CapitalCallInput>({
    resolver: zodResolver(capitalCallSchema),
    mode: 'onBlur',
    defaultValues: call ? toInput(call) : EMPTY,
  });
  const completed = watch('isCompleted');

  const onSubmit = (values: CapitalCallInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? '캐피탈 콜이 수정되었습니다.' : '캐피탈 콜이 등록되었습니다.');
        onSaved?.();
        onClose();
      },
      onError: (err: unknown) => toast.error('저장에 실패했습니다.', err),
    };
    if (isEdit && call) update.mutate({ id: call.id, input: values }, opts);
    else create.mutate(values, opts);
  };

  return (
    <Drawer
      title={isEdit ? '캐피탈 콜 수정' : '캐피탈 콜 등록'}
      width={440}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">차수 *</label>
            <Controller
              name="callRound"
              control={control}
              render={({ field }) => (
                <InputNumber
                  className="w-full"
                  min={1}
                  value={field.value}
                  onChange={(v) => field.onChange(typeof v === 'number' ? v : 1)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <FieldError message={errors.callRound?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">요청액 *</label>
            <Controller
              name="requestedAmount"
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
            <FieldError message={errors.requestedAmount?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">요청일 *</label>
            <Controller
              name="requestedDate"
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
            <FieldError message={errors.requestedDate?.message} />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="isCompleted"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} />
              )}
            />
            <span className="text-sm text-yna-main">납입 완료</span>
          </div>

          {completed ? (
            <div>
              <label className="mb-1 block text-sm text-yna-main">납입 완료일 *</label>
              <Controller
                name="completedDate"
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
              <FieldError message={errors.completedDate?.message} />
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
