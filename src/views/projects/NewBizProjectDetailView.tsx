import { ProjectDetailView } from './ProjectDetailView';
import { NEW_BIZ_PROJECT_DOMAIN } from './projectDomain';

/** 신사업 관리 상세. */
export function NewBizProjectDetailView() {
  return <ProjectDetailView domain={NEW_BIZ_PROJECT_DOMAIN} />;
}
