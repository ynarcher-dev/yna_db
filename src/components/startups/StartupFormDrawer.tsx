import { useMemo } from 'react';
import { Drawer } from 'antd';
import { StartupForm } from './StartupForm';
import { useStartupMutations } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import type { StartupInput } from '@/schemas/startup';
import type { Startup } from '@/types/startup';
import type { InvestmentStage } from '@/lib/labels';

/**
 * 스타트업 등록/수정 Drawer (목록·상세 화면 공용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리해 화면 코드를 가볍게 유지한다.
 */
interface StartupFormDrawerProps {
  open: boolean;
  /** edit 모드면 startup 필수 */
  startup?: Startup;
  onClose: () => void;
  /** 저장 성공 후 콜백 (예: 상세 새로고침) */
  onSaved?: () => void;
}

function toInput(s: Startup): StartupInput {
  return {
    name: s.name,
    ceoName: s.ceoName,
    investmentStage: s.investmentStage as InvestmentStage,
    managementStatus: s.managementStatus,
    managementStatusEtc: s.managementStatusEtc,
    managerId: s.managerId,
    brandColor: s.brandColor,
    logoUrl: s.logoUrl,
    description: s.description,
    shareholders: s.shareholders,
  };
}

export function StartupFormDrawer({ open, startup, onClose, onSaved }: StartupFormDrawerProps) {
  const isEdit = Boolean(startup);
  const { create, update } = useStartupMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;
  // 로고 업로드 경로: 수정=startupId, 신규=임시 uuid
  const logoFolder = useMemo(() => startup?.id ?? `new-${crypto.randomUUID()}`, [startup?.id]);

  const handleSubmit = (values: StartupInput) => {
    if (isEdit && startup) {
      update.mutate(
        { id: startup.id, input: values },
        {
          onSuccess: () => {
            toast.success('스타트업 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('스타트업이 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '스타트업 수정' : '스타트업 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <StartupForm
          defaultValues={startup ? toInput(startup) : undefined}
          logoFolder={logoFolder}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
