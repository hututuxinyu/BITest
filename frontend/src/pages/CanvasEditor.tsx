import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
  Breadcrumb,
} from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  HighlightOutlined,
  ArrowLeftOutlined,
  DashboardOutlined,
  FundOutlined,
} from '@ant-design/icons';
import type { ComponentDefinition, ComponentSummary, Project, ReportSummary } from '../types';
import { componentApi } from '../services/componentApi';
import ChartRenderer from '../components/ChartRenderer';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { projectApi, reportApi } from '../services/api';
import EnhancedCanvas, { EnhancedCanvasItem } from '../components/EnhancedCanvas';
import CanvasToolbar from '../components/CanvasToolbar';
import { HistoryManager } from '../utils/historyManager';
import { calculateBoundingBox, distributeHorizontally, distributeVertically, Bounds } from '../utils/canvasUtils';

interface CanvasItem {
  id: string;
  component: ComponentSummary;
  definition?: ComponentDefinition | null;
  loading: boolean;
  error?: string;
  propsValues?: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
}

// 画布区域高度：100vh - 顶部导航栏60px - 编辑器顶部栏60px - 间距32px
const PANEL_HEIGHT = 'calc(100vh - 152px)';
const COMPONENT_PANEL_WIDTH = 250;
const PROPERTY_COLLAPSED_WIDTH = 64;
const PROPERTY_PANEL_WIDTH = 350;
const thumbnailIconStyle: React.CSSProperties = { fontSize: 32, color: '#3b76f6' };
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

