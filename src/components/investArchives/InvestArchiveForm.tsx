import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Switch, Button } from 'antd';
import { investArchiveSchema, type InvestArchiveInput } from '@/schemas/investArchive';
import {
  INVEST_ARCHIVE_SECTIONS,
  DEFAULT_INVEST_ARCHIVE_SECTIONS,
} from '@/lib/investArchiveSections';
import { SectionVisibilityField } from '@/components/common/SectionVisibilityField';

/**
 * 투자 자료실 글쓰기/수정 폼 (22_invest_archives.md 22.3). 등록·수정 공용.
 * 제목·상단 고정·본문만 다룬다. 첨부파일은 등록/수정 Drawer에서 attachmentSlot 으로 끼워 넣는다.
 */
const EMPTY: InvestArchiveInput = {
  title: '',
  isPinned: false,
  content: '',
  sections: DEFAULT_INVEST_ARCHIVE_SECTIONS,
};

interface InvestArchiveFormProps {
  defaultValues?: InvestArchiveInput;
  submitting?: boolean;
  submitLabel: string;
  /** 첨부파일 영역(드롭존/목록). 본문 아래·동작 버튼 위에 렌더된다. */
  attachmentSlot?: ReactNode;
  onSubmit: (values: InvestArchiveInput) => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-yna-point">{message}</p> : null;
}

export function InvestArchiveForm({
  defaultValues,
  submitting,
  submitLabel,
  attachmentSlot,
  onSubmit,
  onCancel,
}: InvestArchiveFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InvestArchiveInput>({
    resolver: zodResolver(investArchiveSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm text-yna-main">제목 *</label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => <Input {...field} placeholder="자료실 게시글 제목" />}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">상단 고정</label>
        <Controller
          name="isPinned"
          control={control}
          render={({ field }) => (
            <div className="flex h-8 items-center">
              <Switch
                checked={field.value}
                onChange={field.onChange}
                checkedChildren="공지"
                unCheckedChildren="일반"
              />
            </div>
          )}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-yna-main">본문</label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={8} placeholder="게시글 본문 및 자료 설명" />
          )}
        />
        <FieldError message={errors.content?.message} />
      </div>

      <Controller
        name="sections"
        control={control}
        render={({ field }) => (
          <SectionVisibilityField
            config={INVEST_ARCHIVE_SECTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {attachmentSlot}

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
