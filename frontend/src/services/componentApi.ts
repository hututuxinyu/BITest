import type {
  ComponentCategory,
  ComponentTag,
  ComponentSummary,
  ComponentDefinition,
  ComponentFilter,
} from '../types';
import {
  fetchComponentCategories,
  fetchComponentTags,
  fetchComponentList,
  fetchComponentDefinition,
} from './componentMock';

/**
 * 组件库管理 API（使用 Mock 数据）
 */
export const componentApi = {
  getCategories: async (): Promise<ComponentCategory[]> => {
    return fetchComponentCategories();
  },
  getTags: async (): Promise<ComponentTag[]> => {
    return fetchComponentTags();
  },
  listComponents: async (filter: ComponentFilter): Promise<ComponentSummary[]> => {
    return fetchComponentList(filter);
  },
  getDefinition: async (componentId: string): Promise<ComponentDefinition | null> => {
    return fetchComponentDefinition(componentId);
  },
};




