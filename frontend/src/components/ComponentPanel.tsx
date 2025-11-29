import React, { useEffect, useMemo, useState } from 'react';
import {
  Input,
  Tag,
  Space,
  Select,
  List,
  Empty,
  Tabs,
  Collapse,
  Skeleton,
} from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  DashboardOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { componentApi } from '../services/componentApi';
import type {
  ComponentSummary,
} from '../types';

const thumbnailIconStyle: React.CSSProperties = { fontSize: 32, color: '#3b76f6', transform: 'none' };

/**
 * 组件面板组件
 * 显示在导航栏右侧，展示所有组件选项
 * 与编辑报表中的组件库呈现效果保持一致
 */
const ComponentPanel: React.FC = () => {
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [componentTab, setComponentTab] = useState<'basic' | 'custom'>('basic');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const list = await componentApi.listComponents({
          keyword: keyword || undefined,
        });
        setComponents(list);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [keyword]);

  const groupedComponents = useMemo(() => {
    const groups: Record<'basicChart' | 'threeDChart' | 'multimedia' | 'container' | 'control', ComponentSummary[]> = {
      basicChart: [],
      threeDChart: [],
      multimedia: [],
      container: [],
      control: [],
    };
    components.forEach((component) => {
      const category = categorizeComponent(component);
      groups[category].push(component);
    });
    return groups;
  }, [components]);

  const handleDragStart = (e: React.DragEvent, component: ComponentSummary) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={{ padding: '16px 0 16px 16px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', marginRight: 0 }} className="sub-panel-content">
      <Tabs
        size="small"
        activeKey={componentTab}
        onChange={(key) => setComponentTab(key as 'basic' | 'custom')}
        style={{ padding: '0 0 0 0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        tabBarStyle={{ margin: 0, paddingRight: 16, paddingLeft: 16 }}
        items={[
          {
            key: 'basic',
            label: '基础',
            children: (
              <div
                style={{
                  padding: 16,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  overflow: 'hidden',
                }}
              >
                <Input.Search placeholder="搜索组件" allowClear onSearch={setKeyword} style={{ borderRadius: 6 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  <Collapse
                    defaultActiveKey={['basicChart']}
                    bordered={false}
                    ghost
                    style={{ flex: 1, overflow: 'auto', background: 'transparent', minHeight: 0 }}
                    items={[
                      {
                        key: 'basicChart',
                        label: `基础图表 (${groupedComponents.basicChart.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.basicChart, loading, handleDragStart, 'chart')}
                          </div>
                        ),
                      },
                      {
                        key: 'threeDChart',
                        label: `三维图表 (${groupedComponents.threeDChart.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.threeDChart, loading, handleDragStart, 'chart')}
                          </div>
                        ),
                      },
                      {
                        key: 'multimedia',
                        label: `多媒体 (${groupedComponents.multimedia.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.multimedia, loading, handleDragStart, 'other')}
                          </div>
                        ),
                      },
                      {
                        key: 'container',
                        label: `容器组件 (${groupedComponents.container.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.container, loading, handleDragStart, 'layout')}
                          </div>
                        ),
                      },
                      {
                        key: 'control',
                        label: `控制类组件 (${groupedComponents.control.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.control, loading, handleDragStart, 'form')}
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'custom',
            label: '自定义',
            children: (
              <div style={{ padding: '16px 16px 16px 0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="自定义组件管理功能建设中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

function renderComponentGrid(
  items: ComponentSummary[],
  loading: boolean,
  handleDragStart: (e: React.DragEvent, component: ComponentSummary) => void,
  category?: 'chart' | 'form' | 'layout' | 'other'
) {
  if (items.length === 0) {
    if (loading) {
      return <Skeleton active />;
    }
    return <Empty description="暂无组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  // 图表分类使用2列，其他分类使用3列
  const columnCount = category === 'chart' ? 2 : 3;
  return (
    <List
      loading={loading}
      dataSource={items}
      style={{ paddingRight: 4 }}
      grid={{ gutter: 12, column: columnCount }}
      renderItem={(item) => (
        <List.Item key={item.componentId}>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            style={{
              border: '1px solid #e4e7ec',
              borderRadius: 10,
              background: '#fff',
              cursor: 'grab',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
              aspectRatio: '0.85',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                background: '#f5f7fb',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #eef1f6',
                minHeight: 0,
              }}
            >
              <div style={{ transform: 'none' }}>
                {renderThumbnailContent(item)}
              </div>
            </div>
            <div
              style={{
                padding: '8px 6px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  display: 'block',
                  width: '100%',
                }}
                title={item.componentName}
              >
                {item.componentName}
              </span>
            </div>
          </div>
        </List.Item>
      )}
    />
  );
}

function renderThumbnailContent(component: ComponentSummary) {
  const lowerName = component.componentName.toLowerCase();
  
  // 条形图 - 使用水平方向的柱状图图标（优先判断）
  if (lowerName.includes('条形')) {
    return <BarChartOutlined style={{ ...thumbnailIconStyle, transform: 'rotate(90deg)' }} />;
  }
  // 柱线图 - 组合图表（优先判断）
  if (lowerName.includes('柱线') || lowerName.includes('bar-line') || lowerName.includes('barline')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 柱状图
  if (lowerName.includes('柱') || lowerName.includes('bar')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 面积图 - 使用折线图图标（面积图是填充的折线图）
  if (lowerName.includes('面积') || lowerName.includes('area')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  // 折线图
  if (lowerName.includes('折') || lowerName.includes('line')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  // 仪表盘
  if (lowerName.includes('仪表') || lowerName.includes('dashboard') || lowerName.includes('gauge')) {
    return <DashboardOutlined style={thumbnailIconStyle} />;
  }
  // 环形图 - 使用饼图图标（环形图本质上是中空的饼图）
  if (lowerName.includes('环形') || lowerName.includes('donut')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 饼图
  if (lowerName.includes('饼') || lowerName.includes('pie')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 象形图 - 使用柱状图图标
  if (lowerName.includes('象形') || lowerName.includes('pictorial')) {
    return <FundOutlined style={thumbnailIconStyle} />;
  }
  
  // 其他组件如果有预览图或图标，则显示图片
  const previewSrc = component.previewUrl?.trim() || component.icon?.trim();
  if (previewSrc) {
    return <img src={previewSrc} alt={component.componentName} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />;
  }
  
  // 否则使用占位符图标
  return getPlaceholderIcon(component);
}

function getPlaceholderIcon(component: ComponentSummary) {
  const lowerName = component.componentName.toLowerCase();
  // 条形图 - 使用水平方向的柱状图图标（优先判断）
  if (lowerName.includes('条形')) {
    return <BarChartOutlined style={{ ...thumbnailIconStyle, transform: 'rotate(90deg)' }} />;
  }
  // 柱线图 - 组合图表（优先判断）
  if (lowerName.includes('柱线') || lowerName.includes('bar-line') || lowerName.includes('barline')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 柱状图
  if (lowerName.includes('柱') || lowerName.includes('bar')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 面积图
  if (lowerName.includes('面积') || lowerName.includes('area')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  // 折线图
  if (lowerName.includes('折') || lowerName.includes('line')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  // 仪表盘
  if (lowerName.includes('仪表') || lowerName.includes('dashboard') || lowerName.includes('gauge')) {
    return <DashboardOutlined style={thumbnailIconStyle} />;
  }
  // 环形图
  if (lowerName.includes('环形') || lowerName.includes('donut')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 饼图
  if (lowerName.includes('饼') || lowerName.includes('pie')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 象形图
  if (lowerName.includes('象形') || lowerName.includes('pictorial')) {
    return <FundOutlined style={thumbnailIconStyle} />;
  }
  // 散点图
  if (lowerName.includes('散') || lowerName.includes('dot') || lowerName.includes('点') || lowerName.includes('bubble') || lowerName.includes('scatter')) {
    return <DotChartOutlined style={thumbnailIconStyle} />;
  }
  if (component.type === 'chart') {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  return <AppstoreOutlined style={thumbnailIconStyle} />;
}

function categorizeComponent(component: ComponentSummary): 'basicChart' | 'threeDChart' | 'multimedia' | 'container' | 'control' {
  const name = `${component.componentName}${component.alias || ''}`.toLowerCase();
  
  // 三维图表：包含3D、三维等关键词
  const threeDKeywords = ['3d', '三维', '3D'];
  if (threeDKeywords.some((kw) => name.includes(kw))) {
    return 'threeDChart';
  }
  
  // 基础图表：普通图表类型
  const chartKeywords = ['图', 'chart', '仪表', 'dashboard', '指标', 'heatmap', '柱', '折线', '饼', '条形', '面积', '散点', '环形', '象形', '柱线'];
  if (component.type === 'chart' || chartKeywords.some((kw) => component.componentName.includes(kw) || name.includes(kw))) {
    return 'basicChart';
  }
  
  // 多媒体：图片、视频、文本等
  const multimediaKeywords = ['图片', 'image', '视频', 'video', '文本', 'text', '音频', 'audio', '媒体', 'media'];
  if (multimediaKeywords.some((kw) => name.includes(kw))) {
    return 'multimedia';
  }
  
  // 容器组件：容器、布局、分组、选项卡等
  const containerKeywords = ['容器', 'container', '布局', 'layout', 'grid', '栅格', 'flex', '卡片', 'card', 'panel', 'section', '分组', 'group', '选项卡', 'tab'];
  if (containerKeywords.some((kw) => name.includes(kw))) {
    return 'container';
  }
  
  // 控制类组件：按钮、筛选框、输入框等
  return 'control';
}

export default ComponentPanel;

