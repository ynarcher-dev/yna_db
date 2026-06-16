import { useState } from 'react';
import { Button, Space, Alert, Descriptions, Avatar } from 'antd';
import { HiOutlineOfficeBuilding, HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStartup, useStartupMutations } from '@/hooks/useStartups';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StartupStageTag } from '@/components/startups/StartupStageTag';
import { StartupStatusTag } from '@/components/startups/StartupStatusTag';
import { StartupFormDrawer } from '@/components/startups/StartupFormDrawer';
import { ShareholdersBlock } from '@/components/startups/ShareholdersBlock';
import { MetricsBlock } from '@/components/startups/MetricsBlock';
import { FollowupsBlock } from '@/components/startups/FollowupsBlock';
import { formatDate } from '@/lib/formatters';

/**
 * 스타트업 상세 (6_startups.md 6.3).
 * 고유 블록: 프로필 카드(로고·브랜드컬러 액센트) + 기업 설명 + 담당 심사역 매핑.
 * 연계 블록(시계열 지표·후속 보고·주주 PIE·참여 프로그램/프로젝트)은 Phase 4 후속 단계에서 연결한다.
 */
export function StartupDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const [editOpen, setEditOpen] = useState(false);

  const { data: startup, isLoading, isError, refetch } = useStartup(id);
  const { remove } = useStartupMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !startup) {
    return (
      <EmptyState
        message="스타트업을 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/startups')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    toast.confirm('스타트업 삭제', `'${startup.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(startup.id);
        toast.success('삭제되었습니다.');
        navigate('/startups');
      } catch (err) {
        toast.error('삭제에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/startups')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 스타트업 목록
        </button>
        <Space>
          <Button onClick={() => setEditOpen(true)}>수정</Button>
          {role === 'admin' ? (
            <Button danger onClick={handleDelete}>
              삭제
            </Button>
          ) : null}
        </Space>
      </div>

      {/* 프로필 카드 (로고 + 브랜드 컬러 액센트) */}
      <div
        className="rounded-lg border border-yna-border bg-white p-6"
        style={{ borderTopColor: startup.brandColor, borderTopWidth: 3 }}
      >
        <div className="mb-4 flex items-center gap-3">
          <Avatar
            shape="square"
            size={48}
            src={startup.logoUrl || undefined}
            style={{ backgroundColor: startup.brandColor }}
            icon={<HiOutlineOfficeBuilding />}
          />
          <h1 className="text-2xl font-bold tracking-tight text-yna-main">{startup.name}</h1>
          <StartupStageTag stage={startup.investmentStage} />
          <StartupStatusTag status={startup.managementStatus} etc={startup.managementStatusEtc} />
        </div>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="대표자">{startup.ceoName}</Descriptions.Item>
          <Descriptions.Item label="담당 심사역">
            {startup.managerId ? (
              <Link className="text-yna-point" to={`/managers/${startup.managerId}`}>
                {startup.managerName || '심사역'}
              </Link>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="작성자">{startup.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(startup.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(startup.updatedAt)}</Descriptions.Item>
        </Descriptions>
        {startup.description ? (
          <div className="mt-4 border-t border-yna-border pt-4">
            <p className="whitespace-pre-wrap text-sm text-yna-main">{startup.description}</p>
          </div>
        ) : null}
      </div>

      {/* 성장 지표 (재무현황·고용·투자현황 막대그래프) */}
      <MetricsBlock startupId={startup.id} />

      {/* 주주 구성 (표 + 지분율 PIE) — 성장 지표 바로 아래 */}
      <ShareholdersBlock shareholders={startup.shareholders} />

      {/* 후속 보고 · 마일스톤 트래커 */}
      <FollowupsBlock startupId={startup.id} />

      {/* 연계 블록 (프로그램·프로젝트 도메인 개발 후 연결) */}
      <Alert
        type="info"
        showIcon
        message="참여 프로그램 · 프로젝트"
        description="참여 프로그램·프로젝트 연동은 해당 도메인(프로그램/프로젝트) 개발 시 연결됩니다."
      />

      <StartupFormDrawer
        open={editOpen}
        startup={startup}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
