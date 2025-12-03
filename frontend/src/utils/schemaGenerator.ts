import type { CanvasItem } from '../pages/CanvasEditor';
import type { CanvasConfig } from '../components/PropertyPanel';
import type { ReportSchema } from '../../schema/report-schema';

/**
 * 从画布数据生成完整的报表Schema
 */
export function generateReportSchema(
  canvasItems: CanvasItem[],
  canvasConfig: CanvasConfig,
  reportId: string,
  reportName: string,
  projectId: string
): ReportSchema {
  const now = new Date().toISOString();

  // 生成组件列表
  const components = canvasItems.map((item) => {
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
      visible: true,
      locked: false,
      props: item.propsValues || {},
    };

    // 添加i18n配置（如果有）
    if (item.component.componentName) {
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
    if (item.queryConfig && item.datasourceConfig) {
      const datasourceId = `ds-${item.id}`;
      
      // 如果数据源已存在，合并配置
      if (!datasourceMap.has(datasourceId)) {
        const datasource: any = {
          datasourceId,
          datasourceName: `${item.component.componentName || item.id} 数据源`,
          datasourceType: item.datasourceConfig.datasetConfig?.datasourceId 
            ? 'mysql' // 根据实际情况判断
            : 'static',
        };

        // 如果是数据集类型，添加连接配置
        if (item.datasourceConfig.datasetConfig) {
          datasource.connectionConfig = {
            // 这里应该从数据集配置中获取，暂时留空
          };
        }

        // 添加查询配置
        if (item.queryConfig.sql) {
          datasource.queryConfig = {
            sql: item.queryConfig.sql,
            parameters: item.queryConfig.parameters || [],
            fieldMapping: item.queryConfig.fieldMapping || {},
          };
        }

        datasourceMap.set(datasourceId, datasource);
        datasources.push(datasource);
      }

      // 将数据源关联到组件
      const component = components.find((c) => c.componentId === item.id);
      if (component) {
        component.datasourceId = datasourceId;
      }
    }
  });

  // 生成交互配置
  const interactions: any[] = [];
  canvasItems.forEach((item) => {
    if (item.interactionConfig && item.interactionConfig.events) {
      item.interactionConfig.events.forEach((event: any) => {
        interactions.push({
          componentId: item.id,
          events: [event],
        });
      });
    }
  });

  // 生成完整Schema
  const schema: ReportSchema = {
    version: '1.0.0',
    reportId,
    reportName,
    reportType: 'dashboard',
    metadata: {
      createTime: now,
      updateTime: now,
      creator: '', // 从用户上下文获取
      description: canvasConfig.description || '',
    },
    canvas: {
      width: canvasConfig.width || 1920,
      height: canvasConfig.height || 1080,
      backgroundColor: canvasConfig.backgroundColor || '#FFFFFF',
      grid: canvasConfig.gridVisible || false,
      gridSize: canvasConfig.gridSize || 10,
    },
    components,
    datasources: datasources.length > 0 ? datasources : undefined,
    interactions: interactions.length > 0 ? interactions : undefined,
    i18n: {
      'zh-CN': {
        reportName,
        description: canvasConfig.description || '',
      },
      'en-US': {
        reportName,
        description: canvasConfig.description || '',
      },
    },
  };

  return schema;
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
    'table': 'table',
    'image': 'image',
    'text': 'text',
    'button': 'button',
    'filter': 'filter',
    'daterange': 'daterange',
    'input': 'input',
    'select': 'select',
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

