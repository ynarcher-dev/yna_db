import { ProjectsListView } from './ProjectsListView';
import { NEW_BIZ_PROJECT_DOMAIN } from './projectDomain';

/** 신사업 관리 목록 (projects.project_type='new_business' 고정). */
export function NewBizProjectsListView() {
  return <ProjectsListView domain={NEW_BIZ_PROJECT_DOMAIN} />;
}
