import React from 'react';
import {
  Input,
  Button,
  Select,
  DatePicker,
  Radio,
  Checkbox,
  Switch,
} from 'antd';
import { Empty } from 'antd';
import type { ComponentDefinition } from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface FormRendererProps {
  componentId: string;
  definition: ComponentDefinition;
  height?: number | string;
  width?: number | string;
  propsValues?: Record<string, any>;
  children?: React.ReactNode; // 子组件
  componentName?: string; // 组件名称，用于显示标签
}

const FormRenderer: React.FC<FormRendererProps> = ({
  componentId,
  definition,
  height = '100%',
  width = '100%',
  propsValues = {},
  children,
  componentName,
}) => {
  if (!definition) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="组件定义缺失"
        style={{ margin: 0, padding: '32px 0' }}
      />
    );
  }
  const props = { ...(definition.defaultProps || {}), ...propsValues };

  const renderComponent = () => {
    try {
      switch (componentId) {
      case 'form-form':
        return (
          <div
            data-form-container
            data-form-container-id={props.formId}
            style={{
              width: '100%',
              height: '100%',
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
              padding: 16,
              background: '#fafafa',
              position: 'relative',
              overflow: 'auto',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              {props.title || '表单'}
            </div>
            {children ? (
              <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 32px)' }}>
                {children}
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: 12 }}>
                表单容器 - 可拖拽其他表单控件到此
              </div>
            )}
          </div>
        );
      case 'form-text':
        return (
          <TextArea
            placeholder="请输入文本内容"
            rows={4}
            value={props.value || ''}
            style={{ width: '100%' }}
          />
        );
      case 'form-select':
        return (
          <Select
            placeholder="请选择"
            style={{ width: '100%' }}
            options={props.options || []}
            value={props.value}
          />
        );
      case 'form-checkbox':
        return (
          <Checkbox.Group
            options={props.options || []}
            value={props.value}
            style={{ width: '100%' }}
          />
        );
      case 'form-date-range':
        return (
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['开始日期', '结束日期']}
            format="YYYY-MM-DD"
          />
        );
      case 'form-radio':
        return (
          <Radio.Group
            options={props.options || []}
            value={props.value}
            style={{ width: '100%' }}
          />
        );
      case 'form-switch':
        return <Switch checked={props.checked || false} />;
      case 'control-filter':
        return (
          <Input
            placeholder="请输入筛选条件"
            style={{ width: '100%' }}
            value={props.value || ''}
          />
        );
      case 'control-button':
        return (
          <Button type={props.type || 'default'} style={{ width: '100%' }}>
            {props.text || '按钮'}
          </Button>
        );
      case 'control-input':
        return (
          <Input
            placeholder={props.placeholder || '请输入内容'}
            style={{ width: '100%' }}
            value={props.value || ''}
            // 确保是单行输入框，不使用 TextArea
          />
        );
      case 'media-text':
        // 根据对齐方式设置 justifyContent
        const textAlign = props.textAlign || 'left';
        const justifyContentMap: Record<string, string> = {
          left: 'flex-start',
          center: 'center',
          right: 'flex-end',
        };
        return (
          <div
            style={{
              fontSize: props.fontSize || 14,
              color: props.color || '#333',
              fontWeight: props.fontWeight || 'normal',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: justifyContentMap[textAlign] || 'flex-start',
            }}
          >
            {props.text || ''}
          </div>
        );
      case 'media-border':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `${props.width || 1}px ${props.style || 'solid'} ${props.color || '#d9d9d9'}`,
              borderRadius: props.radius ? `${props.radius}px` : '0',
              backgroundColor: props.backgroundColor || 'transparent',
            }}
          />
        );
      case 'media-line':
        const isHorizontal = props.direction === 'horizontal';
        return (
          <div
            style={{
              width: isHorizontal ? '100%' : `${props.width || 1}px`,
              height: isHorizontal ? `${props.width || 1}px` : '100%',
              backgroundColor: props.color || '#d9d9d9',
              borderStyle: props.style || 'solid',
            }}
          />
        );
      case 'media-image':
        return (
          <img
            src={props.src || ''}
            alt={props.alt || '图片'}
            style={{
              width: props.width || '100%',
              height: props.height || 'auto',
              objectFit: props.objectFit || 'cover',
              display: 'block',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      default:
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂不支持该组件的实时渲染"
            style={{ margin: 0, padding: '32px 0' }}
          />
        );
    }
    } catch (error) {
      console.error('FormRenderer render error:', error);
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`渲染错误: ${error instanceof Error ? error.message : '未知错误'}`}
          style={{ margin: 0, padding: '32px 0' }}
        />
      );
    }
  };

  // 表单组件不需要 padding，直接使用定义的大小
  const isFormComponent = componentId === 'form-form';
  
  // 判断是否是表单类型的组件（除了表单容器）
  const isFormTypeComponent = (componentId.startsWith('form-') || componentId.startsWith('control-')) && componentId !== 'form-form';
  
  // 获取组件标签文本的默认值
  const getDefaultLabelText = () => {
    if (componentName) {
      return componentName;
    }
    // 根据 componentId 映射中文名称
    const labelMap: Record<string, string> = {
      'form-text': '文本框',
      'form-select': '下拉框',
      'form-checkbox': '多选框',
      'form-date-range': '日期段选择',
      'form-radio': '单选框',
      'form-switch': '开关切换',
      'control-filter': '过滤器',
      'control-button': '按钮',
      'control-input': '输入框',
    };
    return labelMap[componentId] || '表单组件';
  };

  // 获取当前标签文本（优先使用 propsValues.formLabel，否则使用默认值）
  // 支持空字符串，只有当 formLabel 为 undefined 时才使用默认值
  const getLabelText = () => {
    return propsValues?.formLabel !== undefined ? propsValues.formLabel : getDefaultLabelText();
  };

  const containerStyle: React.CSSProperties = isFormComponent
    ? {
        height,
        width,
        position: 'relative',
      }
    : {
        height,
        width,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 8px',
        gap: 8,
      };

  return (
    <div style={containerStyle}>
      {isFormTypeComponent && (
        <div
          style={{
            fontSize: 12,
            color: '#666',
            fontWeight: 500,
            lineHeight: '20px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {getLabelText()}：
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0 }}>
        {renderComponent()}
      </div>
    </div>
  );
};

export default FormRenderer;

