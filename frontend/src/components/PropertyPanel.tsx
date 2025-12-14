import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Tabs, Button, message, Modal } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ComponentDefinition } from '../types';
import CanvasConfigTab from './PropertyPanel/canvas/CanvasConfigTab';
import ComponentPropertyTab from './PropertyPanel/component/ComponentPropertyTab';
import DatasourceConfigTab from './PropertyPanel/datasource/DatasourceConfigTab';
import InteractionConfigTab from './PropertyPanel/interaction/InteractionConfigTab';
import './PropertyPanel/styles/index.css';

export interface CanvasItem {
  id: string;
  component: {
    componentId: string;
    componentName: string;
    type?: string;
    categories?: string[];
  };
  definition?: ComponentDefinition | null;
  propsValues?: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  loading?: boolean;
  error?: string;
  datasourceConfig?: any;
  queryConfig?: any;
  interactionConfig?: any;
  parentId?: string;
  children?: string[];
}

export interface CanvasConfig {
  width: number;
  height: number;
  adaptMode: 'scale' | 'stretch' | 'fixed';
  gridVisible: boolean;
  gridSize: number;
  title: string;
  description: string;
  backgroundType: 'solid' | 'gradient' | 'image' | 'transparent';
  backgroundColor: string;
  gradientDirection?: 'top-bottom' | 'left-right' | 'diagonal' | 'radial';
  gradientStartColor?: string;
  gradientEndColor?: string;
  backgroundImage?: string;
  imageScale?: 'stretch' | 'tile' | 'center';
  borderEnabled: boolean;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderColor?: string;
  globalFont: string;
  /**
   * 主题配置
   */
  theme?: {
    /** 主题ID */
    themeId: 'light' | 'dark';
    /** 主题名称 */
    themeName: string;
    /** 主题颜色配置 */
    colors: {
      background: string;
      componentBackground: string;
      componentText: string;
      componentBorder: string;
      chartPrimary: string;
      chartSecondary: string;
      chartAccent: string;
      textPrimary: string;
      textSecondary: string;
    };
  };
}

export interface ComponentProperty {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  keepAspectRatio: boolean;
  backgroundColor: string;
  border?: {
    enabled: boolean;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
    radius: number;
  };
  shadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  title?: {
    visible: boolean;
    text: string;
    font: string;
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
    position: 'top' | 'bottom' | 'left' | 'right';
  };
}

interface PropertyPanelProps {
  item?: CanvasItem;
  selectedCount?: number;
  canvasConfig?: CanvasConfig;
  datasets?: Array<import('../types').Dataset>; // 数据集列表
  availableComponents?: Array<{ id: string; name: string }>; // 画布中所有组件列表
  onCanvasConfigChange?: (config: CanvasConfig) => void;
  onPropChange?: (field: string, value: any) => void;
  onItemChange?: (item: CanvasItem) => void;
  onQueryConfigChange?: (componentId: string, config: any) => void;
  onInteractionConfigChange?: (componentId: string, config: any) => void;
  onDatasourceConfigChange?: (componentId: string, config: any) => void;
  onReset?: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  item,
  selectedCount = 0,
  availableComponents = [],
  canvasConfig,
  datasets = [],
  onCanvasConfigChange,
  onPropChange,
  onItemChange,
  onQueryConfigChange,
  onInteractionConfigChange,
  onDatasourceConfigChange,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<string>('canvas');
  const [canvasConfigState, setCanvasConfigState] = useState<CanvasConfig | undefined>(canvasConfig);
  const [componentPropertyState, setComponentPropertyState] = useState<ComponentProperty | undefined>();
  const [datasourceConfigState, setDatasourceConfigState] = useState<any>(null);

  // 根据选中状态自动切换Tab（只在选中数量变化时切换，避免编辑时自动跳转）
  const prevSelectedCountRef = useRef(selectedCount);
  useEffect(() => {
    // 只在选中数量真正变化时才切换Tab，而不是在item内容变化时切换
    if (prevSelectedCountRef.current !== selectedCount) {
      if (selectedCount === 0) {
        setActiveTab('canvas');
      } else if (selectedCount === 1 && item) {
        // 只在从0个选中变为1个选中时才切换到component，避免编辑时跳转
        if (prevSelectedCountRef.current === 0) {
          setActiveTab('component');
        }
      }
      prevSelectedCountRef.current = selectedCount;
    }
  }, [selectedCount, item]);

