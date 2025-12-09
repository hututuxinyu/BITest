
/**
 * 模板 Schema 数据
 * 包含完整的报表 schema 定义，用于模板拖拽到画布时加载
 */
export interface TemplateSchema {
  version: string;
  reportId: string;
  reportName: string;
  reportType: string;
  metadata: {
    createTime: string;
    updateTime: string;
    creator: string;
    description: string;
  };
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
    grid: boolean;
    gridSize: number;
  };
  components: any[];
  datasources?: any[];
  interactions?: any[];
  i18n?: any;
  style?: any;
}

/**
 * Dashboard 销售数据大屏模板 Schema
 */
export const dashboardSalesTemplateSchema: TemplateSchema = {
  version: '1.0.0',
  reportId: 'dashboard-sales-001',
  reportName: '2024年度销售数据总览 Dashboard',
  reportType: 'dashboard',
  metadata: {
    createTime: '2024-06-30T10:00:00Z',
    updateTime: '2024-06-30T18:30:25Z',
    creator: 'admin',
    description: '企业销售数据可视化 Dashboard 大屏，面向企业销售决策层与运营团队',
  },
  canvas: {
    width: 1920,
    height: 1080,
    backgroundColor: '#0A1629',
    grid: false,
    gridSize: 10,
  },
  components: [
    {
      componentId: 'comp-header-title',
      componentType: 'text',
      componentName: '主标题',
      position: { x: 40, y: 20 },
      size: { width: 600, height: 40 },
      zIndex: 10,
      visible: true,
      locked: false,
      props: {
        text: '2024年度销售数据总览 Dashboard',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#165DFF',
        textAlign: 'left',
      },
      style: {
        backgroundColor: 'transparent',
      },
    },
    {
      componentId: 'comp-header-subtitle',
      componentType: 'text',
      componentName: '副标题',
      position: { x: 40, y: 70 },
      size: { width: 400, height: 20 },
      zIndex: 10,
      visible: true,
      locked: false,
      props: {
        text: '实时更新・区域全覆盖・多维度分析',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#666666',
        textAlign: 'left',
      },
      style: {
        backgroundColor: 'transparent',
      },
    },
    {
      componentId: 'comp-filter-time',
      componentType: 'select',
      componentName: '时间筛选器',
      position: { x: 1200, y: 30 },
      size: { width: 150, height: 32 },
      zIndex: 10,
      visible: true,
      locked: false,
      props: {
        label: '时间',
        options: [
          { label: '本月', value: 'month' },
          { label: '本季度', value: 'quarter' },
          { label: '上半年', value: 'halfYear' },
          { label: '全年', value: 'year' },
        ],
        defaultValue: 'halfYear',
        placeholder: '请选择时间',
      },
      style: {
        backgroundColor: '#F5F7FA',
      },
    },
    {
      componentId: 'comp-filter-region',
      componentType: 'checkbox',
      componentName: '区域筛选器',
      position: { x: 1380, y: 30 },
      size: { width: 300, height: 32 },
      zIndex: 10,
      visible: true,
      locked: false,
      props: {
        label: '区域',
        options: [
          { label: '华东', value: 'east' },
          { label: '华北', value: 'north' },
          { label: '华南', value: 'south' },
          { label: '西南', value: 'southwest' },
          { label: '西北', value: 'northwest' },
          { label: '东北', value: 'northeast' },
        ],
        defaultValue: ['east', 'north', 'south', 'southwest', 'northwest', 'northeast'],
      },
      style: {
        backgroundColor: '#F5F7FA',
      },
    },
    {
      componentId: 'comp-filter-product',
      componentType: 'select',
      componentName: '产品筛选器',
      position: { x: 1700, y: 30 },
      size: { width: 150, height: 32 },
      zIndex: 10,
      visible: true,
      locked: false,
      props: {
        label: '产品',
        options: [
          { label: '全品类', value: 'all' },
          { label: '手机', value: 'phone' },
          { label: '智能手表', value: 'watch' },
          { label: '无线耳机', value: 'earphone' },
          { label: '平板电脑', value: 'tablet' },
        ],
        defaultValue: 'all',
        placeholder: '请选择产品',
      },
      style: {
        backgroundColor: '#F5F7FA',
      },
    },
    {
      componentId: 'comp-update-time',
      componentType: 'text',
      componentName: '更新时间',
      position: { x: 1700, y: 80 },
      size: { width: 200, height: 20 },
      zIndex: 10,
      visible: true,
      locked: false,
      props: {
        text: '最后更新：2024-06-30 18:30:25',
        fontSize: 12,
        fontWeight: 'normal',
        color: '#999999',
        textAlign: 'right',
      },
      style: {
        backgroundColor: 'transparent',
      },
    },
    {
      componentId: 'comp-border-top',
      componentType: 'border',
      componentName: '顶部边框',
      position: { x: 0, y: 0 },
      size: { width: 1920, height: 120 },
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        color: '#165DFF',
        width: 2,
        style: 'solid',
        radius: 0,
      },
    },
    {
      componentId: 'comp-line-1',
      componentType: 'line',
      componentName: '分隔线1',
      position: { x: 0, y: 120 },
      size: { width: 1920, height: 1 },
      zIndex: 2,
      visible: true,
      locked: false,
      props: {
        direction: 'horizontal',
        color: '#165DFF',
        width: 1,
        style: 'solid',
      },
    },
    {
      componentId: 'comp-left-border',
      componentType: 'border',
      componentName: '左侧区域边框',
      position: { x: 20, y: 140 },
      size: { width: 800, height: 700 },
      zIndex: 3,
      visible: true,
      locked: false,
      props: {
        color: '#165DFF',
        width: 2,
        style: 'solid',
        radius: 8,
      },
    },
    {
      componentId: 'comp-line-chart',
      componentType: 'lineChart',
      componentName: '销售趋势折线图',
      position: { x: 40, y: 160 },
      size: { width: 760, height: 350 },
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        title: '销售趋势（日维度）',
        xAxisField: 'date',
        yAxisField: 'amount',
        smooth: true,
        showArea: true,
        showLegend: true,
        showTooltip: true,
      },
      data: {
        bindingType: 'static',
        staticConfig: {
          data: [
            { category: '2024-01-01', value: 12.5, series: '实际销售额' },
            { category: '2024-01-08', value: 15.2, series: '实际销售额' },
            { category: '2024-01-15', value: 18.8, series: '实际销售额' },
            { category: '2024-01-22', value: 22.3, series: '实际销售额' },
            { category: '2024-01-29', value: 20.1, series: '实际销售额' },
            { category: '2024-02-05', value: 25.6, series: '实际销售额' },
            { category: '2024-02-12', value: 28.9, series: '实际销售额' },
            { category: '2024-02-19', value: 24.3, series: '实际销售额' },
            { category: '2024-02-26', value: 30.2, series: '实际销售额' },
            { category: '2024-03-05', value: 27.8, series: '实际销售额' },
            { category: '2024-03-12', value: 32.5, series: '实际销售额' },
            { category: '2024-03-19', value: 29.1, series: '实际销售额' },
            { category: '2024-03-26', value: 35.6, series: '实际销售额' },
            { category: '2024-04-02', value: 33.2, series: '实际销售额' },
            { category: '2024-04-09', value: 38.9, series: '实际销售额' },
            { category: '2024-04-16', value: 36.5, series: '实际销售额' },
            { category: '2024-04-23', value: 41.2, series: '实际销售额' },
            { category: '2024-04-30', value: 39.8, series: '实际销售额' },
            { category: '2024-05-07', value: 44.5, series: '实际销售额' },
            { category: '2024-05-14', value: 42.1, series: '实际销售额' },
            { category: '2024-05-21', value: 47.8, series: '实际销售额' },
            { category: '2024-05-28', value: 45.3, series: '实际销售额' },
            { category: '2024-06-04', value: 50.2, series: '实际销售额' },
            { category: '2024-06-11', value: 48.6, series: '实际销售额' },
            { category: '2024-06-18', value: 52.9, series: '实际销售额' },
            { category: '2024-06-25', value: 51.3, series: '实际销售额' },
          ],
        },
      },
      staticData: [
        { category: '2024-01-01', value: 12.5, series: '实际销售额' },
        { category: '2024-01-08', value: 15.2, series: '实际销售额' },
        { category: '2024-01-15', value: 18.8, series: '实际销售额' },
        { category: '2024-01-22', value: 22.3, series: '实际销售额' },
        { category: '2024-01-29', value: 20.1, series: '实际销售额' },
        { category: '2024-02-05', value: 25.6, series: '实际销售额' },
        { category: '2024-02-12', value: 28.9, series: '实际销售额' },
        { category: '2024-02-19', value: 24.3, series: '实际销售额' },
        { category: '2024-02-26', value: 30.2, series: '实际销售额' },
        { category: '2024-03-05', value: 27.8, series: '实际销售额' },
        { category: '2024-03-12', value: 32.5, series: '实际销售额' },
        { category: '2024-03-19', value: 29.1, series: '实际销售额' },
        { category: '2024-03-26', value: 35.6, series: '实际销售额' },
        { category: '2024-04-02', value: 33.2, series: '实际销售额' },
        { category: '2024-04-09', value: 38.9, series: '实际销售额' },
        { category: '2024-04-16', value: 36.5, series: '实际销售额' },
        { category: '2024-04-23', value: 41.2, series: '实际销售额' },
        { category: '2024-04-30', value: 39.8, series: '实际销售额' },
        { category: '2024-05-07', value: 44.5, series: '实际销售额' },
        { category: '2024-05-14', value: 42.1, series: '实际销售额' },
        { category: '2024-05-21', value: 47.8, series: '实际销售额' },
        { category: '2024-05-28', value: 45.3, series: '实际销售额' },
        { category: '2024-06-04', value: 50.2, series: '实际销售额' },
        { category: '2024-06-11', value: 48.6, series: '实际销售额' },
        { category: '2024-06-18', value: 52.9, series: '实际销售额' },
        { category: '2024-06-25', value: 51.3, series: '实际销售额' },
      ],
      style: {
        backgroundColor: '#1A2332',
      },
    },
    {
      componentId: 'comp-line-2',
      componentType: 'line',
      componentName: '分隔线2',
      position: { x: 40, y: 530 },
      size: { width: 760, height: 1 },
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        direction: 'horizontal',
        color: '#165DFF',
        width: 1,
        style: 'dashed',
      },
    },
    {
      componentId: 'comp-bar-chart',
      componentType: 'barChart',
      componentName: '月度销售额柱状图',
      position: { x: 40, y: 550 },
      size: { width: 760, height: 350 },
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        title: '月度销售额对比',
        xAxisField: 'month',
        yAxisField: 'amount',
        showLegend: true,
        showTooltip: true,
        stack: 'none',
      },
      data: {
        bindingType: 'static',
        staticConfig: {
          data: [
            { category: '1月', value: 178.5, series: '2024年销售额' },
            { category: '2月', value: 210.5, series: '2024年销售额' },
            { category: '3月', value: 195.2, series: '2024年销售额' },
            { category: '4月', value: 225.8, series: '2024年销售额' },
            { category: '5月', value: 240.3, series: '2024年销售额' },
            { category: '6月', value: 242.7, series: '2024年销售额' },
            { category: '1月', value: 150.2, series: '2023年销售额' },
            { category: '2月', value: 178.1, series: '2023年销售额' },
            { category: '3月', value: 165.3, series: '2023年销售额' },
            { category: '4月', value: 190.5, series: '2023年销售额' },
            { category: '5月', value: 203.2, series: '2023年销售额' },
            { category: '6月', value: 205.4, series: '2023年销售额' },
          ],
        },
      },
      staticData: [
        { category: '1月', value: 178.5, series: '2024年销售额' },
        { category: '2月', value: 210.5, series: '2024年销售额' },
        { category: '3月', value: 195.2, series: '2024年销售额' },
        { category: '4月', value: 225.8, series: '2024年销售额' },
        { category: '5月', value: 240.3, series: '2024年销售额' },
        { category: '6月', value: 242.7, series: '2024年销售额' },
        { category: '1月', value: 150.2, series: '2023年销售额' },
        { category: '2月', value: 178.1, series: '2023年销售额' },
        { category: '3月', value: 165.3, series: '2023年销售额' },
        { category: '4月', value: 190.5, series: '2023年销售额' },
        { category: '5月', value: 203.2, series: '2023年销售额' },
        { category: '6月', value: 205.4, series: '2023年销售额' },
      ],
      style: {
        backgroundColor: '#1A2332',
      },
    },
    {
      componentId: 'comp-pie-chart',
      componentType: 'pieChart',
      componentName: '区域销售分布饼图',
      position: { x: 880, y: 550 },
      size: { width: 370, height: 310 },
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        title: '区域销售占比',
        innerRadius: 40,
        showLegend: true,
        showTooltip: true,
      },
      data: {
        bindingType: 'static',
        staticConfig: {
          data: [
            { name: '华东', value: 35.0 },
            { name: '华北', value: 25.0 },
            { name: '华南', value: 20.0 },
            { name: '西南', value: 10.0 },
            { name: '西北', value: 5.0 },
            { name: '东北', value: 5.0 },
          ],
        },
      },
      staticData: [
        { name: '华东', value: 35.0 },
        { name: '华北', value: 25.0 },
        { name: '华南', value: 20.0 },
        { name: '西南', value: 10.0 },
        { name: '西北', value: 5.0 },
        { name: '东北', value: 5.0 },
      ],
      style: {
        backgroundColor: '#1A2332',
      },
    },
    {
      componentId: 'comp-table',
      componentType: 'table',
      componentName: '销售明细表格',
      position: { x: 1280, y: 550 },
      size: { width: 680, height: 310 },
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        title: 'TOP10 销售明细',
        columns: [
          { field: 'date', title: '日期', width: 100 },
          { field: 'product', title: '产品', width: 120 },
          { field: 'region', title: '区域', width: 100 },
          { field: 'amount', title: '销售额', width: 120, format: 'number' },
          { field: 'salesperson', title: '销售人员', width: 120 },
          { field: 'completionRate', title: '完成率', width: 90, format: 'percent' },
        ],
        pagination: {
          pageSize: 10,
          showSizeChanger: false,
        },
      },
      data: {
        bindingType: 'static',
        staticConfig: {
          data: [
            { key: '1', date: '2024-06-28', product: '手机', region: '华东', amount: 52.8, salesperson: '张三', completionRate: 95.2 },
            { key: '2', date: '2024-06-27', product: '智能手表', region: '华北', amount: 48.5, salesperson: '李四', completionRate: 88.6 },
            { key: '3', date: '2024-06-26', product: '无线耳机', region: '华南', amount: 45.2, salesperson: '王五', completionRate: 92.3 },
            { key: '4', date: '2024-06-25', product: '手机', region: '华东', amount: 51.3, salesperson: '赵六', completionRate: 89.7 },
            { key: '5', date: '2024-06-24', product: '平板电脑', region: '西南', amount: 42.1, salesperson: '孙七', completionRate: 85.4 },
            { key: '6', date: '2024-06-23', product: '智能手表', region: '华北', amount: 46.8, salesperson: '周八', completionRate: 91.2 },
            { key: '7', date: '2024-06-22', product: '手机', region: '华南', amount: 49.5, salesperson: '吴九', completionRate: 87.8 },
            { key: '8', date: '2024-06-21', product: '无线耳机', region: '华东', amount: 44.2, salesperson: '郑十', completionRate: 93.5 },
            { key: '9', date: '2024-06-20', product: '平板电脑', region: '西北', amount: 38.9, salesperson: '钱一', completionRate: 82.1 },
            { key: '10', date: '2024-06-19', product: '智能手表', region: '东北', amount: 41.6, salesperson: '孙二', completionRate: 90.3 },
          ],
        },
      },
      staticData: [
        { key: '1', date: '2024-06-28', product: '手机', region: '华东', amount: 52.8, salesperson: '张三', completionRate: 95.2 },
        { key: '2', date: '2024-06-27', product: '智能手表', region: '华北', amount: 48.5, salesperson: '李四', completionRate: 88.6 },
        { key: '3', date: '2024-06-26', product: '无线耳机', region: '华南', amount: 45.2, salesperson: '王五', completionRate: 92.3 },
        { key: '4', date: '2024-06-25', product: '手机', region: '华东', amount: 51.3, salesperson: '赵六', completionRate: 89.7 },
        { key: '5', date: '2024-06-24', product: '平板电脑', region: '西南', amount: 42.1, salesperson: '孙七', completionRate: 85.4 },
        { key: '6', date: '2024-06-23', product: '智能手表', region: '华北', amount: 46.8, salesperson: '周八', completionRate: 91.2 },
        { key: '7', date: '2024-06-22', product: '手机', region: '华南', amount: 49.5, salesperson: '吴九', completionRate: 87.8 },
        { key: '8', date: '2024-06-21', product: '无线耳机', region: '华东', amount: 44.2, salesperson: '郑十', completionRate: 93.5 },
        { key: '9', date: '2024-06-20', product: '平板电脑', region: '西北', amount: 38.9, salesperson: '钱一', completionRate: 82.1 },
        { key: '10', date: '2024-06-19', product: '智能手表', region: '东北', amount: 41.6, salesperson: '孙二', completionRate: 90.3 },
      ],
      style: {
        backgroundColor: '#1A2332',
      },
    },
  ],
  datasources: [],
  interactions: [],
  i18n: {
    'zh-CN': {
      reportName: '2024年度销售数据总览 Dashboard',
      description: '企业销售数据可视化 Dashboard 大屏',
    },
    'en-US': {
      reportName: '2024 Annual Sales Data Overview Dashboard',
      description: 'Enterprise Sales Data Visualization Dashboard',
    },
  },
  style: {
    reportBackground: {
      type: 'color',
      value: '#0A1629',
    },
    theme: {
      themeId: 'theme-dashboard-dark',
      themeName: '大屏深色主题',
    },
  },
};

/**
 * 模板 Schema 映射表
 * key: templateId, value: TemplateSchema
 */
export const templateSchemaMap: Record<string, TemplateSchema> = {
  'tpl-dashboard-sales': dashboardSalesTemplateSchema,
};

/**
 * 根据 templateId 获取模板 Schema
 */
export const getTemplateSchema = (templateId: string): TemplateSchema | null => {
  return templateSchemaMap[templateId] || null;
};

