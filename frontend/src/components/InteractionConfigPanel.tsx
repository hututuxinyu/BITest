import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Empty, Space, InputNumber, Radio, Collapse } from 'antd';
import type { InteractionConfig, InteractionEventType, InteractionActionType } from '../types';
import { interactionApi } from '../services/interactionApi';
import DynamicEventConfig from './DynamicEventConfig';

const { TextArea } = Input;

interface InteractionConfigPanelProps {
  componentId?: string;
  onConfigChange?: (config: InteractionConfig) => void;
}

/**
 * 交互配置面板组件
 */
const InteractionConfigPanel: React.FC<InteractionConfigPanelProps> = ({
  componentId,
  onConfigChange,
}) => {
  const [eventType, setEventType] = useState<InteractionEventType>('click');
  const [actionType, setActionType] = useState<InteractionActionType | ''>('');
  const [dynamicEventConfig, setDynamicEventConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 加载组件交互配置
  useEffect(() => {
    if (!componentId) {
      return;
    }
    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await interactionApi.getComponentInteractionConfig(componentId);
        if (response.success && response.data) {
          const config = response.data;
          setEventType(config.eventType);
          if (config.actions && config.actions.length > 0) {
            setActionType(config.actions[0].type);
            if (config.actions[0].type === 'dynamicEvent' && config.dynamicEvent) {
              setDynamicEventConfig(config.dynamicEvent);
            }
          }
        }
      } catch (error) {
        message.error('加载交互配置失败');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [componentId]);

  // 交互事件选择
  const handleEventTypeChange = (value: InteractionEventType) => {
    setEventType(value);
    const newConfig: InteractionConfig = {
      eventType: value,
      actions: [],
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    if (componentId) {
      interactionApi.saveComponentInteractionConfig(componentId, newConfig);
    }
  };

  // 交互动作选择
  const handleActionTypeChange = (value: InteractionActionType) => {
    setActionType(value);
    const actions = [
      {
        type: value,
        config: value === 'dynamicEvent' ? dynamicEventConfig : {},
      },
    ];
    const newConfig: InteractionConfig = {
      eventType,
      actions,
      ...(value === 'dynamicEvent' && dynamicEventConfig ? { dynamicEvent: dynamicEventConfig } : {}),
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    if (componentId) {
      interactionApi.saveComponentInteractionConfig(componentId, newConfig);
    }
  };

  // 动态事件配置变更
  const handleDynamicEventConfigChange = (config: any) => {
    setDynamicEventConfig(config);
    const newConfig: InteractionConfig = {
      eventType,
      actions: [
        {
          type: 'dynamicEvent',
          config,
        },
      ],
      dynamicEvent: config,
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    if (componentId) {
      interactionApi.saveComponentInteractionConfig(componentId, newConfig);
    }
  };

  if (!componentId) {
    return <Empty description="请选择画布中的组件实例" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <Form layout="vertical">
      <Form.Item label="交互事件">
        <Select
          value={eventType}
          onChange={handleEventTypeChange}
          options={[
            { label: '点击', value: 'click' },
            { label: '悬停', value: 'hover' },
            { label: '选择', value: 'select' },
            { label: '输入', value: 'input' },
            { label: '值变更', value: 'change' },
          ]}
        />
      </Form.Item>

      <Form.Item label="交互动作">
        <Select
          value={actionType}
          onChange={handleActionTypeChange}
          placeholder="请选择交互动作"
          options={[
            { label: '下钻', value: 'drillDown' },
            { label: '关联', value: 'associate' },
            { label: '跳转', value: 'jump' },
            { label: '过滤', value: 'filter' },
            { label: '弹窗', value: 'popup' },
            { label: '动态事件', value: 'dynamicEvent' },
          ]}
        />
      </Form.Item>

      {actionType === 'dynamicEvent' && (
        <Form.Item>
          <DynamicEventConfig
            config={dynamicEventConfig}
            onChange={handleDynamicEventConfigChange}
          />
        </Form.Item>
      )}

      {actionType === 'jump' && (
        <Form.Item label="跳转URL">
          <Input
            placeholder="请输入跳转URL"
            onChange={(e) => {
              const newConfig: InteractionConfig = {
                eventType,
                actions: [
                  {
                    type: 'jump',
                    config: { url: e.target.value },
                  },
                ],
              };
              if (onConfigChange) {
                onConfigChange(newConfig);
              }
              if (componentId) {
                interactionApi.saveComponentInteractionConfig(componentId, newConfig);
              }
            }}
          />
        </Form.Item>
      )}

      {actionType === 'popup' && (
        <Form.Item label="弹窗内容">
          <TextArea
            rows={4}
            placeholder="请输入弹窗显示的内容"
            onChange={(e) => {
              const newConfig: InteractionConfig = {
                eventType,
                actions: [
                  {
                    type: 'popup',
                    config: { content: e.target.value },
                  },
                ],
              };
              if (onConfigChange) {
                onConfigChange(newConfig);
              }
              if (componentId) {
                interactionApi.saveComponentInteractionConfig(componentId, newConfig);
              }
            }}
          />
        </Form.Item>
      )}
    </Form>
  );
};

export default InteractionConfigPanel;

