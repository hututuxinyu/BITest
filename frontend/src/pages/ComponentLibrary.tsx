import React from 'react';
import { Card, Empty } from 'antd';
import { BlockOutlined } from '@ant-design/icons';

/**
 * 组件库管理页面
 */
const ComponentLibrary: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <BlockOutlined style={{ marginRight: 8 }} />
        组件库管理
      </h2>
      <Card>
        <Empty
          description="组件库管理功能待实现"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default ComponentLibrary;

