/**
 * 画布工作区容器：
 * - 承载工具栏与 EnhancedCanvas
 * - 处理模板/组件拖拽落盘、Schema 解析加载、组件定义异步获取
 * - 维护画布状态（选中、网格、缩放、历史栈）并联动属性面板
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Card,
  Empty,
  Layout,
  Button,
  message,
} from 'antd';
import {
  CaretLeftOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { ComponentSummary, ComponentDefinition, DatasourceConfig } from '../../types';
import { componentApi } from '../../services/componentApi';
import { templateApi } from '../../services/api';
import type { TemplateDefinition } from '../../types';
import EnhancedCanvas, { EnhancedCanvasItem } from './EnhancedCanvas.tsx';
import CanvasToolbar from './CanvasToolbar.tsx';
import { HistoryManager } from '../../utils/historyManager';
import PropertyPanel, { type CanvasConfig } from '../PropertyPanel';
import { useEditorContext } from '../../contexts/EditorContext';
import {
  buildDatasourceConfig,
  mapComponentTypeToId,
  convertToEnhancedItems,
  convertFromEnhancedItems,
} from '../../utils/canvasShared';
import { renderCanvasContent } from '../../utils/renderCanvasContent';

const PROPERTY_PANEL_WIDTH = 420;
const PROPERTY_COLLAPSED_WIDTH = 8;
const RULER_SIZE = 32;
const RULER_INTERVAL = 100;

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

interface CanvasWorkspaceProps {
  components?: ComponentSummary[];
  onComponentDragStart?: (e: React.DragEvent, component: ComponentSummary) => void;
}

/**
 * 画布工作区组件
 * 用于组件库和模板的预览和编辑
 */
const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({}) => {
  // 从 EditorContext 获取数据集列表
  let editorContext: ReturnType<typeof useEditorContext> | null = null;
  try {
    editorContext = useEditorContext();
  } catch (e) {
    // 如果不在 EditorContextProvider 中，editorContext 为 null
  }
  const datasets = editorContext?.datasets || [];

  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    width: 1920,
    height: 1080,
    adaptMode: 'scale',
    gridVisible: true,
    gridSize: 10,
    title: '',
    description: '',
    backgroundType: 'solid',
    backgroundColor: '#F5F5F5',
    borderEnabled: false,
    globalFont: '微软雅黑',
  });
  const historyManagerRef = useRef<HistoryManager<EnhancedCanvasItem[]>>(new HistoryManager(50));

  const horizontalMarks = useMemo(
    () => Array.from({ length: Math.floor(1920 / RULER_INTERVAL) + 1 }, (_, index) => index * RULER_INTERVAL),
    []
  );
  const verticalMarks = useMemo(
    () => Array.from({ length: Math.floor(1080 / RULER_INTERVAL) + 1 }, (_, index) => index * RULER_INTERVAL),
    []
  );

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

        const datasourceConfig = buildDatasourceConfig(schemaComponent, datasourceMap);

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
        itemSchemaMap.set(itemId, schemaComponent);
      }

      // 先设置初始画布项
      setCanvasItems(parsedItems);

      // 然后异步加载每个组件的定义
      for (const canvasItem of parsedItems) {
        const schemaComponent = itemSchemaMap.get(canvasItem.id);
        const componentId = canvasItem.component.componentId;

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
              if (componentId === 'media-border') {
                setCanvasItems((prev) =>
                  prev.map((item) =>
                    item.id === canvasItem.id
                      ? {
                          ...item,
                          loading: false,
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
            if (componentId === 'media-border') {
              setCanvasItems((prev) =>
                prev.map((item) =>
                  item.id === canvasItem.id
                    ? {
                        ...item,
                        loading: false,
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

  const [enhancedItems, setEnhancedItems] = useState<EnhancedCanvasItem[]>([]);

  useEffect(() => {
    setEnhancedItems(convertToEnhancedItems(canvasItems));
  }, [canvasItems, convertToEnhancedItems]);

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

  const handleCanvasConfigChange = useCallback((config: CanvasConfig) => {
    setCanvasConfig(config);
    // 可以根据需要更新画布相关的状态，比如网格显示
    setShowGrid(config.gridVisible);
  }, []);


  const selectedItem = canvasItems.find((item) => selectedItemIds.includes(item.id));

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
    handleItemsChange([]);
    setSelectedItemIds([]);
    historyManagerRef.current.clear();
    message.success('画布已清空');
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
              background: canvasConfig.backgroundColor,
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
                onClearCanvas={handleClearCanvas} onAlignLeft={function (): void {
                throw new Error("Function not implemented.");
            }} onAlignCenter={function (): void {
                throw new Error("Function not implemented.");
            }} onAlignRight={function (): void {
                throw new Error("Function not implemented.");
            }} onAlignTop={function (): void {
                throw new Error("Function not implemented.");
            }} onAlignMiddle={function (): void {
                throw new Error("Function not implemented.");
            }} onAlignBottom={function (): void {
                throw new Error("Function not implemented.");
            }} onDistributeHorizontally={function (): void {
                throw new Error("Function not implemented.");
            }} onDistributeVertically={function (): void {
                throw new Error("Function not implemented.");
            }} onBringToFront={function (): void {
                throw new Error("Function not implemented.");
            }} onSendToBack={function (): void {
                throw new Error("Function not implemented.");
            }} onBringForward={function (): void {
                throw new Error("Function not implemented.");
            }} onSendBackward={function (): void {
                throw new Error("Function not implemented.");
            }}            />
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {verticalMarks.map((value) => (
                  <span
                    key={`v-mark-${value}`}
                    style={{
                      position: 'absolute',
                      top: value * zoom,
                      left: RULER_SIZE / 2,
                      transform: 'translate(-50%, -50%) rotate(-90deg)',
                      transformOrigin: 'center',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      lineHeight: 1,
                      padding: '0 2px',
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
                          {renderCanvasContent(
                            canvasItem,
                            effectiveDefinition,
                            formPropsValues,
                            childItems,
                            handlePropChange,
                            canvasConfig.theme?.themeId || 'light'
                          )}
                        </div>
                      );
                    }}
                    canvasWidth={canvasConfig.width}
                    canvasHeight={canvasConfig.height}
                    canvasBackgroundColor={canvasConfig.backgroundColor}
                    gridSize={canvasConfig.gridSize}
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
              padding: propertyPanelCollapsed ? '16px 8px' : 0,
              borderRadius: 8,
              height: '100%',
              width: propertyPanelCollapsed ? PROPERTY_COLLAPSED_WIDTH : PROPERTY_PANEL_WIDTH,
              minWidth: propertyPanelCollapsed ? PROPERTY_COLLAPSED_WIDTH : PROPERTY_PANEL_WIDTH,
              maxWidth: propertyPanelCollapsed ? PROPERTY_COLLAPSED_WIDTH : PROPERTY_PANEL_WIDTH,
              transition: 'width 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: propertyPanelCollapsed ? 'center' : 'stretch',
              flexShrink: 0,
              overflow: 'hidden',
              boxSizing: 'border-box',
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
              <PropertyPanel
                item={selectedItem}
                selectedCount={selectedItemIds.length}
                canvasConfig={canvasConfig}
                datasets={datasets}
                onCanvasConfigChange={handleCanvasConfigChange}
                onPropChange={handlePropChange}
                // onItemChange={handleItemChange}
              />
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


export default CanvasWorkspace;

