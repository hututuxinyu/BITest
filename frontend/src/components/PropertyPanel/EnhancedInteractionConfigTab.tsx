import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Table, Space, Modal, message, Collapse, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CaretRightOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface InteractionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'notIn';
  value: any;
}

interface InteractionAction {
  actionType: 'drillDown' | 'associate' | 'jump' | 'filter' | 'popup' | 'refresh' | 'dynamicEvent';
  target?: string;
  params?: Record<string, any>;
  config?: any;
}

interface InteractionEvent {
  eventType: 'click' | 'hover' | 'select' | 'input' | 'change' | 'search';
  conditions?: InteractionCondition[];
  actions: InteractionAction[];
}

interface InteractionConfig {
  componentId: string;
  events: InteractionEvent[];
}

interface EnhancedInteractionConfigTabProps {
  componentId: string;
  availableComponents?: Array<{ id: string; name: string }>; // 画布中所有组件列表
  initialConfig?: InteractionConfig;
  onChange?: (config: InteractionConfig) => void;
}

const EnhancedInteractionConfigTab: React.FC<EnhancedInteractionConfigTabProps> = ({
  componentId,
  availableComponents = [],
  initialConfig,
  onChange,
}) => {
  const [events, setEvents] = useState<InteractionEvent[]>(initialConfig?.events || []);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [eventForm] = Form.useForm();
  const [actionForm] = Form.useForm();

  useEffect(() => {
    if (initialConfig) {
      setEvents(initialConfig.events || []);
    }
  }, [initialConfig]);

  const handleAddEvent = () => {
    setEditingEventIndex(null);
    eventForm.resetFields();
    eventForm.setFieldsValue({
      eventType: 'click',
      conditions: [],
    });
    setEventModalVisible(true);
  };

  const handleEditEvent = (index: number) => {
    setEditingEventIndex(index);
    const event = events[index];
    eventForm.setFieldsValue({
      eventType: event.eventType,
      conditions: event.conditions || [],
    });
    setEventModalVisible(true);
  };

  const handleDeleteEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
    notifyChange({ componentId, events: newEvents });
  };

  const handleEventSave = () => {
    eventForm.validateFields().then((values) => {
      const newEvent: InteractionEvent = {
        eventType: values.eventType,
        conditions: values.conditions || [],
        actions: [],
      };

      if (editingEventIndex !== null) {
        // 编辑：保留原有actions
        newEvent.actions = events[editingEventIndex].actions;
        const newEvents = [...events];
        newEvents[editingEventIndex] = newEvent;
        setEvents(newEvents);
        notifyChange({ componentId, events: newEvents });
      } else {
        // 新增
        const newEvents = [...events, newEvent];
        setEvents(newEvents);
        notifyChange({ componentId, events: newEvents });
      }

      setEventModalVisible(false);
      eventForm.resetFields();
    });
  };

  const handleAddAction = (eventIndex: number) => {
    setCurrentEventIndex(eventIndex);
    setEditingActionIndex(null);
    actionForm.resetFields();
    actionForm.setFieldsValue({
      actionType: 'filter',
    });
    setActionModalVisible(true);
  };

  const handleEditAction = (eventIndex: number, actionIndex: number) => {
    setCurrentEventIndex(eventIndex);
    setEditingActionIndex(actionIndex);
    const action = events[eventIndex].actions[actionIndex];
    actionForm.setFieldsValue({
      actionType: action.actionType,
      target: action.target,
      params: action.params ? JSON.stringify(action.params, null, 2) : '',
      config: action.config ? JSON.stringify(action.config, null, 2) : '',
    });
    setActionModalVisible(true);
  };

  const handleDeleteAction = (eventIndex: number, actionIndex: number) => {
    const newEvents = [...events];
    newEvents[eventIndex].actions = newEvents[eventIndex].actions.filter((_, i) => i !== actionIndex);
    setEvents(newEvents);
    notifyChange({ componentId, events: newEvents });
  };

  const handleActionSave = () => {
    actionForm.validateFields().then((values) => {
      let params: Record<string, any> = {};
      let config: any = {};

      try {
        if (values.params) {
          params = JSON.parse(values.params);
        }
      } catch (e) {
        message.error('参数JSON格式错误');
        return;
      }

      try {
        if (values.config) {
          config = JSON.parse(values.config);
        }
      } catch (e) {
        message.error('配置JSON格式错误');
        return;
      }

      const newAction: InteractionAction = {
        actionType: values.actionType,
        target: values.target,
        params: Object.keys(params).length > 0 ? params : undefined,
        config: Object.keys(config).length > 0 ? config : undefined,
      };

      const newEvents = [...events];
      if (editingActionIndex !== null) {
        // 编辑
        newEvents[currentEventIndex].actions[editingActionIndex] = newAction;
      } else {
        // 新增
        newEvents[currentEventIndex].actions.push(newAction);
      }
      setEvents(newEvents);
      notifyChange({ componentId, events: newEvents });

      setActionModalVisible(false);
      actionForm.resetFields();
    });
  };

  const notifyChange = (config: InteractionConfig) => {
    if (onChange) {
      onChange(config);
    }
  };

  const actionColumns = (eventIndex: number) => [
    {
      title: '动作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      render: (type: string) => {
        const labels: Record<string, string> = {
          drillDown: '下钻',
          associate: '关联',
          jump: '跳转',
          filter: '过滤',
          popup: '弹窗',
          refresh: '刷新',
          dynamicEvent: '动态事件',
        };
        return labels[type] || type;
      },
    },
    {
      title: '目标组件',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InteractionAction, actionIndex: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAction(eventIndex, actionIndex)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAction(eventIndex, actionIndex)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddEvent} block>
          添加事件
        </Button>
      </div>

      {events.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
          暂无交互事件，点击上方按钮添加
        </div>
      )}

      <Collapse
        bordered={false}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined
            style={{
              transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        )}
      >
        {events.map((event, eventIndex) => {
          const eventTypeLabels: Record<string, string> = {
            click: '点击',
            hover: '悬停',
            select: '选择',
            input: '输入',
            change: '值变更',
            search: '搜索',
          };

          return (
            <Collapse.Panel
              key={eventIndex}
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {eventTypeLabels[event.eventType] || event.eventType} ({event.actions.length} 个动作)
                  </span>
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(eventIndex);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(eventIndex);
                      }}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              }
            >
              <Form layout="vertical" size="small">
                <Form.Item label="事件类型">
                  <Select value={event.eventType} disabled>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <Select.Option key={value} value={value}>
                        {label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {event.conditions && event.conditions.length > 0 && (
                  <Form.Item label="触发条件">
                    <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                      {event.conditions.length} 个条件
                    </div>
                  </Form.Item>
                )}

                <Form.Item label="交互动作">
                  <div style={{ marginBottom: '8px' }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddAction(eventIndex)}
                      block
                    >
                      添加动作
                    </Button>
                  </div>
                  <Table
                    columns={actionColumns(eventIndex)}
                    dataSource={event.actions}
                    rowKey={(record, index) => `action-${index}`}
                    pagination={false}
                    size="small"
                  />
                </Form.Item>
              </Form>
            </Collapse.Panel>
          );
        })}
      </Collapse>

      {/* 事件编辑Modal */}
      <Modal
        title={editingEventIndex !== null ? '编辑事件' : '添加事件'}
        open={eventModalVisible}
        onOk={handleEventSave}
        onCancel={() => {
          setEventModalVisible(false);
          eventForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={eventForm} layout="vertical">
          <Form.Item
            name="eventType"
            label="事件类型"
            rules={[{ required: true, message: '请选择事件类型' }]}
          >
            <Select>
              <Select.Option value="click">点击</Select.Option>
              <Select.Option value="hover">悬停</Select.Option>
              <Select.Option value="select">选择</Select.Option>
              <Select.Option value="input">输入</Select.Option>
              <Select.Option value="change">值变更</Select.Option>
              <Select.Option value="search">搜索</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 动作编辑Modal */}
      <Modal
        title={editingActionIndex !== null ? '编辑动作' : '添加动作'}
        open={actionModalVisible}
        onOk={handleActionSave}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={actionForm} layout="vertical">
          <Form.Item
            name="actionType"
            label="动作类型"
            rules={[{ required: true, message: '请选择动作类型' }]}
          >
            <Select>
              <Select.Option value="drillDown">下钻</Select.Option>
              <Select.Option value="associate">关联</Select.Option>
              <Select.Option value="jump">跳转</Select.Option>
              <Select.Option value="filter">过滤</Select.Option>
              <Select.Option value="popup">弹窗</Select.Option>
              <Select.Option value="refresh">刷新</Select.Option>
              <Select.Option value="dynamicEvent">动态事件</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target"
            label="目标组件ID"
            tooltip="选择要执行动作的目标组件"
          >
            <Select placeholder="请选择目标组件" allowClear>
              {availableComponents
                .filter((comp) => comp.id !== componentId)
                .map((comp) => (
                  <Select.Option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.id})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="params"
            label="参数（JSON格式）"
            tooltip="使用表达式，如：${value[0]}, ${data.field}, ${context.param}"
          >
            <TextArea
              rows={4}
              placeholder='例如：{"startDate": "${value[0]}", "endDate": "${value[1]}"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="config"
            label="动作配置（JSON格式，可选）"
            tooltip="根据动作类型配置，如下钻配置、跳转配置等"
          >
            <TextArea
              rows={4}
              placeholder='例如：{"drillDownField": "month", "targetField": "date"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedInteractionConfigTab;

