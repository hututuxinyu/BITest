import type { DatasourceConfig, Dataset, ApiResponse } from '../types';

/**
 * 模拟延迟
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 模拟数据集列表
 */
const mockDatasets: Dataset[] = [
  {
    datasetId: 'dataset-001',
    datasetName: '销售数据',
    datasourceId: 'ds-001',
    datasourceName: '生产数据库',
    description: '包含销售订单、客户信息等数据',
    query: 'SELECT * FROM sales_order WHERE date >= :startDate',
  },
  {
    datasetId: 'dataset-002',
    datasetName: '用户行为数据',
    datasourceId: 'ds-002',
    datasourceName: '分析数据库',
    description: '用户访问、点击等行为数据',
    query: 'SELECT * FROM user_behavior WHERE date >= :startDate',
  },
  {
    datasetId: 'dataset-003',
    datasetName: '财务数据',
    datasourceId: 'ds-001',
    datasourceName: '生产数据库',
    description: '财务报表、收支明细等',
    query: 'SELECT * FROM financial_data WHERE year = :year',
  },
];

/**
 * 模拟组件数据源配置存储
 */
const componentDatasourceConfigs: Record<string, DatasourceConfig> = {};

/**
 * 获取组件数据源配置
 */
export async function getMockComponentDatasourceConfig(componentId: string): Promise<ApiResponse<DatasourceConfig | null>> {
  await delay(200);
  const config = componentDatasourceConfigs[componentId] || null;
  return {
    success: true,
    data: config,
  };
}

/**
 * 保存组件数据源配置
 */
export async function saveMockComponentDatasourceConfig(
  componentId: string,
  config: DatasourceConfig
): Promise<ApiResponse<void>> {
  await delay(300);
  componentDatasourceConfigs[componentId] = config;
  return {
    success: true,
    message: '保存成功',
    data: undefined,
  };
}

/**
 * 获取数据集列表
 */
export async function getMockDatasetList(): Promise<ApiResponse<Dataset[]>> {
  await delay(200);
  return {
    success: true,
    data: mockDatasets,
  };
}

/**
 * 预览数据
 */
export async function previewMockData(datasourceId: string, query: string): Promise<ApiResponse<any[]>> {
  await delay(500);
  // 模拟返回预览数据
  const mockPreviewData = [
    { category: '分类A', value: 100, series: '系列1' },
    { category: '分类B', value: 200, series: '系列1' },
    { category: '分类C', value: 150, series: '系列1' },
    { category: '分类A', value: 80, series: '系列2' },
    { category: '分类B', value: 150, series: '系列2' },
    { category: '分类C', value: 100, series: '系列2' },
  ];
  return {
    success: true,
    data: mockPreviewData,
  };
}