interface CanvasEditorProps {
  user?: { userId: string; username?: string };
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ user }) => {
  const { projectId, reportId } = useParams<{ projectId?: string; reportId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as { project?: Project; report?: ReportSummary }) || {};
  const [projectContext, setProjectContext] = useState<Project | undefined>(locationState.project);
  const [reportContext, setReportContext] = useState<ReportSummary | undefined>(locationState.report);
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [componentTab, setComponentTab] = useState<'basic' | 'custom'>('basic');
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const historyManagerRef = useRef<HistoryManager<EnhancedCanvasItem[]>>(new HistoryManager(50));
  const effectiveUserId = user?.userId || 'user-001';
  const effectiveUsername = user?.username || user?.userId || 'admin';
  const canvasTitle = reportContext?.reportName || '未命名报表';
  const [reportTitle, setReportTitle] = useState(canvasTitle);
  const [language, setLanguage] = useState<'zh-CN' | 'en-US'>('zh-CN');
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
    if (projectId && !projectContext) {
      projectApi
        .enterProject(effectiveUserId, projectId)
        .then((response) => {
          if (response.success) {
            setProjectContext(response.data);
          } else {
            message.error(response.message || '工程信息加载失败');
          }
        })
        .catch(() => message.error('工程信息加载失败'));
    }
  }, [effectiveUserId, projectContext, projectId]);

  useEffect(() => {
    if (projectId && reportId && !reportContext) {
      reportApi
        .getReportDetail(projectId, reportId)
        .then((response) => {
          if (response.success) {
            setReportContext(response.data);
          } else {
            message.error(response.message || '报表信息加载失败');
          }
        })
        .catch(() => message.error('报表信息加载失败'));
    }
  }, [projectId, reportContext, reportId]);

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

  // 转换为EnhancedCanvasItem
  const convertToEnhancedItems = useCallback((items: CanvasItem[]): EnhancedCanvasItem[] => {
    return items.map((item, index) => ({
      id: item.id,
      component: item.component,
      definition: item.definition,
      loading: item.loading,
      error: item.error,
      propsValues: item.propsValues,
      position: item.position || { x: 50, y: 50 + index * 100 },
      size: item.size || { width: 400, height: 300 },
      zIndex: item.zIndex || index + 1,
    }));
  }, []);

  // 从EnhancedCanvasItem转换回CanvasItem
  const convertFromEnhancedItems = useCallback((items: EnhancedCanvasItem[]): CanvasItem[] => {
    return items.map((item) => ({
      id: item.id,
      component: item.component,
      definition: item.definition,
      loading: item.loading,
      error: item.error,
      propsValues: item.propsValues,
      position: item.position,
      size: item.size,
      zIndex: item.zIndex,
    }));
  }, []);

  const [enhancedItems, setEnhancedItems] = useState<EnhancedCanvasItem[]>([]);

  useEffect(() => {
    setEnhancedItems(convertToEnhancedItems(canvasItems));
  }, [canvasItems, convertToEnhancedItems]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('component');
    if (!data) {
      return;
    }
    const component = JSON.parse(data) as ComponentSummary;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - 50;
    const y = (e.clientY - rect.top) / zoom - 50;

    const newItem: CanvasItem = {
      id: `${component.componentId}-${Date.now()}`,
      component,
      loading: true,
      position: { x: Math.max(0, x), y: Math.max(0, y) },
      size: { width: 400, height: 300 },
      zIndex: canvasItems.length + 1,
    };
    const updatedItems = [...canvasItems, newItem];
    setCanvasItems(updatedItems);
    setSelectedItemIds([newItem.id]);
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
        historyManagerRef.current.push(convertToEnhancedItems([...canvasItems, newItem]));
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
    if (selectedItemIds.length === 0) {
      return;
    }
    setCanvasItems((prev) =>
      prev.map((item) =>
        selectedItemIds.includes(item.id)
          ? {
              ...item,
              propsValues: { ...(item.propsValues || {}), [field]: value },
            }
          : item
      )
    );
  };

  const selectedItem = canvasItems.find((item) => selectedItemIds.includes(item.id));

  // 画布增强功能处理函数
  const handleItemsChange = useCallback(
    (items: EnhancedCanvasItem[]) => {
      setEnhancedItems(items);
      setCanvasItems(convertFromEnhancedItems(items));
    },
    [convertFromEnhancedItems]
  );

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedItemIds(ids);
  }, []);

  const handleItemSelect = useCallback((id: string) => {
    setSelectedItemIds([id]);
  }, []);

  // 对齐功能
  const handleAlignLeft = useCallback(() => {
    if (selectedItemIds.length < 2) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const minX = Math.min(...selectedItems.map((item) => item.position.x));
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, position: { ...item.position, x: minX } } : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleAlignCenter = useCallback(() => {
    if (selectedItemIds.length < 2) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const bounds = calculateBoundingBox(
      selectedItems.map((item) => ({
        x: item.position.x,
        y: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }))
    );
    if (bounds) {
      const centerX = bounds.x + bounds.width / 2;
      const updatedItems = enhancedItems.map((item) =>
        selectedItemIds.includes(item.id)
          ? { ...item, position: { ...item.position, x: centerX - item.size.width / 2 } }
          : item
      );
      handleItemsChange(updatedItems);
      historyManagerRef.current.push(updatedItems);
    }
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleAlignRight = useCallback(() => {
    if (selectedItemIds.length < 2) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const maxX = Math.max(...selectedItems.map((item) => item.position.x + item.size.width));
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id)
        ? { ...item, position: { ...item.position, x: maxX - item.size.width } }
        : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleAlignTop = useCallback(() => {
    if (selectedItemIds.length < 2) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const minY = Math.min(...selectedItems.map((item) => item.position.y));
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, position: { ...item.position, y: minY } } : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleAlignMiddle = useCallback(() => {
    if (selectedItemIds.length < 2) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const bounds = calculateBoundingBox(
      selectedItems.map((item) => ({
        x: item.position.x,
        y: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }))
    );
    if (bounds) {
      const centerY = bounds.y + bounds.height / 2;
      const updatedItems = enhancedItems.map((item) =>
        selectedItemIds.includes(item.id)
          ? { ...item, position: { ...item.position, y: centerY - item.size.height / 2 } }
          : item
      );
      handleItemsChange(updatedItems);
      historyManagerRef.current.push(updatedItems);
    }
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleAlignBottom = useCallback(() => {
    if (selectedItemIds.length < 2) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const maxY = Math.max(...selectedItems.map((item) => item.position.y + item.size.height));
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id)
        ? { ...item, position: { ...item.position, y: maxY - item.size.height } }
        : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  // 分布功能
  const handleDistributeHorizontally = useCallback(() => {
    if (selectedItemIds.length < 3) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const bounds: Bounds[] = selectedItems.map((item) => ({
      x: item.position.x,
      y: item.position.y,
      width: item.size.width,
      height: item.size.height,
    }));
    const distributed = distributeHorizontally(bounds);
    const itemMap = new Map(selectedItems.map((item, index) => [item.id, index]));
    const updatedItems = enhancedItems.map((item) => {
      const index = itemMap.get(item.id);
      if (index !== undefined) {
        return { ...item, position: { ...item.position, x: distributed[index].x } };
      }
      return item;
    });
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleDistributeVertically = useCallback(() => {
    if (selectedItemIds.length < 3) {
      return;
    }
    const selectedItems = enhancedItems.filter((item) => selectedItemIds.includes(item.id));
    const bounds: Bounds[] = selectedItems.map((item) => ({
      x: item.position.x,
      y: item.position.y,
      width: item.size.width,
      height: item.size.height,
    }));
    const distributed = distributeVertically(bounds);
    const itemMap = new Map(selectedItems.map((item, index) => [item.id, index]));
    const updatedItems = enhancedItems.map((item) => {
      const index = itemMap.get(item.id);
      if (index !== undefined) {
        return { ...item, position: { ...item.position, y: distributed[index].y } };
      }
      return item;
    });
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  // 层级管理
  const handleBringToFront = useCallback(() => {
    if (selectedItemIds.length === 0) {
      return;
    }
    const maxZIndex = Math.max(...enhancedItems.map((item) => item.zIndex));
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, zIndex: maxZIndex + 1 } : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleSendToBack = useCallback(() => {
    if (selectedItemIds.length === 0) {
      return;
    }
    const minZIndex = Math.min(...enhancedItems.map((item) => item.zIndex));
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, zIndex: minZIndex - 1 } : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleBringForward = useCallback(() => {
    if (selectedItemIds.length === 0) {
      return;
    }
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, zIndex: item.zIndex + 1 } : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  const handleSendBackward = useCallback(() => {
    if (selectedItemIds.length === 0) {
      return;
    }
    const updatedItems = enhancedItems.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, zIndex: Math.max(1, item.zIndex - 1) } : item
    );
    handleItemsChange(updatedItems);
    historyManagerRef.current.push(updatedItems);
  }, [selectedItemIds, enhancedItems, handleItemsChange]);

  // 撤销/重做
  const handleUndo = useCallback(() => {
    const state = historyManagerRef.current.undo();
    if (state) {
      handleItemsChange(state);
      setSelectedItemIds([]);
    }
  }, [handleItemsChange]);

  const handleRedo = useCallback(() => {
    const state = historyManagerRef.current.redo();
    if (state) {
      handleItemsChange(state);
      setSelectedItemIds([]);
    }
  }, [handleItemsChange]);
  useEffect(() => {
    setReportTitle(canvasTitle);
  }, [canvasTitle]);
  const handleBackToProject = () => {
    if (projectContext) {
      navigate(`/projects/${projectContext.projectId}/workspace`, { state: { project: projectContext } });
    } else {
      navigate('/projects');
    }
  };

  const breadcrumbItems = [
    { title: '工程管理', onClick: () => navigate('/projects') },
    projectContext
      ? {
          title: projectContext.projectName,
          onClick: () =>
            navigate(`/projects/${projectContext.projectId}/workspace`, { state: { project: projectContext } }),
        }
      : { title: '工程详情' },
    { title: canvasTitle },
  ];

  return (
    <div
      style={{
        marginTop: -24,
        marginLeft: -24,
        marginRight: -24,
        marginBottom: -24,
        padding: 24,
      }}
    >
      <div className="editor-top-bar">
        <div className="editor-top-section">
          <Avatar style={{ backgroundColor: '#666666', color: '#fff' }}>{effectiveUsername[0]?.toUpperCase()}</Avatar>
          <div>
            <div style={{ fontSize: 12, color: '#475569' }}>当前用户</div>
            <strong>{effectiveUsername}</strong>
          </div>
        </div>
        <Space size="large" wrap align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToProject}>
            返回工程
          </Button>
          <Breadcrumb items={breadcrumbItems} />
        </Space>
        <Space size="middle" wrap align="center">
          <Input
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="请输入报表名称"
            style={{ width: 220 }}
          />
          <Select
            className="editor-language-select"
            value={language}
            onChange={(value: 'zh-CN' | 'en-US') => setLanguage(value)}
            options={[
              { label: '中文', value: 'zh-CN' },
              { label: 'English', value: 'en-US' },
            ]}
          />
          <Button type="primary">保存报表</Button>
          <Button>预览运行态</Button>
          <Button type="dashed">发布报表</Button>
        </Space>
      </div>
      {(projectContext || reportContext) && (
        <div className="editor-context-strip">
          <Space wrap size="middle">
            {projectContext && (
              <Tag color={projectContext.projectType === 'private' ? 'gold' : 'green'}>
                {projectContext.projectType === 'private' ? '个人工程' : '公共工程'}
              </Tag>
            )}
            {reportContext && (
              <Tag color={reportContext.status === 'published' ? 'green' : 'gold'}>
                {reportContext.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            )}
            <span>当前报表：{canvasTitle}</span>
          </Space>
        </div>
      )}
      <Layout
        className="editor-layout-wrapper"
        style={{
          minHeight: PANEL_HEIGHT,
          background: 'transparent',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <Layout.Sider width={COMPONENT_PANEL_WIDTH} theme="light" style={{ background: 'transparent', height: PANEL_HEIGHT }}>
          <Card
            className="component-panel-card"
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
                                  {renderComponentGrid(groupedComponents.chart, loading, handleDragStart, 'chart')}
                                </div>
                              ),
                            },
                            {
                              key: 'form',
                              label: `表单 (${groupedComponents.form.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.form, loading, handleDragStart, 'form')}
                                </div>
                              ),
                            },
                            {
                              key: 'layout',
                              label: `布局 (${groupedComponents.layout.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.layout, loading, handleDragStart, 'layout')}
                                </div>
                              ),
                            },
                            {
                              key: 'other',
                              label: `其他 (${groupedComponents.other.length})`,
                              children: (
                                <div style={{ padding: '8px 0' }}>
                                  {renderComponentGrid(groupedComponents.other, loading, handleDragStart, 'other')}
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
              bodyStyle={{
                height: PANEL_HEIGHT,
                background: '#fff',
                border: '1px dashed #d0d0d0',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CanvasToolbar
                zoom={zoom}
                onZoomIn={() => setZoom((z) => Math.min(3, z + 0.1))}
                onZoomOut={() => setZoom((z) => Math.max(0.1, z - 0.1))}
                onZoomFit={() => {
                  setZoom(1);
                  message.info('画布已适应窗口');
                }}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid((g) => !g)}
                canUndo={historyManagerRef.current.canUndo()}
                canRedo={historyManagerRef.current.canRedo()}
                onUndo={handleUndo}
                onRedo={handleRedo}
                selectedCount={selectedItemIds.length}
                onAlignLeft={handleAlignLeft}
                onAlignCenter={handleAlignCenter}
                onAlignRight={handleAlignRight}
                onAlignTop={handleAlignTop}
                onAlignMiddle={handleAlignMiddle}
                onAlignBottom={handleAlignBottom}
                onDistributeHorizontally={handleDistributeHorizontally}
                onDistributeVertically={handleDistributeVertically}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
              />
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {enhancedItems.length === 0 ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Empty description="拖拽左侧组件到画布区域，开始构建布局" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                ) : (
                  <EnhancedCanvas
                    items={enhancedItems}
                    selectedIds={selectedItemIds}
                    onItemsChange={handleItemsChange}
                    onSelectionChange={handleSelectionChange}
                    onItemSelect={handleItemSelect}
                    renderItem={(item) => {
                      const canvasItem = canvasItems.find((ci) => ci.id === item.id);
                      if (!canvasItem) {
                        return null;
                      }
                      const effectiveDefinition =
                        canvasItem.definition && canvasItem.propsValues
                          ? {
                              ...canvasItem.definition,
                              defaultProps: { ...canvasItem.definition.defaultProps, ...canvasItem.propsValues },
                            }
                          : canvasItem.definition;
                      return (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {renderCanvasContent(canvasItem, effectiveDefinition)}
                        </div>
                      );
                    }}
                    canvasWidth={1920}
                    canvasHeight={1080}
                    gridSize={10}
                    showGrid={showGrid}
                    showAlignmentLines={true}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    historyManager={historyManagerRef.current}
                  />
                )}
              </div>
            </Card>
          </Layout.Content>
          <Layout.Sider
            width={propertyPanelCollapsed ? PROPERTY_COLLAPSED_WIDTH : PROPERTY_PANEL_WIDTH}
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
                className="property-panel-card"
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
                  <PropertyPanel
                    item={selectedItem}
                    onPropChange={handlePropChange}
                    selectedCount={selectedItemIds.length}
                  />
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
              borderRadius: 8,
              background: '#fff',
              cursor: 'grab',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
              aspectRatio: '1',
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
              {renderThumbnailContent(item)}
            </div>
            <div
              style={{
                padding: '6px 8px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#333',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center',
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
  const lowerAlias = (component.alias || '').toLowerCase();
  
  // 条形图
  if (lowerName.includes('条形') || lowerAlias.includes('barchart')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 柱状图
  if (lowerName.includes('柱') || lowerName.includes('bar')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 折线图
  if (lowerName.includes('折') || lowerName.includes('line')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  // 面积图
  if (lowerName.includes('面积') || lowerAlias.includes('areachart')) {
    return <FundOutlined style={thumbnailIconStyle} />;
  }
  // 饼图
  if (lowerName.includes('饼') || lowerName.includes('pie')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 环形图
  if (lowerName.includes('环形') || lowerAlias.includes('donutchart')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 仪表盘
  if (lowerName.includes('仪表') || lowerAlias.includes('dashboard')) {
    return <DashboardOutlined style={thumbnailIconStyle} />;
  }
  // 象形图
  if (lowerName.includes('象形') || lowerAlias.includes('pictorialchart')) {
    return <AppstoreOutlined style={thumbnailIconStyle} />;
  }
  // 柱线图
  if (lowerName.includes('柱线') || lowerAlias.includes('barlinechart')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 散点图
  if (lowerName.includes('散') || lowerName.includes('dot') || lowerName.includes('点') || lowerName.includes('bubble') || lowerAlias.includes('scatterchart')) {
    return <DotChartOutlined style={thumbnailIconStyle} />;
  }
  
  // 其他组件如果有预览图或图标，则显示图片
  const previewSrc = component.previewUrl?.trim() || component.icon?.trim();
  if (previewSrc) {
    return <img src={previewSrc} alt={component.componentName} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />;
  }
  
  // 否则使用占位符图标
  return getPlaceholderIcon(component);
}

function getPlaceholderIcon(component: ComponentSummary) {
  const lowerName = component.componentName.toLowerCase();
  const lowerAlias = (component.alias || '').toLowerCase();
  
  // 条形图
  if (lowerName.includes('条形') || lowerAlias.includes('barchart')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 柱状图
  if (lowerName.includes('柱') || lowerName.includes('bar')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 折线图
  if (lowerName.includes('折') || lowerName.includes('line')) {
    return <LineChartOutlined style={thumbnailIconStyle} />;
  }
  // 面积图
  if (lowerName.includes('面积') || lowerAlias.includes('areachart')) {
    return <FundOutlined style={thumbnailIconStyle} />;
  }
  // 饼图
  if (lowerName.includes('饼') || lowerName.includes('pie')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 环形图
  if (lowerName.includes('环形') || lowerAlias.includes('donutchart')) {
    return <PieChartOutlined style={thumbnailIconStyle} />;
  }
  // 仪表盘
  if (lowerName.includes('仪表') || lowerAlias.includes('dashboard')) {
    return <DashboardOutlined style={thumbnailIconStyle} />;
  }
  // 象形图
  if (lowerName.includes('象形') || lowerAlias.includes('pictorialchart')) {
    return <AppstoreOutlined style={thumbnailIconStyle} />;
  }
  // 柱线图
  if (lowerName.includes('柱线') || lowerAlias.includes('barlinechart')) {
    return <BarChartOutlined style={thumbnailIconStyle} />;
  }
  // 散点图
  if (lowerName.includes('散') || lowerName.includes('dot') || lowerName.includes('点') || lowerName.includes('bubble') || lowerAlias.includes('scatterchart')) {
    return <DotChartOutlined style={thumbnailIconStyle} />;
  }
  // 默认图表图标
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
  selectedCount?: number;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ item, onPropChange, selectedCount = 0 }) => {
  if (selectedCount === 0) {
    return <Empty description="请选择画布中的组件实例" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  if (selectedCount > 1) {
    return <Empty description={`已选择 ${selectedCount} 个组件，请选择单个组件进行属性编辑`} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
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


