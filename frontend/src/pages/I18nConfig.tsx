import React from 'react';
import { Card, Empty } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

/**
 * 国际化配置页面
 */
const I18nConfig: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <GlobalOutlined style={{ marginRight: 8 }} />
        国际化配置
      </h2>
      <Card>
        <Empty
          description="国际化配置功能待实现，支持组件标题、标签、数据字段生成语言资源ID"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default I18nConfig;





