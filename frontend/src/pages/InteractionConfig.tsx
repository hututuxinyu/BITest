import React from 'react';
import { Card, Empty } from 'antd';
import { InteractionOutlined } from '@ant-design/icons';

/**
 * 交互配置页面
 */
const InteractionConfig: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <InteractionOutlined style={{ marginRight: 8 }} />
        交互配置
      </h2>
      <Card>
        <Empty
          description="交互配置功能待实现，支持下钻、关联、跳转、过滤、弹窗、动态事件等"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default InteractionConfig;


