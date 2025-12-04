import type { DatasourceConfig, Dataset, DatasetField, ApiResponse } from '../types';
import {
  getMockComponentDatasourceConfig,
  saveMockComponentDatasourceConfig,
  getMockDatasetList,
  previewMockData,
} from './datasourceMock';

/**
 * 使用模拟数据
 */
const USE_MOCK_DATA = false;

/**
 * 数据源配置API
 */
export const datasourceApi = {
  /**
   * 获取组件数据源配置
   */
  getComponentDatasourceConfig: async (componentId: string): Promise<ApiResponse<DatasourceConfig | null>> => {
    if (USE_MOCK_DATA) {
      return await getMockComponentDatasourceConfig(componentId);
    }
    // 真实API调用
    const response = await fetch(`/api/components/${componentId}/datasource`);
    return response.json();
  },

  /**
   * 保存组件数据源配置
   */
  saveComponentDatasourceConfig: async (
    componentId: string,
    config: DatasourceConfig
  ): Promise<ApiResponse<void>> => {
    if (USE_MOCK_DATA) {
      return await saveMockComponentDatasourceConfig(componentId, config);
    }
    // 真实API调用
    const response = await fetch(`/api/components/${componentId}/datasource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  /**
   * 获取数据集列表
   */
  getDatasetList: async (): Promise<ApiResponse<Dataset[]>> => {
    if (USE_MOCK_DATA) {
      return await getMockDatasetList();
    }
    // 真实API调用
    const response = await fetch('/api/datasets');
    return response.json();
  },

  /**
   * 根据数据集ID获取字段列表
   */
  getDatasetFields: async (datasetId: string): Promise<ApiResponse<DatasetField[]>> => {
    const response = await fetch(`/api/datasets/${datasetId}/fields`);
    return response.json();
  },

  /**
   * 根据数据集ID和标签获取字段列表
   */
  getDatasetFieldsByTag: async (datasetId: string, tag: 'dimension' | 'measure'): Promise<ApiResponse<DatasetField[]>> => {
    const response = await fetch(`/api/datasets/${datasetId}/fields/${tag}`);
    return response.json();
  },

  /**
   * 执行数据集查询
   * @param datasetConfig 数据集配置
   * @returns 查询结果数据
   */
  queryDataset: async (datasetConfig: {
    datasetId: string;
    datasourceId: string;
    query?: string;
    xAxisField?: string;
    yAxisField?: string;
    tableColumns?: Array<{ fieldName: string; fieldLabel: string }>;
    params?: Record<string, any>;
  }): Promise<ApiResponse<any[]>> => {
    try {
      // 构建查询请求
      const requestBody = {
        datasetId: datasetConfig.datasetId,
        datasourceId: datasetConfig.datasourceId,
        query: datasetConfig.query || '',
        xAxisField: datasetConfig.xAxisField,
        yAxisField: datasetConfig.yAxisField,
        tableColumns: datasetConfig.tableColumns,
        params: datasetConfig.params || {},
      };

      const response = await fetch('/api/datasets/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`查询失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('数据集查询失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '查询失败',
        data: [],
      };
    }
  },
};

