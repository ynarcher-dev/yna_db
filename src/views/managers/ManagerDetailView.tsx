import { useState } from 'react';
import { Button, Space, Descriptions, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import { useManager, useManagerMutations } from '@/hooks/useManagers';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PersonProfileCard } from '@/components/common/PersonProfileCard';
import { BiographyView } from '@/components/common/BiographyView';
import { ProfileTextBlock } from '@/components/common/ProfileTextBlock';
import { RoleTag } from '@/components/managers/RoleTag';
import { SpecialtyTags } from '@/components/experts/SpecialtyTags';
import { ManagerFormDrawer } from '@/components/managers/ManagerFormDrawer';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { ManagerRelatedBlocks } from '@/components/managers/ManagerRelatedBlocks';
import { formatDate } from '@/lib/formatters';

/**
 * 심사역 상세 = 본인일 경우 마이페이지 (5_managers.md 5.3, 14_auth.md 14.5).
 * 고유 블록: 프로필 카드 + 약력(학력/경력).
 * 수정: Admin(전체) 또는 본인(허용 컬럼 RPC). 삭제(소프트): Admin 만, 본인 제외(잠금 방지).
 * 연계 블록(담당 스타트업/사업/프로젝트)은 Phase 4 에서 연결한다.
 */
export function ManagerDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const myId = useAuthStore((s) => s.session?.user?.id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: manager, isLoading, isError, refetch } = useManager(id);
  const { remove, updateBiography, updateIntro } = useManagerMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !manager) {
    return (
      <EmptyState
        message="심사역을 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/managers')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const isSelf = manager.id === myId;
  const canEdit = isAdmin || isSelf;
  const canDelete = isAdmin && !isSelf;

  const handleDelete = () => {
    toast.confirm('심사역 비활성화', `'${manager.name}'을(를) 비활성화하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(manager.id);
        toast.success('비활성화되었습니다.');
        navigate('/managers');
      } catch (err) {
        toast.error('처리에 실패했습니다.', err);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/managers')}
          className="flex items-center gap-1 text-sm text-yna-sub hover:text-yna-point"
        >
          <HiArrowLeft /> 심사역 목록
        </button>
        <Space>
          {canEdit ? (
            <Button type={isSelf ? 'primary' : 'default'} onClick={() => setEditOpen(true)}>
              {isSelf ? '내 프로필 수정' : '수정'}
            </Button>
          ) : null}
          {canDelete ? (
            <Button danger onClick={handleDelete}>
              비활성화
            </Button>
          ) : null}
        </Space>
      </div>

      {/* 프로필 카드 (전문가와 공유하는 사람-프로필 골격) */}
      <PersonProfileCard
        imageUrl={manager.profileImageUrl}
        name={manager.name}
        tags={
          <>
            <RoleTag role={manager.role} />
            {isSelf ? <Tag color="green">나</Tag> : null}
          </>
        }
        subtitle={[manager.position, manager.companyName, manager.departmentName, manager.teamName]
          .filter(Boolean)
          .join(' · ')}
      >
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="연락처">{manager.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="이메일">{manager.email}</Descriptions.Item>
          <Descriptions.Item label="관심 분야" span={2}>
            <SpecialtyTags specialties={manager.specialties} />
          </Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(manager.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(manager.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </PersonProfileCard>

      {/* 약력 + 소개 — 카드 자체의 '수정'에서 부분 저장 (기본 수정과 분리).
          본인은 update_my_profile RPC, Admin 은 컬럼 직접 UPDATE 로 분기한다. */}
      {manager.sections.biography ? (
        <BiographyView
          biography={manager.biography}
          editable={canEdit}
          saving={updateBiography.isPending}
          onSave={(biography) =>
            updateBiography.mutate(
              { manager, biography, mode: isAdmin ? 'admin' : 'self' },
              {
                onSuccess: () => {
                  toast.success('약력이 저장되었습니다.');
                  void refetch();
                },
                onError: (e) => toast.error('저장에 실패했습니다.', e),
              },
            )
          }
        />
      ) : null}
      {manager.sections.intro ? (
        <ProfileTextBlock
          title="소개"
          text={manager.greeting}
          editable={canEdit}
          saving={updateIntro.isPending}
          onSave={(greeting) =>
            updateIntro.mutate(
              { manager, greeting, mode: isAdmin ? 'admin' : 'self' },
              {
                onSuccess: () => {
                  toast.success('소개가 저장되었습니다.');
                  void refetch();
                },
                onError: (e) => toast.error('저장에 실패했습니다.', e),
              },
            )
          }
        />
      ) : null}

      {/* 역방향 연계: 담당 스타트업·프로젝트·운영 사업 (각 섹션 토글로 표시/숨김) */}
      <ManagerRelatedBlocks managerId={manager.id} sections={manager.sections} />

      {/* 첨부파일 (전 도메인 공통 카드) — 항상 최하단 */}
      {manager.sections.attachments ? (
        <EntityFilesBlock entityType="manager" entityId={manager.id} />
      ) : null}

      {canEdit ? (
        <ManagerFormDrawer
          open={editOpen}
          manager={manager}
          mode={isAdmin ? 'admin' : 'self'}
          onClose={() => setEditOpen(false)}
          onSaved={() => void refetch()}
        />
      ) : null}
    </div>
  );
}
