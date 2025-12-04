import type { CanvasItem } from '../pages/CanvasEditor';
import type { CanvasConfig } from '../components/PropertyPanel';
import type { ReportSchema } from '../../schema/report-schema';
import type { DatasourceConfig, DatasetField, Dataset } from '../types';

/**
 * 从画布数据生成完整的报表Schema
 */
export function generateReportSchema(
  canvasItems: CanvasItem[],
  canvasConfig: CanvasConfig,
  reportId: string,
  reportName: string,
  projectId: string,
  datasets?: Dataset[],
  creator?: string
): ReportSchema {
  const now = new Date().toISOString();

  // 生成组件列表
  const components = canvasItems.map((item) => {
    const props = { ...(item.propsValues || {}) };
    const componentI18n: Record<string, Record<string, string>> = {
      'zh-CN': {},
      'en-US': {},
    };

    // 处理 props 中的 i18n:xxx 格式，提取到 i18n 配置中
    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (typeof value === 'string' && value.startsWith('i18n:')) {
        const i18nKey = value.substring(5); // 去掉 'i18n:' 前缀
        // 使用 mock 数据生成 i18n 配置
        componentI18n['zh-CN'][i18nKey] = getMockI18nValue('zh-CN', i18nKey, item.component.componentName || '');
        componentI18n['en-US'][i18nKey] = getMockI18nValue('en-US', i18nKey, item.component.componentName || '');
        // 保留 props 中的 i18n:xxx 格式
      } else if (typeof value === 'string' && value.startsWith('a18i:')) {
        // 处理错误的格式 a18i:xxx（demo 中有这个错误）
        const i18nKey = value.substring(5);
        componentI18n['zh-CN'][i18nKey] = getMockI18nValue('zh-CN', i18nKey, item.component.componentName || '');
        componentI18n['en-US'][i18nKey] = getMockI18nValue('en-US', i18nKey, item.component.componentName || '');
      }
    });

    const component: any = {
      componentId: item.id,
      componentType: mapComponentIdToType(item.component.componentId),
      componentName: item.component.componentName || item.id,
      position: {
        x: item.position?.x || 0,
        y: item.position?.y || 0,
      },
      size: {
        width: item.size?.width || 400,
        height: item.size?.height || 300,
      },
      zIndex: item.zIndex || 1,
      visible: item.visible !== undefined ? item.visible : true,
      locked: item.locked !== undefined ? item.locked : false,
      props,
    };

    // 如果有数据源配置，关联数据源ID
    if (item.datasourceConfig?.datasetConfig?.datasetId) {
      const datasourceId = `ds-${item.datasourceConfig.datasetConfig.datasourceId || item.datasourceConfig.datasetConfig.datasetId}`;
      component.datasourceId = datasourceId;
    }

    // 添加i18n配置
    if (Object.keys(componentI18n['zh-CN']).length > 0 || Object.keys(componentI18n['en-US']).length > 0) {
      component.i18n = componentI18n;
    } else if (item.component.componentName) {
      // 如果没有 i18n props，至少添加组件名称的 i18n
      component.i18n = {
        'zh-CN': {
          componentName: item.component.componentName,
        },
        'en-US': {
          componentName: item.component.componentName,
        },
      };
    }

    return component;
  });

  // 生成数据源配置
  const datasources: any[] = [];
  const datasourceMap = new Map<string, any>();

  canvasItems.forEach((item) => {
    if (item.datasourceConfig?.datasetConfig) {
      const datasetConfig = item.datasourceConfig.datasetConfig;
      const datasetId = datasetConfig.datasetId;
      const datasourceId = datasetConfig.datasourceId || `ds-${datasetId}`;
      
      // 如果数据源已存在，合并配置
      if (!datasourceMap.has(datasourceId)) {
        // 查找数据集信息
        const dataset = datasets?.find((d) => d.datasetId === datasetId);
        const datasetFields = dataset?.fields || [];

        // 构建 selectedFields
        const selectedFields: Array<{
          fieldName: string;
          fieldLabel: string;
          fieldType: string;
          tag: string;
        }> = [];

        // 从数据集字段中获取字段信息
        if (datasetFields.length > 0) {
          datasetFields.forEach((field: DatasetField) => {
            selectedFields.push({
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              fieldType: field.fieldType,
              tag: field.tag,
            });
          });
        } else {
          // 如果没有字段信息，从组件配置中推断
          if (datasetConfig.xAxisField) {
            selectedFields.push({
              fieldName: datasetConfig.xAxisField,
              fieldLabel: datasetConfig.xAxisField,
              fieldType: 'string',
              tag: 'dimension',
            });
          }
          if (datasetConfig.yAxisField) {
            selectedFields.push({
              fieldName: datasetConfig.yAxisField,
              fieldLabel: datasetConfig.yAxisField,
              fieldType: 'number',
              tag: 'measure',
            });
          }
          if (datasetConfig.tableColumns) {
            datasetConfig.tableColumns.forEach((col: any) => {
              if (!selectedFields.find((f) => f.fieldName === col.fieldName)) {
                selectedFields.push({
                  fieldName: col.fieldName,
                  fieldLabel: col.fieldLabel || col.fieldName,
                  fieldType: 'string',
                  tag: 'dimension',
                });
              }
            });
          }
        }

        const datasource: any = {
          datasourceId,
          datasourceName: dataset?.datasetName || `${item.component.componentName || item.id} 数据源`,
          datasourceType: dataset?.datasourceType || 'mysql',
          datasetId: datasetId,
          datasetName: dataset?.datasetName || '数据集',
          queryConfig: {
            selectedFields,
          },
        };

        // 添加 filters（从 queryConfig 中获取，如果有）
        if (item.queryConfig?.filters && Array.isArray(item.queryConfig.filters)) {
          datasource.filters = item.queryConfig.filters.map((filter: any) => ({
            field: filter.field,
            operator: filter.operator,
            sourceId: filter.sourceId,
            valuePath: filter.valuePath || 'value',
          }));
        }

        // 添加 parameters（从 queryConfig 中获取，如果有）
        if (item.queryConfig?.parameters && Object.keys(item.queryConfig.parameters).length > 0) {
          datasource.parameters = {};
          Object.entries(item.queryConfig.parameters).forEach(([key, param]: [string, any]) => {
            datasource.parameters[key] = {
              type: param.type || 'string',
              sourceId: param.sourceId,
              path: param.path || 'value',
            };
          });
        }

        datasourceMap.set(datasourceId, datasource);
        datasources.push(datasource);
      }
    }
  });

  // 生成交互配置
  const interactions: any[] = [];
  const interactionMap = new Map<string, any>();

  canvasItems.forEach((item) => {
    if (item.interactionConfig && item.interactionConfig.events) {
      if (!interactionMap.has(item.id)) {
        interactionMap.set(item.id, {
          componentId: item.id,
          events: [],
        });
      }
      const interaction = interactionMap.get(item.id);
      if (Array.isArray(item.interactionConfig.events)) {
        interaction.events.push(...item.interactionConfig.events);
      } else {
        interaction.events.push(item.interactionConfig.events);
      }
    }
  });

  interactionMap.forEach((interaction) => {
    if (interaction.events.length > 0) {
      interactions.push(interaction);
    }
  });

  // 生成完整Schema
  const schema: ReportSchema = {
    version: '1.0.0',
    reportId,
    reportName,
    reportType: 'report',
    metadata: {
      createTime: now,
      updateTime: now,
      creator: creator || 'user-001',
      description: canvasConfig.description || '',
    },
    canvas: {
      width: canvasConfig.width || 1920,
      height: canvasConfig.height || 1080,
      backgroundColor: canvasConfig.backgroundColor || '#f5f5f5',
      grid: canvasConfig.gridVisible !== undefined ? canvasConfig.gridVisible : true,
      gridSize: canvasConfig.gridSize || 10,
    },
    components,
    datasources: datasources.length > 0 ? datasources : undefined,
    interactions: interactions.length > 0 ? interactions : undefined,
    i18n: {
      'zh-CN': {
        reportName: reportName,
        description: canvasConfig.description || '',
      },
      'en-US': {
        reportName: reportName,
        description: canvasConfig.description || '',
      },
    },
    style: {
      reportBackground: {
        type: 'color',
        value: canvasConfig.backgroundColor || '#f5f5f5',
      },
      theme: {
        themeId: 'theme-default',
        themeName: '默认主题',
      },
    },
  };

  return schema;
}

