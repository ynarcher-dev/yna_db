import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Button } from 'antd';
import { LpEditor } from './LpEditor';
import { useFundMutations } from '@/hooks/useFunds';
import { useAppToast } from '@/components/common/useAppToast';
import { lpCompositionFormSchema, type LpCompositionFormInput } from '@/schemas/fund';
import type { Fund } from '@/types/fund';

/**
 * LP 구성 편집 Drawer (LP 카드 전용, Admin). 기본 재무 정보와 분리해 LP 만 갱신한다.
 */
export function LpCompositionFormDrawer({
  open,
  fund,
  onClose,
  onSaved,
}: {
  open: boolean;
  fund: Fund;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { updateLpComposition } = useFundMutations();
  const toast = useAppToast();
  const { control, handleSubmit } = useForm<LpCompositionFormInput>({
    resolver: zodResolver(lpCompositionFormSchema),
    defaultValues: { lpComposition: fund.lpComposition },
  });

  const onSubmit = (values: LpCompositionFormInput) => {
    updateLpComposition.mutate(
      { id: fund.id, input: values },
      {
        onSuccess: () => {
          toast.success('LP 구성이 저장되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('저장에 실패했습니다.', err),
      },
    );
  };

  return (
    <Drawer title="LP 구성 수정" width={560} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <LpEditor control={control} />
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={updateLpComposition.isPending}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
