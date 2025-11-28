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
  Modal,
  Tooltip,
} from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DashboardOutlined,
  FundOutlined,
  SaveOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ComponentDefinition, ComponentSummary, DatasourceConfig, Project, ReportSummary } from '../types';
import { componentApi } from '../services/componentApi';
import ChartRenderer from '../components/ChartRenderer';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { projectApi, reportApi } from '../services/api';
import EnhancedCanvas, { EnhancedCanvasItem } from '../components/EnhancedCanvas';
import CanvasToolbar from '../components/CanvasToolbar';
import { HistoryManager } from '../utils/historyManager';
import { calculateBoundingBox, distributeHorizontally, distributeVertically, Bounds } from '../utils/canvasUtils';
import DatasourceConfigPanel from '../components/DatasourceConfigPanel';
import InteractionConfigPanel from '../components/InteractionConfigPanel';

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
  datasourceConfig?: DatasourceConfig;
}

// 画布区域高度：100vh - 顶部导航栏60px
const PANEL_HEIGHT = 'calc(100vh - 60px)';
const COMPONENT_PANEL_WIDTH = 250;
const COMPONENT_COLLAPSED_WIDTH = 8;
const PROPERTY_COLLAPSED_WIDTH = 8;
const PROPERTY_PANEL_WIDTH = 230;
const RULER_SIZE = 24;
const RULER_INTERVAL = 100;
const PROPERTY_LABEL_WIDTH = 72;
const FORM_ITEM_SPACING = 12;
const thumbnailIconStyle: React.CSSProperties = { fontSize: 32, color: '#3b76f6', transform: 'none' };
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
  const [componentPanelCollapsed, setComponentPanelCollapsed] = useState(false);
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(false);
  const [configTab, setConfigTab] = useState<'property' | 'datasource' | 'interaction'>('property');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const horizontalMarks = useMemo(
    () => Array.from({ length: Math.floor(1920 / RULER_INTERVAL) + 1 }, (_, index) => index * RULER_INTERVAL),
    []
  );
  const verticalMarks = useMemo(
    () => Array.from({ length: Math.floor(1080 / RULER_INTERVAL) + 1 }, (_, index) => index * RULER_INTERVAL),
    []
  );
  const historyManagerRef = useRef<HistoryManager<EnhancedCanvasItem[]>>(new HistoryManager(50));
  const effectiveUserId = user?.userId || 'user-001';
  const effectiveUsername = user?.username || user?.userId || 'admin';
  const canvasTitle = reportContext?.reportName || '未命名报表';
  const [reportTitle, setReportTitle] = useState(canvasTitle);
  const [language, setLanguage] = useState<'zh-CN' | 'en-US'>('zh-CN');
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
    datasourceConfig: item.datasourceConfig,
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
    datasourceConfig: item.datasourceConfig,
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

