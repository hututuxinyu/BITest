import type {
  CodeRepository,
  TemplateDefinition,
  SchemaFileSummary,
  DataSourceDefinition,
  InteractionOption,
  ComponentOption,
} from '../types/reportCreation';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const codeRepositories: CodeRepository[] = [
  {
    repoId: 'repo-001',
    repoName: 'bi-schema-main',
    description: 'BI平台主干Schema仓库',
    branches: [
      { branchName: 'master', isPersonal: false, lastSyncTime: '2024-02-10 09:45' },
      { branchName: 'feature/user-001', isPersonal: true, lastSyncTime: '2024-02-11 14:12' },
    ],
  },
  {
    repoId: 'repo-002',
    repoName: 'marketing-dashboard',
    description: '营销大屏个人工程',
    branches: [
      { branchName: 'main', isPersonal: false, lastSyncTime: '2024-02-08 18:33' },
      { branchName: 'user-001/campaign', isPersonal: true, lastSyncTime: '2024-02-11 08:02' },
    ],
  },
  {
    repoId: 'repo-003',
    repoName: 'finance-report',
    description: '财务主题报表仓库',
    branches: [
      { branchName: 'stable', isPersonal: false, lastSyncTime: '2024-02-06 11:25' },
      { branchName: 'user-001/q1', isPersonal: true, lastSyncTime: '2024-02-10 21:40' },
    ],
  },
];

const templates: TemplateDefinition[] = [
  {
    templateId: 'tpl-001',
    name: '销售概览仪表盘',
    category: 'dashboard',
    description: '包含销售额趋势、渠道占比、热力分布等模块',
    previewUrl: '',
    tags: ['销售', '大屏', '实时'],
    recommendFor: ['Retail', 'E-Commerce'],
  },
  {
    templateId: 'tpl-002',
    name: '运营KPI报表',
    category: 'report',
    description: '适用于月度运营复盘，预置KPI卡片和图表布局',
    previewUrl: '',
    tags: ['运营', 'KPI'],
    recommendFor: ['Operations'],
  },
  {
    templateId: 'tpl-003',
    name: '空白模板',
    category: 'blank',
    description: '完全自定义布局，适配多场景设计',
    previewUrl: '',
    tags: ['自定义'],
    recommendFor: ['Advanced Designers'],
  },
];

const schemaFileMap: Record<string, SchemaFileSummary[]> = {
  'repo-001-feature/user-001': [
    { filePath: 'schemas/sales/dashboard.json', status: 'updated', lastModified: '2024-02-11 13:20', owner: 'user-001' },
    { filePath: 'schemas/sales/kpi.json', status: 'unchanged', lastModified: '2024-02-09 10:05', owner: 'system' },
  ],
  'repo-002-user-001/campaign': [
    { filePath: 'schemas/marketing/campaign.json', status: 'added', lastModified: '2024-02-10 17:12', owner: 'user-001' },
    { filePath: 'schemas/marketing/overview.json', status: 'updated', lastModified: '2024-02-09 19:40', owner: 'analyst' },
  ],
  'repo-003-user-001/q1': [
    { filePath: 'schemas/finance/q1.json', status: 'updated', lastModified: '2024-02-10 22:01', owner: 'user-001' },
    { filePath: 'schemas/finance/common.json', status: 'unchanged', lastModified: '2024-02-07 08:15', owner: 'finance-team' },
  ],
};

const dataSources: DataSourceDefinition[] = [
  {
    dataSourceId: 'ds-sales',
    name: '销售分析数据库',
    type: 'mysql',
    status: 'connected',
    description: '生产环境MySQL，包含订单、渠道、区域表',
  },
  {
    dataSourceId: 'ds-marketing',
    name: '营销实时数据',
    type: 'api',
    status: 'warning',
    description: 'REST API，提供实时投放与转化数据',
  },
  {
    dataSourceId: 'ds-finance',
    name: '财务指标库',
    type: 'postgres',
    status: 'connected',
    description: 'PostgreSQL，存储月度财务指标',
  },
];

const interactionOptions: InteractionOption[] = [
  {
    interactionId: 'jump-detail',
    name: '下钻详情',
    description: '点击组件后跳转到明细报表',
    eventExample: 'POST /api/events/drill?target=detail',
  },
  {
    interactionId: 'linkage-filter',
    name: '联动过滤',
    description: '多个组件之间共享过滤条件',
    eventExample: 'POST /api/events/linkage',
  },
  {
    interactionId: 'global-refresh',
    name: '全局刷新',
    description: '触发REST API刷新所有组件数据',
    eventExample: 'POST /api/events/refresh',
  },
];

const componentOptions: ComponentOption[] = [
  {
    componentId: 'bar-chart',
    name: '柱状图',
    description: '适合展示分类对比',
    type: 'chart',
    icon: '',
    defaultDataSourceId: 'ds-sales',
  },
  {
    componentId: 'line-chart',
    name: '折线图',
    description: '展示趋势变化',
    type: 'chart',
    icon: '',
    defaultDataSourceId: 'ds-sales',
  },
  {
    componentId: 'pie-chart',
    name: '饼图',
    description: '结构占比展示',
    type: 'chart',
    icon: '',
    defaultDataSourceId: 'ds-marketing',
  },
  {
    componentId: 'table',
    name: '指标表格',
    description: '展示多指标明细',
    type: 'table',
    icon: '',
    defaultDataSourceId: 'ds-finance',
  },
];

export const fetchSceneRepositories = async (): Promise<CodeRepository[]> => {
  await delay(200);
  return codeRepositories;
};

export const fetchSceneTemplates = async (): Promise<TemplateDefinition[]> => {
  await delay(200);
  return templates;
};

export const fetchSchemaFiles = async (repoId: string, branchName: string): Promise<SchemaFileSummary[]> => {
  await delay(200);
  const key = `${repoId}-${branchName}`;
  return schemaFileMap[key] || [];
};

export const fetchSceneDataSources = async (): Promise<DataSourceDefinition[]> => {
  await delay(200);
  return dataSources;
};

export const fetchInteractionOptions = async (): Promise<InteractionOption[]> => {
  await delay(200);
  return interactionOptions;
};

export const fetchComponentOptions = async (): Promise<ComponentOption[]> => {
  await delay(200);
  return componentOptions;
};

