import React from 'react';
import { Card, Empty } from 'antd';
import { EditOutlined } from '@ant-design/icons';

/**
 * 画布编辑页面
 * 这是报表编辑界面的主页面，采用三栏布局
 */
const CanvasEditor: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <EditOutlined style={{ marginRight: 8 }} />
        画布编辑
      </h2>
      <Card>
        <Empty
          description="画布编辑功能待实现，将采用三栏布局：左侧组件库、中间画布、右侧配置面板"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default CanvasEditor;

