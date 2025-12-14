/**
 * 画布领域的共享工具：
 * - 定义基础 CanvasItem 模型
 * - 组件类型与 componentId 的映射
 * - 从 schema 构建 datasource 配置
 * - 轻量 CanvasItem 与 EnhancedCanvasItem 的互转
 */
import type { DatasourceConfig } from '../types';
import type { EnhancedCanvasItem } from '../components/canvas/EnhancedCanvas';
import type { ComponentDefinition, ComponentSummary } from '../types';

export interface BaseCanvasItem {
  id: string;
  component: ComponentSummary;
  definition?: ComponentDefinition | null;
  loading: boolean;
  error?: string;
  propsValues?: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  datasourceConfig?: DatasourceConfig;
  // 允许扩展字段（如 queryConfig / interactionConfig / visible / locked）
  [key: string]: any;
}

/**
 * 组件类型与 componentId 的映射
 */
export const mapComponentTypeToId = (componentType: string): string => {
  const normalizedType = (componentType || '').toLowerCase();
  const typeMap: Record<string, string> = {
    barchart: 'chart-bar',
    barcharthorizontal: 'chart-bar',
    areachart: 'custom-area-chart',
    linechart: 'chart-line',
    piechart: 'chart-pie',
    donutchart: 'custom-donut-chart',
    radarchart: 'chart-radar',
    dashboard: 'custom-dashboard',
    pictorialbarchart: 'custom-pictorial-chart',
    scatterchart: 'custom-scatter-chart',
    barlinechart: 'custom-bar-line-chart',
    table: 'chart-table',
    treetable: 'chart-tree-table',
    gauge: 'chart-gauge',
    image: 'media-image',
    video: 'media-video',
    line: 'media-line',
    border: 'media-border',
    text: 'media-text',
    button: 'control-button',
    filter: 'control-filter',
    input: 'control-input',
    form: 'form-form',
    textarea: 'form-text',
    select: 'form-select',
    checkbox: 'form-checkbox',
    daterange: 'form-date-range',
    radio: 'form-radio',
    switch: 'form-switch',
  };
  return typeMap[normalizedType] || componentType;
};

/**
 * 从 schemaComponent 中构建 DatasourceConfig
 * 优先级：data.datasetConfig / data.staticConfig > datasourceId 映射 > datasourceConfig > staticData
 */
export const buildDatasourceConfig = (
  schemaComponent: any,
  datasourceMap?: Map<string, any>
): DatasourceConfig | undefined => {
  let datasourceConfig: DatasourceConfig | undefined;

  if (schemaComponent?.data) {
    if (schemaComponent.data.bindingType === 'dataset' && schemaComponent.data.datasetConfig) {
      datasourceConfig = {
        sourceType: 'dataset',
        bindingType: 'dataset',
        datasetConfig: {
          datasourceId: schemaComponent.data.datasetConfig.datasourceId || schemaComponent.datasourceId || '',
          query: schemaComponent.data.datasetConfig.query || '',
          params: schemaComponent.data.datasetConfig.params || {},
        },
      };
    } else if (schemaComponent.data.bindingType === 'static' && schemaComponent.data.staticConfig) {
      datasourceConfig = {
        sourceType: 'static',
        bindingType: 'static',
        staticConfig: {
          data: schemaComponent.data.staticConfig.data || [],
        },
      };
    }
  }

  if (!datasourceConfig && schemaComponent?.datasourceId && datasourceMap) {
    const datasource = datasourceMap.get(schemaComponent.datasourceId);
    if (datasource && datasource.queryConfig) {
      datasourceConfig = {
        sourceType: 'dataset',
        bindingType: 'dataset',
        datasetConfig: {
          datasourceId: datasource.datasourceId,
          query: datasource.queryConfig.sql || '',
          params: datasource.queryConfig.parameters?.reduce((acc: Record<string, any>, param: any) => {
            acc[param.name] = param;
            return acc;
          }, {}),
        },
      };
    }
  }

  if (!datasourceConfig && schemaComponent?.datasourceConfig) {
    datasourceConfig = schemaComponent.datasourceConfig;
  }

  if (!datasourceConfig && schemaComponent?.staticData) {
    datasourceConfig = {
      sourceType: 'static',
      bindingType: 'static',
      staticConfig: {
        data: Array.isArray(schemaComponent.staticData) ? schemaComponent.staticData : [],
      },
    };
  }

  return datasourceConfig;
};

/**
 * 将轻量 CanvasItem 转为 EnhancedCanvasItem，补齐默认位置信息等
 */
export const convertToEnhancedItems = <T extends BaseCanvasItem>(items: T[]): EnhancedCanvasItem[] => {
  return items.map((item, index) => ({
    id: item.id,
    component: item.component,
    definition: item.definition,
    loading: item.loading,
    error: item.error,
    propsValues: item.propsValues,
    position: item.position || { x: 50, y: 50 + index * 100 },
    size: item.size || { width: 400, height: 300 },
    zIndex: item.zIndex ?? index + 1,
    datasourceConfig: item.datasourceConfig,
    queryConfig: item.queryConfig,
    interactionConfig: item.interactionConfig,
    visible: item.visible,
    locked: item.locked,
  }));
};

/**
 * 将 EnhancedCanvasItem 转回轻量 CanvasItem，保留扩展字段
 */
export const convertFromEnhancedItems = <T extends BaseCanvasItem = BaseCanvasItem>(
  items: EnhancedCanvasItem[]
): T[] => {
  return items.map(
    (item) =>
      ({
        id: item.id,
        component: item.component,
        definition: item.definition,
        loading: item.loading,
        error: item.error,
        propsValues: item.propsValues,
        position: item.position,
        size: item.size,
        zIndex: item.zIndex,
        datasourceConfig: item.datasourceConfig,
        queryConfig: item.queryConfig,
        interactionConfig: item.interactionConfig,
        visible: item.visible,
        locked: item.locked,
      } as unknown as T)
  );
};

