import { useState } from 'react';
import { Button, Space, Alert, Descriptions, Rate, Statistic } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import { useExpert, useExpertRating, useExpertMutations } from '@/hooks/useExperts';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PersonProfileCard } from '@/components/common/PersonProfileCard';
import { BiographyView } from '@/components/common/BiographyView';
import { ProfileTextBlock } from '@/components/common/ProfileTextBlock';
import { ExpertTypeTag } from '@/components/experts/ExpertTypeTag';
import { AvailabilityTag } from '@/components/experts/AvailabilityTag';
import { SpecialtyTags } from '@/components/experts/SpecialtyTags';
import { ExpertFormDrawer } from '@/components/experts/ExpertFormDrawer';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { formatDate } from '@/lib/formatters';

/**
 * 전문가 상세 (9_experts.md 9.3).
 * 고유 블록: 프로필 카드 + 멘토링 만족도 통계(view_expert_ratings).
 * 연계 블록(스타트업 자문 매칭 히스토리)은 Phase 4 에서 expert_mentorings 조인으로 연결한다.
 */
export function ExpertDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const role = useAuthStore((s) => s.role);
  const [editOpen, setEditOpen] = useState(false);

  const { data: expert, isLoading, isError, refetch } = useExpert(id);
  const { data: rating } = useExpertRating(id);
  const { remove } = useExpertMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !expert) {
    return (
      <EmptyState
        message="전문가를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/experts')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    toast.confirm('전문가 삭제', `'${expert.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(expert.id);
        toast.success('삭제되었습니다.');
        navigate('/experts');
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
          onClick={() => navigate('/experts')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 전문가 목록
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

      {/* 프로필 카드 (심사역과 공유하는 사람-프로필 골격) */}
      <PersonProfileCard
        imageUrl={expert.profileImageUrl}
        name={expert.name}
        tags={
          <>
            <ExpertTypeTag type={expert.expertType} />
            <AvailabilityTag available={expert.isAvailable} />
          </>
        }
        subtitle={`${expert.position} · ${expert.company}`}
      >
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="연락처">{expert.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="이메일">{expert.email}</Descriptions.Item>
          <Descriptions.Item label="관심 분야" span={2}>
            <SpecialtyTags specialties={expert.specialties} />
          </Descriptions.Item>
          <Descriptions.Item label="책임자">{expert.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(expert.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(expert.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </PersonProfileCard>

      {/* 멘토링 만족도 통계 (기본 수정에서 비활성화하면 숨김) */}
      {expert.sections.mentoringRating ? (
        <div className="rounded-lg border border-yna-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-yna-main">멘토링 만족도</h2>
          {rating && rating.mentoringCount > 0 && rating.averageRating !== null ? (
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <Rate disabled allowHalf value={rating.averageRating} />
                <span className="text-xl font-semibold text-yna-main">
                  {rating.averageRating.toFixed(1)}
                </span>
              </div>
              <Statistic title="멘토링 이력" value={rating.mentoringCount} suffix="건" />
            </div>
          ) : (
            <EmptyState message="평가된 멘토링 이력이 없습니다." />
          )}
        </div>
      ) : null}

      {/* 약력 (세로 표시) + 소개 — 심사역과 공유하는 블록 */}
      {expert.sections.biography ? <BiographyView biography={expert.biography} /> : null}
      {expert.sections.intro ? <ProfileTextBlock title="소개" text={expert.greeting} /> : null}

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {expert.sections.attachments ? (
        <EntityFilesBlock entityType="expert" entityId={expert.id} />
      ) : null}

      {/* 연계 블록 (Phase 4) */}
      <Alert
        type="info"
        showIcon
        message="스타트업 자문 매칭 히스토리"
        description="자문 일자·대상 스타트업·담당 심사역·피드백 이력 연동은 프로젝트/스타트업 도메인(Phase 4) 개발 시 연결됩니다."
      />

      <ExpertFormDrawer
        open={editOpen}
        expert={expert}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
