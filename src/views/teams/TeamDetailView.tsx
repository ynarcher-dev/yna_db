import { useState } from 'react';
import { Button, Space, Descriptions, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import { useTeam, useTeamMutations } from '@/hooks/useTeams';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { TeamFormDrawer } from '@/components/teams/TeamFormDrawer';
import { TeamMembersPanel } from '@/components/teams/TeamMembersPanel';
import { formatDate } from '@/lib/formatters';

/**
 * 팀(소속 단위) 상세. 개요(회사·그룹·팀·운영기간) + 소속 멤버 패널(심사역 배정).
 * 수정/삭제(소프트)는 Admin 전용.
 */
export function TeamDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const [editOpen, setEditOpen] = useState(false);

  const { data: team, isLoading, isError, refetch } = useTeam(id);
  const { remove } = useTeamMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !team) {
    return (
      <EmptyState
        message="팀을 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/departments')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    toast.confirm('팀 삭제', `'${team.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(team.id);
        toast.success('삭제되었습니다.');
        navigate('/departments');
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  const periodText = team.operatingStart || team.operatingEnd
    ? `${team.operatingStart ? formatDate(team.operatingStart) : '-'} ~ ${
        team.operatingEnd ? formatDate(team.operatingEnd) : '운영중'
      }`
    : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/departments')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 소속 목록
        </button>
        {isAdmin ? (
          <Space>
            <Button onClick={() => setEditOpen(true)}>수정</Button>
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          </Space>
        ) : null}
      </div>

      {/* 팀 개요 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <p className="mb-1 text-sm text-yna-sub">{team.company}</p>
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold tracking-tight text-yna-main">
          {team.name || team.groupName}
          {!team.operatingEnd ? <Tag color="green">운영중</Tag> : null}
        </h1>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="회사">{team.company}</Descriptions.Item>
          <Descriptions.Item label="그룹">{team.groupName}</Descriptions.Item>
          <Descriptions.Item label="운영기간">{periodText}</Descriptions.Item>
          <Descriptions.Item label="작성자">{team.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(team.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(team.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 소속 멤버 (심사역 배정) */}
      <TeamMembersPanel teamId={team.id} isAdmin={isAdmin} />

      <TeamFormDrawer
        open={editOpen}
        team={team}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
