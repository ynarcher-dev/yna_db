import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Input, Select, Button } from 'antd';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { businessTeamSchema, type BusinessTeamInput } from '@/schemas/startupProfile';
import { useStartupMutations } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import type { Startup } from '@/types/startup';

/**
 * 비즈니스 & 팀 역량 편집 Drawer (상세 화면 전용).
 * business_profile / team_profile 두 jsonb 를 한 폼에서 편집한다.
 */
interface Props {
  open: boolean;
  startup: Startup;
  onClose: () => void;
  onSaved?: () => void;
}

function toInput(s: Startup): BusinessTeamInput {
  return {
    oneLiner: s.businessProfile.oneLiner,
    businessModel: s.businessProfile.businessModel,
    targetMarket: s.businessProfile.targetMarket,
    competitiveEdge: s.businessProfile.competitiveEdge,
    founderStrength: s.teamProfile.founderStrength,
    members: s.teamProfile.members,
    capabilities: s.teamProfile.capabilities,
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function BusinessTeamFormDrawer({ open, startup, onClose, onSaved }: Props) {
  const { updateBusinessTeam } = useStartupMutations();
  const toast = useAppToast();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessTeamInput>({
    resolver: zodResolver(businessTeamSchema),
    mode: 'onBlur',
    defaultValues: toInput(startup),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  const handleSave = (values: BusinessTeamInput) => {
    updateBusinessTeam.mutate(
      { id: startup.id, input: values },
      {
        onSuccess: () => {
          toast.success('비즈니스 · 팀 역량이 저장되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (e) => toast.error('저장에 실패했습니다.', e),
      },
    );
  };

  const textArea = (name: keyof BusinessTeamInput, label: string, rows = 3) => (
    <div>
      <label className="mb-1 block text-sm text-yna-main">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => <Input.TextArea {...(field as object)} rows={rows} />}
      />
      <FieldError message={errors[name]?.message as string | undefined} />
    </div>
  );

  return (
    <Drawer
      title="비즈니스 · 팀 역량 수정"
      width={520}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {open ? (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4" noValidate>
          <h4 className="border-b border-yna-border pb-1 text-sm font-semibold text-yna-main">
            비즈니스
          </h4>
          <div>
            <label className="mb-1 block text-sm text-yna-main">한 줄 소개</label>
            <Controller
              name="oneLiner"
              control={control}
              render={({ field }) => <Input {...field} placeholder="무엇을 하는 회사인지 한 줄로" />}
            />
            <FieldError message={errors.oneLiner?.message} />
          </div>
          {textArea('businessModel', '비즈니스 모델 (수익 구조)')}
          {textArea('targetMarket', '타겟 시장 & 고객')}
          {textArea('competitiveEdge', '경쟁 우위 / 차별점')}

          <h4 className="border-b border-yna-border pb-1 text-sm font-semibold text-yna-main">
            팀 역량
          </h4>
          {textArea('founderStrength', '대표 / 창업자 역량')}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yna-main">핵심 팀원</span>
              <Button
                size="small"
                icon={<HiOutlinePlus />}
                onClick={() => append({ name: '', role: '', background: '' })}
              >
                팀원 추가
              </Button>
            </div>
            {fields.length === 0 ? (
              <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
                등록된 팀원이 없습니다. “팀원 추가”로 이름·직책·핵심 경력을 기록하세요.
              </p>
            ) : null}
            {fields.map((f, index) => (
              <div key={f.id} className="space-y-1 rounded-md border border-yna-border p-2">
                <div className="flex items-center gap-2">
                  <Controller
                    name={`members.${index}.name`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="이름" className="w-32 shrink-0" />}
                  />
                  <Controller
                    name={`members.${index}.role`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="직책 (예: CTO)" />}
                  />
                  <Button
                    danger
                    type="text"
                    aria-label="팀원 삭제"
                    icon={<HiOutlineTrash />}
                    onClick={() => remove(index)}
                  />
                </div>
                <Controller
                  name={`members.${index}.background`}
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="핵심 경력" />}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm text-yna-main">핵심 역량 키워드</label>
            <Controller
              name="capabilities"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="tags"
                  className="w-full"
                  placeholder="예: AI, B2B세일즈, 바이오 (입력 후 Enter)"
                  tokenSeparators={[',']}
                  open={false}
                  suffixIcon={null}
                />
              )}
            />
            <FieldError message={errors.capabilities?.message} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={updateBusinessTeam.isPending}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
