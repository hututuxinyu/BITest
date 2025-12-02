import React from 'react';
import { Card, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

/**
 * Schema生成页面
 */
const SchemaGenerator: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        Schema生成
      </h2>
      <Card>
        <Empty
          description="Schema生成功能待实现，将设计态的所有配置信息转换为标准化的schema文件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default SchemaGenerator;





