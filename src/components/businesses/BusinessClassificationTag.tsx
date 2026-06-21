import { Tag } from 'antd';
import {
  BUSINESS_CLASSIFICATION_COLOR,
  BUSINESS_CLASSIFICATION_LABEL,
  badgeTone,
} from '@/lib/labels';
import type { BusinessClassification } from '@/types/database';

/** 사업 구분 배지 (공공/민간/매출). */
export function BusinessClassificationTag({ classification }: { classification: BusinessClassification }) {
  return (
    <Tag {...badgeTone(BUSINESS_CLASSIFICATION_COLOR[classification])}>
      {BUSINESS_CLASSIFICATION_LABEL[classification]}
    </Tag>
  );
}
