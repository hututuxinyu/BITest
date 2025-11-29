import React, { useEffect, useState } from 'react';
import { List, Avatar, Tag, Empty, Card, Space } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { fetchSceneTemplates } from '../services/reportCreationMock';
import type { TemplateDefinition } from '../types/reportCreation';

/**
 * 模板面板组件
 * 显示在导航栏右侧，展示所有可选模板
 */
const TemplatePanel: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const list = await fetchSceneTemplates();
        setTemplates(list);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      dashboard: '仪表盘',
      report: '报表',
      blank: '空白',
    };
    return map[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      dashboard: 'blue',
      report: 'green',
      blank: 'default',
    };
    return map[category] || 'default';
  };

  return (
    <div style={{ padding: '16px 0 16px 16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', marginRight: 0 }} className="sub-panel-content">
      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
        dataSource={templates}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              style={{ width: '100%' }}
              cover={
                item.previewUrl ? (
                  <img alt={item.name} src={item.previewUrl} style={{ height: 160, objectFit: 'cover' }} />
                ) : (
                  <div
                    style={{
                      height: 160,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                    }}
                  >
                    <AppstoreOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                  </div>
                )
              }
            >
              <Card.Meta
                avatar={<Avatar icon={<AppstoreOutlined />} />}
                title={
                  <Space>
                    <span>{item.name}</span>
                    <Tag color={getCategoryColor(item.category)}>{getCategoryLabel(item.category)}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8, color: '#666' }}>{item.description}</div>
                    <Space size={[0, 8]} wrap>
                      {item.tags.map((tag) => (
                        <Tag key={tag} size="small">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
      {!loading && templates.length === 0 && (
        <Empty description="暂无模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default TemplatePanel;

