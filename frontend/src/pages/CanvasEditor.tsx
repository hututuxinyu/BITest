import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Card,
  Empty,
  Input,
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
  CaretLeftOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { ComponentDefinition, ComponentSummary, DatasourceConfig, Project, ReportSummary } from '../types';
import { componentApi } from '../services/componentApi';
import ChartRenderer from '../components/ChartRenderer';
import FormRenderer from '../components/FormRenderer';
import TableRenderer from '../components/TableRenderer';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { projectApi, reportApi, templateApi } from '../services/api';
import type { TemplateDefinition } from '../types/reportCreation';
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
  parentId?: string; // 父组件ID，用于嵌套
  children?: string[]; // 子组件ID列表
}

const PROPERTY_COLLAPSED_WIDTH = 8;
const PROPERTY_PANEL_WIDTH = 230;
const RULER_SIZE = 24;
const RULER_INTERVAL = 100;
const PROPERTY_LABEL_WIDTH = 72;
const FORM_ITEM_SPACING = 12;

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
  
  // 获取 EditorContext（可能不存在，需要安全处理）
  let editorContext: ReturnType<typeof useEditorContext> | null = null;
  try {
    editorContext = useEditorContext();
  } catch (e) {
    // 如果不在 EditorContextProvider 中，editorContext 为 null
  }

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
    // 转换为小写以支持大小写不敏感的匹配
    const normalizedType = componentType.toLowerCase();
    const typeMap: Record<string, string> = {
      barchart: 'chart-bar',
      linechart: 'chart-line',
      piechart: 'chart-pie',
      radarchart: 'chart-radar',
      table: 'chart-table',
      treetable: 'chart-tree-table',
      gauge: 'chart-gauge',
      image: 'media-image',
      video: 'media-video',
      line: 'media-line',
      border: 'media-border',
      text: 'media-text',
      button: 'control-button',
      filter: 'control-filter',
      input: 'control-input',
      form: 'form-form',
      timeperiod: 'form-time-period',
      textarea: 'form-text',
      select: 'form-select',
      checkbox: 'form-checkbox',
      daterange: 'form-date-range',
      radio: 'form-radio',
      switch: 'form-switch',
    };
    return typeMap[normalizedType] || componentType;
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

      // 创建数据源映射表（从 schema.datasources）
      const datasourceMap = new Map();
      if (schema.datasources && Array.isArray(schema.datasources)) {
        for (const ds of schema.datasources) {
          datasourceMap.set(ds.datasourceId, ds);
        }
      }

      // 解析Schema中的组件
      const parsedItems: CanvasItem[] = [];
      const itemSchemaMap = new Map<string, any>(); // 存储itemId到schemaComponent的映射
      
      for (const schemaComponent of schema.components) {
        // 跳过不可见的组件
        if (schemaComponent.visible === false) {
          continue;
        }

        // 映射componentType到componentId
        const componentId = mapComponentTypeToId(schemaComponent.componentType || '');
        let component = componentMap.get(componentId);

        // 对于 border 组件，如果找不到，创建一个临时的组件对象
        if (!component && componentId === 'media-border') {
          component = {
            componentId: 'media-border',
            componentName: schemaComponent.componentName || '边框',
            alias: 'border',
            version: '1.0.0',
            type: 'media',
            icon: '',
            previewUrl: '',
            description: '边框组件',
            categories: ['border'],
            tags: ['border', 'media'],
            author: 'system',
            releaseTime: new Date().toISOString(),
          };
        }

        if (!component) {
          console.warn(`未找到组件: ${componentId} (componentType: ${schemaComponent.componentType})`);
          continue;
        }

        // 处理数据源配置
        // 优先级：data.datasetConfig > datasourceId (从 datasources 查找) > datasourceConfig > staticData
        let datasourceConfig: DatasourceConfig | undefined = undefined;
        
        // 1. 优先使用组件中的 data 字段（数据配置）
        if (schemaComponent.data) {
          if (schemaComponent.data.bindingType === 'dataset' && schemaComponent.data.datasetConfig) {
            datasourceConfig = {
              sourceType: 'dataset',
              bindingType: 'dataset',
              datasetConfig: {
                datasourceId: schemaComponent.data.datasetConfig.datasourceId || schemaComponent.datasourceId || '',
                query: schemaComponent.data.datasetConfig.query || '',
                params: schemaComponent.data.datasetConfig.params || {},
              },
            };
          } else if (schemaComponent.data.bindingType === 'static' && schemaComponent.data.staticConfig) {
            datasourceConfig = {
              sourceType: 'static',
              bindingType: 'static',
              staticConfig: {
                data: schemaComponent.data.staticConfig.data || [],
              },
            };
          }
        }
        
        // 2. 如果组件有 datasourceId 且没有 data 配置，从 datasources 中查找
        if (!datasourceConfig && schemaComponent.datasourceId) {
          const datasource = datasourceMap.get(schemaComponent.datasourceId);
          if (datasource && datasource.queryConfig) {
            // 将 schema 中的数据源格式转换为 DatasourceConfig 格式
            datasourceConfig = {
              sourceType: 'dataset',
              bindingType: 'dataset',
              datasetConfig: {
                datasourceId: datasource.datasourceId,
                query: datasource.queryConfig.sql || '',
                params: datasource.queryConfig.parameters?.reduce((acc: Record<string, any>, param: any) => {
                  acc[param.name] = param;
                  return acc;
                }, {}),
              },
            };
          }
        }
        
        // 3. 如果直接提供了 datasourceConfig，直接使用
        if (!datasourceConfig && schemaComponent.datasourceConfig) {
          datasourceConfig = schemaComponent.datasourceConfig;
        }
        
        // 4. 如果有 staticData 字段，使用静态数据
        if (!datasourceConfig && schemaComponent.staticData) {
          datasourceConfig = {
            sourceType: 'static',
            bindingType: 'static',
            staticConfig: {
              data: Array.isArray(schemaComponent.staticData) ? schemaComponent.staticData : [],
            },
          };
        }

        // 创建CanvasItem
        const itemId = schemaComponent.componentId || `${componentId}-${Date.now()}-${parsedItems.length}`;
        const canvasItem: CanvasItem = {
          id: itemId,
          component,
          loading: true,
          position: schemaComponent.position || { x: 100, y: 100 },
          size: schemaComponent.size || { width: 400, height: 300 },
          zIndex: schemaComponent.zIndex || parsedItems.length + 1,
          propsValues: schemaComponent.props || {},
          datasourceConfig,
        };

        parsedItems.push(canvasItem);
        itemSchemaMap.set(itemId, schemaComponent); // 保存映射关系
      }

      // 先设置初始画布项，确保异步更新时能找到对应的item
      setCanvasItems(parsedItems);

      // 然后异步加载每个组件的定义
      for (const canvasItem of parsedItems) {
        const schemaComponent = itemSchemaMap.get(canvasItem.id);
        const componentId = canvasItem.component.componentId;

        // 异步加载组件定义
        // 对于 border 组件，即使定义加载失败也不设置 error，因为可以直接使用 props 渲染
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
                          ...(schemaComponent?.props || {}),
                        },
                      }
                    : item
                )
              );
            } else {
              // 对于 border 组件，即使没有定义也不设置 error
              if (componentId === 'media-border') {
                setCanvasItems((prev) =>
                  prev.map((item) =>
                    item.id === canvasItem.id
                      ? {
                          ...item,
                          loading: false,
                          // 不设置 error，让组件直接使用 props 渲染
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
            }
          })
          .catch(() => {
            // 对于 border 组件，即使加载失败也不设置 error
            if (componentId === 'media-border') {
              setCanvasItems((prev) =>
                prev.map((item) =>
                  item.id === canvasItem.id
                    ? {
                        ...item,
                        loading: false,
                        // 不设置 error，让组件直接使用 props 渲染
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
                        error: '加载组件定义失败',
                      }
                    : item
                )
              );
            }
          });
      }
      
      // 更新画布尺寸到 EditorContext
      if (editorContext && schema.canvas) {
        editorContext.setCanvasWidth(schema.canvas.width || 1920);
        editorContext.setCanvasHeight(schema.canvas.height || 1080);
        editorContext.setCanvasBackgroundColor(schema.canvas.backgroundColor || '#fafafa');
      }
      
      // 更新历史记录
      if (parsedItems.length > 0) {
        const enhancedItems = convertToEnhancedItems(parsedItems);
        historyManagerRef.current.push(enhancedItems);
        // 同步到 EditorContext
        if (editorContext) {
          editorContext.setCanvasItems(enhancedItems);
        }
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
    const enhanced = convertToEnhancedItems(canvasItems);
    setEnhancedItems(enhanced);
    // 同步到 EditorContext 用于预览
    if (editorContext) {
      editorContext.setCanvasItems(enhanced);
    }
  }, [canvasItems, convertToEnhancedItems, editorContext]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // 检查是否是模板拖拽
    const templateData = e.dataTransfer.getData('template');
    if (templateData) {
      try {
        const template = JSON.parse(templateData) as TemplateDefinition;
        // 从后端API获取模板schema
        templateApi
          .getTemplateSchema(template.templateId)
          .then((response) => {
            if (response.success && response.data) {
              loadSchemaToCanvas(response.data);
              message.success(`已加载模板：${template.name}`);
            } else {
              message.warning(`模板 ${template.name} 的 Schema 数据不存在`);
            }
          })
          .catch((error) => {
            console.error('加载模板Schema失败:', error);
            message.error('加载模板失败: ' + (error.message || '未知错误'));
          });
        return;
      } catch (error) {
        console.error('解析模板数据失败:', error);
        message.error('加载模板失败');
        return;
      }
    }
    
    // 处理组件拖拽
    const data = e.dataTransfer.getData('component');
    if (!data) {
      return;
    }
    const component = JSON.parse(data) as ComponentSummary;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;

    // 检查是否拖拽到表单组件内部
    let parentId: string | undefined;
    let dropX = canvasX;
    let dropY = canvasY;

    // 查找所有表单组件，检查拖拽位置是否在其中
    for (const item of canvasItems) {
      if (item.component.componentId === 'form-form' && item.position && item.size) {
        const formX = item.position.x;
        const formY = item.position.y;
        const formWidth = item.size.width;
        const formHeight = item.size.height;
        
        if (
          canvasX >= formX &&
          canvasX <= formX + formWidth &&
          canvasY >= formY &&
          canvasY <= formY + formHeight
        ) {
          parentId = item.id;
          // 计算相对于表单组件的位置（减去表单的 padding）
          dropX = canvasX - formX - 16; // 16px padding
          dropY = canvasY - formY - 16; // 16px padding
          break;
        }
      }
    }

    // 根据组件类型设置默认大小
    const getDefaultSize = (comp: ComponentSummary): { width: number; height: number } => {
      // 表单组件使用更大的尺寸
      if (comp.componentId === 'form-form') {
        return { width: 600, height: 400 };
      }
      // 表单控件使用较小的尺寸
      if (comp.categories?.includes('form') || comp.type === 'control') {
        return { width: 200, height: 32 };
      }
      // 图表组件使用默认尺寸
      if (comp.type === 'chart') {
        return { width: 400, height: 300 };
      }
      // 其他组件使用默认尺寸
      return { width: 400, height: 300 };
    };

    const defaultSize = getDefaultSize(component);

    const newItem: CanvasItem = {
      id: `${component.componentId}-${Date.now()}`,
      component,
      loading: true,
      position: { x: Math.max(0, dropX), y: Math.max(0, dropY) },
      size: defaultSize,
      zIndex: canvasItems.length + 1,
      parentId,
    };
    const updatedItems = [...canvasItems, newItem];
    
    // 如果拖拽到表单组件内部，更新父组件的 children 列表
    if (parentId) {
      const parentIndex = updatedItems.findIndex((item) => item.id === parentId);
      if (parentIndex !== -1) {
        const parent = updatedItems[parentIndex];
        updatedItems[parentIndex] = {
          ...parent,
          children: [...(parent.children || []), newItem.id],
        };
      }
    }
    
    setCanvasItems(updatedItems);
    setSelectedItemIds([newItem.id]);
    message.success(`已将 ${component.componentName} 添加到画布`);
    componentApi
      .getDefinition(component.componentId)
      .then((def) => {
        setCanvasItems((prev) => {
          const updated = prev.map((item) =>
            item.id === newItem.id
              ? {
                  ...item,
                  definition: def,
                  loading: false,
                  error: def ? undefined : '未找到组件定义，无法渲染。',
                  propsValues: def?.defaultProps ? { ...def.defaultProps } : {},
                }
              : item
        );
          return updated;
        });
        historyManagerRef.current.push(convertToEnhancedItems(updatedItems));
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
      // 同步到 EditorContext 用于预览
      if (editorContext) {
        editorContext.setCanvasItems(items);
      }
    },
    [convertFromEnhancedItems, editorContext]
  );
  
  // 当 enhancedItems 变化时，同步到 EditorContext
  useEffect(() => {
    if (editorContext && enhancedItems.length >= 0) {
      editorContext.setCanvasItems(enhancedItems);
    }
  }, [enhancedItems, editorContext]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedItemIds(ids);
  }, []);

  const handleItemSelect = useCallback((id: string) => {
    setSelectedItemIds([id]);
  }, []);

  // 发布报表处理函数
  const handlePublish = useCallback(async () => {
    if (!projectId || !reportId) {
      message.warning('请先创建或选择报表');
      return;
    }

    try {
      // 先验证Schema
      const validateResponse = await reportApi.validateReportSchema(projectId, reportId);
      if (!validateResponse.success) {
        message.error(validateResponse.message || 'Schema验证失败');
        return;
      }

      if (!validateResponse.data.valid) {
        Modal.warning({
          title: 'Schema验证失败',
          content: validateResponse.data.errorMessage || 'Schema格式不正确，无法发布',
        });
        return;
      }

      // 确认发布
      Modal.confirm({
        title: '确认发布',
        content: '发布后报表将在运行态可见，是否确认发布？',
        onOk: async () => {
          try {
            const response = await reportApi.publishReport(effectiveUserId, projectId, reportId);
            if (response.success && response.data) {
              message.success('发布成功');
              // 更新报表上下文状态
              setReportContext({
                ...reportContext!,
                status: 'published',
              });
            } else {
              message.error(response.message || '发布失败');
            }
          } catch (error: any) {
            message.error(error.message || '发布失败');
          }
        },
      });
    } catch (error: any) {
      message.error(error.message || '发布失败');
    }
  }, [projectId, reportId, effectiveUserId, reportContext]);

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
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
      }}
    >
      <Layout
        style={{
          height: '100%',
          background: 'transparent',
          gap: 16,
          alignItems: 'stretch',
          flex: 1,
        }}
      >
        <Layout.Content style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                        return null;
                      }
                      let mergedDefinition: ComponentDefinition = canvasItem.definition;
                      if (canvasItem.propsValues) {
                        mergedDefinition = {
                          ...mergedDefinition,
                          defaultProps: { ...(mergedDefinition.defaultProps || {}), ...canvasItem.propsValues },
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
                    
                    // 如果是表单组件，查找并渲染子组件
                    const childItems = canvasItem.children
                      ? canvasItem.children
                          .map((childId) => canvasItems.find((ci) => ci.id === childId))
                          .filter((ci): ci is CanvasItem => ci !== undefined)
                      : [];
                    
                    // 为表单组件添加 formId 到 propsValues
                    const formPropsValues = canvasItem.component.componentId === 'form-form'
                      ? { ...canvasItem.propsValues, formId: canvasItem.id }
                      : canvasItem.propsValues;
                    
                    return (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {renderCanvasContent(canvasItem, effectiveDefinition, formPropsValues, childItems)}
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
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Layout.Sider
              width={propertyPanelCollapsed ? PROPERTY_COLLAPSED_WIDTH : PROPERTY_PANEL_WIDTH}
              theme="light"
              style={{
                background: '#fff',
                padding: propertyPanelCollapsed ? '16px 8px' : 16,
                borderRadius: 8,
              height: '100%',
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
                        <div style={{ padding: 16, height: 'calc(100% - 108px)', overflow: 'auto' }}>
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
                        <div style={{ padding: 16, height: 'calc(100% - 108px)', overflow: 'auto' }}>
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
                        <div style={{ padding: 16, height: 'calc(100% - 108px)', overflow: 'auto' }}>
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
    </div>
  );
};

export default CanvasEditor;

function renderCanvasContent(
  item: CanvasItem,
  definition?: ComponentDefinition | null,
  propsValues?: Record<string, any>,
  childItems: CanvasItem[] = []
) {
  // 对于 border 组件，即使有 error 或没有 definition，也尝试直接渲染
  if (item.component.componentId === 'media-border') {
    const borderProps = propsValues || item.propsValues || {};
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `${borderProps.width || 2}px ${borderProps.style || 'solid'} ${borderProps.color || '#165DFF'}`,
          borderRadius: borderProps.radius ? `${borderProps.radius}px` : '0',
          backgroundColor: borderProps.backgroundColor || 'transparent',
        }}
      />
    );
  }
  
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
  if (definition) {
    // 表格组件（使用专门的 TableRenderer）
    if (item.component.componentId === 'chart-table' || item.component.componentId === 'chart-tree-table') {
      return (
        <TableRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
        />
      );
    }
    // 图表组件
    if (item.component.type === 'chart') {
    return (
      <ChartRenderer
        componentId={item.component.componentId}
        definition={definition}
        height="100%"
        width="100%"
      />
    );
  }
    // 媒体组件（text、border、line）
    // 对于 border 组件，即使没有 definition 也可以直接渲染
    if (item.component.componentId === 'media-border') {
      if (!definition) {
        const borderProps = propsValues || item.propsValues || {};
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `${borderProps.width || 2}px ${borderProps.style || 'solid'} ${borderProps.color || '#165DFF'}`,
              borderRadius: borderProps.radius ? `${borderProps.radius}px` : '0',
              backgroundColor: borderProps.backgroundColor || 'transparent',
            }}
          />
        );
      }
      return (
        <FormRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
        />
      );
    }
    
    if (item.component.type === 'media' || 
        item.component.componentId === 'media-text' || 
        item.component.componentId === 'media-line') {
      return (
        <FormRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
        />
      );
    }
    
    // 表单组件和控制组件
    // 检查：type 为 'control' 或 'form'，或者 categories 包含 'form'
    const isFormOrControl = 
      item.component.type === 'control' || 
      item.component.type === 'form' ||
      item.component.categories?.includes('form');
    
    if (isFormOrControl) {
      // 渲染子组件（只在表单组件中渲染）
      const children = item.component.componentId === 'form-form' && childItems.length > 0 ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
          {childItems.map((child) => {
            const childDefinition = child.definition;
            const childEffectiveDefinition = childDefinition
              ? {
                  ...childDefinition,
                  defaultProps: {
                    ...(childDefinition.defaultProps || {}),
                    ...(child.propsValues || {}),
                  },
                }
              : null;
            return (
              <div
                key={child.id}
                style={{
                  position: 'absolute',
                  left: (child.position?.x || 0) + 16, // 加上表单的 padding
                  top: (child.position?.y || 0) + 32, // 加上表单的 padding 和标题高度
                  width: child.size?.width || 200,
                  height: child.size?.height || 32,
                  pointerEvents: 'auto',
                }}
              >
                {renderCanvasContent(child, childEffectiveDefinition, child.propsValues)}
              </div>
            );
          })}
        </div>
      ) : null;
      
      return (
        <FormRenderer
          componentId={item.component.componentId}
          definition={definition}
          height={item.size?.height || '100%'}
          width={item.size?.width || '100%'}
          propsValues={propsValues || item.propsValues}
        >
          {children}
        </FormRenderer>
      );
    }
  }
  // 如果没有定义，显示错误信息
  if (!definition) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={`${item.component.componentName} - 组件定义未加载`}
        style={{ margin: 0, padding: '32px 0' }}
      />
    );
  }
  // 如果没有定义或类型不匹配，显示预览图或占位符
  if (item.component.previewUrl) {
  return (
    <img
      src={item.component.previewUrl}
      alt={item.component.componentName}
      style={{ width: '100%', height: 240, objectFit: 'cover' }}
      />
    );
  }
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={`${item.component.componentName} - 暂不支持预览`}
      style={{ margin: 0, padding: '32px 0' }}
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


