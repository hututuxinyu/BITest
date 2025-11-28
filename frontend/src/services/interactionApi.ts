import type { InteractionConfig, ApiResponse } from '../types';
import {
  getMockComponentInteractionConfig,
  saveMockComponentInteractionConfig,
} from './interactionMock';

/**
 * 使用模拟数据
 */
const USE_MOCK_DATA = true;

/**
 * 交互配置API
 */
export const interactionApi = {
  /**
   * 获取组件交互配置
   */
  getComponentInteractionConfig: async (componentId: string): Promise<ApiResponse<InteractionConfig | null>> => {
    if (USE_MOCK_DATA) {
      return await getMockComponentInteractionConfig(componentId);
    }
    // 真实API调用
    const response = await fetch(`/api/components/${componentId}/interaction`);
    return response.json();
  },

  /**
   * 保存组件交互配置
   */
  saveComponentInteractionConfig: async (
    componentId: string,
    config: InteractionConfig
  ): Promise<ApiResponse<void>> => {
    if (USE_MOCK_DATA) {
      return await saveMockComponentInteractionConfig(componentId, config);
    }
    // 真实API调用
    const response = await fetch(`/api/components/${componentId}/interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return response.json();
  },
};

