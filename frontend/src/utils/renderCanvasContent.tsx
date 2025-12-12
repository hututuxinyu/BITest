/**
 * 画布内容渲染入口：
 * - 按组件类型选择具体渲染器（表格/图表/表单/媒体等）
 * - 处理加载、错误、占位态
 * - 特例：边框组件、表单子元素递归渲染
 */
import { Empty, Result, Skeleton } from 'antd';
import type { ComponentDefinition, ComponentSummary, DatasourceConfig } from '../types';
import ChartRenderer from '../components/common/ChartRenderer';
import FormRenderer from '../components/common/FormRenderer';
import TableRenderer from '../components/common/TableRenderer';
import LayoutRenderer from '../components/common/LayoutRenderer';

export interface RenderCanvasItem {
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
  children?: string[];
}

export function renderCanvasContent(
  item: RenderCanvasItem,
  definition?: ComponentDefinition | null,
  propsValues?: Record<string, any>,
  childItems: RenderCanvasItem[] = [],
  onPropChange?: (field: string, value: any) => void,
  themeId: 'light' | 'dark' = 'light'
) {
  if (item.component.componentId === 'media-border') {
    const borderProps = propsValues || item.propsValues || {};
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `${borderProps.width || 2}px ${borderProps.style || 'solid'} ${borderProps.color || '#165DFF'}`,
          borderRadius: borderProps.radius ? `${borderProps.radius}px` : '0',
          backgroundColor: borderProps.backgroundColor || 'transparent',
        }}
      />
    );
  }

  if (item.loading) {
    return <Skeleton active style={{ padding: 16 }} />;
  }
  if (item.error) {
    return (
      <Result
        status="warning"
        title="渲染失败"
        subTitle={item.error}
        style={{ padding: '16px 0' }}
      />
    );
  }
  if (definition) {
    if (item.component.componentId === 'chart-table' || item.component.componentId === 'chart-tree-table') {
      return (
        <TableRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
        />
      );
    }

    if (item.component.type === 'layout') {
      return (
        <LayoutRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
        />
      );
    }

    if (item.component.type === 'chart') {
      return (
        <ChartRenderer
          componentId={item.component.componentId}
          definition={definition}
          height="100%"
          width="100%"
          themeId={themeId}
        />
      );
    }

    if (item.component.type === 'media' || item.component.componentId === 'media-text' || item.component.componentId === 'media-line') {
      return (
        <FormRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
          componentName={item.component.componentName}
        />
      );
    }

    const isFormOrControl =
      item.component.type === 'control' ||
      item.component.type === 'form' ||
      item.component.categories?.includes('form');

    if (isFormOrControl) {
      const children =
        item.component.componentId === 'form-form' && childItems.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
            {childItems.map((child) => {
              const childDefinition = child.definition;
              const childEffectiveDefinition = childDefinition
                ? {
                    ...childDefinition,
                    defaultProps: {
                      ...(childDefinition.defaultProps || {}),
                      ...(child.propsValues || {}),
                    },
                  }
                : null;
              return (
                <div
                  key={child.id}
                  style={{
                    position: 'absolute',
                    left: (child.position?.x || 0) + 16,
                    top: (child.position?.y || 0) + 32,
                    width: child.size?.width || 200,
                    height: child.size?.height || 32,
                    pointerEvents: 'auto',
                  }}
                >
                  {renderCanvasContent(child, childEffectiveDefinition, child.propsValues, [], onPropChange, themeId)}
                </div>
              );
            })}
          </div>
        ) : null;

      return (
        <FormRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
          componentName={item.component.componentName}
        >
          {children}
        </FormRenderer>
      );
    }
  }

  if (!definition) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={`${item.component.componentName} - 组件定义未加载`}
        style={{ margin: 0, padding: '32px 0' }}
      />
    );
  }

  if (item.component.previewUrl) {
    return (
      <img
        src={item.component.previewUrl}
        alt={item.component.componentName}
        style={{ width: '100%', height: 240, objectFit: 'cover' }}
      />
    );
  }

  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={`${item.component.componentName} - 暂不支持预览`}
      style={{ margin: 0, padding: '32px 0' }}
    />
  );
}