  // 初始化画布配置
  useEffect(() => {
    if (canvasConfig) {
      setCanvasConfigState(canvasConfig);
    } else {
      // 默认画布配置
      setCanvasConfigState({
        width: 1920,
        height: 1080,
        adaptMode: 'scale',
        gridVisible: true,
        gridSize: 10,
        title: '未命名报表',
        description: '',
        backgroundType: 'solid',
        backgroundColor: '#F5F5F5',
        borderEnabled: false,
        globalFont: '微软雅黑',
      });
    }
  }, [canvasConfig]);

  // 初始化组件属性
  useEffect(() => {
    if (item) {
      const props = item.propsValues || {};
      setComponentPropertyState({
        id: item.id,
        name: props.name || `${item.component.componentName} - ${item.id}`,
        description: props.description || '',
        visible: props.visible !== false,
        locked: props.locked === true,
        zIndex: item.zIndex || 1,
        x: item.position?.x || 0,
        y: item.position?.y || 0,
        width: item.size?.width || 200,
        height: item.size?.height || 200,
        keepAspectRatio: props.keepAspectRatio !== false,
        backgroundColor: props.backgroundColor || '#FFFFFF',
        border: props.border || {
          enabled: false,
          width: 1,
          style: 'solid',
          color: '#E5E7EB',
          radius: 0,
        },
        shadow: props.shadow || {
          enabled: false,
          offsetX: 0,
          offsetY: 0,
          blur: 0,
          color: '#000000',
          opacity: 0.1,
        },
        padding: props.padding || {
          top: 16,
          right: 16,
          bottom: 16,
          left: 16,
        },
        title: props.title || {
          visible: true,
          text: item.component.componentName,
          font: 'inherit',
          fontSize: 16,
          color: '#333333',
          align: 'center',
          position: 'top',
        },
      });
      
      // 初始化数据源配置（从 item 中获取，如果没有则从后端加载）
      // 只对图表类组件加载数据源配置
      const loadDatasourceConfig = async () => {
        // 判断是否是图表类组件
        const isChart = item.component.type === 'chart' 
          || (item.component.categories && item.component.categories.includes('chart'))
          || ['chart-bar', 'chart-line', 'chart-pie', 'chart-radar',
              'custom-bar-chart', 'custom-area-chart', 'custom-donut-chart',
              'custom-pictorial-chart', 'custom-scatter-chart', 'custom-bar-line-chart',
              'custom-dashboard', 'chart-table', 'chart-tree-table'].includes(item.component.componentId);
        
        if (!isChart) {
          // 非图表类组件不需要数据源配置
          setDatasourceConfigState(null);
          return;
        }
        
        // 优先使用 item 中的配置（如果存在）
        if (item.datasourceConfig) {
          // 如果 item 中已有配置，直接使用
          setDatasourceConfigState(item.datasourceConfig);
          return;
        }
        
        // 如果 item 中没有配置，设置为 null
        setDatasourceConfigState(null);
      };
      loadDatasourceConfig();
      
    }
  }, [item]);

  // 当 item.datasourceConfig 变化时，同步更新内部状态（用于组件库场景）
  useEffect(() => {
    if (item?.datasourceConfig) {
      setDatasourceConfigState(item.datasourceConfig);
    } else if (item && !item.datasourceConfig) {
      // 如果 item 存在但没有 datasourceConfig，清空状态
      setDatasourceConfigState(null);
    }
  }, [item?.datasourceConfig, item?.id]);

  // 画布配置变更 - 立即应用
  const handleCanvasConfigChange = useCallback((config: CanvasConfig) => {
    setCanvasConfigState(config);
    // 立即应用配置
    if (onCanvasConfigChange) {
      onCanvasConfigChange(config);
    }
  }, [onCanvasConfigChange]);

