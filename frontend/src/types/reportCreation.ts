/**
 * 创建报表场景相关类型定义
 */
export interface TemplateDefinition {
  templateId: string;
  name: string;
  description: string;
  category: 'dashboard' | 'report' | 'blank';
  previewUrl?: string;
  tags: string[];
  recommendFor: string[];
}

export interface CodeRepositoryBranch {
  branchName: string;
  isPersonal: boolean;
  lastSyncTime: string;
}

export interface CodeRepository {
  repoId: string;
  repoName: string;
  branches: CodeRepositoryBranch[];
  description: string;
}

export interface SchemaFileSummary {
  filePath: string;
  status: 'added' | 'updated' | 'unchanged';
  lastModified: string;
  owner?: string;
}

export interface DataSourceDefinition {
  dataSourceId: string;
  name: string;
  type: 'mysql' | 'postgres' | 'api' | 'excel';
  status: 'connected' | 'warning' | 'disconnected';
  description: string;
}

export interface InteractionOption {
  interactionId: string;
  name: string;
  description: string;
  eventExample: string;
}

export interface ComponentOption {
  componentId: string;
  name: string;
  description: string;
  type: string;
  icon?: string;
  defaultDataSourceId: string;
}

export interface CanvasComponentState {
  instanceId: string;
  componentId: string;
  title: string;
  dataSourceId: string;
  interactionId?: string;
  style: {
    width: number;
    height: number;
    color: string;
  };
  filters: string;
}

