import React, { useMemo, useState, useEffect } from 'react';
import type { EnhancedCanvasItem } from '../canvas/EnhancedCanvas';
import ChartRenderer from '../common/ChartRenderer';
import FormRenderer from '../common/FormRenderer';
import TableRenderer from '../common/TableRenderer';
import type { ComponentDefinition } from '../../types';
import { datasourceApi } from '../../services/datasourceApi';
import { Spin } from 'antd';
import { getThemeById, getDefaultTheme } from '../../themes';

/**
 * 转换数据集数据为图表数据格式
 * 如果数据已经是正确的格式，直接返回；否则进行转换
 */
function transformDatasetData(
  data: any[],
  datasetConfig: { xAxisField?: string; yAxisField?: string }
): any[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // 检查数据是否已经是图表格式（有 category 和 value 字段）
  const firstItem = data[0];
  if (firstItem && ('category' in firstItem || 'name' in firstItem) && 'value' in firstItem) {
    // 已经是正确的格式，直接返回
    return data;
  }

  // 需要转换：从原始数据格式转换为图表格式
  const xAxisField = datasetConfig.xAxisField;
  const yAxisField = datasetConfig.yAxisField;

  if (!xAxisField || !yAxisField) {
    console.warn('缺少 xAxisField 或 yAxisField，无法转换数据');
    return [];
  }

  return data.map((row: any) => ({
    category: row[xAxisField] ?? row.category ?? '未命名分类',
    value: typeof row[yAxisField] === 'number' ? row[yAxisField] : Number(row[yAxisField]) || 0,
    series: row.series ?? '默认系列',
  }));
}

interface ReportPreviewProps {
  items: EnhancedCanvasItem[];
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundColor?: string;
  themeId?: 'light' | 'dark';
  title?: string;
}

/**
 * 预览项组件，处理单个组件的数据加载
 */
interface PreviewItemProps {
  item: EnhancedCanvasItem;
  renderItem: (item: EnhancedCanvasItem, data?: any[]) => React.ReactNode;
}

