import React from 'react';
import { Card, Empty } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

/**
 * 数据源配置页面
 */
const DatasourceConfig: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <DatabaseOutlined style={{ marginRight: 8 }} />
        数据源配置
      </h2>
      <Card>
        <Empty
          description="数据源配置功能待实现"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default DatasourceConfig;






