import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, Button } from 'antd';
import { shareholdersFormSchema, type ShareholdersFormInput } from '@/schemas/startup';
import { useStartupMutations } from '@/hooks/useStartups';
import { useAppToast } from '@/components/common/useAppToast';
import { ShareholderEditor } from './ShareholderEditor';
import type { Startup } from '@/types/startup';

/**
 * 주주 구성 편집 Drawer (주주 카드 전용). 기본 정보와 분리해 주주만 저장한다.
 */
interface Props {
  open: boolean;
  startup: Startup;
  onClose: () => void;
  onSaved?: () => void;
}

export function ShareholdersFormDrawer({ open, startup, onClose, onSaved }: Props) {
  const { updateShareholders } = useStartupMutations();
  const toast = useAppToast();
  const { control, handleSubmit } = useForm<ShareholdersFormInput>({
    resolver: zodResolver(shareholdersFormSchema),
    mode: 'onBlur',
    defaultValues: { shareholders: startup.shareholders },
  });

  const handleSave = (values: ShareholdersFormInput) => {
    updateShareholders.mutate(
      { id: startup.id, input: values },
      {
        onSuccess: () => {
          toast.success('주주 구성이 저장되었습니다.');
          onSaved?.();
          onClose();
        },
        onError: (e) => toast.error('저장에 실패했습니다.', e),
      },
    );
  };

  return (
    <Drawer title="주주 구성 수정" width={520} open={open} onClose={onClose} destroyOnClose>
      {open ? (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4" noValidate>
          <ShareholderEditor control={control} />
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" loading={updateShareholders.isPending}>
              저장
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}
