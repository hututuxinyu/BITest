import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Empty,
  Input,
  Tag,
  List,
  Avatar,
  Space,
  Button,
  message,
  Skeleton,
  Result,
  Form,
  Switch,
  InputNumber,
  Layout,
  Tabs,
  Select,
  Collapse,
} from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  HighlightOutlined,
} from '@ant-design/icons';
import type { ComponentDefinition, ComponentSummary } from '../types';
import { componentApi } from '../services/componentApi';
import ChartRenderer from '../components/ChartRenderer';

interface CanvasItem {
  id: string;
  component: ComponentSummary;
  definition?: ComponentDefinition | null;
  loading: boolean;
  error?: string;
  propsValues?: Record<string, any>;
}

const PANEL_HEIGHT = 'calc(100vh - 200px)';
const thumbnailIconStyle: React.CSSProperties = { fontSize: 44, color: '#3b76f6' };
const removedComponentNames = new Set(['标签容器', '图片', '日期选择器组件']);
const additionalComponents: ComponentSummary[] = [
  {
    componentId: 'custom-bar-chart',
    componentName: '条形图',
    alias: 'BarChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示分类数据的条形对比图',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
  {
    componentId: 'custom-area-chart',
    componentName: '面积图',
    alias: 'AreaChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示累积趋势的面积图',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
  {
    componentId: 'custom-dashboard',
    componentName: '仪表盘',
    alias: 'Dashboard',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示关键指标的仪表盘图',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
  {
    componentId: 'custom-donut-chart',
    componentName: '环形图',
    alias: 'DonutChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示占比结构的环形图',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
  {
    componentId: 'custom-pictorial-chart',
    componentName: '象形图',
    alias: 'PictorialChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '支持自定义图形的带状图示',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
  {
    componentId: 'custom-scatter-chart',
    componentName: '散点图',
    alias: 'ScatterChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '展示变量关系的散点图',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
  {
    componentId: 'custom-bar-line-chart',
    componentName: '柱线图',
    alias: 'BarLineChart',
    version: '1.0.0',
    type: 'chart',
    icon: '',
    previewUrl: '',
    description: '柱状与折线组合的复合图',
    categories: [],
    tags: [],
    author: 'system',
    releaseTime: '2024-01-01',
  },
];

const CanvasEditor: React.FC = () => {
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [componentTab, setComponentTab] = useState<'basic' | 'custom'>('basic');
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(true);
  const groupedComponents = useMemo(() => {
    const groups: Record<'chart' | 'form' | 'layout' | 'other', ComponentSummary[]> = {
      chart: [],
      form: [],
      layout: [],
      other: [],
    };
    components.forEach((component) => {
      const category = categorizeComponent(component);
      groups[category].push(component);
    });
    return groups;
  }, [components]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const list = await componentApi.listComponents({
          keyword: keyword || undefined,
        });
        const filtered = list.filter((item) => !removedComponentNames.has(item.componentName));
        const existingIds = new Set(filtered.map((item) => item.componentId));
        const merged = [
          ...filtered,
          ...additionalComponents.filter((item) => !existingIds.has(item.componentId)),
        ];
        setComponents(merged);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [keyword]);

  const handleDragStart = (e: React.DragEvent, component: ComponentSummary) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('component');
    if (!data) {
      return;
    }
    const component = JSON.parse(data) as ComponentSummary;
    const newItem: CanvasItem = {
      id: `${component.componentId}-${Date.now()}`,
      component,
      loading: true,
    };
    setCanvasItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    message.success(`已将 ${component.componentName} 添加到画布`);
    componentApi
      .getDefinition(component.componentId)
      .then((def) => {
        setCanvasItems((prev) =>
          prev.map((item) =>
            item.id === newItem.id
              ? {
                  ...item,
                  definition: def,
                  loading: false,
                  error: def ? undefined : '未找到组件定义，无法渲染。',
                  propsValues: def?.defaultProps ? { ...def.defaultProps } : {},
                }
              : item
          )
        );
      })
      .catch(() => {
        setCanvasItems((prev) =>
          prev.map((item) =>
            item.id === newItem.id
              ? {
                  ...item,
                  loading: false,
                  error: '加载组件定义失败，请稍后重试。',
                }
              : item
          )
        );
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handlePropChange = (field: string, value: any) => {
    if (!selectedItemId) {
      return;
    }
    setCanvasItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              propsValues: { ...(item.propsValues || {}), [field]: value },
            }
          : item
      )
    );
  };

  const selectedItem = canvasItems.find((item) => item.id === selectedItemId);

  return (
    <div
      style={{
        marginTop: -24,
        marginLeft: -24,
        marginRight: -24,
        marginBottom: -24,
      }}
    >
      <Layout
        style={{
          minHeight: PANEL_HEIGHT,
          background: 'transparent',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <Layout.Sider width={340} theme="light" style={{ background: 'transparent', height: PANEL_HEIGHT }}>
          <Card
            title="组件管理"
            bordered={false}
            bodyStyle={{ padding: 0, height: PANEL_HEIGHT }}
            style={{ borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}
          >
            <Tabs
              size="small"
              activeKey={componentTab}
              onChange={(key) => setComponentTab(key as 'basic' | 'custom')}
              style={{ padding: '0 16px' }}
              tabBarStyle={{ margin: 0 }}
              items={[
                {
                  key: 'basic',
                  label: '基础',
                  children: (
                    <div
                      style={{
                        padding: 16,
                        height: `calc(${PANEL_HEIGHT} - 64px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <Input.Search placeholder="搜索组件" allowClear onSearch={setKeyword} style={{ borderRadius: 6 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Collapse
                          defaultActiveKey={['chart']}
                          bordered={false}
                          ghost
                          style={{ flex: 1, overflow: 'auto', background: 'transparent' }}
                          items={[
                            {
                              key: 'chart',
                              label: `图表 (${groupedComponents.chart.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.chart, loading, handleDragStart)}
                                </div>
                              ),
                            },
                            {
                              key: 'form',
                              label: `表单 (${groupedComponents.form.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.form, loading, handleDragStart)}
                                </div>
                              ),
                            },
                            {
                              key: 'layout',
                              label: `布局 (${groupedComponents.layout.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.layout, loading, handleDragStart)}
                                </div>
                              ),
                            },
                            {
                              key: 'other',
                              label: `其他 (${groupedComponents.other.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.other, loading, handleDragStart)}
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
                    <div style={{ padding: 16, height: 'calc(100vh - 284px)' }}>
                      <Empty description="自定义组件管理功能建设中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Layout.Sider>
        <Layout style={{ background: 'transparent', gap: 16, alignItems: 'stretch' }}>
          <Layout.Content>
            <Card
              title="画布区域"
              bodyStyle={{
                height: PANEL_HEIGHT,
                background: '#f6fbff',
                border: '1px dashed #91d5ff',
                display: 'flex',
                flexDirection: 'column',
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div style={{ flex: 1, overflow: 'auto' }}>
                {canvasItems.length === 0 ? (
                  <Empty description="拖拽左侧组件到画布区域，开始构建布局" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {canvasItems.map((item, index) => {
                      const isSelected = selectedItemId === item.id;
                      const effectiveDefinition =
                        item.definition && item.propsValues
                          ? { ...item.definition, defaultProps: { ...item.definition.defaultProps, ...item.propsValues } }
                          : item.definition;
                      return (
                        <Card
                          key={item.id}
                          size="small"
                          onClick={() => setSelectedItemId(item.id)}
                          style={{
                            borderColor: isSelected ? '#1890ff' : undefined,
                            cursor: 'pointer',
                          }}
                          title={
                            <Space>
                              <Avatar size="small" src={item.component.icon} />
                              <span>{item.component.componentName}</span>
                              <Tag color="blue">实例 {index + 1}</Tag>
                            </Space>
                          }
                          extra={
                            <Space>
                              <Button
                                danger
                                type="link"
                                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                  event.stopPropagation();
                                  setCanvasItems((prev) => prev.filter((canvas) => canvas.id !== item.id));
                                  if (selectedItemId === item.id) {
                                    setSelectedItemId(undefined);
                                  }
                                }}
                              >
                                移除
                              </Button>
                            </Space>
                          }
                        >
                          <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
                            {renderCanvasContent(item, effectiveDefinition)}
                          </div>
                        </Card>
                      );
                    })}
                  </Space>
                )}
              </div>
            </Card>
          </Layout.Content>
          <Layout.Sider
            width={propertyPanelCollapsed ? 64 : 360}
            theme="light"
            style={{
              background: '#fff',
              padding: propertyPanelCollapsed ? '16px 8px' : 16,
              borderRadius: 8,
              height: PANEL_HEIGHT,
              transition: 'width 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: propertyPanelCollapsed ? 'center' : 'stretch',
            }}
          >
            {propertyPanelCollapsed ? (
              <Button
                type="text"
                icon={<HighlightOutlined style={{ fontSize: 20 }} />}
                onClick={() => setPropertyPanelCollapsed(false)}
                style={{ color: '#2b7dfa' }}
                title="编辑属性"
              />
            ) : (
              <Card
                title="属性编辑"
                bordered={false}
                style={{ height: '100%' }}
                bodyStyle={{ padding: 0, height: '100%' }}
                extra={
                  <Button type="text" size="small" onClick={() => setPropertyPanelCollapsed(true)}>
                    收起
                  </Button>
                }
              >
                <div style={{ padding: 16, height: `calc(${PANEL_HEIGHT} - 64px)`, overflow: 'auto' }}>
                  <PropertyPanel item={selectedItem} onPropChange={handlePropChange} />
                </div>
              </Card>
            )}
          </Layout.Sider>
        </Layout>
      </Layout>
    </div>
  );
};

export default CanvasEditor;

function renderComponentGrid(
  items: ComponentSummary[],
  loading: boolean,
  handleDragStart: (e: React.DragEvent, component: ComponentSummary) => void
) {
  if (items.length === 0) {
    if (loading) {
      return <Skeleton active />;
    }
    return <Empty description="暂无组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <List
      loading={loading}
      dataSource={items}
      style={{ paddingRight: 4 }}
      grid={{ gutter: 12, column: 3 }}
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
            }}
          >
            <div
              style={{
                background: '#f5f7fb',
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #eef1f6',
              }}
            >
              {renderThumbnailContent(item)}
            </div>
            <Space
              align="center"
              style={{
                padding: '10px 12px',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span style={{ fontWeight: 600 }}>{item.componentName}</span>
            </Space>
          </div>
        </List.Item>
      )}
    />
  );
}

function renderThumbnailContent(component: ComponentSummary) {
  const previewSrc = component.previewUrl?.trim() || component.icon?.trim();
  if (previewSrc) {
    return <img src={previewSrc} alt={component.componentName} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />;
  }
  return getPlaceholderIcon(component);
}

function getPlaceholderIcon(component: ComponentSummary) {
  const lowerName = component.componentName.toLowerCase();
  if (lowerName.includes('柱') || lowerName.includes('bar')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('折') || lowerName.includes('line')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('饼') || lowerName.includes('pie')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  if (lowerName.includes('散') || lowerName.includes('dot') || lowerName.includes('点') || lowerName.includes('bubble')) {
    return <DotChartOutlined style={thumbnailIconStyle} />;
  }
  if (component.type === 'chart') {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  return <AppstoreOutlined style={thumbnailIconStyle} />;
}

function categorizeComponent(component: ComponentSummary): 'chart' | 'form' | 'layout' | 'other' {
  const name = `${component.componentName}${component.alias || ''}`.toLowerCase();
  const chartKeywords = ['图', 'chart', '仪表', 'dashboard', '指标', 'heatmap'];
  if (component.type === 'chart' || chartKeywords.some((kw) => component.componentName.includes(kw) || name.includes(kw))) {
    return 'chart';
  }
  const formKeywords = ['表单', '输入', 'input', 'select', '选择', '下拉', '按钮', 'button', '上传', 'upload', '日期', 'date', '时间', 'time', '开关', 'switch'];
  if (formKeywords.some((kw) => name.includes(kw))) {
    return 'form';
  }
  const layoutKeywords = ['容器', '布局', 'layout', 'grid', '栅格', 'flex', '卡片', 'panel', 'section'];
  if (layoutKeywords.some((kw) => name.includes(kw))) {
    return 'layout';
  }
  return 'other';
}

function renderCanvasContent(item: CanvasItem, definition?: ComponentDefinition | null) {
  if (item.loading) {
    return <Skeleton active style={{ padding: 16 }} />;
  }
  if (item.error) {
    return (
      <Result
        status="warning"
        title="渲染失败"
        subTitle={item.error}
        style={{ padding: '16px 0' }}
      />
    );
  }
  if (definition && item.component.type === 'chart') {
    return <ChartRenderer componentId={item.component.componentId} definition={definition} />;
  }
  return (
    <img
      src={item.component.previewUrl}
      alt={item.component.componentName}
      style={{ width: '100%', height: 240, objectFit: 'cover' }}
    />
  );
}

interface PropertyPanelProps {
  item?: CanvasItem;
  onPropChange: (field: string, value: any) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ item, onPropChange }) => {
  if (!item) {
    return <Empty description="请选择画布中的组件实例" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  if (!item.definition) {
    return <Empty description="组件定义加载中..." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  if (!item.definition.propsSchema || item.definition.propsSchema.length === 0) {
    return <Empty description="该组件暂无可配置属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  const values = item.propsValues || {};
  return (
    <Form layout="vertical">
      {item.definition.propsSchema.map((schema) => (
        <Form.Item key={schema.field} label={schema.label} tooltip={schema.description}>
          {renderFormField(schema.type, values[schema.field] ?? schema.default, schema.options, (value) => onPropChange(schema.field, value))}
        </Form.Item>
      ))}
    </Form>
  );
};

function renderFormField(
  type: string,
  value: any,
  options: Array<{ label: string; value: any }> | undefined,
  onChange: (value: any) => void
) {
  if (type === 'boolean') {
    return <Switch checked={Boolean(value)} onChange={(checked) => onChange(checked)} />;
  }
  if (type === 'number') {
    return <InputNumber style={{ width: '100%' }} value={value} onChange={(val) => onChange(val)} />;
  }
  if (type === 'enum' && options) {
    return <Select value={value} onChange={onChange} options={options} />;
  }
  return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
}

