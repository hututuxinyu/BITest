/**
 * 报表Schema类型定义
 * 用于设计态与运行态之间的数据交换
 */

/**
 * 报表类型
 */
export type ReportType = 'report' | 'dashboard';

/**
 * 数据源类型
 */
export type DatasourceType =
  | 'mysql'
  | 'postgresql'
  | 'oracle'
  | 'hive'
  | 'clickhouse'
  | 'elasticsearch'
  | 'api'
  | 'file';

/**
 * API请求方法
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * 文件类型
 */
export type FileType = 'csv' | 'excel' | 'json';

/**
 * 参数类型
 */
export type ParameterType = 'string' | 'number' | 'date' | 'boolean';

/**
 * 参数来源
 */
export type ParameterSource = 'static' | 'control' | 'url' | 'user';

/**
 * 过滤操作符
 */
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'in'
  | 'notIn'
  | 'between';

/**
 * 事件类型
 */
export type EventType = 'click' | 'hover' | 'select' | 'input' | 'change' | 'search';

/**
 * 交互动作类型
 */
export type ActionType = 'drillDown' | 'associate' | 'jump' | 'filter' | 'popup' | 'refresh' | 'dynamicEvent';

/**
 * 边框样式
 */
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none';

/**
 * 背景类型
 */
export type BackgroundType = 'color' | 'gradient' | 'image' | 'video';

/**
 * 报表元信息
 */
export interface ReportMetadata {
  /** 创建时间，ISO 8601格式 */
  createTime: string;
  /** 更新时间，ISO 8601格式 */
  updateTime: string;
  /** 创建者ID */
  creator: string;
  /** 报表描述 */
  description?: string;
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  /** 画布宽度（像素） */
  width: number;
  /** 画布高度（像素） */
  height: number;
  /** 画布背景颜色 */
  backgroundColor?: string;
  /** 是否显示网格 */
  grid?: boolean;
  /** 网格大小（像素） */
  gridSize?: number;
}

/**
 * 位置信息
 */
export interface Position {
  /** X坐标（像素） */
  x: number;
  /** Y坐标（像素） */
  y: number;
}

/**
 * 尺寸信息
 */
export interface Size {
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
}

/**
 * 边框配置
 */
export interface BorderConfig {
  /** 边框宽度 */
  width?: number;
  /** 边框样式 */
  style?: BorderStyle;
  /** 边框颜色 */
  color?: string;
  /** 圆角 */
  radius?: number;
}

/**
 * 阴影配置
 */
export interface ShadowConfig {
  /** X偏移 */
  x?: number;
  /** Y偏移 */
  y?: number;
  /** 模糊半径 */
  blur?: number;
  /** 阴影颜色 */
  color?: string;
}

/**
 * 组件样式配置
 */
export interface ComponentStyle {
  /** 背景颜色 */
  backgroundColor?: string;
  /** 文字颜色 */
  color?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 字体类型 */
  fontFamily?: string;
  /** 边框配置 */
  border?: BorderConfig;
  /** 阴影配置 */
  shadow?: ShadowConfig;
  /** 透明度（0-1） */
  opacity?: number;
  /** 其他样式属性 */
  [key: string]: any;
}

/**
 * 查询参数配置
 */
export interface QueryParameter {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: ParameterType;
  /** 参数值 */
  value?: any;
  /** 参数来源 */
  source?: ParameterSource;
  /** 参数来源ID（当source为control时，为控制类组件ID） */
  sourceId?: string;
}

/**
 * 过滤条件配置
 */
export interface FilterCondition {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: FilterOperator;
  /** 过滤值 */
  value?: any;
}

/**
 * 查询配置
 */
export interface QueryConfig {
  /** SQL查询语句（当数据源类型为数据库时） */
  sql?: string;
  /** API接口地址（当数据源类型为api时） */
  apiUrl?: string;
  /** API请求方法 */
  apiMethod?: ApiMethod;
  /** API请求头 */
  apiHeaders?: Record<string, string>;
  /** API请求体 */
  apiBody?: Record<string, any>;
  /** 文件路径（当数据源类型为file时） */
  filePath?: string;
  /** 文件类型 */
  fileType?: FileType;
  /** 查询参数列表 */
  parameters?: QueryParameter[];
  /** 过滤条件列表 */
  filters?: FilterCondition[];
  /** 字段映射配置 */
  fieldMapping?: Record<string, string>;
}

