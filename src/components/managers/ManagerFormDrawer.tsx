import { Drawer } from 'antd';
import { ManagerForm } from './ManagerForm';
import { useManagerMutations } from '@/hooks/useManagers';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import { useAppToast } from '@/components/common/useAppToast';
import { EMPTY_BIOGRAPHY } from '@/types/biography';
import type { Manager } from '@/types/manager';
import type { ManagerInput } from '@/schemas/manager';

/**
 * 심사역 프로필 수정 Drawer (상세 화면 공용).
 * mode='admin' → 전체 컬럼 직접 UPDATE, mode='self'(본인) → update_my_profile RPC.
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface ManagerFormDrawerProps {
  open: boolean;
  manager: Manager;
  mode: 'admin' | 'self';
  onClose: () => void;
  onSaved?: () => void;
}

function toInput(m: Manager): ManagerInput {
  return {
    name: m.name,
    position: m.position,
    departmentId: m.departmentId,
    phone: m.phone,
    specialties: m.specialties,
    profileImageUrl: m.profileImageUrl,
    greeting: m.greeting,
    biography: m.biography ?? EMPTY_BIOGRAPHY,
  };
}

export function ManagerFormDrawer({ open, manager, mode, onClose, onSaved }: ManagerFormDrawerProps) {
  const { updateAsAdmin, updateMyProfile } = useManagerMutations();
  const { data: departmentOptions = [] } = useDepartmentOptions();
  const toast = useAppToast();
  const submitting = updateAsAdmin.isPending || updateMyProfile.isPending;

  const handleSubmit = (values: ManagerInput) => {
    const onSuccess = () => {
      toast.success('프로필이 수정되었습니다.');
      onSaved?.();
      onClose();
    };
    const onError = (err: unknown) => toast.error('수정에 실패했습니다.', err);

    if (mode === 'admin') {
      updateAsAdmin.mutate({ id: manager.id, input: values }, { onSuccess, onError });
    } else {
      updateMyProfile.mutate(values, { onSuccess, onError });
    }
  };

  return (
    <Drawer
      title={mode === 'self' ? '내 프로필 수정' : '심사역 정보 수정'}
      width={760}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <ManagerForm
          mode={mode}
          managerId={manager.id}
          defaultValues={toInput(manager)}
          departmentOptions={departmentOptions}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
