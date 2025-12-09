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
        render: col.format === 'number' ? (value: any) => (typeof value === 'number' ? value.toLocaleString() : value) : undefined,
      }));
    } else if (definition.dataSchema && definition.dataSchema.length > 0) {
      // 从 dataSchema 生成列定义
      tableColumns = definition.dataSchema.map((schema: any) => ({
        title: schema.label || schema.field,
        dataIndex: schema.field,
        key: schema.field,
        render: schema.type === 'number' ? (value: any) => (typeof value === 'number' ? value.toLocaleString() : value) : undefined,
      }));
    } else if (data.length > 0) {
      // 从数据中推断列
      tableColumns = Object.keys(data[0])
        .filter((key) => key !== 'key' && key !== 'children')
        .map((key) => ({
          title: key,
          dataIndex: key,
          key,
        }));
    }

    // 构建数据源
    const tableData = data.map((row: any, index: number) => ({
      key: row.key || `row-${index}`,
      ...row,
    }));

    // 分页配置
    const paginationConfig = props.pagination !== false
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

  if (componentId === 'chart-tree-table') {
    // 树形表格
    const treeData = useMemo(() => {
      const data = definition.defaultData || [];
      return data.map((row: any, index: number) => ({
        key: row.key || `row-${index}`,
        ...row,
        children: row.children || undefined,
      }));
    }, [definition]);

    return (
      <div style={{ height, width, padding: '16px', overflow: 'auto' }}>
        {props.title && (
          <div style={{ marginBottom: 16, fontWeight: 500, fontSize: 14 }}>
            {props.title}
          </div>
        )}
        <Table
          columns={columns}
          dataSource={treeData}
          pagination={pagination}
        />
      </div>
    );
  }

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

