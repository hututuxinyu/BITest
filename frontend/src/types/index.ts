/**
 * 用户信息类型
 */
export interface User {
  userId: string;
  username: string;
  email?: string;
  status: string;
  lastLoginTime?: string;
}

/**
 * 工程信息类型
 */
export interface Project {
  projectId: string;
  projectName: string;
  description?: string;
  projectType: string;
  createTime: string;
  updateTime: string;
  reportCount: number;
  lastReportUpdateTime?: string;
}

/**
 * API响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * 分页结果类型
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 报表状态类型
 */
export type ReportStatus = 'draft' | 'published' | 'archived';

/**
 * 报表概要信息
 */
export interface ReportSummary {
  reportId: string;
  projectId: string;
  reportName: string;
  description?: string;
  status: ReportStatus;
  template?: string;
  tags?: string[];
  createdTime: string;
  updateTime: string;
  createdBy: string;
  lastEditedBy: string;
}

/**
 * 创建报表请求
 */
export interface CreateReportRequest {
  reportName: string;
  description?: string;
  template?: string;
}

/**
 * 创建工程请求类型
 */
export interface CreateProjectRequest {
  projectName: string;
  description?: string;
  projectType?: string;
}

/**
 * 更新工程请求类型
 */
export interface UpdateProjectRequest {
  projectName?: string;
  description?: string;
  projectType?: string;
}

/**
 * 组件分类
 */
export interface ComponentCategory {
  categoryId: string;
  categoryName: string;
  parentId?: string;
  orderNo: number;
  icon?: string;
}

/**
 * 组件标签
 */
export interface ComponentTag {
  tagId: string;
  tagName: string;
  description?: string;
}

/**
 * 组件摘要信息
 */
export interface ComponentSummary {
  componentId: string;
  componentName: string;
  alias?: string;
  version: string;
  type: string;
  icon: string;
  previewUrl: string;
  description?: string;
  categories: string[];
  tags: string[];
  author: string;
  releaseTime: string;
}

/**
 * 组件属性Schema
 */
export interface ComponentPropSchema {
  field: string;
  label: string;
  type: string;
  default?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  description?: string;
}

/**
 * 组件数据Schema
 */
export interface ComponentDataSchema {
  field: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
}

/**
 * 组件事件定义
 */
export interface ComponentEventSchema {
  event: string;
  label: string;
  description?: string;
  params?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
  componentId: string;
  version: string;
  propsSchema: ComponentPropSchema[];
  defaultProps: Record<string, any>;
  dataSchema: ComponentDataSchema[];
  defaultData: any;
  eventSchema: ComponentEventSchema[];
  defaultEvents: Record<string, any>;
  supportFeatures: Record<string, any>;
}

/**
 * 组件过滤条件
 */
export interface ComponentFilter {
  keyword?: string;
  categoryId?: string;
  tags?: string[];
  type?: string;
}

/**
 * 数据源配置类型
 */
export type DatasourceSourceType = 'dataset' | 'static';
export type DatasourceBindingType = 'dataset' | 'static';

/**
 * 数据集配置
 */
export interface DatasetConfig {
  datasourceId: string;
  query: string;
  params?: Record<string, any>;
}

/**
 * 静态数据配置
 */
export interface StaticConfig {
  data: any[];
}

/**
 * 数据源配置
 */
export interface DatasourceConfig {
  sourceType: DatasourceSourceType;
  bindingType: DatasourceBindingType;
  datasetConfig?: DatasetConfig;
  staticConfig?: StaticConfig;
}

/**
 * 数据集信息
 */
export interface Dataset {
  datasetId: string;
  datasetName: string;
  datasourceId: string;
  datasourceName: string;
  description?: string;
  query?: string;
}

/**
 * 交互事件类型
 */
export type InteractionEventType = 'click' | 'hover' | 'select' | 'input' | 'change';

/**
 * 交互动作类型
 */
export type InteractionActionType = 'drillDown' | 'associate' | 'jump' | 'filter' | 'popup' | 'dynamicEvent';

/**
 * 动态事件认证配置
 */
export interface DynamicEventAuth {
  type: 'bearer' | 'apikey' | 'basic';
  config: {
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    username?: string;
    password?: string;
  };
}

/**
 * 参数映射配置
 */
export interface ParamMapping {
  source: string;
  target: string;
}

/**
 * 动态事件配置
 */
export interface DynamicEventConfig {
  apiUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  auth?: DynamicEventAuth;
  paramMapping?: ParamMapping[];
}

/**
 * 交互动作配置
 */
export interface InteractionAction {
  type: InteractionActionType;
  config: any;
}

/**
 * 交互配置
 */
export interface InteractionConfig {
  eventType: InteractionEventType;
  actions: InteractionAction[];
  dynamicEvent?: DynamicEventConfig;
}


