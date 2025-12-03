import type { DatasourceConfig, Dataset, ApiResponse } from '../types';
import {
  getMockComponentDatasourceConfig,
  saveMockComponentDatasourceConfig,
  getMockDatasetList,
  previewMockData,
} from './datasourceMock';

/**
 * 使用模拟数据
 */
const USE_MOCK_DATA = true;

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
   * 预览数据
   */
  previewData: async (datasourceId: string, query: string): Promise<ApiResponse<any[]>> => {
    if (USE_MOCK_DATA) {
      return await previewMockData(datasourceId, query);
    }
    // 真实API调用
    const response = await fetch('/api/datasources/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasourceId, query }),
    });
    return response.json();
  },

  /**
   * 验证SQL语句
   */
  validateSql: async (sql: string, datasourceType: string = 'mysql'): Promise<ApiResponse<{ valid: boolean; errors: string[]; warnings: string[] }>> => {
    // 暂时使用前端验证，后续可以调用后端API进行更严格的验证
    // 真实API调用示例：
    // const response = await fetch('/api/datasources/validate-sql', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ sql, datasourceType }),
    // });
    // return response.json();
    
    // 使用前端验证
    const { validateSqlSyntax } = await import('../utils/sqlValidator');
    const result = validateSqlSyntax(sql);
    return {
      success: true,
      data: result,
    };
  },
};

