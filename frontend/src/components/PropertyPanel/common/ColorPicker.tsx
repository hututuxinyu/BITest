import React, { useState, useEffect } from 'react';
import { Popover, Input } from 'antd';
import './ColorPicker.css';

/**
 * 基础色系定义
 */
const BASE_COLORS = [
  // 红色系
  ['#FF4D4F', '#FF7875', '#FFA39E', '#FFCCC7', '#FFF1F0'],
  // 橙色系
  ['#FF7A45', '#FF9C6E', '#FFBB96', '#FFD8BF', '#FFF2E8'],
  // 黄色系
  ['#FFC53D', '#FFD666', '#FFE58F', '#FFF1B8', '#FFFBE6'],
  // 绿色系
  ['#52C41A', '#73D13D', '#95DE64', '#B7EB8F', '#F6FFED'],
  // 青色系
  ['#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#E6FFFB'],
  // 蓝色系
  ['#1890FF', '#40A9FF', '#69C0FF', '#91D5FF', '#E6F7FF'],
  // 紫色系
  ['#722ED1', '#9254DE', '#B37FEB', '#D3ADF7', '#F9F0FF'],
  // 灰色系
  ['#595959', '#8C8C8C', '#BFBFBF', '#D9D9D9', '#F0F0F0'],
  // 黑色和白色
  ['#000000', '#FFFFFF', '#FAFAFA', '#F5F5F5', '#E5E5E5'],
];

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  placeholder?: string;
  allowCustom?: boolean; // 是否允许自定义颜色输入
}

/**
 * 颜色选择器组件
 * 支持基础色系色块选择和自定义颜色输入
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#FFFFFF',
  onChange,
  placeholder = '#FFFFFF',
  allowCustom = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handleColorSelect = (color: string) => {
    setCustomColor(color);
    onChange?.(color);
    setVisible(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange?.(color);
  };

  const colorPalette = (
    <div className="color-picker-palette">
      <div className="color-picker-grid">
        {BASE_COLORS.map((row, rowIndex) => (
          <div key={rowIndex} className="color-picker-row">
            {row.map((color) => {
              const isActive = value?.toLowerCase() === color.toLowerCase();
              // 判断是否为浅色（需要深色对勾）
              const isLightColor = ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#E5E5E5', '#F0F0F0', '#D9D9D9', '#BFBFBF', 
                                   '#FFFBE6', '#FFF1B8', '#FFE58F', '#FFD666', '#FFF2E8', '#FFD8BF', 
                                   '#FFCCC7', '#FFF1F0', '#F6FFED', '#B7EB8F', '#E6FFFB', '#87E8DE', 
                                   '#E6F7FF', '#91D5FF', '#F9F0FF', '#D3ADF7'].includes(color.toUpperCase());
              return (
                <div
                  key={color}
                  className={`color-picker-swatch ${isActive ? 'active' : ''} ${isLightColor ? 'light' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              );
            })}
          </div>
        ))}
      </div>
      {allowCustom && (
        <div className="color-picker-custom">
          <div className="color-picker-custom-label">自定义颜色：</div>
          <div className="color-picker-custom-input-wrapper">
            <div
              className="color-picker-custom-preview"
              style={{ backgroundColor: customColor || '#FFFFFF' }}
            />
            <Input
              className="color-picker-custom-input"
              value={customColor || ''}
              onChange={handleCustomColorChange}
              placeholder={placeholder}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="color-picker-wrapper">
      <Popover
        content={colorPalette}
        trigger="click"
        open={visible}
        onOpenChange={setVisible}
        placement="bottomLeft"
        overlayClassName="color-picker-popover"
      >
        <div
          className="color-picker-preview"
          style={{ backgroundColor: value || '#FFFFFF' }}
          onClick={() => setVisible(true)}
        />
      </Popover>
      {allowCustom && (
        <Input
          className="color-picker-input"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default ColorPicker;
