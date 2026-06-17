import { useMemo, useState } from 'react';
import { Table, Select, Button, Space } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { HiOutlineLinkSlash } from 'react-icons/hi2';
import {
  usePartnerProjects,
  usePartnerProjectMutations,
  type PartnerProjectRow,
} from '@/hooks/usePartnerProjects';
import { useProjectOptions } from '@/hooks/useProjects';
import { ProjectFormDrawer } from '@/components/projects/ProjectFormDrawer';
import { useAppToast } from '@/components/common/useAppToast';
import { EmptyState } from '@/components/common/EmptyState';
import { projectColumns } from '@/lib/listColumns';
import type { Project } from '@/types/project';

/**
 * 협력사 상세 "참여 프로젝트" 역방향 편집 패널 (project_partners '쓰는 쪽', 0036 쓰기 RLS).
 * 프로젝트 목록과 동일한 표 형태 + 연동 해제. (a) 기존 프로젝트 연결 또는 (b) 신규 생성·즉시 매핑.
 */
export function PartnerProjectsPanel({ partnerId }: { partnerId: string }) {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { rows, isLoading } = usePartnerProjects(partnerId);
  const { data: projectOptions = [] } = useProjectOptions();
  const { add, remove } = usePartnerProjectMutations(partnerId);
  const [selected, setSelected] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const joinedIds = useMemo(
    () => new Set(rows.map((r) => r.project?.id).filter(Boolean)),
    [rows],
  );
  const availableOptions = useMemo(
    () => projectOptions.filter((o) => !joinedIds.has(o.value)),
    [projectOptions, joinedIds],
  );

  // 표시는 목록과 동일한 프로젝트 도메인 객체로, 조인 메타(해제)는 프로젝트 id 로 역참조한다.
  const projects = useMemo(
    () => rows.map((r) => r.project).filter((p): p is Project => Boolean(p)),
    [rows],
  );
  const metaByProject = useMemo(() => {
    const m = new Map<string, PartnerProjectRow>();
    rows.forEach((r) => {
      if (r.project) m.set(r.project.id, r);
    });
    return m;
  }, [rows]);

  const handleAdd = (projectId: string, isNew = false) => {
    add.mutate(projectId, {
      onSuccess: () => {
        toast.success(isNew ? '새 프로젝트가 생성·연결되었습니다.' : '참여 프로젝트가 추가되었습니다.');
        setSelected(undefined);
      },
      onError: (err) =>
        toast.error(
          isNew
            ? '프로젝트는 생성됐지만 연결에 실패했습니다. 아래 목록에서 직접 추가해 주세요.'
            : '추가에 실패했습니다.',
          err,
        ),
    });
  };

  const handleRemove = (r: PartnerProjectRow) => {
    toast.confirm('연동 해제', `'${r.project?.name || '프로젝트'}' 연동을 해제하시겠습니까?`, async () => {
      try {
        await remove.mutateAsync(r.id);
        toast.success('해제되었습니다.');
      } catch (err) {
        toast.error('해제에 실패했습니다.', err);
      }
    });
  };

  // 프로젝트 목록과 동일한 고유 컬럼 + 연동해제 컬럼.
  const columns: TableProps<Project>['columns'] = [
    ...projectColumns(),
    {
      title: '연동 해제',
      key: 'actions',
      width: 72,
      align: 'center',
      render: (_, p) => {
        const m = metaByProject.get(p.id);
        return m ? (
          <Button
            size="small"
            type="text"
            danger
            aria-label="연동 해제"
            icon={<HiOutlineLinkSlash />}
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(m);
            }}
          />
        ) : null;
      },
    },
  ];

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">
        참여 프로젝트
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {rows.length === 0 && !isLoading ? (
        <EmptyState message="참여한 프로젝트가 없습니다." />
      ) : (
        <Table<Project>
          rowKey="id"
          size="small"
          className="mb-4"
          loading={isLoading}
          columns={columns}
          dataSource={projects}
          pagination={false}
          onRow={(p) => ({
            onClick: () => navigate(`/projects/${p.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          className="w-52"
          placeholder="프로젝트 선택"
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : '추가할 프로젝트가 없습니다.'}
        />
        <Space>
          <Button
            type="primary"
            icon={<HiOutlinePlus />}
            disabled={!selected}
            loading={add.isPending}
            onClick={() => selected && handleAdd(selected)}
          >
            추가
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>+ 새 프로젝트</Button>
        </Space>
      </div>

      <ProjectFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(projectId) => handleAdd(projectId, true)}
      />
    </div>
  );
}
