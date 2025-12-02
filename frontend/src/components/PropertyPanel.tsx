import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Button, message, Modal } from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ComponentDefinition } from '../types';
import CanvasConfigTab from './PropertyPanel/CanvasConfigTab';
import ComponentPropertyTab from './PropertyPanel/ComponentPropertyTab';
import DatasourceConfigTab from './PropertyPanel/DatasourceConfigTab';
import InteractionConfigTab from './PropertyPanel/InteractionConfigTab';
import './PropertyPanel/index.css';

export interface CanvasItem {
  id: string;
  component: {
    componentId: string;
    componentName: string;
  };
  definition?: ComponentDefinition | null;
  propsValues?: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  loading?: boolean;
  error?: string;
  datasourceConfig?: any;
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
  onCanvasConfigChange?: (config: CanvasConfig) => void;
  onPropChange?: (field: string, value: any) => void;
  onItemChange?: (item: CanvasItem) => void;
  onApply?: () => void;
  onReset?: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  item,
  selectedCount = 0,
  canvasConfig,
  onCanvasConfigChange,
  onPropChange,
  onItemChange,
  onApply,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<string>('canvas');
  const [canvasConfigState, setCanvasConfigState] = useState<CanvasConfig | undefined>(canvasConfig);
  const [componentPropertyState, setComponentPropertyState] = useState<ComponentProperty | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  // 根据选中状态自动切换Tab
  useEffect(() => {
    if (selectedCount === 0) {
      setActiveTab('canvas');
    } else if (selectedCount === 1 && item) {
      setActiveTab('component');
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
      setHasChanges(false);
    }
  }, [item]);

  // 画布配置变更
  const handleCanvasConfigChange = useCallback((config: CanvasConfig) => {
    setCanvasConfigState(config);
    setHasChanges(true);
    // 实时预览：基础属性实时同步
    if (onCanvasConfigChange) {
      onCanvasConfigChange(config);
    }
  }, [onCanvasConfigChange]);

  // 组件属性变更
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
    setHasChanges(true);
    
    // 实时预览：基础属性实时同步
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

  // 应用配置
  const handleApply = useCallback(() => {
    if (activeTab === 'canvas' && canvasConfigState && onCanvasConfigChange) {
      onCanvasConfigChange(canvasConfigState);
      message.success('画布配置已应用');
    } else if (activeTab === 'component' && componentPropertyState && item && onItemChange) {
      const updatedItem = { ...item };
      updatedItem.position = { x: componentPropertyState.x, y: componentPropertyState.y };
      updatedItem.size = { width: componentPropertyState.width, height: componentPropertyState.height };
      updatedItem.zIndex = componentPropertyState.zIndex;
      updatedItem.propsValues = {
        ...updatedItem.propsValues,
        name: componentPropertyState.name,
        description: componentPropertyState.description,
        visible: componentPropertyState.visible,
        locked: componentPropertyState.locked,
        keepAspectRatio: componentPropertyState.keepAspectRatio,
        backgroundColor: componentPropertyState.backgroundColor,
        border: componentPropertyState.border,
        shadow: componentPropertyState.shadow,
        padding: componentPropertyState.padding,
        title: componentPropertyState.title,
      };
      onItemChange(updatedItem);
      message.success('组件属性已应用');
    }
    setHasChanges(false);
    if (onApply) {
      onApply();
    }
  }, [activeTab, canvasConfigState, componentPropertyState, item, onCanvasConfigChange, onItemChange, onApply]);

  // 重置配置
  const handleReset = useCallback(() => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置当前配置吗？未保存的更改将丢失。',
      onOk: () => {
        if (activeTab === 'canvas' && canvasConfig) {
          setCanvasConfigState(canvasConfig);
          message.success('画布配置已重置');
        } else if (activeTab === 'component' && item) {
          // 重新初始化组件属性
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
          message.success('组件属性已重置');
        }
        setHasChanges(false);
        if (onReset) {
          onReset();
        }
      },
    });
  }, [activeTab, canvasConfig, item, onReset]);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          handleApply();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, handleApply, handleReset]);

  // 未选中组件时显示画布配置
  if (selectedCount === 0) {
    return (
      <div className="property-panel">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
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
            {
              key: 'datasource',
              label: '数据源配置',
              disabled: true,
              children: null,
            },
            {
              key: 'interaction',
              label: '交互设置',
              disabled: true,
              children: null,
            },
          ]}
        />
        <div className="property-panel-actions">
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApply}
            disabled={!hasChanges}
            block
          >
            应用
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={!hasChanges}
            block
            style={{ marginTop: 8 }}
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
        items={[
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
          {
            key: 'component',
            label: '组件属性',
            children: (
              <div className="property-panel-content">
                <ComponentPropertyTab
                  item={item}
                  property={componentPropertyState}
                  onChange={handleComponentPropertyChange}
                />
              </div>
            ),
          },
          {
            key: 'datasource',
            label: '数据源配置',
            children: (
              <div className="property-panel-content">
                <DatasourceConfigTab
                  componentId={item.id}
                  componentDefinition={item.definition}
                />
              </div>
            ),
          },
          {
            key: 'interaction',
            label: '交互设置',
            children: (
              <div className="property-panel-content">
                <InteractionConfigTab
                  componentId={item.id}
                />
              </div>
            ),
          },
        ]}
      />
      <div className="property-panel-actions">
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleApply}
          disabled={!hasChanges}
          block
        >
          应用
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleReset}
          disabled={!hasChanges}
          block
          style={{ marginTop: 8 }}
        >
          重置
        </Button>
      </div>
    </div>
  );
};

export default PropertyPanel;

