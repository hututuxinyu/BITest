import React, { useMemo } from 'react';
import type { TemplateSchema } from '../services/templateMock';
import ChartRenderer from './ChartRenderer';
import FormRenderer from './FormRenderer';
import TableRenderer from './TableRenderer';
import { componentApi } from '../services/componentApi';
import type { ComponentDefinition, ComponentSummary } from '../types';

interface TemplatePreviewProps {
  templateSchema: TemplateSchema;
  scale?: number; // 缩放比例，默认根据容器大小自动计算
  width?: number; // 预览区域宽度
  height?: number; // 预览区域高度
}

/**
 * 模板预览组件
 * 用于在模板面板中显示缩小版的dashboard预览
 */
const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateSchema,
  scale,
  width = 250,
  height = 160,
}) => {
  const [componentMap, setComponentMap] = React.useState<Map<string, ComponentSummary>>(new Map());
  const [definitionMap, setDefinitionMap] = React.useState<Map<string, ComponentDefinition>>(new Map());

  // 计算缩放比例
  const calculatedScale = useMemo(() => {
    if (scale !== undefined) {
      return scale;
    }
    // 根据容器大小和canvas大小自动计算
    const canvasWidth = templateSchema.canvas.width;
    const canvasHeight = templateSchema.canvas.height;
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;
    return Math.min(scaleX, scaleY, 0.15); // 最大缩放15%
  }, [scale, width, height, templateSchema.canvas]);

  // 加载组件信息
  React.useEffect(() => {
    const loadComponents = async () => {
      const compMap = new Map<string, ComponentSummary>();
      const defMap = new Map<string, ComponentDefinition>();

      for (const schemaComp of templateSchema.components) {
        if (!schemaComp.visible) {
          continue;
        }

        // 映射componentType到componentId
        const componentId = mapComponentTypeToId(schemaComp.componentType || '');
        
        try {
          // 获取组件摘要
          const components = await componentApi.listComponents({});
          const component = components.find((c: ComponentSummary) => c.componentId === componentId);
          if (component) {
            compMap.set(schemaComp.componentId, component);

            // 获取组件定义
            const definition = await componentApi.getDefinition(componentId);
            if (definition) {
              defMap.set(schemaComp.componentId, definition);
            }
          }
        } catch (error) {
          console.warn(`加载组件 ${componentId} 失败:`, error);
        }
      }

      setComponentMap(compMap);
      setDefinitionMap(defMap);
    };

    loadComponents();
  }, [templateSchema]);

  // 映射componentType到componentId
  const mapComponentTypeToId = (componentType: string): string => {
    const normalizedType = componentType.toLowerCase();
    const typeMap: Record<string, string> = {
      barchart: 'chart-bar',
      linechart: 'chart-line',
      piechart: 'chart-pie',
      radarchart: 'chart-radar',
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

  // 渲染组件内容
  const renderComponent = (schemaComp: any) => {
    const component = componentMap.get(schemaComp.componentId);
    const definition = definitionMap.get(schemaComp.componentId);

    if (!component || !definition) {
      return null;
    }

    // 合并props
    const propsValues = { ...(definition.defaultProps || {}), ...(schemaComp.props || {}) };

    // 合并数据
    let mergedDefinition = { ...definition };
    if (schemaComp.data?.bindingType === 'static' && schemaComp.data.staticConfig?.data) {
      mergedDefinition = {
        ...mergedDefinition,
        defaultData: schemaComp.data.staticConfig.data,
      };
    } else if (schemaComp.staticData) {
      mergedDefinition = {
        ...mergedDefinition,
        defaultData: schemaComp.staticData,
      };
    }

    // 根据组件类型渲染
    if (component.componentId === 'chart-table' || component.componentId === 'chart-tree-table') {
      return (
        <TableRenderer
          componentId={component.componentId}
          definition={mergedDefinition}
          height="100%"
          width="100%"
          propsValues={propsValues}
        />
      );
    }

    if (component.type === 'chart') {
      return (
        <ChartRenderer
          componentId={component.componentId}
          definition={mergedDefinition}
          height="100%"
          width="100%"
        />
      );
    }

    if (component.type === 'control' || component.categories?.includes('form')) {
      return (
        <FormRenderer
          componentId={component.componentId}
          definition={mergedDefinition}
          height="100%"
          width="100%"
          propsValues={propsValues}
        />
      );
    }

    // 文本组件简单渲染
    if (component.componentId === 'media-text' || schemaComp.componentType === 'text') {
      const text = propsValues.text || '';
      const fontSize = (propsValues.fontSize || 14) * calculatedScale;
      const color = propsValues.color || '#333';
      return (
        <div
          style={{
            fontSize: `${fontSize}px`,
            color,
            fontWeight: propsValues.fontWeight || 'normal',
            textAlign: propsValues.textAlign || 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      );
    }

    // 边框组件
    if (component.componentId === 'media-border' || schemaComp.componentType === 'border') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            border: `${(propsValues.width || 1) * calculatedScale}px ${propsValues.style || 'solid'} ${propsValues.color || '#d9d9d9'}`,
            borderRadius: propsValues.radius ? `${propsValues.radius * calculatedScale}px` : '0',
          }}
        />
      );
    }

    // 线条组件
    if (component.componentId === 'media-line' || schemaComp.componentType === 'line') {
      const isHorizontal = propsValues.direction === 'horizontal';
      return (
        <div
          style={{
            width: isHorizontal ? '100%' : `${(propsValues.width || 1) * calculatedScale}px`,
            height: isHorizontal ? `${(propsValues.width || 1) * calculatedScale}px` : '100%',
            backgroundColor: propsValues.color || '#d9d9d9',
            borderStyle: propsValues.style || 'solid',
          }}
        />
      );
    }

    return null;
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: templateSchema.canvas.backgroundColor || '#f5f5f5',
        borderRadius: '4px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: `${templateSchema.canvas.width * calculatedScale}px`,
          height: `${templateSchema.canvas.height * calculatedScale}px`,
          transform: `scale(${calculatedScale})`,
          transformOrigin: 'top left',
        }}
      >
        {templateSchema.components
          .filter((comp) => comp.visible !== false)
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map((schemaComp) => {
            const position = schemaComp.position || { x: 0, y: 0 };
            const size = schemaComp.size || { width: 100, height: 100 };

            return (
              <div
                key={schemaComp.componentId}
                style={{
                  position: 'absolute',
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${size.width}px`,
                  height: `${size.height}px`,
                  zIndex: schemaComp.zIndex || 0,
                }}
              >
                {renderComponent(schemaComp)}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default TemplatePreview;