/**
 * 获取 mock i18n 值
 */
function getMockI18nValue(lang: 'zh-CN' | 'en-US', key: string, componentName: string): string {
  const mockData: Record<string, Record<string, string>> = {
    'zh-CN': {
      title: componentName || '标题',
      label: '标签',
      name: componentName || '名称',
    },
    'en-US': {
      title: componentName || 'Title',
      label: 'Label',
      name: componentName || 'Name',
    },
  };

  return mockData[lang]?.[key] || (lang === 'zh-CN' ? key : key);
}

/**
 * 将组件ID映射到组件类型
 */
function mapComponentIdToType(componentId: string): string {
  // 根据组件ID推断类型
  const typeMap: Record<string, string> = {
    'bar-chart': 'barChart',
    'line-chart': 'lineChart',
    'pie-chart': 'pieChart',
    'scatter-chart': 'scatterChart',
    'radar-chart': 'radarChart',
    'gauge-chart': 'gaugeChart',
    'table': 'table',
    'image': 'image',
    'text': 'text',
    'button': 'button',
    'filter': 'filter',
    'daterange': 'dataRange',
    'control-daterange': 'dataRange',
    'form-date-range': 'dataRange',
    'input': 'input',
    'select': 'select',
    'control-input': 'input',
    'control-select': 'select',
    'control-button': 'button',
    'control-filter': 'filter',
  };

  // 尝试直接匹配
  if (typeMap[componentId]) {
    return typeMap[componentId];
  }

  // 尝试部分匹配
  for (const [key, value] of Object.entries(typeMap)) {
    if (componentId.includes(key)) {
      return value;
    }
  }

  // 默认返回
  return 'text';
}

/**
 * 验证Schema格式
 */
export function validateSchema(schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema.version) {
    errors.push('缺少version字段');
  }

  if (!schema.reportId) {
    errors.push('缺少reportId字段');
  }

  if (!schema.reportName) {
    errors.push('缺少reportName字段');
  }

  if (!schema.canvas) {
    errors.push('缺少canvas字段');
  } else {
    if (typeof schema.canvas.width !== 'number') {
      errors.push('canvas.width必须是数字');
    }
    if (typeof schema.canvas.height !== 'number') {
      errors.push('canvas.height必须是数字');
    }
  }

  if (!schema.components || !Array.isArray(schema.components)) {
    errors.push('components必须是数组');
  } else {
    schema.components.forEach((comp: any, index: number) => {
      if (!comp.componentId) {
        errors.push(`components[${index}].componentId不能为空`);
      }
      if (!comp.componentType) {
        errors.push(`components[${index}].componentType不能为空`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

