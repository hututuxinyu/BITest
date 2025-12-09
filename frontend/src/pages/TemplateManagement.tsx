import React from 'react';
import { Card, Empty} from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

/**
 * TODO 模板管理页面
 */
const TemplateManagement: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <AppstoreOutlined style={{ marginRight: 8 }} />
        模板管理
      </h2>
      <Card>
        <Empty
          description="模板管理功能待实现"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default TemplateManagement;






