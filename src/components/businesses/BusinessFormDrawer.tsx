import { Drawer } from 'antd';
import { BusinessForm } from './BusinessForm';
import { useBusinessMutations } from '@/hooks/useBusinesses';
import { useAppToast } from '@/components/common/useAppToast';
import type { BusinessInput } from '@/schemas/business';
import type { Business } from '@/types/business';

/**
 * 사업 등록/수정 Drawer (목록·상세 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface BusinessFormDrawerProps {
  open: boolean;
  business?: Business;
  onClose: () => void;
  /** 저장 성공 후 콜백. 생성·수정된 사업 id 를 넘겨 역방향 자동 매핑에 쓰게 한다. */
  onSaved?: (businessId: string) => void;
}

function toInput(p: Business): BusinessInput {
  return {
    name: p.name,
    status: p.status,
    generation: p.generation,
    budget: p.budget,
    revenue: p.revenue,
    profit: p.profit,
    startDate: p.startDate,
    endDate: p.endDate,
    recruitmentDeadline: p.recruitmentDeadline,
    description: p.description,
    sections: p.sections,
  };
}

export function BusinessFormDrawer({ open, business, onClose, onSaved }: BusinessFormDrawerProps) {
  const isEdit = Boolean(business);
  const { create, update } = useBusinessMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: BusinessInput) => {
    if (isEdit && business) {
      update.mutate(
        { id: business.id, input: values },
        {
          onSuccess: () => {
            toast.success('사업 정보가 수정되었습니다.');
            onSaved?.(business.id);
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: (created) => {
          toast.success('사업이 등록되었습니다.');
          onSaved?.(created.id);
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '사업 수정' : '사업 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <BusinessForm
          defaultValues={business ? toInput(business) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
