import React, { useMemo } from 'react';
import { Table } from 'antd';
import { Empty } from 'antd';
import type { ComponentDefinition } from '../../types';

interface TableRendererProps {
  componentId: string;
  definition: ComponentDefinition;
  height?: number | string;
  width?: number | string;
  propsValues?: Record<string, any>;
}

const TableRenderer: React.FC<TableRendererProps> = ({
  componentId: _componentId, // 保留以保持接口一致性，目前未使用
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

  // 安全的渲染函数：处理对象、数组等复杂类型
  const safeRender = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      // 如果是数组，转换为字符串
      if (Array.isArray(value)) {
        return value.length > 0 ? JSON.stringify(value) : '';
      }
      // 如果是对象，尝试提取常见属性（如 name, label, title）
      if (value.name !== undefined) {
        return String(value.name);
      }
      if (value.label !== undefined) {
        return String(value.label);
      }
      if (value.title !== undefined) {
        return String(value.title);
      }
      // 否则转换为 JSON 字符串
      return JSON.stringify(value);
    }
    return value;
  };

  const { columns, dataSource, pagination } = useMemo(() => {
    // 从定义中获取数据
    const data = definition.defaultData || [];
    
    // 构建列定义
    // 优先使用 props 中的 columns，如果没有则从 dataSchema 生成，最后从数据中推断
    let tableColumns: any[] = [];
    
    if (props.columns && Array.isArray(props.columns) && props.columns.length > 0) {
      // 使用 props 中的 columns 配置
      tableColumns = props.columns.map((col: any) => ({
        title: col.title || col.field,
        dataIndex: col.field,
        key: col.field,
        width: col.width,
        render: (value: any) => {
          if (col.format === 'number') {
            return typeof value === 'number' ? value.toLocaleString() : safeRender(value);
          }
          return safeRender(value);
        },
      }));
    } else if (definition.dataSchema && definition.dataSchema.length > 0) {
      // 从 dataSchema 生成列定义
      tableColumns = definition.dataSchema.map((schema: any) => ({
        title: schema.label || schema.field,
        dataIndex: schema.field,
        key: schema.field,
        render: (value: any) => {
          if (schema.type === 'number') {
            return typeof value === 'number' ? value.toLocaleString() : safeRender(value);
          }
          return safeRender(value);
        },
      }));
    } else if (data.length > 0) {
      // 从数据中推断列
      tableColumns = Object.keys(data[0])
        .filter((key) => key !== 'key' && key !== 'children')
        .map((key) => ({
          title: key,
          dataIndex: key,
          key,
          render: safeRender,
        }));
    }

    // 构建数据源
    const tableData = data.map((row: any, index: number) => ({
      key: row.key || `row-${index}`,
      ...row,
    }));

    // 分页配置
    const paginationConfig: false | { pageSize: number; showSizeChanger: boolean; showTotal: (total: number) => string } | undefined = 
      props.pagination !== false
        ? {
            pageSize: props.pageSize || 10,
            showSizeChanger: typeof props.pagination === 'object' ? props.pagination?.showSizeChanger !== false : true,
            showTotal: (total: number) => `共 ${total} 条`,
          }
        : false;

    return {
      columns: tableColumns,
      dataSource: tableData,
      pagination: paginationConfig,
    };
  }, [definition, props]);

  // 普通表格
  return (
    <div style={{ height, width, padding: '16px', overflow: 'auto' }}>
      {props.title && (
        <div style={{ marginBottom: 16, fontWeight: 500, fontSize: 14 }}>
          {props.title}
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
      />
    </div>
  );
};

export default TableRenderer;

