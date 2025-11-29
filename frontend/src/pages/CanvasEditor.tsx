import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Card,
  Empty,
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
  Button,
  Input,
} from 'antd';
import {
  CaretLeftOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { ComponentDefinition, ComponentSummary, DatasourceConfig, Project, ReportSummary } from '../types';
import { componentApi } from '../services/componentApi';
import ChartRenderer from '../components/ChartRenderer';
import { useLocation, useParams } from 'react-router-dom';
import { projectApi, reportApi } from '../services/api';
import EnhancedCanvas, { EnhancedCanvasItem } from '../components/EnhancedCanvas';
import CanvasToolbar from '../components/CanvasToolbar';
import { HistoryManager } from '../utils/historyManager';
import { calculateBoundingBox, distributeHorizontally, distributeVertically, Bounds } from '../utils/canvasUtils';
import DatasourceConfigPanel from '../components/DatasourceConfigPanel';
import InteractionConfigPanel from '../components/InteractionConfigPanel';
import { useEditorContext } from '../contexts/EditorContext';

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

// 画布区域高度：100%
const PANEL_HEIGHT = '100%';
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
  const location = useLocation();
  const locationState = (location.state as { project?: Project; report?: ReportSummary }) || {};
  const [projectContext, setProjectContext] = useState<Project | undefined>(locationState.project);
  const [reportContext, setReportContext] = useState<ReportSummary | undefined>(locationState.report);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
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
  const schemaLoadedKeyRef = useRef<string>(''); // 标记已加载的Schema标识（projectId-reportId），避免重复加载
  const effectiveUserId = user?.userId || 'user-001';
  const editorContext = useEditorContext();

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

  // 将Schema中的componentType映射到componentId
  const mapComponentTypeToId = useCallback((componentType: string): string => {
    const typeMap: Record<string, string> = {
      barChart: 'chart-bar',
      lineChart: 'chart-line',
      pieChart: 'chart-pie',
      table: 'chart-table',
      gauge: 'chart-gauge',
      image: 'media-image',
      video: 'media-video',
      text: 'media-text',
      button: 'control-button',
      filter: 'control-filter',
      input: 'control-input',
    };
    return typeMap[componentType] || componentType;
  }, []);


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

  // 解析Schema并加载到画布
  const loadSchemaToCanvas = useCallback(async (schema: any) => {
    if (!schema || !schema.components || !Array.isArray(schema.components)) {
      return;
    }

    try {
      // 获取所有组件列表，用于查找组件定义
      const allComponents = await componentApi.listComponents({});
      const componentMap = new Map(allComponents.map((c) => [c.componentId, c]));

      // 解析Schema中的组件
      const parsedItems: CanvasItem[] = [];
      
      for (const schemaComponent of schema.components) {
        // 跳过不可见的组件
        if (schemaComponent.visible === false) {
          continue;
        }

        // 映射componentType到componentId
        const componentId = mapComponentTypeToId(schemaComponent.componentType || '');
        const component = componentMap.get(componentId);

        if (!component) {
          console.warn(`未找到组件: ${componentId} (componentType: ${schemaComponent.componentType})`);
          continue;
        }

        // 创建CanvasItem
        const canvasItem: CanvasItem = {
          id: schemaComponent.componentId || `${componentId}-${Date.now()}`,
          component,
          loading: true,
          position: schemaComponent.position || { x: 100, y: 100 },
          size: schemaComponent.size || { width: 400, height: 300 },
          zIndex: schemaComponent.zIndex || parsedItems.length + 1,
          propsValues: schemaComponent.props || {},
          datasourceConfig: schemaComponent.datasourceConfig || undefined,
        };

        parsedItems.push(canvasItem);

        // 异步加载组件定义
        componentApi
          .getDefinition(componentId)
          .then((def) => {
            if (def) {
              setCanvasItems((prev) =>
                prev.map((item) =>
                  item.id === canvasItem.id
                    ? {
                        ...item,
                        definition: def,
                        loading: false,
                        propsValues: {
                          ...def.defaultProps,
                          ...schemaComponent.props,
                        },
                      }
                    : item
                )
              );
            } else {
              setCanvasItems((prev) =>
                prev.map((item) =>
                  item.id === canvasItem.id
                    ? {
                        ...item,
                        loading: false,
                        error: '未找到组件定义',
                      }
                    : item
                )
              );
            }
          })
          .catch(() => {
            setCanvasItems((prev) =>
              prev.map((item) =>
                item.id === canvasItem.id
                  ? {
                      ...item,
                      loading: false,
                      error: '加载组件定义失败',
                    }
                  : item
              )
            );
          });
      }

      // 设置初始画布项
      setCanvasItems(parsedItems);
      
      // 更新历史记录
      if (parsedItems.length > 0) {
        const enhancedItems = convertToEnhancedItems(parsedItems);
        historyManagerRef.current.push(enhancedItems);
      }

      message.success(`已加载 ${parsedItems.length} 个组件到画布`);
    } catch (error: any) {
      console.error('加载Schema失败:', error);
      message.error('加载Schema失败: ' + (error.message || '未知错误'));
    }
  }, [mapComponentTypeToId, convertToEnhancedItems]);

  // 当切换报表时，清空画布并重置加载标记
  useEffect(() => {
    const schemaKey = `${projectId}-${reportId}`;
    
    // 如果projectId或reportId变化，且与已加载的报表不同，则清空画布
    if (projectId && reportId && schemaLoadedKeyRef.current && schemaLoadedKeyRef.current !== schemaKey) {
      setCanvasItems([]);
      setSelectedItemIds([]);
      schemaLoadedKeyRef.current = ''; // 重置加载标记
      historyManagerRef.current.clear(); // 清空历史记录
    }
  }, [projectId, reportId]);

  // 自动加载Schema
  useEffect(() => {
    if (!projectId || !reportId || !reportContext) {
      return;
    }
    
    // 生成唯一标识，用于判断是否需要重新加载
    const schemaKey = `${projectId}-${reportId}`;
    
    // 如果已经加载过这个报表的Schema，则不加载（避免重复加载）
    if (schemaLoadedKeyRef.current === schemaKey) {
      return;
    }
    
    // 标记为正在加载/已加载
    schemaLoadedKeyRef.current = schemaKey;
    
    reportApi
      .getReportSchema(projectId, reportId)
      .then((response) => {
        if (response.success && response.data) {
          loadSchemaToCanvas(response.data);
          schemaLoadedKeyRef.current = schemaKey; // 标记为已加载
        } else {
          // Schema不存在或为空，不显示错误（可能是新报表）
          console.log('报表Schema为空或不存在，将显示空白画布');
          schemaLoadedKeyRef.current = schemaKey; // 即使为空也标记，避免重复请求
        }
      })
      .catch((error) => {
        // Schema加载失败，可能是新报表还没有Schema，不显示错误
        console.log('加载Schema失败（可能是新报表）:', error);
        schemaLoadedKeyRef.current = ''; // 加载失败，重置标记，允许重试
      });
  }, [projectId, reportId, reportContext, loadSchemaToCanvas]);

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
  
  // 使用EditorContext同步状态
  useEffect(() => {
    if (projectContext) {
      editorContext.setProjectContext(projectContext);
    }
  }, [projectContext, editorContext]);

  useEffect(() => {
    if (reportContext) {
      editorContext.setReportContext(reportContext);
      if (reportContext.reportName) {
        editorContext.setReportTitle(reportContext.reportName);
      }
    }
  }, [reportContext, editorContext]);

  return (
    <div
      style={{
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Layout
        className="editor-layout-wrapper"
        style={{
          height: '100%',
          background: 'transparent',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <Layout style={{ background: 'transparent', gap: 16, alignItems: 'stretch', flex: 1 }}>
          <Layout.Content>
            <Card
              bodyStyle={{
                height: '100%',
                background: '#fff',
                border: '1px dashed #d0d0d0',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
              }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
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
                backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)',
                backgroundSize: `${10 * zoom}px ${10 * zoom}px`,
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
  return <Input value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} style={{ width: '100%' }} />;
}


