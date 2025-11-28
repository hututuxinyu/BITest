import type {
  ComponentCategory,
  ComponentTag,
  ComponentSummary,
  ComponentDefinition,
  ComponentFilter,
} from '../types';

/**
 * 模拟组件分类
 */
export const mockCategories: ComponentCategory[] = [
  { categoryId: 'chart', categoryName: '基础图表', orderNo: 1, icon: 'BarChartOutlined' },
  { categoryId: 'chart-3d', categoryName: '三维图表', parentId: 'chart', orderNo: 2 },
  { categoryId: 'media', categoryName: '多媒体', orderNo: 3, icon: 'PictureOutlined' },
  { categoryId: 'container', categoryName: '容器组件', orderNo: 4, icon: 'AppstoreOutlined' },
  { categoryId: 'control', categoryName: '控制组件', orderNo: 5, icon: 'ControlOutlined' },
];

/**
 * 模拟标签
 */
export const mockTags: ComponentTag[] = [
  { tagId: 'trend', tagName: '趋势分析' },
  { tagId: 'compare', tagName: '对比' },
  { tagId: 'kpi', tagName: 'KPI' },
  { tagId: 'media', tagName: '多媒体' },
  { tagId: 'form', tagName: '表单' },
];

/**
 * 模拟组件列表
 */
