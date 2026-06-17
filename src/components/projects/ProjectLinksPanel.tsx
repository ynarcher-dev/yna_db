import { useMemo, useState } from 'react';
import { Tag, Select, Button, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import {
  useProjectLinks,
  useProjectLinkMutations,
  PROJECT_LINK_CONFIG,
  type ProjectLinkKind,
} from '@/hooks/useProjectLinks';
import { useStartupOptions } from '@/hooks/useStartups';
import { usePartnerOptions } from '@/hooks/usePartners';
import { useAppToast } from '@/components/common/useAppToast';

/**
 * 프로젝트 매칭 스타트업/협력사 매핑 패널 (10_projects.md 10.3 연계 UI, 다대다).
 * 두 패널이 구조가 같아 kind 로 분기한다. 편집은 전 직원 공통.
 */
export function ProjectLinksPanel({
  projectId,
  kind,
  title,
}: {
  projectId: string;
  kind: ProjectLinkKind;
  title: string;
}) {
  const cfg = PROJECT_LINK_CONFIG[kind];
  const toast = useAppToast();
  const { links, isLoading } = useProjectLinks(projectId, kind);
  const { add, remove } = useProjectLinkMutations(projectId, kind);

  // kind 는 마운트 동안 고정이므로 두 옵션 훅을 모두 호출하고 해당 목록만 사용한다(Hook 규칙 준수).
  const startupOptions = useStartupOptions();
  const partnerOptions = usePartnerOptions();
  const allOptions = useMemo(
    () => (kind === 'startup' ? startupOptions.data : partnerOptions.data) ?? [],
    [kind, startupOptions.data, partnerOptions.data],
  );

  const [selected, setSelected] = useState<string | undefined>();

  const linkedIds = useMemo(() => new Set(links.map((l) => l.entityId)), [links]);
  const availableOptions = useMemo(
    () => allOptions.filter((o) => !linkedIds.has(o.value)),
    [allOptions, linkedIds],
  );

  const handleAdd = () => {
    if (!selected) return;
    add.mutate(selected, {
      onSuccess: () => {
        toast.success(`${cfg.noun}이(가) 추가되었습니다.`);
        setSelected(undefined);
      },
      onError: (err) => toast.error(`${cfg.noun} 추가에 실패했습니다.`, err),
    });
  };

  const handleRemove = (joinId: string, name: string) => {
    toast.confirm(
      `${cfg.noun} 해제`,
      `'${name || cfg.noun}' 매핑을 해제하시겠습니까?`,
      async () => {
        try {
          await remove.mutateAsync(joinId);
          toast.success(`${cfg.noun}이(가) 해제되었습니다.`);
        } catch (err) {
          toast.error(`${cfg.noun} 해제에 실패했습니다.`, err);
        }
      },
    );
  };

  return (
    <div className="rounded-lg border border-yna-border bg-white p-6">
      <h2 className="mb-3 text-base font-semibold text-yna-main">
        {title}
        <span className="ml-1 text-xs font-normal text-yna-point">(연동)</span>
      </h2>

      {isLoading ? (
        <Spin size="small" />
      ) : links.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {links.map((l) => (
            <Tag
              key={l.id}
              closable
              onClose={(e) => {
                e.preventDefault();
                handleRemove(l.id, l.name);
              }}
              className="flex items-center gap-1 px-2 py-1"
            >
              <Link className="text-yna-point" to={`${cfg.path}/${l.entityId}`}>
                {l.name || cfg.noun}
              </Link>
            </Tag>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-yna-sub">아직 매핑된 {cfg.noun}이(가) 없습니다.</p>
      )}

      <div className="flex items-center gap-2">
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          className="w-60"
          placeholder={`${cfg.noun} 선택`}
          options={availableOptions}
          value={selected}
          onChange={(v?: string) => setSelected(v)}
          notFoundContent={availableOptions.length ? undefined : `추가할 ${cfg.noun}이(가) 없습니다.`}
        />
        <Button
          type="primary"
          icon={<HiOutlinePlus />}
          disabled={!selected}
          loading={add.isPending}
          onClick={handleAdd}
        >
          추가
        </Button>
      </div>
    </div>
  );
}
