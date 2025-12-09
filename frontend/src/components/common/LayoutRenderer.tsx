import React from 'react';
import { Empty } from 'antd';
import type { ComponentDefinition } from '../../types';

interface LayoutRendererProps {
  componentId: string;
  definition: ComponentDefinition;
  height?: number | string;
  width?: number | string;
  propsValues?: Record<string, any>;
}

const baseSlotStyle: React.CSSProperties = {
  border: '1px dashed #d9d9d9',
  borderRadius: 6,
  background: '#fafafa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#999',
  fontSize: 12,
};

const LayoutRenderer: React.FC<LayoutRendererProps> = ({
  componentId,
  definition,
  height = '100%',
  width = '100%',
  propsValues = {},
}) => {
  if (!definition) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="组件定义缺失"
        style={{ margin: 0, padding: '32px 0' }}
      />
    );
  }

  const props = { ...(definition.defaultProps || {}), ...propsValues };

  if (componentId === 'layout-top-bottom') {
    return renderTopBottom(props, height, width);
  } else if (componentId === 'layout-left-right') {
    return renderLeftRight(props, height, width);
  } else if (componentId === 'layout-header-content-footer') {
    return renderHeaderContentFooter(props, height, width);
  } else if (componentId === 'layout-grid') {
    return renderGrid(props, height, width);
  } else {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂不支持该布局组件的实时渲染"
        style={{ margin: 0, padding: '32px 0' }}
      />
    );
  }
};

function renderTopBottom(props: Record<string, any>, height: number | string, width: number | string) {
  const gap = Number(props.gap) || 0;
  const topRatio = Number(props.topRatio) || 1;
  const bottomRatio = Number(props.bottomRatio) || 1;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        height,
        width,
        background: props.background || '#fff',
      }}
    >
      <div style={{ ...baseSlotStyle, flex: topRatio, borderBottom: props.splitLine ? '1px dashed #e5e6eb' : 'none' }}>上区域（拖拽组件至此）</div>
      <div style={{ ...baseSlotStyle, flex: bottomRatio }}>下区域（拖拽组件至此）</div>
    </div>
  );
}

function renderLeftRight(props: Record<string, any>, height: number | string, width: number | string) {
  const gap = Number(props.gap) || 0;
  const leftRatio = Number(props.leftRatio) || 1;
  const rightRatio = Number(props.rightRatio) || 1;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap,
        height,
        width,
        background: props.background || '#fff',
      }}
    >
      <div style={{ ...baseSlotStyle, flex: leftRatio, borderRight: props.splitLine ? '1px dashed #e5e6eb' : 'none' }}>左区域（拖拽组件至此）</div>
      <div style={{ ...baseSlotStyle, flex: rightRatio }}>右区域（拖拽组件至此）</div>
    </div>
  );
}

function renderHeaderContentFooter(props: Record<string, any>, height: number | string, width: number | string) {
  const gap = Number(props.gap) || 0;
  const headerRatio = Number(props.headerRatio) || 1;
  const contentRatio = Number(props.contentRatio) || 1;
  const footerRatio = Number(props.footerRatio) || 1;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        height,
        width,
        background: props.background || '#fff',
      }}
    >
      <div
        style={{
          ...baseSlotStyle,
          flex: headerRatio,
          position: props.stickyHeader ? 'sticky' : 'relative',
          top: props.stickyHeader ? 0 : undefined,
          borderBottom: props.stickyHeader || props.splitLine ? '1px dashed #e5e6eb' : 'none',
        }}
      >
        头部（拖拽组件至此）
      </div>
      <div style={{ ...baseSlotStyle, flex: contentRatio, minHeight: 80 }}>内容区（拖拽组件至此）</div>
      <div
        style={{
          ...baseSlotStyle,
          flex: footerRatio,
          position: props.stickyFooter ? 'sticky' : 'relative',
          bottom: props.stickyFooter ? 0 : undefined,
          borderTop: props.stickyFooter || props.splitLine ? '1px dashed #e5e6eb' : 'none',
        }}
      >
        底部（拖拽组件至此）
      </div>
    </div>
  );
}

function renderGrid(props: Record<string, any>, height: number | string, width: number | string) {
  const rows = Math.max(1, Number(props.rows) || 1);
  const cols = Math.max(1, Number(props.cols) || 1);
  const gutter = Number(props.gutter) || 0;
  const rowHeights: string[] = Array.isArray(props.rowHeights) && props.rowHeights.length > 0
    ? props.rowHeights.map((h: any) => formatSize(h, '1fr'))
    : Array.from({ length: rows }).map(() => '1fr');
  const colWidths: string[] = Array.isArray(props.colWidths) && props.colWidths.length > 0
    ? props.colWidths.map((w: any) => formatSize(w, '1fr'))
    : Array.from({ length: cols }).map(() => '1fr');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: rowHeights.slice(0, rows).join(' '),
        gridTemplateColumns: colWidths.slice(0, cols).join(' '),
        gap: gutter,
        height,
        width,
        background: props.background || '#fff',
      }}
    >
      {Array.from({ length: rows * cols }).map((_, index) => (
        <div key={`cell-${index}`} style={baseSlotStyle}>
          单元格 {index + 1}（拖拽组件至此）
        </div>
      ))}
    </div>
  );
}

function formatSize(value: any, fallback: string) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

export default LayoutRenderer;

