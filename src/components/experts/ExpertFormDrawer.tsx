import { useMemo } from 'react';
import { Drawer } from 'antd';
import { ExpertForm } from './ExpertForm';
import { useExpertMutations } from '@/hooks/useExperts';
import { useAppToast } from '@/components/common/useAppToast';
import type { ExpertInput } from '@/schemas/expert';
import type { Expert } from '@/types/expert';

/**
 * 전문가 등록/수정 Drawer (목록·상세 화면 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리해 화면 코드를 가볍게 유지한다.
 */
interface ExpertFormDrawerProps {
  open: boolean;
  /** edit 모드면 expert 필수 */
  expert?: Expert;
  onClose: () => void;
  /** 저장 성공 후 콜백 (예: 상세 새로고침) */
  onSaved?: () => void;
}

function toInput(e: Expert): ExpertInput {
  return {
    name: e.name,
    company: e.company,
    position: e.position,
    phone: e.phone,
    email: e.email,
    expertType: e.expertType,
    specialties: e.specialties,
    isAvailable: e.isAvailable,
    profileImageUrl: e.profileImageUrl,
    greeting: e.greeting,
    biography: e.biography,
    sections: e.sections,
  };
}

export function ExpertFormDrawer({ open, expert, onClose, onSaved }: ExpertFormDrawerProps) {
  const isEdit = Boolean(expert);
  const { create, update } = useExpertMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;
  // 이미지 업로드 경로: 수정=expertId, 신규=임시 uuid
  const imageFolder = useMemo(() => expert?.id ?? `new-${crypto.randomUUID()}`, [expert?.id]);

  const handleSubmit = (values: ExpertInput) => {
    if (isEdit && expert) {
      update.mutate(
        { id: expert.id, input: values },
        {
          onSuccess: () => {
            toast.success('전문가 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('전문가가 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '전문가 수정' : '전문가 등록'}
      width={760}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <ExpertForm
          defaultValues={expert ? toInput(expert) : undefined}
          imageFolder={imageFolder}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
