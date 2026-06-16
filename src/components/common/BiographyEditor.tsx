import { Controller, useFieldArray, type Control, type FieldValues } from 'react-hook-form';
import { Button, Input } from 'antd';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

/**
 * 약력 에디터 (5_managers.md 5.3 / 9_experts.md — 학력/경력/자격증 행 추가 에디터).
 * 심사역·전문가 공용(폼 타입에 biography: {education,career,certifications} 필드가 있으면 사용 가능).
 * 입력은 가로형: 영역(학력/경력/자격증)을 위→아래로 쌓고, 각 항목의 필드는 한 줄(가로)로 입력한다.
 * (상세 화면 표시는 세로형) 각 영역은 useFieldArray 로 행을 추가/삭제한다.
 */

/** 한 영역의 입력 행에서 사용할 필드 정의 */
interface RowField {
  /** biography 하위 키 (예: 'school', 'company', 'name') */
  key: string;
  placeholder: string;
  /** 가로 배치용 폭 클래스 (예: 'w-36 shrink-0' | 'flex-1') */
  className: string;
}

interface BioSectionProps {
  control: Control<FieldValues>;
  title: string;
  /** useFieldArray name (예: 'biography.education') */
  name: 'biography.education' | 'biography.career' | 'biography.certifications' | 'biography.awards';
  fieldsDef: RowField[];
  /** 행 추가 시 기본값 */
  emptyRow: Record<string, string>;
}

function BioSection({ control, title, name, fieldsDef, emptyRow }: BioSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-yna-main">{title}</span>
        <Button
          size="small"
          icon={<HiOutlinePlus />}
          onClick={() => append({ ...emptyRow } as never)}
        >
          추가
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md bg-yna-bg px-3 py-2 text-xs text-yna-sub">
          등록된 {title}이(가) 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              {fieldsDef.map((f) => (
                <Controller
                  key={f.key}
                  control={control}
                  name={`${name}.${index}.${f.key}` as never}
                  render={({ field: rf }) => (
                    <Input {...rf} placeholder={f.placeholder} className={f.className} />
                  )}
                />
              ))}
              <Button
                danger
                type="text"
                aria-label={`${title} 삭제`}
                icon={<HiOutlineTrash />}
                onClick={() => remove(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BiographyEditor<T extends FieldValues>({ control }: { control: Control<T> }) {
  // 심사역·전문가 폼 모두 biography 필드 구조가 동일하므로 FieldValues 로 좁혀 공용 사용
  const c = control as unknown as Control<FieldValues>;
  return (
    <div className="space-y-5">
      <BioSection
        control={c}
        title="학력"
        name="biography.education"
        emptyRow={{ school: '', major: '', degree: '', period: '' }}
        fieldsDef={[
          { key: 'school', placeholder: '학교', className: 'w-40 shrink-0' },
          { key: 'major', placeholder: '전공', className: 'flex-1' },
          { key: 'degree', placeholder: '학위', className: 'w-24 shrink-0' },
          { key: 'period', placeholder: '기간 (예: 2010-2014)', className: 'w-40 shrink-0' },
        ]}
      />
      <BioSection
        control={c}
        title="경력"
        name="biography.career"
        emptyRow={{ company: '', position: '', period: '' }}
        fieldsDef={[
          { key: 'company', placeholder: '회사/기관', className: 'w-40 shrink-0' },
          { key: 'position', placeholder: '직책', className: 'flex-1' },
          { key: 'period', placeholder: '기간 (예: 2015-2020)', className: 'w-40 shrink-0' },
        ]}
      />
      <BioSection
        control={c}
        title="자격증"
        name="biography.certifications"
        emptyRow={{ name: '', issuer: '', period: '' }}
        fieldsDef={[
          { key: 'name', placeholder: '자격증명', className: 'w-40 shrink-0' },
          { key: 'issuer', placeholder: '발급기관', className: 'flex-1' },
          { key: 'period', placeholder: '취득일 (예: 2018)', className: 'w-32 shrink-0' },
        ]}
      />
      <BioSection
        control={c}
        title="수상"
        name="biography.awards"
        emptyRow={{ name: '', issuer: '', period: '' }}
        fieldsDef={[
          { key: 'name', placeholder: '수상명', className: 'w-40 shrink-0' },
          { key: 'issuer', placeholder: '수여기관', className: 'flex-1' },
          { key: 'period', placeholder: '수상연도 (예: 2022)', className: 'w-32 shrink-0' },
        ]}
      />
    </div>
  );
}