const handleDatasourceConfigChange = useCallback(
  (config: DatasourceConfig) => {
    if (selectedItemIds.length === 0) {
      return;
    }
    setCanvasItems((prev) =>
      prev.map((item) =>
        selectedItemIds.includes(item.id)
          ? {
              ...item,
              datasourceConfig: config,
            }
          : item
      )
    );
  },
  [selectedItemIds]
);

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

  const handleClearCanvas = useCallback(() => {
    Modal.confirm({
      title: '确认清空画布',
      content: '清空画布将删除所有组件，此操作不可撤销，是否继续？',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        handleItemsChange([]);
        setSelectedItemIds([]);
        historyManagerRef.current.clear();
        message.success('画布已清空');
      },
    });
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
        {/* 左侧：用户信息和返回按钮 */}
        <div className="editor-top-section">
          <Space size="middle">
            <Avatar style={{ backgroundColor: '#666666', color: '#fff' }}>{effectiveUsername[0]?.toUpperCase()}</Avatar>
            <div>
              <div style={{ fontSize: 12, color: '#475569' }}>当前用户</div>
              <strong>{effectiveUsername}</strong>
            </div>
            <Button icon={<CaretLeftOutlined />} onClick={handleBackToProject} size="small">
              返回工程管理
            </Button>
          </Space>
        </div>
        {/* 中间：报表名称（可编辑） */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Input
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="请输入报表名称"
            style={{ width: 300, textAlign: 'center' }}
            bordered={false}
          />
        </div>
        {/* 右侧：操作按钮组和语言切换 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 220 }}>
          <Space size="middle" wrap align="center">
            <Tooltip title="保存">
              <Button
                type="primary"
                shape="circle"
                icon={<SaveOutlined />}
                aria-label="保存"
              />
            </Tooltip>
            <Tooltip title="预览">
              <Button
                shape="circle"
                icon={<EyeOutlined />}
                aria-label="预览"
              />
            </Tooltip>
            <Tooltip title="发布">
              <Button
                type="dashed"
                shape="circle"
                icon={<SendOutlined style={{ transform: 'rotate(315deg)' }} />}
                aria-label="发布"
              />
            </Tooltip>
            <Select
              className="editor-language-select"
              value={language}
              onChange={(value: 'zh-CN' | 'en-US') => setLanguage(value)}
              options={[
                { label: '中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
              ]}
            />
          </Space>
        </div>
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
        <div style={{ position: 'relative', height: PANEL_HEIGHT }}>
          <Layout.Sider
            width={componentPanelCollapsed ? COMPONENT_COLLAPSED_WIDTH : COMPONENT_PANEL_WIDTH}
            theme="light"
            style={{
              background: 'transparent',
              height: PANEL_HEIGHT,
              transition: 'width 0.2s ease',
            }}
          >
            {componentPanelCollapsed ? (
              <Card
                className="component-panel-card"
                bordered={false}
                bodyStyle={{ padding: 0, height: PANEL_HEIGHT }}
                style={{ borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}
              />
            ) : (
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
                          defaultActiveKey={['basicChart']}
                          bordered={false}
                          ghost
                          style={{ flex: 1, overflow: 'auto', background: 'transparent' }}
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
                    <div style={{ padding: 16, height: 'calc(100vh - 284px)' }}>
                      <Empty description="自定义组件管理功能建设中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ),
                },
              ]}
            />
            </Card>
          )}
          </Layout.Sider>
          <Button
            type="text"
            icon={componentPanelCollapsed ? <CaretRightOutlined /> : <CaretLeftOutlined />}
            onClick={() => setComponentPanelCollapsed(!componentPanelCollapsed)}
            style={{
              position: 'absolute',
              right: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e8e8e8',
            }}
            title={componentPanelCollapsed ? '展开组件库' : '收起组件库'}
          />
        </div>
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
                onClearCanvas={handleClearCanvas}
              />
          <div
            style={{
              flex: 1,
              position: 'relative',
              paddingLeft: RULER_SIZE,
              paddingTop: RULER_SIZE,
              background: '#f8f9fb',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: RULER_SIZE,
                right: 0,
                height: RULER_SIZE,
                backgroundColor: '#fdfdfd',
                borderBottom: '1px solid #e1e6ef',
                backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px)',
                backgroundSize: `${10 * zoom}px 100%`,
                pointerEvents: 'none',
                fontSize: 10,
                color: '#7b8294',
                lineHeight: `${RULER_SIZE}px`,
                zIndex: 5,
              }}
            >
              {horizontalMarks.map((value) => (
                <span
                  key={`h-mark-${value}`}
                  style={{
                    position: 'absolute',
                    left: value * zoom,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                top: RULER_SIZE,
                left: 0,
                bottom: 0,
                width: RULER_SIZE,
                backgroundColor: '#fdfdfd',
                borderRight: '1px solid #e1e6ef',
                backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)',
                backgroundSize: `100% ${10 * zoom}px`,
                pointerEvents: 'none',
                fontSize: 10,
                color: '#7b8294',
                zIndex: 5,
              }}
            >
              {verticalMarks.map((value) => (
                <span
                  key={`v-mark-${value}`}
                  style={{
                    position: 'absolute',
                    top: value * zoom,
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    transformOrigin: 'center',
                    width: RULER_SIZE,
                    textAlign: 'center',
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: RULER_SIZE,
                height: RULER_SIZE,
                background: '#eef1f6',
                borderRight: '1px solid #e1e6ef',
                borderBottom: '1px solid #e1e6ef',
                zIndex: 6,
              }}
            />
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
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
                    const effectiveDefinition = (() => {
                      if (!canvasItem.definition) {
                        return canvasItem.definition;
                      }
                      let mergedDefinition: ComponentDefinition = canvasItem.definition;
                      if (canvasItem.propsValues) {
                        mergedDefinition = {
                          ...mergedDefinition,
                          defaultProps: { ...mergedDefinition.defaultProps, ...canvasItem.propsValues },
                        };
                      }
                      if (
                        canvasItem.datasourceConfig?.bindingType === 'static' &&
                        canvasItem.datasourceConfig.staticConfig
                      ) {
                        mergedDefinition = {
                          ...mergedDefinition,
                          defaultData: canvasItem.datasourceConfig.staticConfig.data,
                        };
                      }
                      return mergedDefinition;
                    })();
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
              </div>
            </Card>
          </Layout.Content>
          <div style={{ position: 'relative', height: PANEL_HEIGHT }}>
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
                <Card
                  className="property-panel-card"
                  bordered={false}
                  style={{ height: '100%' }}
                  bodyStyle={{ padding: 0, height: '100%' }}
                />
              ) : (
                <Card
                  className="property-panel-card"
                  bordered={false}
                  style={{ height: '100%' }}
                  bodyStyle={{ padding: 0, height: '100%' }}
                >
                <Tabs
                  activeKey={configTab}
                  onChange={(key) => setConfigTab(key as 'property' | 'datasource' | 'interaction')}
                  size="small"
                  tabBarGutter={16}
                  items={[
                    {
                      key: 'property',
                      label: '属性',
                      children: (
                        <div style={{ padding: 16, height: `calc(${PANEL_HEIGHT} - 108px)`, overflow: 'auto' }}>
                          <PropertyPanel
                            item={selectedItem}
                            onPropChange={handlePropChange}
                            selectedCount={selectedItemIds.length}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'datasource',
                      label: '数据源',
                      children: (
                        <div style={{ padding: 16, height: `calc(${PANEL_HEIGHT} - 108px)`, overflow: 'auto' }}>
                          <DatasourceConfigPanel
                            componentId={selectedItem?.id}
                            componentDefinition={selectedItem?.definition}
                            onConfigChange={(config) => {
                              handleDatasourceConfigChange(config);
                              message.success('数据源配置已更新');
                            }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'interaction',
                      label: '交互',
                      children: (
                        <div style={{ padding: 16, height: `calc(${PANEL_HEIGHT} - 108px)`, overflow: 'auto' }}>
                          <InteractionConfigPanel
                            componentId={selectedItem?.id}
                            onConfigChange={() => {
                              message.success('交互配置已更新');
                            }}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            )}
            </Layout.Sider>
            <Button
              type="text"
              icon={propertyPanelCollapsed ? <CaretLeftOutlined /> : <CaretRightOutlined />}
              onClick={() => setPropertyPanelCollapsed(!propertyPanelCollapsed)}
              style={{
                position: 'absolute',
                left: -16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e8e8e8',
              }}
              title={propertyPanelCollapsed ? '展开属性面板' : '收起属性面板'}
            />
          </div>
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
    return (
      <ChartRenderer
        componentId={item.component.componentId}
        definition={definition}
        height="100%"
        width="100%"
      />
    );
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
    <>
      <Form layout="vertical" size="small">
        {item.definition.propsSchema.map((schema) => (
          <Form.Item key={schema.field} style={{ marginBottom: FORM_ITEM_SPACING }} tooltip={schema.description}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: `0 0 ${PROPERTY_LABEL_WIDTH}px`, color: '#111827', fontSize: 13, fontWeight: 500 }}>
                {schema.label}
              </div>
              <div style={{ flex: 1 }}>
                {renderFormField(
                  schema.type,
                  values[schema.field] ?? schema.default,
                  schema.options,
                  (value) => onPropChange(schema.field, value)
                )}
              </div>
            </div>
          </Form.Item>
        ))}
      </Form>
      <Collapse
        bordered={false}
        ghost
        style={{ background: 'transparent', marginTop: 8 }}
        defaultActiveKey={['size-position']}
        expandIcon={({ isActive }) => (
          <CaretLeftOutlined
            style={{
              fontSize: 12,
              color: '#6b7280',
              transform: isActive ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        )}
        expandIconPosition="end"
        items={[
          {
            key: 'size-position',
            label: (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#1f2937',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, marginLeft: -16 }}>大小与位置</div>
              </div>
            ),
            children: (
              <div style={{ paddingTop: FORM_ITEM_SPACING }}>
                <Form layout="vertical" size="small">
                  {[
                    { label: '宽度', field: 'width', fallback: item.size?.width || 0 },
                    { label: '高度', field: 'height', fallback: item.size?.height || 0 },
                    { label: 'X 坐标', field: 'x', fallback: item.position?.x || 0 },
                    { label: 'Y 坐标', field: 'y', fallback: item.position?.y || 0 },
                  ].map((control) => (
                    <Form.Item key={control.field} style={{ marginBottom: FORM_ITEM_SPACING }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: `0 0 ${PROPERTY_LABEL_WIDTH}px`, color: '#111827', fontSize: 13, fontWeight: 500 }}>
                          {control.label}
                        </div>
                        <div style={{ flex: 1 }}>
                          <InputNumber
                            size="small"
                            style={{ width: '100%' }}
                            value={Number(values[control.field]) || control.fallback || 0}
                            onChange={(val) => onPropChange(control.field, val)}
                          />
                        </div>
                      </div>
                    </Form.Item>
                  ))}
                </Form>
              </div>
            ),
          },
        ]}
      />
    </>
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
    return <Select value={value} onChange={onChange} options={options} style={{ width: '100%' }} />;
  }
  return <Input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }} />;
}