  // 组件属性变更 - 立即应用
  const handleComponentPropertyChange = useCallback((field: string, value: any) => {
    if (!componentPropertyState) return;
    
    const updated = { ...componentPropertyState };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (updated as any)[parent] = {
        ...(updated as any)[parent],
        [child]: value,
      };
    } else {
      (updated as any)[field] = value;
    }
    
    setComponentPropertyState(updated);
    
    // 立即应用配置
    if (onPropChange) {
      onPropChange(field, value);
    }
    if (onItemChange && item) {
      const updatedItem = { ...item };
      if (field === 'x' || field === 'y') {
        updatedItem.position = { ...updatedItem.position, [field]: value } as { x: number; y: number };
      } else if (field === 'width' || field === 'height') {
        updatedItem.size = { ...updatedItem.size, [field]: value } as { width: number; height: number };
      } else {
        updatedItem.propsValues = { ...updatedItem.propsValues, [field]: value };
      }
      onItemChange(updatedItem);
    }
  }, [componentPropertyState, item, onPropChange, onItemChange]);

  // 应用配置 - 保存所有当前配置
  // 重置配置 - 重置所有配置到初始状态
  const handleReset = useCallback(() => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置该组件的所有配置吗？未保存的更改将丢失。',
      onOk: async () => {
        if (!item) {
          return;
        }

        try {
          // 重置画布配置
          if (canvasConfig) {
            setCanvasConfigState(canvasConfig);
          }

          // 重置组件属性
          const props = item.propsValues || {};
          setComponentPropertyState({
            id: item.id,
            name: props.name || `${item.component.componentName} - ${item.id}`,
            description: props.description || '',
            visible: props.visible !== false,
            locked: props.locked === true,
            zIndex: item.zIndex || 1,
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 200,
            height: item.size?.height || 200,
            keepAspectRatio: props.keepAspectRatio !== false,
            backgroundColor: props.backgroundColor || '#FFFFFF',
            border: props.border || {
              enabled: false,
              width: 1,
              style: 'solid',
              color: '#E5E7EB',
              radius: 0,
            },
            shadow: props.shadow || {
              enabled: false,
              offsetX: 0,
              offsetY: 0,
              blur: 0,
              color: '#000000',
              opacity: 0.1,
            },
            padding: props.padding || {
              top: 16,
              right: 16,
              bottom: 16,
              left: 16,
            },
            title: props.title || {
              visible: true,
              text: item.component.componentName,
              font: 'inherit',
              fontSize: 16,
              color: '#333333',
              align: 'center',
              position: 'top',
            },
          });

          // 重置数据源配置（只对图表类组件处理）
          // 判断是否是图表类组件
          const isChart = item.component.type === 'chart' 
            || (item.component.categories && item.component.categories.includes('chart'))
            || ['chart-bar', 'chart-line', 'chart-pie', 'chart-radar',
                'custom-bar-chart', 'custom-area-chart', 'custom-donut-chart',
                'custom-pictorial-chart', 'custom-scatter-chart', 'custom-bar-line-chart',
                'custom-dashboard', 'chart-table', 'chart-tree-table'].includes(item.component.componentId);
          
          if (!isChart) {
            // 非图表类组件不需要数据源配置
            setDatasourceConfigState(null);
          } else if (item.datasourceConfig) {
            // 如果 item 中有配置，使用 item 中的配置
            setDatasourceConfigState(item.datasourceConfig);
          } else {
            // 否则设置为 null
            setDatasourceConfigState(null);
          }

          message.success('所有配置已重置');
          if (onReset) {
            onReset();
          }
        } catch (error) {
          message.error('重置配置失败');
          console.error('重置配置失败:', error);
        }
      },
    });
  }, [canvasConfig, item, onReset]);

  // 快捷键支持 - 仅保留重置功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  // 判断是否是基础图表组件（必须在所有条件返回之前调用）
  const isBasicChart = useMemo(() => {
    if (!item || !item.component) {
      return false;
    }
    // 通过 type 字段判断
    if (item.component.type === 'chart') {
      return true;
    }
    // 通过 categories 字段判断
    if (item.component.categories && item.component.categories.includes('chart')) {
      return true;
    }
    // 通过 componentId 判断（兼容性处理）
    const chartComponentIds = [
      'chart-bar', 'chart-line', 'chart-pie', 'chart-radar',
      'custom-bar-chart', 'custom-area-chart', 'custom-donut-chart',
      'custom-pictorial-chart', 'custom-scatter-chart', 'custom-bar-line-chart',
      'custom-dashboard', 'chart-table', 'chart-tree-table'
    ];
    if (chartComponentIds.includes(item.component.componentId)) {
      return true;
    }
    return false;
  }, [item?.component]);

  // 构建 Tab items，根据组件类型决定显示哪些页签
  // 规则：
  // 1. 未选中组件：只显示画布配置
  // 2. 图表类组件：显示组件属性、数据来源、交互设置
  // 3. 表单类组件：显示组件属性、交互设置（不显示数据来源）
  const tabItems = useMemo(() => {
    const items: Array<{ key: string; label: string; children: React.ReactNode }> = [];

    // 未选中组件时，只显示画布配置（这个情况在下面单独处理，这里不添加）
    if (selectedCount === 0) {
      return [
        {
          key: 'canvas',
          label: '画布配置',
          children: (
            <div className="property-panel-content">
              <CanvasConfigTab
                config={canvasConfigState}
                onChange={handleCanvasConfigChange}
              />
            </div>
          ),
        },
      ];
    }

    // 选中组件时，始终显示组件属性
    if (item) {
      items.push({
        key: 'component',
        label: '组件属性',
        children: (
          <div className="property-panel-content">
            <ComponentPropertyTab
              item={item}
              property={componentPropertyState}
              componentDefinition={item.definition}
              onChange={handleComponentPropertyChange}
            />
          </div>
        ),
      });

      // 图表类组件显示数据来源
      if (isBasicChart) {
        items.push({
          key: 'datasource',
          label: '数据来源',
          children: (
            <div className="property-panel-content">
              <DatasourceConfigTab
                componentId={item.id}
                componentTypeId={item.component.componentId}
                componentDefinition={item.definition}
                availableComponents={availableComponents}
                datasets={datasets}
                initialConfig={datasourceConfigState || item.datasourceConfig}
                onQueryConfigChange={(config) => {
                  if (onQueryConfigChange) {
                    onQueryConfigChange(item.id, config);
                  }
                }}
                onConfigChange={(config) => {
                  setDatasourceConfigState(config);
                  // 配置立即应用
                  if (onDatasourceConfigChange && item) {
                    onDatasourceConfigChange(item.id, config);
                  }
                }}
              />
            </div>
          ),
        });
      }

      // 所有组件都显示交互设置
      items.push({
        key: 'interaction',
        label: '交互设置',
        children: (
          <div className="property-panel-content">
            <InteractionConfigTab
              componentId={item.id}
              availableComponents={availableComponents}
              initialConfig={item.interactionConfig}
              onConfigChange={(config) => {
                if (onInteractionConfigChange && item) {
                  onInteractionConfigChange(item.id, config);
                }
              }}
            />
          </div>
        ),
      });
    }

    return items;
  }, [selectedCount, isBasicChart, item, canvasConfigState, componentPropertyState, datasourceConfigState, availableComponents, datasets, handleCanvasConfigChange, handleComponentPropertyChange, onQueryConfigChange, onInteractionConfigChange, onDatasourceConfigChange]);

  // 未选中组件时显示画布配置
  if (selectedCount === 0) {
    return (
      <div className="property-panel">
        <Tabs
          activeKey="canvas"
          onChange={setActiveTab}
          items={tabItems}
        />
        <div className="property-panel-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            block
          >
            重置
          </Button>
        </div>
      </div>
    );
  }

  // 选中多个组件时提示
  if (selectedCount > 1) {
    return (
      <div className="property-panel">
        <div className="property-panel-empty">
          <p>已选择 {selectedCount} 个组件</p>
          <p style={{ fontSize: 12, color: '#999999' }}>请选择单个组件进行属性编辑</p>
        </div>
      </div>
    );
  }

  // 选中单个组件时显示组件属性
  if (!item) {
    return (
      <div className="property-panel">
        <div className="property-panel-empty">
          <p>请选择画布中的组件实例</p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-panel">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
        <div className="property-panel-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            block
          >
            重置
          </Button>
        </div>
    </div>
  );
};

export default PropertyPanel;

