import type { InteractionConfig, ApiResponse } from '../types';

/**
 * 模拟延迟
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 模拟组件交互配置存储
 */
const componentInteractionConfigs: Record<string, InteractionConfig> = {};

/**
 * 获取组件交互配置
 */
export async function getMockComponentInteractionConfig(componentId: string): Promise<ApiResponse<InteractionConfig | null>> {
  await delay(200);
  const config = componentInteractionConfigs[componentId] || null;
  return {
    success: true,
    data: config,
  };
}

/**
 * 保存组件交互配置
 */
export async function saveMockComponentInteractionConfig(
  componentId: string,
  config: InteractionConfig
): Promise<ApiResponse<void>> {
  await delay(300);
  componentInteractionConfigs[componentId] = config;
  return {
    success: true,
    message: '保存成功',
    data: undefined,
  };
}

