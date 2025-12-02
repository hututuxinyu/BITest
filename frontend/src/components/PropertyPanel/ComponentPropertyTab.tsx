import React from 'react';
import { Form, Input, InputNumber, Select, Switch, Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import type { CanvasItem, ComponentProperty } from '../PropertyPanel';
import './ComponentPropertyTab.css';

interface ComponentPropertyTabProps {
  item: CanvasItem;
  property?: ComponentProperty;
  onChange: (field: string, value: any) => void;
}

const ComponentPropertyTab: React.FC<ComponentPropertyTabProps> = ({ item, property, onChange }) => {
  if (!property) {
    return <div>加载中...</div>;
  }

  return (
    <div className="component-property-tab">
      {/* 基础信息 */}
      <Collapse
        bordered={false}
        defaultActiveKey={['basic', 'position', 'style', 'title']}
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
        <Collapse.Panel header="基础信息" key="basic">
          <Form.Item label="组件名称" className="config-item">
            <Input
              value={property.name}
              onChange={(e) => onChange('name', e.target.value)}
              maxLength={20}
              placeholder={`${item.component.componentName} - ${item.id}`}
            />
            <div className="config-item-description">最多20字</div>
          </Form.Item>

          <Form.Item label="组件描述" className="config-item">
            <Input.TextArea
              value={property.description}
              onChange={(e) => onChange('description', e.target.value)}
              rows={2}
              maxLength={100}
              placeholder="请输入组件描述"
            />
            <div className="config-item-description">最多100字</div>
          </Form.Item>

          <Form.Item label="组件ID" className="config-item">
            <Input
              value={property.id}
              disabled
              placeholder="自动生成"
            />
            <div className="config-item-description">唯一标识，不可修改</div>
          </Form.Item>

          <Form.Item label="可见性" className="config-item">
            <Switch
              checked={property.visible}
              onChange={(checked) => onChange('visible', checked)}
            />
            <div className="config-item-description">关闭后组件在画布和预览中隐藏</div>
          </Form.Item>

          <Form.Item label="锁定状态" className="config-item">
            <Switch
              checked={property.locked}
              onChange={(checked) => onChange('locked', checked)}
            />
            <div className="config-item-description">开启后组件无法拖动、修改尺寸</div>
          </Form.Item>

          <Form.Item label="层级（zIndex）" className="config-item">
            <InputNumber
              value={property.zIndex}
              onChange={(val) => onChange('zIndex', val || 1)}
              min={1}
              max={100}
              style={{ width: '100%' }}
            />
            <div className="config-item-description">数值越大越靠上（范围：1~100）</div>
          </Form.Item>
        </Collapse.Panel>

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

        {/* 标题设置 */}
        <Collapse.Panel header="标题设置" key="title">
          <Form.Item label="标题显示" className="config-item">
            <Switch
              checked={property.title?.visible}
              onChange={(checked) => onChange('title.visible', checked)}
            />
          </Form.Item>

          {property.title?.visible && (
            <>
              <Form.Item label="标题文本" className="config-item">
                <Input
                  value={property.title.text}
                  onChange={(e) => onChange('title.text', e.target.value)}
                  maxLength={30}
                  placeholder={item.component.componentName}
                />
                <div className="config-item-description">最多30字</div>
              </Form.Item>

              <Form.Item label="标题字体" className="config-item">
                <Select
                  value={property.title.font}
                  onChange={(val) => onChange('title.font', val)}
                >
                  <Select.Option value="inherit">全局字体</Select.Option>
                  <Select.Option value="微软雅黑">微软雅黑</Select.Option>
                  <Select.Option value="思源黑体">思源黑体</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="标题字号" className="config-item">
                <InputNumber
                  value={property.title.fontSize}
                  onChange={(val) => onChange('title.fontSize', val || 16)}
                  min={12}
                  max={24}
                  style={{ width: '100%' }}
                />
                <div className="config-item-description">范围：12~24px</div>
              </Form.Item>

              <Form.Item label="标题颜色" className="config-item">
                <div className="color-picker-wrapper">
                  <div
                    className="color-picker-preview"
                    style={{ backgroundColor: property.title.color }}
                  />
                  <Input
                    className="color-picker-input"
                    value={property.title.color}
                    onChange={(e) => onChange('title.color', e.target.value)}
                    placeholder="#333333"
                  />
                </div>
              </Form.Item>

              <Form.Item label="标题对齐" className="config-item">
                <Select
                  value={property.title.align}
                  onChange={(val) => onChange('title.align', val)}
                >
                  <Select.Option value="left">左对齐</Select.Option>
                  <Select.Option value="center">居中</Select.Option>
                  <Select.Option value="right">右对齐</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="标题位置" className="config-item">
                <Select
                  value={property.title.position}
                  onChange={(val) => onChange('title.position', val)}
                >
                  <Select.Option value="top">顶部</Select.Option>
                  <Select.Option value="bottom">底部</Select.Option>
                  <Select.Option value="left">左侧</Select.Option>
                  <Select.Option value="right">右侧</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default ComponentPropertyTab;

