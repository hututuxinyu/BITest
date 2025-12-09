/**
 * 模板面板组件
 * 显示在导航栏右侧，展示所有可选模板
 * 支持拖拽模板到画布
 */
import React, { useEffect, useState } from 'react';
import { List, Empty, Card, message } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { templateApi } from '../../services/api';
import type { TemplateDefinition } from '../../types';
// 使用相对路径导入图片（从 src 目录到 pic 目录）
import dashboardPreviewImage from '../../../assets/dashboard1.png';

interface TemplatePanelProps {
  onTemplateDragStart?: (template: TemplateDefinition) => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onTemplateDragStart }) => {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const response = await templateApi.getAllTemplates();
        if (response.success && response.data) {
          // 将后端返回的数据转换为TemplateDefinition格式
          const list: TemplateDefinition[] = response.data.map((item: any) => ({
            templateId: item.templateId,
            name: item.templateName,
            category: item.category || 'dashboard',
            description: item.description || '',
            previewUrl: item.previewImage || '',
            tags: [],
            recommendFor: [],
          }));
          setTemplates(list);
        } else {
          message.error('加载模板列表失败');
        }
      } catch (error) {
        console.error('加载模板列表失败:', error);
        message.error('加载模板列表失败');
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  return (
    <div style={{ padding: '16px 0 16px 16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', marginRight: 0 }} className="sub-panel-content">
      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
        dataSource={templates}
        renderItem={(item) => {
          // 计算尺寸：整体16:10，图片16:9，文字1行
          // 使用aspect-ratio来保持比例
          return (
            <List.Item style={{ padding: '0 0 16px 0' }}>
              <Card
                hoverable
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('template', JSON.stringify(item));
                  if (onTemplateDragStart) {
                    onTemplateDragStart(item);
                  }
                }}
                style={{ 
                  width: '100%', 
                  cursor: 'grab',
                  aspectRatio: '16/10',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                }}
                bodyStyle={{ 
                  padding: 0, 
                  height: '10%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                cover={
                  <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
                    {item.previewUrl ? (
                      <img alt={item.name} src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : item.category === 'dashboard' ? (
                      <img 
                        alt={item.name} 
                        src={dashboardPreviewImage} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          // 如果图片加载失败，显示占位符
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="#d9d9d9">
                                  <path d="M24 8L8 16v16l16 8 16-8V16L24 8z"/>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f5f5f5',
                        }}
                      >
                        <AppstoreOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      </div>
                    )}
                  </div>
                }
              >
                <span style={{ fontSize: 14, color: '#333', lineHeight: '1.5' }}>{item.name}</span>
              </Card>
            </List.Item>
          );
        }}
      />
      {!loading && templates.length === 0 && (
        <Empty description="暂无模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default TemplatePanel;