/**
 * 数据源连接配置
 */
export interface ConnectionConfig {
  /** 主机地址 */
  host?: string;
  /** 端口号 */
  port?: number;
  /** 数据库名 */
  database?: string;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 连接URL（JDBC URL或API URL） */
  url?: string;
  /** 其他连接选项 */
  options?: Record<string, any>;
}

/**
 * 组件数据源配置
 */
export interface ComponentDatasourceConfig {
  /** 数据源类型 */
  datasourceType: DatasourceType;
  /** 查询配置 */
  queryConfig: QueryConfig;
}

/**
 * 组件多语言配置
 */
export interface ComponentI18n {
  /** 语言代码对应的多语言文本，如zh-CN, en-US */
  [languageCode: string]: Record<string, string>;
}

/**
 * 组件配置
 */
export interface Component {
  /** 组件唯一标识符 */
  componentId: string;
  /** 组件类型 */
  componentType: string;
  /** 组件名称 */
  componentName?: string;
  /** 组件位置 */
  position: Position;
  /** 组件尺寸 */
  size: Size;
  /** 组件层级 */
  zIndex?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否锁定 */
  locked?: boolean;
  /** 组件属性配置 */
  props?: Record<string, any>;
  /** 绑定的数据源ID */
  datasourceId?: string;
  /** 数据源配置（当组件有独立数据源时） */
  datasourceConfig?: ComponentDatasourceConfig;
  /** 组件多语言配置 */
  i18n?: ComponentI18n;
  /** 组件默认样式配置 */
  style?: ComponentStyle;
}

/**
 * 数据源配置
 */
export interface Datasource {
  /** 数据源唯一标识符 */
  datasourceId: string;
  /** 数据源名称 */
  datasourceName?: string;
  /** 数据源类型 */
  datasourceType: DatasourceType;
  /** 连接配置 */
  connectionConfig?: ConnectionConfig;
  /** 查询配置 */
  queryConfig?: QueryConfig;
}

/**
 * 交互条件配置
 */
export interface InteractionCondition {
  /** 字段名 */
  field?: string;
  /** 操作符 */
  operator?: FilterOperator;
  /** 条件值 */
  value?: any;
}

/**
 * 动态事件API配置
 */
export interface DynamicEventApiConfig {
  /** API接口地址 */
  url: string;
  /** 请求方法 */
  method: ApiMethod;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 查询参数 */
  queryParams?: Record<string, any>;
  /** 请求体 */
  body?: Record<string, any>;
  /** 请求超时时间（毫秒） */
  timeout?: number;
}

/**
 * 动态事件认证配置
 */
export interface DynamicEventAuthConfig {
  /** 认证类型 */
  type: 'none' | 'bearer' | 'apiKey' | 'basic';
  /** Bearer Token（当type为bearer时） */
  bearerToken?: string;
  /** API Key配置（当type为apiKey时） */
  apiKey?: {
    /** API Key名称 */
    key: string;
    /** API Key值 */
    value: string;
    /** API Key位置 */
    location: 'header' | 'query';
  };
  /** Basic认证配置（当type为basic时） */
  basicAuth?: {
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
  };
}

/**
 * 动态事件参数映射配置
 */
export interface DynamicEventParamMapping {
  /** 组件数据映射 */
  componentData?: Record<string, string>;
  /** 用户数据映射 */
  userData?: Record<string, string>;
  /** 上下文数据映射 */
  contextData?: Record<string, string>;
  /** 静态参数 */
  staticParams?: Record<string, any>;
}

/**
 * 动态事件响应转换配置
 */
export interface DynamicEventResponseTransform {
  /** 转换类型 */
  type: 'none' | 'map' | 'filter' | 'aggregate';
  /** 转换规则 */
  rules?: any[];
}

/**
 * 动态事件响应配置
 */
export interface DynamicEventResponseConfig {
  /** 数据路径（JSONPath） */
  dataPath?: string;
  /** 成功条件（表达式） */
  successCondition?: string;
  /** 错误路径（JSONPath） */
  errorPath?: string;
  /** 数据转换配置 */
  transform?: DynamicEventResponseTransform;
}

