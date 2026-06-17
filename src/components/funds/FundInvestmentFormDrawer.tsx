import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Button, InputNumber, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { fundInvestmentSchema, type FundInvestmentInput } from '@/schemas/fundInvestment';
import { useFundInvestmentMutations } from '@/hooks/useFundInvestments';
import { useStartupOptions } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import type { FundInvestment } from '@/types/fundInvestment';

const EMPTY: FundInvestmentInput = {
  startupId: '',
  investmentAmount: 0,
  sharePercentage: 0,
  investmentDate: '',
};

function toInput(i: FundInvestment): FundInvestmentInput {
  return {
    startupId: i.startupId,
    investmentAmount: i.investmentAmount,
    sharePercentage: i.sharePercentage,
    investmentDate: i.investmentDate,
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

/**
 * 펀드 투자 집행 등록/수정 Drawer (Admin). 피투자 스타트업은 useStartupOptions Select.
 */
export function FundInvestmentFormDrawer({
  open,
  fundId,
  investment,
  onClose,
  onSaved,
}: {
  open: boolean;
  fundId: string;
  investment?: FundInvestment;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(investment);
  const { create, update } = useFundInvestmentMutations(fundId);
  const { data: startupOptions = [] } = useStartupOptions();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FundInvestmentInput>({
    resolver: zodResolver(fundInvestmentSchema),
    mode: 'onBlur',
    defaultValues: investment ? toInput(investment) : EMPTY,
  });

  const onSubmit = (values: FundInvestmentInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? '투자 집행이 수정되었습니다.' : '투자 집행이 등록되었습니다.');
        onSaved?.();
        onClose();
      },
      onError: (err: unknown) => toast.error('저장에 실패했습니다.', err),
    };
    if (isEdit && investment) update.mutate({ id: investment.id, input: values }, opts);
    else create.mutate(values, opts);
  };

  return (
    <Drawer
      title={isEdit ? '투자 집행 수정' : '투자 집행 등록'}
      width={440}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-yna-main">피투자 스타트업 *</label>
            <Controller
              name="startupId"
              control={control}
              render={({ field }) => (
                <Select
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                  placeholder="스타트업 선택"
                  options={startupOptions}
                  value={field.value || undefined}
                  onChange={(v?: string) => field.onChange(v ?? '')}
                  disabled={isEdit}
                />
              )}
            />
            <FieldError message={errors.startupId?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">출자액 *</label>
            <Controller
              name="investmentAmount"
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
            <FieldError message={errors.investmentAmount?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">취득 지분율 *</label>
            <Controller
              name="sharePercentage"
              control={control}
              render={({ field }) => (
                <InputNumber
                  className="w-full"
                  min={0}
                  max={100}
                  step={0.1}
                  value={field.value}
                  onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                  onBlur={field.onBlur}
                  addonAfter="%"
                />
              )}
            />
            <FieldError message={errors.sharePercentage?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">투자일 *</label>
            <Controller
              name="investmentDate"
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
            <FieldError message={errors.investmentDate?.message} />
          </div>

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