export const mockComponents: ComponentSummary[] = [
  {
    componentId: 'chart-bar',
    componentName: '柱状图',
    alias: 'BarChart',
    version: '1.1.0',
    type: 'chart',
    icon: 'https://gw.alipayobjects.com/zos/antfincdn/efFDkTI4Pv/bar-chart.svg',
    previewUrl: 'https://gw.alipayobjects.com/zos/antfincdn/nJj5sEa5h9/bar-preview.png',
    description: '用于展示分类数据的对比，支持拖拽、堆叠、百分比等配置',
    categories: ['chart'],
    tags: ['trend', 'compare'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-10 10:00:00',
  },
  {
    componentId: 'chart-line',
    componentName: '折线图',
    alias: 'LineChart',
    version: '1.0.5',
    type: 'chart',
    icon: 'https://gw.alipayobjects.com/zos/antfincdn/XAEr9xx83R/line-chart.svg',
    previewUrl: 'https://gw.alipayobjects.com/zos/antfincdn/OyBNxT1P7Z/line-preview.png',
    description: '用于展示趋势变化，支持多序列、平滑曲线、面积填充',
    categories: ['chart'],
    tags: ['trend'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-05 09:30:00',
  },
  {
    componentId: 'chart-pie',
    componentName: '饼图',
    alias: 'PieChart',
    version: '1.0.2',
    type: 'chart',
    icon: 'https://gw.alipayobjects.com/zos/antfincdn/n%24BebtP6Nf/pie-chart.svg',
    previewUrl: 'https://gw.alipayobjects.com/zos/antfincdn/6x8XwQdG6N/pie-preview.png',
    description: '用于展示占比关系，支持环形、玫瑰图模式',
    categories: ['chart'],
    tags: ['kpi'],
    author: 'BI-Chart-Team',
    releaseTime: '2023-12-30 14:20:00',
  },
  {
    componentId: 'media-image',
    componentName: '图片',
    alias: 'ImageWidget',
    version: '1.0.0',
    type: 'media',
    icon: 'https://gw.alipayobjects.com/zos/antfincdn/M%24FKU2nplI/image.svg',
    previewUrl: 'https://gw.alipayobjects.com/zos/antfincdn/x4u7GqgWQK/image-preview.png',
    description: '支持上传和引用网络图片，包含裁剪、缩放、滤镜等能力',
    categories: ['media'],
    tags: ['media'],
    author: 'BI-Media-Team',
    releaseTime: '2023-12-12 08:00:00',
  },
  {
    componentId: 'container-tab',
    componentName: '标签容器',
    alias: 'TabContainer',
    version: '2.0.0',
    type: 'container',
    icon: 'https://gw.alipayobjects.com/zos/antfincdn/7p81Rw4cQe/tabs.svg',
    previewUrl: 'https://gw.alipayobjects.com/zos/antfincdn/y1mPGZ7HO7/tabs-preview.png',
    description: '支持多页签切换，适合承载多个子组件，支持动态新增页签',
    categories: ['container'],
    tags: ['layout'],
    author: 'BI-Layout-Team',
    releaseTime: '2024-01-15 15:10:00',
  },
];

/**
 * 模拟组件定义
 */
export const mockComponentDefinitions: Record<string, ComponentDefinition> = {
  'chart-bar': {
    componentId: 'chart-bar',
    version: '1.1.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '柱状图', description: '显示在图表顶部的标题' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
      {
        field: 'stack',
        label: '堆叠模式',
        type: 'enum',
        default: 'none',
        options: [
          { label: '无', value: 'none' },
          { label: '普通堆叠', value: 'normal' },
          { label: '百分比堆叠', value: 'percent' },
        ],
      },
    ],
    defaultProps: {
      title: '柱状图',
      showLegend: true,
      stack: 'none',
    },
    dataSchema: [
      { field: 'category', label: '分类', type: 'string', required: true },
      { field: 'value', label: '指标值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: false },
    ],
    defaultData: [
      { category: '一月', value: 120, series: '计划' },
      { category: '二月', value: 200, series: '计划' },
      { category: '三月', value: 150, series: '计划' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'category', type: 'string', description: '当前分类' },
          { name: 'value', type: 'number', description: '指标值' },
          { name: 'series', type: 'string', description: '系列名称' },
        ],
      },
      {
        event: 'legendChange',
        label: '图例切换',
        params: [{ name: 'checked', type: 'boolean' }],
      },
    ],
    defaultEvents: {
      click: null,
      legendChange: null,
    },
    supportFeatures: {
      drillDown: true,
      interaction: true,
      dataBinding: true,
    },
  },
  'chart-pie': {
    componentId: 'chart-pie',
    version: '1.0.2',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '饼图', description: '显示在图表顶部的标题' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
      {
        field: 'innerRadius',
        label: '内半径',
        type: 'number',
        default: 0,
        description: '设置为大于0即可展示环形效果，单位为百分比（0-70）',
      },
      {
        field: 'roseType',
        label: '玫瑰图模式',
        type: 'enum',
        default: 'none',
        options: [
          { label: '关闭', value: 'none' },
          { label: '面积模式', value: 'area' },
          { label: '半径模式', value: 'radius' },
        ],
      },
    ],
    defaultProps: {
      title: '饼图',
      showLegend: true,
      innerRadius: 0,
      roseType: 'none',
    },
    dataSchema: [
      { field: 'name', label: '名称', type: 'string', required: true },
      { field: 'value', label: '数值', type: 'number', required: true },
    ],
    defaultData: [
      { name: '分类 A', value: 35 },
      { name: '分类 B', value: 28 },
      { name: '分类 C', value: 22 },
      { name: '分类 D', value: 15 },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'name', type: 'string', description: '扇区名称' },
          { name: 'value', type: 'number', description: '扇区数值' },
          { name: 'percent', type: 'number', description: '占比' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'control-date-picker': {
    componentId: 'control-date-picker',
    version: '1.3.0',
    propsSchema: [
      { field: 'mode', label: '模式', type: 'enum', default: 'range', options: [{ label: '单日', value: 'single' }, { label: '范围', value: 'range' }] },
      { field: 'format', label: '格式', type: 'string', default: 'YYYY-MM-DD' },
    ],
    defaultProps: {
      mode: 'range',
      format: 'YYYY-MM-DD',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string[]', description: '日期或日期范围' }],
      },
    ],
    defaultEvents: {
      change: null,
    },
    supportFeatures: {
      control: {
        emits: ['change'],
        debounce: true,
      },
    },
  },
  'chart-line': {
    componentId: 'chart-line',
    version: '1.0.5',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '折线图', description: '显示在图表顶部的标题' },
      { field: 'smooth', label: '平滑曲线', type: 'boolean', default: false },
      { field: 'showArea', label: '面积填充', type: 'boolean', default: false },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
    ],
    defaultProps: {
      title: '折线图',
      smooth: false,
      showArea: false,
      showLegend: true,
    },
    dataSchema: [
      { field: 'category', label: '分类', type: 'string', required: true },
      { field: 'value', label: '指标值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: false },
    ],
    defaultData: [
      { category: '一月', value: 120, series: '计划' },
      { category: '二月', value: 132, series: '计划' },
      { category: '三月', value: 101, series: '计划' },
      { category: '四月', value: 134, series: '计划' },
      { category: '一月', value: 90, series: '实际' },
      { category: '二月', value: 110, series: '实际' },
      { category: '三月', value: 95, series: '实际' },
      { category: '四月', value: 120, series: '实际' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'category', type: 'string', description: '当前分类' },
          { name: 'value', type: 'number', description: '指标值' },
          { name: 'series', type: 'string', description: '系列名称' },
        ],
      },
      {
        event: 'legendChange',
        label: '图例切换',
        params: [{ name: 'checked', type: 'boolean' }],
      },
    ],
    defaultEvents: {
      click: null,
      legendChange: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-bar-chart': {
    componentId: 'custom-bar-chart',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '条形图', description: '显示在图表顶部的标题' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
      {
        field: 'stack',
        label: '堆叠模式',
        type: 'enum',
        default: 'none',
        options: [
          { label: '无', value: 'none' },
          { label: '普通堆叠', value: 'normal' },
          { label: '百分比堆叠', value: 'percent' },
        ],
      },
    ],
    defaultProps: {
      title: '条形图',
      showLegend: true,
      stack: 'none',
    },
    dataSchema: [
      { field: 'category', label: '分类', type: 'string', required: true },
      { field: 'value', label: '指标值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: false },
    ],
    defaultData: [
      { category: '分类A', value: 120, series: '系列1' },
      { category: '分类B', value: 200, series: '系列1' },
      { category: '分类C', value: 150, series: '系列1' },
      { category: '分类A', value: 80, series: '系列2' },
      { category: '分类B', value: 150, series: '系列2' },
      { category: '分类C', value: 100, series: '系列2' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'category', type: 'string', description: '当前分类' },
          { name: 'value', type: 'number', description: '指标值' },
          { name: 'series', type: 'string', description: '系列名称' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-area-chart': {
    componentId: 'custom-area-chart',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '面积图', description: '显示在图表顶部的标题' },
      { field: 'smooth', label: '平滑曲线', type: 'boolean', default: true },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
    ],
    defaultProps: {
      title: '面积图',
      smooth: true,
      showLegend: true,
    },
    dataSchema: [
      { field: 'category', label: '分类', type: 'string', required: true },
      { field: 'value', label: '指标值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: false },
    ],
    defaultData: [
      { category: '一月', value: 120, series: '系列1' },
      { category: '二月', value: 132, series: '系列1' },
      { category: '三月', value: 101, series: '系列1' },
      { category: '四月', value: 134, series: '系列1' },
      { category: '一月', value: 90, series: '系列2' },
      { category: '二月', value: 110, series: '系列2' },
      { category: '三月', value: 95, series: '系列2' },
      { category: '四月', value: 120, series: '系列2' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'category', type: 'string', description: '当前分类' },
          { name: 'value', type: 'number', description: '指标值' },
          { name: 'series', type: 'string', description: '系列名称' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-dashboard': {
    componentId: 'custom-dashboard',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '仪表盘', description: '显示在图表顶部的标题' },
      { field: 'min', label: '最小值', type: 'number', default: 0 },
      { field: 'max', label: '最大值', type: 'number', default: 100 },
    ],
    defaultProps: {
      title: '仪表盘',
      min: 0,
      max: 100,
    },
    dataSchema: [
      { field: 'value', label: '数值', type: 'number', required: true },
    ],
    defaultData: [
      { value: 75 },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'value', type: 'number', description: '当前数值' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-donut-chart': {
    componentId: 'custom-donut-chart',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '环形图', description: '显示在图表顶部的标题' },
      { field: 'innerRadius', label: '内半径', type: 'number', default: 50, description: '内半径百分比' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
    ],
    defaultProps: {
      title: '环形图',
      innerRadius: 50,
      showLegend: true,
    },
    dataSchema: [
      { field: 'name', label: '名称', type: 'string', required: true },
      { field: 'value', label: '数值', type: 'number', required: true },
    ],
    defaultData: [
      { name: '分类 A', value: 35 },
      { name: '分类 B', value: 28 },
      { name: '分类 C', value: 22 },
      { name: '分类 D', value: 15 },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'name', type: 'string', description: '扇区名称' },
          { name: 'value', type: 'number', description: '扇区数值' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-pictorial-chart': {
    componentId: 'custom-pictorial-chart',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '象形图', description: '显示在图表顶部的标题' },
      { field: 'symbol', label: '图形符号', type: 'string', default: 'rect', description: '图形类型' },
    ],
    defaultProps: {
      title: '象形图',
      symbol: 'rect',
    },
    dataSchema: [
      { field: 'name', label: '名称', type: 'string', required: true },
      { field: 'value', label: '数值', type: 'number', required: true },
    ],
    defaultData: [
      { name: '类别1', value: 100 },
      { name: '类别2', value: 80 },
      { name: '类别3', value: 60 },
      { name: '类别4', value: 40 },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'name', type: 'string', description: '类别名称' },
          { name: 'value', type: 'number', description: '数值' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-scatter-chart': {
    componentId: 'custom-scatter-chart',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '散点图', description: '显示在图表顶部的标题' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
    ],
    defaultProps: {
      title: '散点图',
      showLegend: true,
    },
    dataSchema: [
      { field: 'x', label: 'X轴值', type: 'number', required: true },
      { field: 'y', label: 'Y轴值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: false },
    ],
    defaultData: [
      { x: 10, y: 20, series: '系列1' },
      { x: 15, y: 30, series: '系列1' },
      { x: 20, y: 25, series: '系列1' },
      { x: 25, y: 40, series: '系列1' },
      { x: 30, y: 35, series: '系列1' },
      { x: 12, y: 15, series: '系列2' },
      { x: 18, y: 22, series: '系列2' },
      { x: 22, y: 28, series: '系列2' },
      { x: 28, y: 32, series: '系列2' },
      { x: 35, y: 38, series: '系列2' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'x', type: 'number', description: 'X轴值' },
          { name: 'y', type: 'number', description: 'Y轴值' },
          { name: 'series', type: 'string', description: '系列名称' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'custom-bar-line-chart': {
    componentId: 'custom-bar-line-chart',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '柱线图', description: '显示在图表顶部的标题' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
    ],
    defaultProps: {
      title: '柱线图',
      showLegend: true,
    },
    dataSchema: [
      { field: 'category', label: '分类', type: 'string', required: true },
      { field: 'value', label: '指标值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: true },
      { field: 'type', label: '类型', type: 'string', required: false, description: 'bar或line' },
    ],
    defaultData: [
      { category: '一月', value: 120, series: '柱状', type: 'bar' },
      { category: '二月', value: 200, series: '柱状', type: 'bar' },
      { category: '三月', value: 150, series: '柱状', type: 'bar' },
      { category: '一月', value: 90, series: '折线', type: 'line' },
      { category: '二月', value: 110, series: '折线', type: 'line' },
      { category: '三月', value: 95, series: '折线', type: 'line' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'category', type: 'string', description: '当前分类' },
          { name: 'value', type: 'number', description: '指标值' },
          { name: 'series', type: 'string', description: '系列名称' },
        ],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
};

/**
 * 模拟API延迟
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchComponentCategories(): Promise<ComponentCategory[]> {
  await delay(200);
  return mockCategories;
}

export async function fetchComponentTags(): Promise<ComponentTag[]> {
  await delay(200);
  return mockTags;
}

export async function fetchComponentList(filter: ComponentFilter): Promise<ComponentSummary[]> {
  await delay(300);
  let list = [...mockComponents];
  if (filter.categoryId) {
    list = list.filter((item) => item.categories.includes(filter.categoryId!));
  }
  if (filter.tags && filter.tags.length > 0) {
    list = list.filter((item) => filter.tags!.every((tag) => item.tags.includes(tag)));
  }
  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase();
    list = list.filter(
      (item) => item.componentName.toLowerCase().includes(keyword) || (item.description || '').toLowerCase().includes(keyword)
    );
  }
  if (filter.type) {
    list = list.filter((item) => item.type === filter.type);
  }
  return list;
}

export async function fetchComponentDefinition(componentId: string): Promise<ComponentDefinition | null> {
  await delay(200);
  return mockComponentDefinitions[componentId] || null;
}


