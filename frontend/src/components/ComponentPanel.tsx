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
  TableOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DownOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  EditOutlined,
  MinusOutlined,
  BorderInnerOutlined,
  PlayCircleOutlined,
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
    const groups: Record<'basicChart' | 'form' | 'multimedia' | 'container' | 'control', ComponentSummary[]> = {
      basicChart: [],
      form: [],
      multimedia: [],
      container: [],
      control: [],
    };
    components.forEach((component) => {
      const category = categorizeComponent(component);
      groups[category].push(component);
    });
    // 对表单组件列表进行排序，确保"表单组件"排在第一位
    groups.form.sort((a, b) => {
      if (a.componentName === '表单组件') return -1;
      if (b.componentName === '表单组件') return 1;
      return 0;
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
                        key: 'form',
                        label: `表单组件 (${groupedComponents.form.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.form, loading, handleDragStart, 'form')}
                          </div>
                        ),
                      },
                      {
                        key: 'multimedia',
                        label: `多媒体 (${groupedComponents.multimedia.length})`,
                        children: (
                          <div style={{ padding: '8px 0' }}>
                            {renderComponentGrid(groupedComponents.multimedia, loading, handleDragStart, 'multimedia')}
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
  category?: 'chart' | 'form' | 'multimedia' | 'layout' | 'other'
) {
  if (items.length === 0) {
    if (loading) {
      return <Skeleton active />;
    }
    return <Empty description="暂无组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  // 图表、表单和多媒体分类使用2列，其他分类使用3列
  const columnCount = category === 'chart' || category === 'form' || category === 'multimedia' ? 2 : 3;
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
  
  // 雷达图
  if (lowerName.includes('雷达') || lowerName.includes('radar')) {
    return <FundOutlined style={thumbnailIconStyle} />;
  }
  // 表格
  if (lowerName.includes('表格') && !lowerName.includes('树形')) {
    return <TableOutlined style={thumbnailIconStyle} />;
  }
  // 树形表格
  if (lowerName.includes('树形表格') || lowerName.includes('treetable')) {
    return <ApartmentOutlined style={thumbnailIconStyle} />;
  }
  // 表单组件
  if (lowerName.includes('表单组件') || (lowerName.includes('表单') && !lowerName.includes('文本框') && !lowerName.includes('下拉框') && !lowerName.includes('多选框') && !lowerName.includes('单选框'))) {
    return <AppstoreOutlined style={thumbnailIconStyle} />;
  }
  // 文本框
  if (lowerName.includes('文本框') || (lowerName.includes('文本') && !lowerName.includes('输入'))) {
    return <FileTextOutlined style={thumbnailIconStyle} />;
  }
  // 下拉框
  if (lowerName.includes('下拉框') || lowerName.includes('select')) {
    return <DownOutlined style={thumbnailIconStyle} />;
  }
  // 多选框
  if (lowerName.includes('多选框') || lowerName.includes('checkbox')) {
    return <CheckSquareOutlined style={thumbnailIconStyle} />;
  }
  // 日期段选择
  if (lowerName.includes('日期段') || lowerName.includes('daterange')) {
    return <CalendarOutlined style={thumbnailIconStyle} />;
  }
  // 单选框
  if (lowerName.includes('单选框') || lowerName.includes('radio')) {
    return <CheckCircleOutlined style={thumbnailIconStyle} />;
  }
  // 开关切换
  if (lowerName.includes('开关') || lowerName.includes('switch')) {
    return <SwapOutlined style={thumbnailIconStyle} />;
  }
  // 过滤器
  if (lowerName.includes('过滤器') || lowerName.includes('filter')) {
    return <FilterOutlined style={thumbnailIconStyle} />;
  }
  // 按钮
  if (lowerName.includes('按钮') || lowerName.includes('button')) {
    return <ThunderboltOutlined style={thumbnailIconStyle} />;
  }
  // 输入框
  if (lowerName.includes('输入框') || lowerName.includes('input')) {
    return <EditOutlined style={thumbnailIconStyle} />;
  }
  // 线条
  if (lowerName.includes('线条') || lowerName.includes('line')) {
    return <MinusOutlined style={thumbnailIconStyle} />;
  }
  // 边框
  if (lowerName.includes('边框') || lowerName.includes('border')) {
    return <BorderInnerOutlined style={thumbnailIconStyle} />;
  }
  // 视频
  if (lowerName.includes('视频') || lowerName.includes('video')) {
    return <PlayCircleOutlined style={thumbnailIconStyle} />;
  }
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
  // 雷达图
  if (lowerName.includes('雷达') || lowerName.includes('radar')) {
    return <FundOutlined style={thumbnailIconStyle} />;
  }
  // 表格
  if (lowerName.includes('表格') && !lowerName.includes('树形')) {
    return <TableOutlined style={thumbnailIconStyle} />;
  }
  // 树形表格
  if (lowerName.includes('树形表格') || lowerName.includes('treetable')) {
    return <ApartmentOutlined style={thumbnailIconStyle} />;
  }
  // 表单组件图标
  if (lowerName.includes('表单组件') || (lowerName.includes('表单') && !lowerName.includes('文本框') && !lowerName.includes('下拉框') && !lowerName.includes('多选框') && !lowerName.includes('单选框'))) {
    return <AppstoreOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('文本框') || (lowerName.includes('文本') && !lowerName.includes('输入'))) {
    return <FileTextOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('下拉框') || lowerName.includes('select')) {
    return <DownOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('多选框') || lowerName.includes('checkbox')) {
    return <CheckSquareOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('日期段') || lowerName.includes('daterange')) {
    return <CalendarOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('单选框') || lowerName.includes('radio')) {
    return <CheckCircleOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('开关') || lowerName.includes('switch')) {
    return <SwapOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('过滤器') || lowerName.includes('filter')) {
    return <FilterOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('按钮') || lowerName.includes('button')) {
    return <ThunderboltOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('输入框') || lowerName.includes('input')) {
    return <EditOutlined style={thumbnailIconStyle} />;
  }
  // 线条
  if (lowerName.includes('线条') || lowerName.includes('line')) {
    return <MinusOutlined style={thumbnailIconStyle} />;
  }
  // 边框
  if (lowerName.includes('边框') || lowerName.includes('border')) {
    return <BorderInnerOutlined style={thumbnailIconStyle} />;
  }
  // 视频
  if (lowerName.includes('视频') || lowerName.includes('video')) {
    return <PlayCircleOutlined style={thumbnailIconStyle} />;
  }
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

function categorizeComponent(component: ComponentSummary): 'basicChart' | 'form' | 'multimedia' | 'container' | 'control' {
  const name = `${component.componentName}${component.alias || ''}`.toLowerCase();
  
  // 优先检查 categories 字段
  if (component.categories && component.categories.length > 0) {
    if (component.categories.includes('form')) {
      return 'form';
    }
    if (component.categories.includes('media')) {
      return 'multimedia';
    }
    if (component.categories.includes('container')) {
      return 'container';
    }
    if (component.categories.includes('chart')) {
      return 'basicChart';
    }
    if (component.categories.includes('control')) {
      return 'control';
    }
  }
  
  // 表单组件：文本框、下拉框、多选框、日期段选择、单选框、开关切换、过滤器、按钮、输入框、表单组件
  const formKeywords = ['表单组件', 'form', '文本框', 'text', '下拉框', 'select', '多选框', 'checkbox', '日期段', 'daterange', '单选框', 'radio', '开关', 'switch', '过滤器', 'filter', '按钮', 'button', '输入框', 'input'];
  if (formKeywords.some((kw) => component.componentName.includes(kw) || name.includes(kw))) {
    return 'form';
  }
  
  // 多媒体：图片、视频、文本等（优先于图表判断）
  const multimediaKeywords = ['图片', 'image', '视频', 'video', '文本', 'text', '音频', 'audio', '媒体', 'media'];
  if (multimediaKeywords.some((kw) => name.includes(kw))) {
    return 'multimedia';
  }
  
  // 基础图表：普通图表类型，包括雷达图、表格、树形表格
  const chartKeywords = ['图', 'chart', '仪表', 'dashboard', '指标', 'heatmap', '柱', '折线', '饼', '条形', '面积', '散点', '环形', '象形', '柱线', '雷达', 'radar', '表格', 'table', '树形表格', 'treetable'];
  if (component.type === 'chart' || chartKeywords.some((kw) => component.componentName.includes(kw) || name.includes(kw))) {
    return 'basicChart';
  }
  
  // 容器组件：容器、布局、分组、选项卡等
  const containerKeywords = ['容器', 'container', '布局', 'layout', 'grid', '栅格', 'flex', '卡片', 'card', 'panel', 'section', '分组', 'group', '选项卡', 'tab'];
  if (containerKeywords.some((kw) => name.includes(kw))) {
    return 'container';
  }
  
  // 控制类组件：按钮、筛选框、输入框等（不在form分类中的）
  return 'control';
}

export default ComponentPanel;

