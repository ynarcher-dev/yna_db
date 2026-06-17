import { useState } from 'react';
import { Button, Space, Descriptions } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import { useDepartment, useDepartmentMutations } from '@/hooks/useDepartments';
import { useAuthStore } from '@/stores/authStore';
import { useAppToast } from '@/components/common/useAppToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { DepartmentFormDrawer } from '@/components/departments/DepartmentFormDrawer';
import { EntityFilesBlock } from '@/components/common/EntityFilesBlock';
import { DepartmentRelatedBlocks } from '@/components/departments/DepartmentRelatedBlocks';
import { formatDate } from '@/lib/formatters';

/**
 * 소속(부서) 상세 (11_departments.md 11.3).
 * 고유 블록: 본부 조직도 개요 카드(부서명·설립일·설명).
 * 연계 블록(본부장·부서원 목록, 본부 투자 성과 비교)은 Phase 4 에서
 * 심사역(managers)·스타트업(startups) 도메인 조인으로 연결한다.
 */
export function DepartmentDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useAppToast();
  const isAdmin = useAuthStore((s) => s.role) === 'admin';
  const [editOpen, setEditOpen] = useState(false);

  const { data: department, isLoading, isError, refetch } = useDepartment(id);
  const { remove } = useDepartmentMutations();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError || !department) {
    return (
      <EmptyState
        message="부서를 찾을 수 없습니다."
        action={
          <Button type="primary" onClick={() => navigate('/departments')}>
            목록으로
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    toast.confirm('부서 삭제', `'${department.name}'을(를) 삭제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(department.id);
        toast.success('삭제되었습니다.');
        navigate('/departments');
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

      {/* 본부 조직도 개요 카드 */}
      <div className="rounded-lg border border-yna-border bg-white p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-yna-main">{department.name}</h1>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="설립일">
            {department.establishedAt ? formatDate(department.establishedAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="책임자">{department.authorName || '관리자'}</Descriptions.Item>
          <Descriptions.Item label="설명" span={2}>
            {department.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="등록일">{formatDate(department.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="수정일">{formatDate(department.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 첨부파일 (전 도메인 공통 카드) */}
      {department.sections.attachments ? (
        <EntityFilesBlock entityType="department" entityId={department.id} />
      ) : null}

      {/* 역방향 연계: 소속 부서원 · 본부 투자 성과 (본부장 임명은 후속) */}
      <DepartmentRelatedBlocks departmentId={department.id} />

      <DepartmentFormDrawer
        open={editOpen}
        department={department}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