const PreviewItem: React.FC<PreviewItemProps> = ({ item, renderItem }) => {
  const [data, setData] = useState<any[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // 如果是静态数据，直接使用
    if (item.datasourceConfig?.bindingType === 'static' && item.datasourceConfig.staticConfig) {
      setData(item.datasourceConfig.staticConfig.data);
      return;
    }

    // 如果是数据集配置，需要查询数据
    if (item.datasourceConfig?.bindingType === 'dataset' && item.datasourceConfig.datasetConfig) {
      const datasetConfig = item.datasourceConfig.datasetConfig;
      
      // 检查是否有必要的数据配置
      if (!datasetConfig.datasetId) {
        setData(undefined);
        return;
      }

      setLoading(true);
      setError(undefined);

      datasourceApi
        .queryDataset({
          datasetId: datasetConfig.datasetId,
          datasourceId: datasetConfig.datasourceId,
          query: datasetConfig.query,
          xAxisField: datasetConfig.xAxisField,
          yAxisField: datasetConfig.yAxisField,
          tableColumns: datasetConfig.tableColumns,
          params: datasetConfig.params,
        })
        .then((response) => {
          if (response.success) {
            const responseData = response.data || [];
            // 如果返回的数据是空数组，设置为 undefined 以使用默认数据
            if (Array.isArray(responseData) && responseData.length === 0) {
              console.warn('数据查询结果为空，使用默认数据');
              setData(undefined);
            } else {
              // 转换数据格式：如果数据格式不符合图表要求，进行转换
              const transformedData = transformDatasetData(responseData, datasetConfig);
              setData(transformedData);
            }
          } else {
            console.warn('数据加载失败:', response.message || '未知错误', '，使用默认数据');
            // 查询失败时设置为 undefined，使用默认数据，不显示错误
            setData(undefined);
          }
        })
        .catch((err) => {
          console.warn('数据加载异常:', err.message || '未知错误', '，使用默认数据');
          // 查询失败时设置为 undefined，使用默认数据，不显示错误
          setData(undefined);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // 没有数据源配置，使用默认数据
      setData(undefined);
    }
  }, [item.datasourceConfig]);

  if (loading) {
    return (
      <div style={{ padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="small" />
        <span style={{ marginLeft: 8 }}>加载数据中...</span>
      </div>
    );
  }

  // 只有当有错误且没有数据时才显示错误
  // 如果有默认数据可以回退，则不显示错误
  if (error && data === undefined && (!item.definition?.defaultData || (Array.isArray(item.definition.defaultData) && item.definition.defaultData.length === 0))) {
    return (
      <div style={{ padding: 16, color: '#ff4d4f' }}>
        数据加载失败: {error}
      </div>
    );
  }

  return <>{renderItem(item, data)}</>;
};

/**
 * 报表预览组件
 * 用于预览报表，不显示编辑相关的UI元素
 */
const ReportPreview: React.FC<ReportPreviewProps> = ({
  items,
  canvasWidth = 1920,
  canvasHeight = 1080,
  backgroundColor = '#fafafa',
  themeId = 'light',
  title,
}) => {
  const theme = useMemo(() => getThemeById(themeId || 'light') || getDefaultTheme(), [themeId]);
  const titleColor = theme?.colors.titleText || theme?.colors.textPrimary || '#1f1f1f';
  const titleBg = themeId === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.65)';

  // 渲染组件内容
  const renderItem = (item: EnhancedCanvasItem, previewData?: any[]): React.ReactNode => {
    if (item.loading) {
      return <div style={{ padding: 16 }}>加载中...</div>;
    }
    if (item.error) {
      return <div style={{ padding: 16, color: '#ff4d4f' }}>渲染失败: {item.error}</div>;
    }

    // 对于 border 组件，即使没有 definition 也可以直接渲染
    if (!item.definition && item.component.componentId !== 'media-border') {
      return <div style={{ padding: 16 }}>组件定义未加载</div>;
    }
    
    // 如果 border 组件没有 definition，使用默认的 props
    if (item.component.componentId === 'media-border' && !item.definition) {
      const borderProps = item.propsValues || {};
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

    const effectiveDefinition: ComponentDefinition = (() => {
      let mergedDefinition: ComponentDefinition = item.definition;
      if (item.propsValues) {
        mergedDefinition = {
          ...mergedDefinition,
          defaultProps: { ...(mergedDefinition.defaultProps || {}), ...item.propsValues },
        };
      }
      
      // 优先使用预览数据（从数据集查询得到），其次使用静态数据，最后使用默认数据
      // 只有当 previewData 是有效数组（非空）时才使用，空数组时回退到默认数据
      if (previewData !== undefined && Array.isArray(previewData) && previewData.length > 0) {
        mergedDefinition = {
          ...mergedDefinition,
          defaultData: previewData,
        };
      } else if (item.datasourceConfig?.bindingType === 'static' && item.datasourceConfig.staticConfig) {
        mergedDefinition = {
          ...mergedDefinition,
          defaultData: item.datasourceConfig.staticConfig.data,
        };
      }
      // 如果没有预览数据和静态数据，使用 definition 中的默认数据（保持不变）
      return mergedDefinition;
    })();

    // 表格组件
    if (item.component.componentId === 'chart-table') {
      return (
        <TableRenderer
          componentId={item.component.componentId}
          definition={effectiveDefinition}
          height={item.size.height}
          width={item.size.width}
          propsValues={item.propsValues}
        />
      );
    }

    // 图表组件
    if (item.component.type === 'chart') {
      // 树选择组件使用 FormRenderer 渲染
      if (item.component.componentId === 'chart-tree') {
        return (
          <FormRenderer
            componentId={item.component.componentId}
            definition={effectiveDefinition}
            height={item.size.height}
            width={item.size.width}
            propsValues={item.propsValues}
            componentName={item.component.componentName}
          />
        );
      }
      return (
        <ChartRenderer
          componentId={item.component.componentId}
          definition={effectiveDefinition}
          height="100%"
          width="100%"
          themeId={themeId}
        />
      );
    }

    // 媒体组件和表单组件
    if (
      item.component.type === 'media' ||
      item.component.type === 'control' ||
      item.component.type === 'form' ||
      item.component.categories?.includes('form') ||
      item.component.componentId === 'media-text' ||
      item.component.componentId === 'media-border' ||
      item.component.componentId === 'media-line' ||
      item.component.componentId === 'media-image'
    ) {
      return (
        <FormRenderer
          componentId={item.component.componentId}
          definition={effectiveDefinition}
          height={item.size.height}
          width={item.size.width}
          propsValues={item.propsValues}
        />
      );
    }

    return <div style={{ padding: 16 }}>暂不支持该组件的预览</div>;
  };

  // 按 zIndex 排序
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [items]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: backgroundColor,
        position: 'relative',
      }}
    >
      {title ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 0,
            right: 0,
            textAlign: 'center',
            pointerEvents: 'none',
            fontSize: 28,
            fontWeight: 700,
            color: titleColor,
            textShadow: themeId === 'dark' ? '0 1px 3px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.18)',
            padding: '8px 16px',
            background: titleBg,
            borderRadius: 12,
            width: '50%',
            margin: '0 auto',
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          position: 'relative',
          width: canvasWidth,
          height: canvasHeight,
          margin: '0 auto',
          background: backgroundColor,
        }}
      >
        {sortedItems.map((item) => {
          // 判断是否是 border 组件
          const isBorderComponent =
            item.component.componentId === 'media-border' ||
            item.component.categories?.includes('border') ||
            item.component.type === 'border';

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: item.position.x,
                top: item.position.y,
                width: item.size.width,
                height: item.size.height,
                zIndex: item.zIndex || 0,
                // 预览模式下不显示边框和背景（border组件除外，它需要透明背景以显示内部边框）
                border: 'none',
                background: isBorderComponent ? 'transparent' : 'transparent',
                pointerEvents: 'auto',
              }}
            >
              <PreviewItem item={item} renderItem={renderItem} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportPreview;

