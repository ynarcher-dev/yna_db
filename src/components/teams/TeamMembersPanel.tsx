import { useMemo, useState } from 'react';
import { Select, Button, Tag, Empty } from 'antd';
import { badgeTone } from '@/lib/labels';
import { Link } from 'react-router-dom';
import { HiOutlineX } from 'react-icons/hi';
import { useTeamMembers, useTeamMemberMutations } from '@/hooks/useTeams';
import { useManagerOptions } from '@/hooks/useManagers';
import { useAppToast } from '@/components/common/useAppToast';

/**
 * 팀 상세의 '소속 멤버' 패널. 심사역을 이 팀에 배정/해제(Admin 전용).
 * 배정 = 심사역의 소속 팀을 이 팀으로 설정. 한 심사역은 한 팀에만 속한다(다른 팀 소속자 배정 시 이동).
 */
export function TeamMembersPanel({
  teamId,
  isAdmin,
}: {
  teamId: string;
  isAdmin: boolean;
}) {
  const toast = useAppToast();
  const { data: members = [], isLoading } = useTeamMembers(teamId);
  const { data: managerOptions = [] } = useManagerOptions();
  const { assign, unassign } = useTeamMemberMutations(teamId);

  const [picked, setPicked] = useState<string | undefined>();

  // 이미 이 팀에 속한 멤버는 추가 후보에서 제외
  const addable = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    return managerOptions.filter((o) => !memberIds.has(o.value));
  }, [managerOptions, members]);

  const handleAssign = () => {
    if (!picked) return;
    assign.mutate(picked, {
      onSuccess: () => {
        toast.success('소속 멤버로 배정되었습니다.');
        setPicked(undefined);
      },
      onError: (err) => toast.error('배정에 실패했습니다.', err),
    });
  };

  const handleUnassign = (managerId: string, name: string) => {
    toast.confirm('소속 해제', `'${name}'을(를) 이 팀에서 해제하시겠습니까?`, async () => {
      try {
        await unassign.mutateAsync(managerId);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">
        소속 멤버
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {isAdmin ? (
        <div className="mb-4 flex items-center gap-2">
          <Select
            showSearch
            allowClear
            optionFilterProp="label"
            className="w-64"
            placeholder="심사역 선택 후 배정"
            options={addable}
            value={picked}
            onChange={(v) => setPicked(v)}
          />
          <Button type="primary" onClick={handleAssign} loading={assign.isPending} disabled={!picked}>
            배정
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-yna-sub">불러오는 중…</p>
      ) : members.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="소속된 멤버가 없습니다." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Tag key={m.id} {...badgeTone('neutral')} className="flex items-center gap-1 px-2 py-1">
              <Link to={`/managers/${m.id}`} className="text-yna-main hover:text-yna-point">
                {m.name}
                {m.position ? <span className="text-yna-sub"> · {m.position}</span> : null}
              </Link>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleUnassign(m.id, m.name)}
                  className="ml-1 text-yna-sub hover:text-yna-point"
                  aria-label="소속 해제"
                >
                  <HiOutlineX />
                </button>
              ) : null}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
