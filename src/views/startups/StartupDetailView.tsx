import { useState } from 'react';
import { Button, Space, Descriptions, Avatar } from 'antd';
import { HiOutlineOfficeBuilding, HiArrowLeft } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
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
import { BusinessTeamBlock } from '@/components/startups/BusinessTeamBlock';
import { DiagnosisBlock } from '@/components/startups/DiagnosisBlock';
import { NewsroomBlock } from '@/components/startups/NewsroomBlock';
import { MemoBlock } from '@/components/startups/MemoBlock';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { EntityManagersPanel } from '@/components/common/EntityManagersPanel';
import { StartupRelatedBlocks } from '@/components/startups/StartupRelatedBlocks';
import { formatDate } from '@/lib/formatters';

/**
 * 스타트업 상세 (6_startups.md 6.3).
 * 고유 블록: 프로필 카드(로고·브랜드컬러 액센트) + 기업 설명 + 담당 심사역 매핑.
 * 연계 블록(시계열 지표·후속 보고·주주 PIE·참여 사업/프로젝트)은 Phase 4 후속 단계에서 연결한다.
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
          <Button onClick={() => setEditOpen(true)}>기본 수정</Button>
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

      {/* 담당자(다대다) 배정 패널 — 담당자는 모두 자유롭게 추가/해제(작성자 필수 편입 폐지, 0054). */}
      {/* 담당자 배정은 '투자기업'(invested)일 때만 노출한다(발굴·보육·기타는 카드 자체를 숨김). */}
      {startup.sections.managers && startup.managementStatus === 'invested' ? (
        <EntityManagersPanel kind="startup" entityId={startup.id} />
      ) : null}

      {/* 카드 섹션: 기본 수정에서 비활성화한 섹션은 숨긴다 (startup.sections) */}

      {/* 비즈니스 & 팀 역량 — 성장 지표 위 */}
      {startup.sections.businessTeam ? (
        <BusinessTeamBlock startup={startup} onSaved={() => void refetch()} />
      ) : null}

      {/* 성장 지표 (비즈니스 현황 + 재무·매출·고용·투자 막대그래프) */}
      {startup.sections.metrics ? (
        <MetricsBlock startup={startup} onSaved={() => void refetch()} />
      ) : null}

      {/* 주주 구성 (표 + 지분율 PIE) */}
      {startup.sections.shareholders ? (
        <ShareholdersBlock startup={startup} onSaved={() => void refetch()} />
      ) : null}

      {/* 기업진단 — 주주 구성 아래 */}
      {startup.sections.diagnosis ? (
        <DiagnosisBlock startup={startup} onSaved={() => void refetch()} />
      ) : null}

      {/* 뉴스룸 — 네이버 뉴스 API 연동 예정 */}
      {startup.sections.newsroom ? <NewsroomBlock startup={startup} /> : null}

      {/* 후속 보고 · 마일스톤 트래커 */}
      {startup.sections.followups ? <FollowupsBlock startupId={startup.id} /> : null}

      {/* 메모 · 회의록 (시계열 타임라인) */}
      {startup.sections.memo ? (
        <MemoBlock startup={startup} onSaved={() => void refetch()} />
      ) : null}

      {/* 정방향 연계 표시(읽기 전용): 참여 사업·프로젝트. 투자 재원·금액은 위 투자현황이 담당 */}
      <StartupRelatedBlocks startupId={startup.id} sections={startup.sections} />

      {/* 첨부파일 (전 도메인 공통 카드) — 항상 최하단 */}
      {startup.sections.attachments ? (
        <EntityFilesBlock entityType="startup" entityId={startup.id} />
      ) : null}

      <StartupFormDrawer
        open={editOpen}
        startup={startup}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
