import { Drawer } from 'antd';
import { FundForm } from './FundForm';
import { useFundMutations } from '@/hooks/useFunds';
import { useAppToast } from '@/components/common/useAppToast';
import type { FundInput } from '@/schemas/fund';
import type { Fund } from '@/types/fund';

/**
 * 펀드 등록/수정 Drawer (목록·상세 공용, Admin 전용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface FundFormDrawerProps {
  open: boolean;
  fund?: Fund;
  onClose: () => void;
  onSaved?: () => void;
}

function toInput(f: Fund): FundInput {
  return {
    name: f.name,
    totalAmount: f.totalAmount,
    investingPeriod: f.investingPeriod,
    balance: f.balance,
    sections: f.sections,
  };
}

export function FundFormDrawer({ open, fund, onClose, onSaved }: FundFormDrawerProps) {
  const isEdit = Boolean(fund);
  const { create, update } = useFundMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: FundInput) => {
    if (isEdit && fund) {
      update.mutate(
        { id: fund.id, input: values },
        {
          onSuccess: () => {
            toast.success('펀드 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('펀드가 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '펀드 수정' : '펀드 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <FundForm
          defaultValues={fund ? toInput(fund) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
