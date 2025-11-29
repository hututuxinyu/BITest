import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Card,
  Empty,
  Layout,
  Button,
  Tabs,
  message,
  Skeleton,
  Result,
  Form,
  Switch,
  InputNumber,
  Input,
  Select,
  Collapse,
} from 'antd';
import {
  CaretLeftOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import type { ComponentSummary, ComponentDefinition, DatasourceConfig } from '../types';
import { componentApi } from '../services/componentApi';
import ChartRenderer from './ChartRenderer';
import EnhancedCanvas, { EnhancedCanvasItem } from './EnhancedCanvas';
import CanvasToolbar from './CanvasToolbar';
import { HistoryManager } from '../utils/historyManager';
import DatasourceConfigPanel from './DatasourceConfigPanel';
import InteractionConfigPanel from './InteractionConfigPanel';

const PANEL_HEIGHT = '100%';
const PROPERTY_PANEL_WIDTH = 230;
const PROPERTY_COLLAPSED_WIDTH = 8;
const RULER_SIZE = 32;
const RULER_INTERVAL = 100;
const PROPERTY_LABEL_WIDTH = 72;
const FORM_ITEM_SPACING = 12;

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

interface CanvasWorkspaceProps {
  components?: ComponentSummary[];
  onComponentDragStart?: (e: React.DragEvent, component: ComponentSummary) => void;
}

/**
 * 画布工作区组件
 * 用于组件库和模板的预览和编辑
 */
const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ components = [], onComponentDragStart }) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(false);
  const [configTab, setConfigTab] = useState<'property' | 'datasource' | 'interaction'>('property');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const historyManagerRef = useRef<HistoryManager<EnhancedCanvasItem[]>>(new HistoryManager(50));

  const horizontalMarks = useMemo(
    () => Array.from({ length: Math.floor(1920 / RULER_INTERVAL) + 1 }, (_, index) => index * RULER_INTERVAL),
    []
  );
  const verticalMarks = useMemo(
    () => Array.from({ length: Math.floor(1080 / RULER_INTERVAL) + 1 }, (_, index) => index * RULER_INTERVAL),
    []
  );

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

export default CanvasWorkspace;

