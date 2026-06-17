import { Drawer } from 'antd';
import { TeamForm } from './TeamForm';
import { useTeamMutations } from '@/hooks/useTeams';
import { useAppToast } from '@/components/common/useAppToast';
import type { TeamInput } from '@/schemas/team';
import type { Team } from '@/types/team';

/**
 * 팀 등록/수정 Drawer (목록·상세 화면 공용, Admin 전용).
 * 변이 호출 + 성공/실패 토스트 + 닫기를 한곳에서 처리한다.
 */
interface TeamFormDrawerProps {
  open: boolean;
  /** edit 모드면 team 필수 */
  team?: Team;
  onClose: () => void;
  onSaved?: () => void;
}

function toInput(t: Team): TeamInput {
  return {
    company: t.company,
    groupName: t.groupName,
    name: t.name,
    operatingStart: t.operatingStart,
    operatingEnd: t.operatingEnd,
  };
}

export function TeamFormDrawer({ open, team, onClose, onSaved }: TeamFormDrawerProps) {
  const isEdit = Boolean(team);
  const { create, update } = useTeamMutations();
  const toast = useAppToast();
  const submitting = create.isPending || update.isPending;

  const handleSubmit = (values: TeamInput) => {
    if (isEdit && team) {
      update.mutate(
        { id: team.id, input: values },
        {
          onSuccess: () => {
            toast.success('팀 정보가 수정되었습니다.');
            onSaved?.();
            onClose();
          },
          onError: (err) => toast.error('수정에 실패했습니다.', err),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success('팀이 등록되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (err) => toast.error('등록에 실패했습니다.', err),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? '팀 수정' : '팀 등록'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <TeamForm
          defaultValues={team ? toInput(team) : undefined}
          submitting={submitting}
          submitLabel={isEdit ? '수정' : '등록'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
