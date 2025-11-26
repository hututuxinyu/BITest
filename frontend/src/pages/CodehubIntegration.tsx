import React from 'react';
import { Card, Empty } from 'antd';
import { GitlabOutlined } from '@ant-design/icons';

/**
 * Codehub集成页面
 */
const CodehubIntegration: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <GitlabOutlined style={{ marginRight: 8 }} />
        Codehub集成
      </h2>
      <Card>
        <Empty
          description="Codehub集成功能待实现，支持从Codehub个人分支导入Schema文件，支持将修改后的Schema文件提交到Codehub个人分支"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default CodehubIntegration;


