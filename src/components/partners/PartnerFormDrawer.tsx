import { Drawer } from 'antd';
import { PartnerForm } from './PartnerForm';
import { usePartnerMutations } from '@/hooks/usePartners';
import { useAppToast } from '@/components/common/useAppToast';
import type { PartnerInput } from '@/schemas/partner';
import type { Partner } from '@/types/partner';

/**
 * 협력사 등록/수정 Drawer (목록·상세 화면 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리해 화면 코드를 가볍게 유지한다.
 */
interface PartnerFormDrawerProps {
  open: boolean;
  /** edit 모드면 partner 필수 */
  partner?: Partner;
  onClose: () => void;
  /** 저장 성공 후 콜백 (예: 상세 새로고침) */
  onSaved?: () => void;
}

function toInput(p: Partner): PartnerInput {
  return {
    name: p.name,
    department: p.department,
    partnerType: p.partnerType,
    contactPerson: p.contactPerson,
    phone: p.phone,
    email: p.email,
    interactionLog: p.interactionLog,
  };
}

export function PartnerFormDrawer({ open, partner, onClose, onSaved }: PartnerFormDrawerProps) {
  const isEdit = Boolean(partner);
  const { create, update } = usePartnerMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: PartnerInput) => {
    if (isEdit && partner) {
      update.mutate(
        { id: partner.id, input: values },
        {
          onSuccess: () => {
            toast.success('협력사 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('협력사가 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '협력사 수정' : '협력사 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <PartnerForm
          defaultValues={partner ? toInput(partner) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
