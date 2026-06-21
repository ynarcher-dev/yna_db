import { ProjectsListView } from './ProjectsListView';
import { MA_PROJECT_DOMAIN } from './projectDomain';

/** M&A 관리 목록 (projects.project_type='m_and_a' 고정). */
export function MaProjectsListView() {
  return <ProjectsListView domain={MA_PROJECT_DOMAIN} />;
}
