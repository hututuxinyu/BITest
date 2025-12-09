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
  { categoryId: 'form', categoryName: '表单组件', orderNo: 2, icon: 'ControlOutlined' },
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
    componentId: 'layout-top-bottom',
    componentName: '上下布局',
    alias: 'TopBottomLayout',
    version: '1.0.0',
    type: 'layout',
    icon: '',
    previewUrl: '',
    description: '上下分区布局，支持比例和分割线配置',
    categories: ['layout'],
    tags: ['layout'],
    author: 'BI-Layout-Team',
    releaseTime: '2024-01-20 10:00:00',
  },
  {
    componentId: 'layout-left-right',
    componentName: '左右布局',
    alias: 'LeftRightLayout',
    version: '1.0.0',
    type: 'layout',
    icon: '',
    previewUrl: '',
    description: '左右分栏布局，支持比例和分割线配置',
    categories: ['layout'],
    tags: ['layout'],
    author: 'BI-Layout-Team',
    releaseTime: '2024-01-20 10:05:00',
  },
  {
    componentId: 'layout-header-content-footer',
    componentName: '上中下布局',
    alias: 'HeaderContentFooter',
    version: '1.0.0',
    type: 'layout',
    icon: '',
    previewUrl: '',
    description: '典型的页眉-内容-页脚布局，支持粘性头尾',
    categories: ['layout'],
    tags: ['layout'],
    author: 'BI-Layout-Team',
    releaseTime: '2024-01-20 10:10:00',
  },
  {
    componentId: 'layout-grid',
    componentName: '表格布局',
    alias: 'GridLayout',
    version: '1.0.0',
    type: 'layout',
    icon: '',
    previewUrl: '',
    description: '多行多列网格布局，可自定义行高列宽与间距',
    categories: ['layout'],
    tags: ['layout'],
    author: 'BI-Layout-Team',
    releaseTime: '2024-01-20 10:15:00',
  },
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
    componentId: 'custom-bar-chart',
    componentName: '条形图',
    alias: 'BarChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示分类数据的条形对比图',
    categories: ['chart'],
    tags: ['trend', 'compare'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'custom-area-chart',
    componentName: '面积图',
    alias: 'AreaChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示累积趋势的面积图',
    categories: ['chart'],
    tags: ['trend'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'custom-dashboard',
    componentName: '仪表盘',
    alias: 'Dashboard',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示关键指标的仪表盘图',
    categories: ['chart'],
    tags: ['kpi'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'custom-donut-chart',
    componentName: '环形图',
    alias: 'DonutChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示占比结构的环形图',
    categories: ['chart'],
    tags: ['kpi'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'custom-pictorial-chart',
    componentName: '象形图',
    alias: 'PictorialChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '支持自定义图形的带状图示',
    categories: ['chart'],
    tags: ['compare'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'custom-scatter-chart',
    componentName: '散点图',
    alias: 'ScatterChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示变量关系的散点图',
    categories: ['chart'],
    tags: ['trend'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'custom-bar-line-chart',
    componentName: '柱线图',
    alias: 'BarLineChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '柱状与折线组合的复合图',
    categories: ['chart'],
    tags: ['trend', 'compare'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'chart-radar',
    componentName: '雷达图',
    alias: 'RadarChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '用于展示多维度数据的对比分析',
    categories: ['chart'],
    tags: ['compare', 'kpi'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'chart-table',
    componentName: '表格',
    alias: 'Table',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '用于展示结构化数据，支持排序、筛选、分页等功能',
    categories: ['chart'],
    tags: ['compare'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'chart-tree-table',
    componentName: '树形表格',
    alias: 'TreeTable',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '用于展示具有层级关系的数据，支持展开和折叠',
    categories: ['chart'],
    tags: ['compare'],
    author: 'BI-Chart-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-form',
    componentName: '表单',
    alias: 'Form',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于创建表单容器，可以包含多个表单控件',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-text',
    componentName: '文本框',
    alias: 'Text',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于显示和编辑多行文本内容',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-select',
    componentName: '下拉框',
    alias: 'Select',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于从多个选项中选择一个值',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-checkbox',
    componentName: '多选框',
    alias: 'Checkbox',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于多选操作，支持选择多个选项',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-date-range',
    componentName: '日期段选择',
    alias: 'DateRange',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于选择日期范围，支持开始日期和结束日期',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-radio',
    componentName: '单选框',
    alias: 'Radio',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于单选操作，只能选择一个选项',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'form-switch',
    componentName: '开关切换',
    alias: 'Switch',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于开关状态的切换，支持开/关两种状态',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'control-filter',
    componentName: '过滤器',
    alias: 'Filter',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于数据筛选，支持多条件组合过滤',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'control-button',
    componentName: '按钮',
    alias: 'Button',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于触发操作，支持点击事件',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'control-input',
    componentName: '输入框',
    alias: 'Input',
    version: '1.0.0',
    type: 'control',
    icon: '',
    previewUrl: '',
    description: '用于输入单行文本内容',
    categories: ['form'],
    tags: ['form'],
    author: 'BI-Form-Team',
    releaseTime: '2024-01-01 00:00:00',
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
    componentId: 'media-text',
    componentName: '文本',
    alias: 'Text',
    version: '1.0.0',
    type: 'media',
    icon: '',
    previewUrl: '',
    description: '用于显示文本内容，支持自定义字体、颜色、对齐方式等',
    categories: ['media'],
    tags: ['media'],
    author: 'BI-Media-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'media-line',
    componentName: '线条',
    alias: 'Line',
    version: '1.0.0',
    type: 'media',
    icon: '',
    previewUrl: '',
    description: '用于绘制各种样式的线条，支持水平、垂直、斜线等',
    categories: ['media'],
    tags: ['media'],
    author: 'BI-Media-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'media-border',
    componentName: '边框',
    alias: 'Border',
    version: '1.0.0',
    type: 'media',
    icon: '',
    previewUrl: '',
    description: '用于添加装饰性边框，支持多种样式和颜色',
    categories: ['media'],
    tags: ['media'],
    author: 'BI-Media-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
  {
    componentId: 'media-video',
    componentName: '视频',
    alias: 'Video',
    version: '1.0.0',
    type: 'media',
    icon: '',
    previewUrl: '',
    description: '支持播放视频文件，支持多种视频格式',
    categories: ['media'],
    tags: ['media'],
    author: 'BI-Media-Team',
    releaseTime: '2024-01-01 00:00:00',
  },
];

/**
 * 模拟组件定义
 */
export const mockComponentDefinitions: Record<string, ComponentDefinition> = {
  'layout-top-bottom': {
    componentId: 'layout-top-bottom',
    version: '1.0.0',
    propsSchema: [
      { field: 'gap', label: '间距', type: 'number', default: 8, description: '上下区域之间的空隙' },
      { field: 'topRatio', label: '上区域比例', type: 'number', default: 6, description: 'flex 比例，影响高度分配' },
      { field: 'bottomRatio', label: '下区域比例', type: 'number', default: 4, description: 'flex 比例，影响高度分配' },
      { field: 'splitLine', label: '分割线', type: 'boolean', default: true, description: '是否显示上下分割线' },
      { field: 'background', label: '背景色', type: 'string', default: '#ffffff' },
    ],
    defaultProps: {
      gap: 8,
      topRatio: 6,
      bottomRatio: 4,
      splitLine: true,
      background: '#ffffff',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      slots: ['top', 'bottom'],
      dragDrop: { accept: 'any' },
    },
  },
  'layout-left-right': {
    componentId: 'layout-left-right',
    version: '1.0.0',
    propsSchema: [
      { field: 'gap', label: '间距', type: 'number', default: 12, description: '左右区域之间的空隙' },
      { field: 'leftRatio', label: '左区域比例', type: 'number', default: 4, description: 'flex 比例，影响宽度分配' },
      { field: 'rightRatio', label: '右区域比例', type: 'number', default: 6, description: 'flex 比例，影响宽度分配' },
      { field: 'splitLine', label: '分割线', type: 'boolean', default: true, description: '是否显示左右分割线' },
      { field: 'background', label: '背景色', type: 'string', default: '#ffffff' },
    ],
    defaultProps: {
      gap: 12,
      leftRatio: 4,
      rightRatio: 6,
      splitLine: true,
      background: '#ffffff',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      slots: ['left', 'right'],
      dragDrop: { accept: 'any' },
    },
  },
  'layout-header-content-footer': {
    componentId: 'layout-header-content-footer',
    version: '1.0.0',
    propsSchema: [
      { field: 'gap', label: '间距', type: 'number', default: 8, description: '各区域之间的空隙' },
      { field: 'headerRatio', label: '头部比例', type: 'number', default: 2 },
      { field: 'contentRatio', label: '内容比例', type: 'number', default: 6 },
      { field: 'footerRatio', label: '底部比例', type: 'number', default: 2 },
      { field: 'stickyHeader', label: '头部吸顶', type: 'boolean', default: false },
      { field: 'stickyFooter', label: '底部吸底', type: 'boolean', default: false },
      { field: 'background', label: '背景色', type: 'string', default: '#ffffff' },
    ],
    defaultProps: {
      gap: 8,
      headerRatio: 2,
      contentRatio: 6,
      footerRatio: 2,
      stickyHeader: false,
      stickyFooter: false,
      background: '#ffffff',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      slots: ['header', 'content', 'footer'],
      dragDrop: { accept: 'any' },
    },
  },
  'layout-grid': {
    componentId: 'layout-grid',
    version: '1.0.0',
    propsSchema: [
      { field: 'rows', label: '行数', type: 'number', default: 2, description: '网格行数' },
      { field: 'cols', label: '列数', type: 'number', default: 2, description: '网格列数' },
      { field: 'gutter', label: '栅格间距', type: 'number', default: 8, description: '单元格间距' },
      { field: 'rowHeights', label: '行高数组', type: 'array', default: [], description: '自定义每行高度，px 或比例' },
      { field: 'colWidths', label: '列宽数组', type: 'array', default: [], description: '自定义每列宽度，px 或比例' },
      { field: 'autoFill', label: '自动填充剩余', type: 'boolean', default: true },
      { field: 'background', label: '背景色', type: 'string', default: '#ffffff' },
    ],
    defaultProps: {
      rows: 2,
      cols: 2,
      gutter: 8,
      rowHeights: [],
      colWidths: [],
      autoFill: true,
      background: '#ffffff',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      slots: ['cell-0-0', 'cell-0-1', 'cell-1-0', 'cell-1-1'],
      dragDrop: { accept: 'any' },
    },
  },
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
  'chart-radar': {
    componentId: 'chart-radar',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '雷达图', description: '显示在图表顶部的标题' },
      { field: 'showLegend', label: '显示图例', type: 'boolean', default: true },
    ],
    defaultProps: {
      title: '雷达图',
      showLegend: true,
    },
    dataSchema: [
      { field: 'name', label: '维度名称', type: 'string', required: true },
      { field: 'value', label: '数值', type: 'number', required: true },
      { field: 'series', label: '系列', type: 'string', required: false },
    ],
    defaultData: [
      { name: '维度1', value: 80, series: '系列1' },
      { name: '维度2', value: 60, series: '系列1' },
      { name: '维度3', value: 70, series: '系列1' },
      { name: '维度4', value: 90, series: '系列1' },
      { name: '维度5', value: 50, series: '系列1' },
    ],
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [
          { name: 'name', type: 'string', description: '维度名称' },
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
  'chart-table': {
    componentId: 'chart-table',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '表格', description: '显示在表格顶部的标题' },
      { field: 'pagination', label: '分页', type: 'boolean', default: true },
      { field: 'pageSize', label: '每页条数', type: 'number', default: 10 },
    ],
    defaultProps: {
      title: '表格',
      pagination: true,
      pageSize: 10,
    },
    dataSchema: [
      { field: 'key', label: '键', type: 'string', required: true },
      { field: 'name', label: '名称', type: 'string', required: true },
      { field: 'value', label: '数值', type: 'number', required: false },
    ],
    defaultData: [
      { key: '1', name: '行1', value: 100 },
      { key: '2', name: '行2', value: 200 },
      { key: '3', name: '行3', value: 150 },
    ],
    eventSchema: [
      {
        event: 'rowClick',
        label: '行点击',
        params: [{ name: 'row', type: 'object', description: '行数据' }],
      },
    ],
    defaultEvents: {
      rowClick: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'chart-tree-table': {
    componentId: 'chart-tree-table',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '标题', type: 'string', default: '树形表格', description: '显示在表格顶部的标题' },
      { field: 'defaultExpandAll', label: '默认展开全部', type: 'boolean', default: false },
    ],
    defaultProps: {
      title: '树形表格',
      defaultExpandAll: false,
    },
    dataSchema: [
      { field: 'key', label: '键', type: 'string', required: true },
      { field: 'name', label: '名称', type: 'string', required: true },
      { field: 'children', label: '子节点', type: 'array', required: false },
    ],
    defaultData: [
      { key: '1', name: '节点1', children: [{ key: '1-1', name: '子节点1-1' }] },
      { key: '2', name: '节点2' },
    ],
    eventSchema: [
      {
        event: 'rowClick',
        label: '行点击',
        params: [{ name: 'row', type: 'object', description: '行数据' }],
      },
    ],
    defaultEvents: {
      rowClick: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: true,
    },
  },
  'form-form': {
    componentId: 'form-form',
    version: '1.0.0',
    propsSchema: [
      { field: 'title', label: '表单标题', type: 'string', default: '表单', description: '表单的标题' },
      { field: 'layout', label: '布局方式', type: 'enum', default: 'vertical', options: [
        { label: '垂直', value: 'vertical' },
        { label: '水平', value: 'horizontal' },
        { label: '内联', value: 'inline' },
      ]},
      { field: 'labelCol', label: '标签宽度', type: 'number', default: 100, description: '标签列的宽度（像素）' },
    ],
    defaultProps: {
      title: '表单',
      layout: 'vertical',
      labelCol: 100,
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'submit',
        label: '提交',
        params: [{ name: 'values', type: 'object', description: '表单值' }],
      },
      {
        event: 'reset',
        label: '重置',
        params: [],
      },
    ],
    defaultEvents: {
      submit: null,
      reset: null,
    },
    supportFeatures: {
      control: {
        emits: ['submit', 'reset'],
        debounce: false,
      },
    },
  },
  'form-text': {
    componentId: 'form-text',
    version: '1.0.0',
    propsSchema: [
      { field: 'placeholder', label: '占位符', type: 'string', default: '请输入文本内容' },
      { field: 'rows', label: '行数', type: 'number', default: 4 },
      { field: 'value', label: '默认值', type: 'string', default: '' },
    ],
    defaultProps: {
      placeholder: '请输入文本内容',
      rows: 4,
      value: '',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string', description: '文本内容' }],
      },
    ],
    defaultEvents: {
      change: null,
    },
    supportFeatures: {
      control: {
        emits: ['change'],
        debounce: false,
      },
    },
  },
  'form-select': {
    componentId: 'form-select',
    version: '1.0.0',
    propsSchema: [
      { field: 'placeholder', label: '占位符', type: 'string', default: '请选择' },
      { field: 'options', label: '选项', type: 'array', default: [] },
      { field: 'value', label: '默认值', type: 'string', default: '' },
    ],
    defaultProps: {
      placeholder: '请选择',
      options: [
        { label: '选项1', value: 'option1' },
        { label: '选项2', value: 'option2' },
        { label: '选项3', value: 'option3' },
      ],
      value: '',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string', description: '选中的值' }],
      },
    ],
    defaultEvents: {
      change: null,
    },
    supportFeatures: {
      control: {
        emits: ['change'],
        debounce: false,
      },
    },
  },
  'form-checkbox': {
    componentId: 'form-checkbox',
    version: '1.0.0',
    propsSchema: [
      { field: 'options', label: '选项', type: 'array', default: [] },
      { field: 'value', label: '默认值', type: 'array', default: [] },
    ],
    defaultProps: {
      options: [
        { label: '选项1', value: 'option1' },
        { label: '选项2', value: 'option2' },
        { label: '选项3', value: 'option3' },
      ],
      value: [],
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'array', description: '选中的值数组' }],
      },
    ],
    defaultEvents: {
      change: null,
    },
    supportFeatures: {
      control: {
        emits: ['change'],
        debounce: false,
      },
    },
  },
  'form-date-range': {
    componentId: 'form-date-range',
    version: '1.0.0',
    propsSchema: [
      { field: 'format', label: '日期格式', type: 'string', default: 'YYYY-MM-DD', description: '日期显示格式' },
      { field: 'placeholder', label: '占位符', type: 'array', default: ['开始日期', '结束日期'] },
    ],
    defaultProps: {
      format: 'YYYY-MM-DD',
      placeholder: ['开始日期', '结束日期'],
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string[]', description: '日期范围' }],
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
  'form-radio': {
    componentId: 'form-radio',
    version: '1.0.0',
    propsSchema: [
      { field: 'options', label: '选项', type: 'array', default: [] },
      { field: 'value', label: '默认值', type: 'string', default: '' },
    ],
    defaultProps: {
      options: [
        { label: '选项1', value: 'option1' },
        { label: '选项2', value: 'option2' },
        { label: '选项3', value: 'option3' },
      ],
      value: '',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string', description: '选中的值' }],
      },
    ],
    defaultEvents: {
      change: null,
    },
    supportFeatures: {
      control: {
        emits: ['change'],
        debounce: false,
      },
    },
  },
  'form-switch': {
    componentId: 'form-switch',
    version: '1.0.0',
    propsSchema: [
      { field: 'checked', label: '默认状态', type: 'boolean', default: false },
      { field: 'checkedText', label: '开启文本', type: 'string', default: '' },
      { field: 'unCheckedText', label: '关闭文本', type: 'string', default: '' },
    ],
    defaultProps: {
      checked: false,
      checkedText: '',
      unCheckedText: '',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'checked', type: 'boolean', description: '开关状态' }],
      },
    ],
    defaultEvents: {
      change: null,
    },
    supportFeatures: {
      control: {
        emits: ['change'],
        debounce: false,
      },
    },
  },
  'control-filter': {
    componentId: 'control-filter',
    version: '1.0.0',
    propsSchema: [
      { field: 'placeholder', label: '占位符', type: 'string', default: '请输入筛选条件' },
      { field: 'value', label: '默认值', type: 'string', default: '' },
    ],
    defaultProps: {
      placeholder: '请输入筛选条件',
      value: '',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string', description: '筛选值' }],
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
  'control-button': {
    componentId: 'control-button',
    version: '1.0.0',
    propsSchema: [
      { field: 'text', label: '按钮文本', type: 'string', default: '按钮' },
      {
        field: 'type',
        label: '按钮类型',
        type: 'enum',
        default: 'default',
        options: [
          { label: '默认', value: 'default' },
          { label: '主要', value: 'primary' },
          { label: '虚线', value: 'dashed' },
          { label: '危险', value: 'danger' },
        ],
      },
    ],
    defaultProps: {
      text: '按钮',
      type: 'default',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      control: {
        emits: ['click'],
        debounce: false,
      },
    },
  },
  'control-input': {
    componentId: 'control-input',
    version: '1.0.0',
    propsSchema: [
      { field: 'placeholder', label: '占位符', type: 'string', default: '请输入内容' },
      { field: 'value', label: '默认值', type: 'string', default: '' },
    ],
    defaultProps: {
      placeholder: '请输入内容',
      value: '',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'change',
        label: '值变化',
        params: [{ name: 'value', type: 'string', description: '输入值' }],
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
  'media-text': {
    componentId: 'media-text',
    version: '1.0.0',
    propsSchema: [
      { field: 'text', label: '文本内容', type: 'string', default: '', description: '显示的文本内容' },
      { field: 'fontSize', label: '字体大小', type: 'number', default: 14, description: '字体大小（像素）' },
      { field: 'fontWeight', label: '字体粗细', type: 'enum', default: 'normal', options: [
        { label: '正常', value: 'normal' },
        { label: '加粗', value: 'bold' },
      ], description: '字体粗细' },
      { field: 'color', label: '文字颜色', type: 'string', default: '#333333', description: '文字颜色' },
      { field: 'textAlign', label: '对齐方式', type: 'enum', default: 'left', options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' },
      ], description: '文本对齐方式' },
    ],
    defaultProps: {
      text: '',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#333333',
      textAlign: 'left',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      interaction: false,
      dataBinding: false,
    },
  },
  'media-image': {
    componentId: 'media-image',
    version: '1.0.0',
    propsSchema: [
      { field: 'src', label: '图片地址', type: 'string', default: '', description: '图片的URL地址' },
      { field: 'alt', label: '替代文本', type: 'string', default: '图片', description: '图片无法显示时的替代文本' },
      { field: 'width', label: '宽度', type: 'string', default: '100%', description: '图片宽度' },
      { field: 'height', label: '高度', type: 'string', default: 'auto', description: '图片高度' },
    ],
    defaultProps: {
      src: '',
      alt: '图片',
      width: '100%',
      height: 'auto',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'click',
        label: '点击',
        params: [],
      },
    ],
    defaultEvents: {
      click: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: false,
    },
  },
  'media-line': {
    componentId: 'media-line',
    version: '1.0.0',
    propsSchema: [
      {
        field: 'direction',
        label: '方向',
        type: 'enum',
        default: 'horizontal',
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
        description: '线条的方向',
      },
      { field: 'color', label: '颜色', type: 'string', default: '#d9d9d9', description: '线条颜色' },
      { field: 'width', label: '宽度', type: 'number', default: 1, description: '线条宽度（像素）' },
      {
        field: 'style',
        label: '样式',
        type: 'enum',
        default: 'solid',
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
        ],
        description: '线条样式',
      },
    ],
    defaultProps: {
      direction: 'horizontal',
      color: '#d9d9d9',
      width: 1,
      style: 'solid',
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      interaction: false,
      dataBinding: false,
    },
  },
  'media-border': {
    componentId: 'media-border',
    version: '1.0.0',
    propsSchema: [
      { field: 'color', label: '边框颜色', type: 'string', default: '#d9d9d9', description: '边框颜色' },
      { field: 'width', label: '边框宽度', type: 'number', default: 1, description: '边框宽度（像素）' },
      {
        field: 'style',
        label: '边框样式',
        type: 'enum',
        default: 'solid',
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
          { label: '双线', value: 'double' },
        ],
        description: '边框样式',
      },
      { field: 'radius', label: '圆角', type: 'number', default: 0, description: '边框圆角（像素）' },
    ],
    defaultProps: {
      color: '#d9d9d9',
      width: 1,
      style: 'solid',
      radius: 0,
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [],
    defaultEvents: {},
    supportFeatures: {
      interaction: false,
      dataBinding: false,
    },
  },
  'media-video': {
    componentId: 'media-video',
    version: '1.0.0',
    propsSchema: [
      { field: 'src', label: '视频地址', type: 'string', default: '', description: '视频的URL地址' },
      { field: 'poster', label: '封面图', type: 'string', default: '', description: '视频封面图片地址' },
      { field: 'autoplay', label: '自动播放', type: 'boolean', default: false, description: '是否自动播放' },
      { field: 'controls', label: '显示控件', type: 'boolean', default: true, description: '是否显示播放控件' },
      { field: 'loop', label: '循环播放', type: 'boolean', default: false, description: '是否循环播放' },
      { field: 'muted', label: '静音', type: 'boolean', default: false, description: '是否静音' },
    ],
    defaultProps: {
      src: '',
      poster: '',
      autoplay: false,
      controls: true,
      loop: false,
      muted: false,
    },
    dataSchema: [],
    defaultData: null,
    eventSchema: [
      {
        event: 'play',
        label: '播放',
        params: [],
      },
      {
        event: 'pause',
        label: '暂停',
        params: [],
      },
      {
        event: 'ended',
        label: '播放结束',
        params: [],
      },
    ],
    defaultEvents: {
      play: null,
      pause: null,
      ended: null,
    },
    supportFeatures: {
      interaction: true,
      dataBinding: false,
    },
  },
};

/**
 * 模拟API延迟
 */
// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchComponentCategories(): Promise<ComponentCategory[]> {
  // await delay(200);
  return mockCategories;
}

export async function fetchComponentTags(): Promise<ComponentTag[]> {
  // await delay(200);
  return mockTags;
}

export async function fetchComponentList(filter: ComponentFilter): Promise<ComponentSummary[]> {
  // await delay(300);
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
  // await delay(200);
  return mockComponentDefinitions[componentId] || null;
}


