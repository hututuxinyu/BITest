import React from 'react';
import { Form, Input, InputNumber, Select, Switch, Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import type { CanvasItem, ComponentProperty } from '../../PropertyPanel';
import '../styles/ComponentPropertyTab.css';

interface ComponentPropertyTabProps {
  item: CanvasItem;
  property?: ComponentProperty;
  componentDefinition?: any; // 组件定义，包含 propsSchema
  onChange: (field: string, value: any) => void;
}

const ComponentPropertyTab: React.FC<ComponentPropertyTabProps> = ({ item, property, componentDefinition, onChange }) => {
  if (!property) {
    return <div>加载中...</div>;
  }

  // 判断是否是表单类型的组件（除了表单容器）
  const isFormTypeComponent = 
    (item.component.componentId.startsWith('form-') || 
     item.component.componentId.startsWith('control-')) && 
    item.component.componentId !== 'form-form';

  // 获取标签文本的默认值
  const getDefaultLabelText = () => {
    if (item.component.componentName) {
      return item.component.componentName;
    }
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
    return labelMap[item.component.componentId] || '表单组件';
  };

  // 获取组件特有属性值
  const getComponentPropValue = (field: string) => {
    const props = item.propsValues || {};
    const defaultValue = componentDefinition?.defaultProps?.[field];
    return props[field] !== undefined ? props[field] : defaultValue;
  };

  // 获取标签文本值
  const getLabelText = () => {
    const props = item.propsValues || {};
    // 支持空字符串，只有当 formLabel 为 undefined 时才使用默认值
    return props.formLabel !== undefined ? props.formLabel : getDefaultLabelText();
  };

  // 渲染组件特有属性
  const renderComponentSpecificProps = () => {
    if (!componentDefinition?.propsSchema || componentDefinition.propsSchema.length === 0) {
      return null;
    }

    return (
      <Collapse.Panel header="组件特有属性" key="componentProps">
        {componentDefinition.propsSchema.map((prop: any) => {
          const value = getComponentPropValue(prop.field);
          
          // 根据类型渲染不同的控件
          if (prop.type === 'boolean') {
            return (
              <Form.Item key={prop.field} label={prop.label} className="config-item">
                <Switch
                  checked={value !== undefined ? value : prop.default}
                  onChange={(checked) => onChange(prop.field, checked)}
                />
                {prop.description && (
                  <div className="config-item-description">{prop.description}</div>
                )}
              </Form.Item>
            );
          }

          if (prop.type === 'enum' && prop.options) {
            return (
              <Form.Item key={prop.field} label={prop.label} className="config-item">
                <Select
                  value={value !== undefined ? value : prop.default}
                  onChange={(val) => onChange(prop.field, val)}
                  options={prop.options.map((opt: any) => ({
                    label: opt.label,
                    value: opt.value,
                  }))}
                />
                {prop.description && (
                  <div className="config-item-description">{prop.description}</div>
                )}
              </Form.Item>
            );
          }

          if (prop.type === 'number') {
            return (
              <Form.Item key={prop.field} label={prop.label} className="config-item">
                <InputNumber
                  value={value !== undefined ? value : prop.default}
                  onChange={(val) => onChange(prop.field, val ?? prop.default)}
                  style={{ width: '100%' }}
                  min={prop.min}
                  max={prop.max}
                  step={prop.step}
                />
                {prop.description && (
                  <div className="config-item-description">{prop.description}</div>
                )}
              </Form.Item>
            );
          }

          // 默认字符串类型
          return (
            <Form.Item key={prop.field} label={prop.label} className="config-item">
              <Input
                value={value !== undefined ? value : prop.default || ''}
                onChange={(e) => onChange(prop.field, e.target.value)}
                placeholder={prop.description}
                maxLength={prop.maxLength}
              />
              {prop.description && (
                <div className="config-item-description">{prop.description}</div>
              )}
            </Form.Item>
          );
        })}
      </Collapse.Panel>
    );
  };

  return (
    <div className="component-property-tab">
      <Collapse
        bordered={false}
        defaultActiveKey={isFormTypeComponent ? ['label', 'componentProps', 'position', 'style'] : ['componentProps', 'position', 'style']}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined
            style={{
              transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        )}
        className="config-collapse"
      >
        {/* 表单组件标签文本编辑 */}
        {isFormTypeComponent && (
          <Collapse.Panel header="标签设置" key="label">
            <Form.Item label="标签文本" className="config-item">
              <Input
                value={getLabelText()}
                onChange={(e) => onChange('formLabel', e.target.value)}
                placeholder="请输入标签文本"
              />
              <div className="config-item-description">表单组件前显示的文本标签</div>
            </Form.Item>
          </Collapse.Panel>
        )}

        {/* 组件特有属性 */}
        {renderComponentSpecificProps()}

        {/* 位置尺寸 */}
        <Collapse.Panel header="位置尺寸" key="position">
          <Form.Item label="X 坐标" className="config-item">
            <InputNumber
              value={property.x}
              onChange={(val) => onChange('x', val || 0)}
              style={{ width: '100%' }}
            />
            <div className="config-item-description">相对于画布左上角的水平距离</div>
          </Form.Item>

          <Form.Item label="Y 坐标" className="config-item">
            <InputNumber
              value={property.y}
              onChange={(val) => onChange('y', val || 0)}
              style={{ width: '100%' }}
            />
            <div className="config-item-description">相对于画布左上角的垂直距离</div>
          </Form.Item>

          <Form.Item label="宽度" className="config-item">
            <InputNumber
              value={property.width}
              onChange={(val) => onChange('width', val || 200)}
              min={100}
              style={{ width: '100%' }}
            />
            <div className="config-item-description">范围：100~画布宽度-20</div>
          </Form.Item>

          <Form.Item label="高度" className="config-item">
            <InputNumber
              value={property.height}
              onChange={(val) => onChange('height', val || 200)}
              min={50}
              style={{ width: '100%' }}
            />
            <div className="config-item-description">范围：50~画布高度-20</div>
          </Form.Item>

          <Form.Item label="等比缩放" className="config-item">
            <Switch
              checked={property.keepAspectRatio}
              onChange={(checked) => onChange('keepAspectRatio', checked)}
            />
            <div className="config-item-description">开启后修改宽度/高度时保持宽高比</div>
          </Form.Item>
        </Collapse.Panel>

        {/* 样式设置 */}
        <Collapse.Panel header="样式设置" key="style">
          <Form.Item label="背景色" className="config-item">
            <div className="color-picker-wrapper">
              <div
                className="color-picker-preview"
                style={{ backgroundColor: property.backgroundColor }}
              />
              <Input
                className="color-picker-input"
                value={property.backgroundColor}
                onChange={(e) => onChange('backgroundColor', e.target.value)}
                placeholder="#FFFFFF"
              />
            </div>
          </Form.Item>

          <Form.Item label="边框设置" className="config-item">
            <Switch
              checked={property.border?.enabled}
              onChange={(checked) => onChange('border.enabled', checked)}
            />
          </Form.Item>

          {property.border?.enabled && (
            <>
              <Form.Item label="边框宽度" className="config-item">
                <InputNumber
                  value={property.border.width}
                  onChange={(val) => onChange('border.width', val || 1)}
                  min={1}
                  max={5}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="边框样式" className="config-item">
                <Select
                  value={property.border.style}
                  onChange={(val) => onChange('border.style', val)}
                >
                  <Select.Option value="solid">实线</Select.Option>
                  <Select.Option value="dashed">虚线</Select.Option>
                  <Select.Option value="dotted">点线</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="边框颜色" className="config-item">
                <div className="color-picker-wrapper">
                  <div
                    className="color-picker-preview"
                    style={{ backgroundColor: property.border.color }}
                  />
                  <Input
                    className="color-picker-input"
                    value={property.border.color}
                    onChange={(e) => onChange('border.color', e.target.value)}
                    placeholder="#E5E7EB"
                  />
                </div>
              </Form.Item>
              <Form.Item label="圆角" className="config-item">
                <InputNumber
                  value={property.border.radius}
                  onChange={(val) => onChange('border.radius', val || 0)}
                  min={0}
                  max={20}
                  style={{ width: '100%' }}
                />
                <div className="config-item-description">范围：0~20px</div>
              </Form.Item>
            </>
          )}

          <Form.Item label="阴影效果" className="config-item">
            <Switch
              checked={property.shadow?.enabled}
              onChange={(checked) => onChange('shadow.enabled', checked)}
            />
          </Form.Item>

          {property.shadow?.enabled && (
            <>
              <Form.Item label="X偏移" className="config-item">
                <InputNumber
                  value={property.shadow.offsetX}
                  onChange={(val) => onChange('shadow.offsetX', val || 0)}
                  min={-20}
                  max={20}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Y偏移" className="config-item">
                <InputNumber
                  value={property.shadow.offsetY}
                  onChange={(val) => onChange('shadow.offsetY', val || 0)}
                  min={-20}
                  max={20}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="模糊度" className="config-item">
                <InputNumber
                  value={property.shadow.blur}
                  onChange={(val) => onChange('shadow.blur', val || 0)}
                  min={0}
                  max={50}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="阴影颜色" className="config-item">
                <div className="color-picker-wrapper">
                  <div
                    className="color-picker-preview"
                    style={{ backgroundColor: property.shadow.color }}
                  />
                  <Input
                    className="color-picker-input"
                    value={property.shadow.color}
                    onChange={(e) => onChange('shadow.color', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </Form.Item>
              <Form.Item label="透明度" className="config-item">
                <InputNumber
                  value={property.shadow.opacity}
                  onChange={(val) => onChange('shadow.opacity', val || 0.1)}
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="内边距" className="config-item">
            <div style={{ display: 'flex', gap: 8 }}>
              <InputNumber
                value={property.padding.top}
                onChange={(val) => onChange('padding.top', val || 16)}
                placeholder="上"
                style={{ flex: 1 }}
              />
              <InputNumber
                value={property.padding.right}
                onChange={(val) => onChange('padding.right', val || 16)}
                placeholder="右"
                style={{ flex: 1 }}
              />
              <InputNumber
                value={property.padding.bottom}
                onChange={(val) => onChange('padding.bottom', val || 16)}
                placeholder="下"
                style={{ flex: 1 }}
              />
              <InputNumber
                value={property.padding.left}
                onChange={(val) => onChange('padding.left', val || 16)}
                placeholder="左"
                style={{ flex: 1 }}
              />
            </div>
          </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default ComponentPropertyTab;

