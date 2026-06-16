import { useState } from 'react';
import { Button, Space, Alert, Descriptions, Tag } from 'antd';
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
import { formatDate } from '@/lib/formatters';

/**
 * 심사역 상세 = 본인일 경우 마이페이지 (5_managers.md 5.3, 14_auth.md 14.5).
 * 고유 블록: 프로필 카드 + 약력(학력/경력).
 * 수정: Admin(전체) 또는 본인(허용 컬럼 RPC). 삭제(소프트): Admin 만, 본인 제외(잠금 방지).
 * 연계 블록(담당 스타트업/프로그램/프로젝트)은 Phase 4 에서 연결한다.
 */
export function ManagerDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const myId = useAuthStore((s) => s.session?.user?.id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: manager, isLoading, isError, refetch } = useManager(id);
  const { remove } = useManagerMutations();

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
            {isSelf ? <Tag color="processing">나</Tag> : null}
          </>
        }
        subtitle={`${manager.position}${manager.departmentName ? ` · ${manager.departmentName}` : ''}`}
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

      {/* 약력 (세로 표시) + 소개 — 전문가와 공유하는 블록 */}
      <BiographyView biography={manager.biography} />
      <ProfileTextBlock title="소개" text={manager.greeting} />

      {/* 연계 블록 (Phase 4) */}
      <Alert
        type="info"
        showIcon
        message="담당 스타트업 · 참여 프로그램 · 담당 프로젝트"
        description="심사역이 담당/참여하는 스타트업·프로그램·프로젝트 탭은 해당 도메인(Phase 4) 개발 시 연결됩니다."
      />

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