/**
 * 动态事件错误处理配置
 */
export interface DynamicEventErrorHandling {
  /** 重试配置 */
  retry?: {
    /** 是否启用重试 */
    enabled: boolean;
    /** 最大重试次数 */
    maxRetries?: number;
    /** 重试延迟（毫秒） */
    retryDelay?: number;
  };
  /** 降级策略 */
  fallback?: {
    /** 是否启用降级 */
    enabled: boolean;
    /** 降级动作 */
    action?: 'showError' | 'useDefault' | 'ignore';
  };
  /** 错误消息 */
  errorMessage?: string;
}

/**
 * 动态事件响应动作配置
 */
export interface DynamicEventResponseAction {
  /** 动作类型 */
  type: 'updateComponent' | 'triggerAction' | 'showMessage';
  /** 目标组件ID或动作ID */
  target?: string;
  /** 动作配置 */
  config?: Record<string, any>;
}

/**
 * 动态事件配置
 */
export interface DynamicEventConfig {
  /** API配置 */
  apiConfig: DynamicEventApiConfig;
  /** 认证配置 */
  authConfig: DynamicEventAuthConfig;
  /** 参数映射配置 */
  paramMapping?: DynamicEventParamMapping;
  /** 响应配置 */
  responseConfig?: DynamicEventResponseConfig;
  /** 错误处理配置 */
  errorHandling?: DynamicEventErrorHandling;
  /** 响应动作列表 */
  responseActions?: DynamicEventResponseAction[];
}

/**
 * 交互动作配置
 */
export interface InteractionAction {
  /** 动作类型 */
  actionType: ActionType;
  /** 目标组件ID或报表ID（当actionType为jump时） */
  target?: string;
  /** 传递的参数 */
  params?: Record<string, any>;
  /** 动作配置 */
  config?: Record<string, any>;
  /** 动态事件配置（当actionType为dynamicEvent时） */
  dynamicEventConfig?: DynamicEventConfig;
}

/**
 * 交互事件配置
 */
export interface InteractionEvent {
  /** 事件类型 */
  eventType: EventType;
  /** 触发条件列表 */
  conditions?: InteractionCondition[];
  /** 交互动作列表 */
  actions: InteractionAction[];
}

/**
 * 交互配置
 */
export interface Interaction {
  /** 触发交互的组件ID */
  componentId: string;
  /** 交互事件列表 */
  events: InteractionEvent[];
}

/**
 * 报表多语言配置
 */
export interface ReportI18n {
  /** 语言代码对应的多语言文本 */
  [languageCode: string]: {
    /** 报表名称 */
    reportName?: string;
    /** 报表描述 */
    description?: string;
    /** 数据字段名称的多语言映射 */
    fieldMappings?: Record<string, string>;
    /** 其他多语言文本 */
    [key: string]: any;
  };
}

/**
 * 报表背景配置
 */
export interface ReportBackground {
  /** 背景类型 */
  type: BackgroundType;
  /** 背景值（颜色值、图片URL等） */
  value: string;
  /** 背景配置（渐变方向、图片尺寸等） */
  config?: Record<string, any>;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题ID */
  themeId?: string;
  /** 主题名称 */
  themeName?: string;
}

/**
 * 报表样式配置
 */
export interface ReportStyle {
  /** 报表背景配置 */
  reportBackground?: ReportBackground;
  /** 主题配置 */
  theme?: ThemeConfig;
}

/**
 * 报表Schema
 */
export interface ReportSchema {
  /** Schema版本号，遵循语义化版本规范 */
  version: string;
  /** 报表唯一标识符 */
  reportId: string;
  /** 报表名称 */
  reportName: string;
  /** 报表类型 */
  reportType: ReportType;
  /** 报表元信息 */
  metadata: ReportMetadata;
  /** 画布配置 */
  canvas: CanvasConfig;
  /** 组件列表 */
  components: Component[];
  /** 数据源配置列表 */
  datasources?: Datasource[];
  /** 交互配置列表 */
  interactions?: Interaction[];
  /** 报表多语言配置 */
  i18n?: ReportI18n;
  /** 报表默认样式配置 */
  style?: ReportStyle;
}

