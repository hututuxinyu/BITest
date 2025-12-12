import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Switch, Upload, Collapse, Radio, message } from 'antd';
import { PictureOutlined, CaretRightOutlined } from '@ant-design/icons';
import type { CanvasConfig } from '../../PropertyPanel';
import { getAllThemes, getThemeById, getDefaultTheme, type Theme } from '../../../themes';
import { getPalette } from '../../../themes/echartsTheme';
import { applyThemeToCanvas } from '../../../utils/themeUtils';
import '../styles/CanvasConfigTab.css';

interface CanvasConfigTabProps {
  config?: CanvasConfig;
  onChange: (config: CanvasConfig) => void;
}

const CanvasConfigTab: React.FC<CanvasConfigTabProps> = ({ config, onChange }) => {
  const defaultTheme = getDefaultTheme();
  const [selectedThemeId, setSelectedThemeId] = useState<'light' | 'dark'>(
    config?.theme?.themeId || defaultTheme.themeId
  );
  const themes = getAllThemes();

  // 当外部config变化时，同步selectedThemeId
  useEffect(() => {
    if (config?.theme?.themeId) {
      setSelectedThemeId(config.theme.themeId);
    } else if (config) {
      const themedConfig = applyThemeToCanvas(config, defaultTheme);
      onChange(themedConfig);
      setSelectedThemeId(defaultTheme.themeId);
    }
  }, [config, defaultTheme, onChange]);

  if (!config) {
    return <div>加载中...</div>;
  }

  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  /**
   * 处理主题选择变化
   */
  const handleThemeChange = (themeId: 'light' | 'dark') => {
    const theme = getThemeById(themeId);
    if (!theme) {
      message.error('主题不存在');
      return;
    }

    setSelectedThemeId(themeId);

    // 应用主题到画布配置
    const updatedConfig = applyThemeToCanvas(config, theme);
    onChange(updatedConfig);
    message.success(`已应用${theme.themeName}`);
  };

  return (
    <div className="canvas-config-tab">
      <Collapse
        bordered={false}
        defaultActiveKey={['basic', 'style']}
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
        {/* 基础设置 */}
        <Collapse.Panel header="基础设置" key="basic">
          <Form.Item label="报表名称" className="config-item">
            <Input
              value={config.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={20}
              placeholder="未命名报表"
            />
            <div className="config-item-description">最多20字</div>
          </Form.Item>

          <Form.Item label="画布宽度" className="config-item">
          <div className="unit-selector">
            <InputNumber
              value={config.width}
              onChange={(val) => handleChange('width', val || 1920)}
              min={800}
              max={4000}
              style={{ flex: 1 }}
            />
            <Select value="px" style={{ width: 60 }}>
              <Select.Option value="px">px</Select.Option>
              <Select.Option value="%">%</Select.Option>
              <Select.Option value="vw">vw</Select.Option>
            </Select>
          </div>
          <div className="config-item-description">范围：800~4000px</div>
        </Form.Item>

        <Form.Item label="画布高度" className="config-item">
          <div className="unit-selector">
            <InputNumber
              value={config.height}
              onChange={(val) => handleChange('height', val || 1080)}
              min={600}
              max={3000}
              style={{ flex: 1 }}
            />
            <Select value="px" style={{ width: 60 }}>
              <Select.Option value="px">px</Select.Option>
              <Select.Option value="%">%</Select.Option>
              <Select.Option value="vh">vh</Select.Option>
            </Select>
          </div>
          <div className="config-item-description">范围：600~3000px</div>
        </Form.Item>

        <Form.Item label="适配模式" className="config-item">
          <Select
            value={config.adaptMode}
            onChange={(val) => handleChange('adaptMode', val)}
          >
            <Select.Option value="scale">等比缩放</Select.Option>
            <Select.Option value="stretch">拉伸填充</Select.Option>
            <Select.Option value="fixed">固定宽高比</Select.Option>
          </Select>
          <div className="config-item-description">选择画布在不同屏幕尺寸下的适配方式</div>
        </Form.Item>

        <Form.Item label="网格显示" className="config-item">
          <Switch
            checked={config.gridVisible}
            onChange={(checked) => handleChange('gridVisible', checked)}
          />
          <div className="config-item-description">开启后在画布上显示网格辅助线</div>
        </Form.Item>

        {config.gridVisible && (
          <Form.Item label="网格大小" className="config-item">
            <Select
              value={config.gridSize}
              onChange={(val) => handleChange('gridSize', val)}
            >
              <Select.Option value={10}>10px</Select.Option>
              <Select.Option value={20}>20px</Select.Option>
              <Select.Option value={30}>30px</Select.Option>
              <Select.Option value={50}>50px</Select.Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item label="报表描述" className="config-item">
          <Input.TextArea
            value={config.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="请输入报表描述"
          />
          <div className="config-item-description">最多500字</div>
        </Form.Item>
        </Collapse.Panel>

        {/* 样式设置 */}
        <Collapse.Panel header="样式设置" key="style">
          {/* 主题选择（新增，放在最前面） */}
          <Form.Item label="主题" className="config-item">
            <Radio.Group
              value={selectedThemeId}
              onChange={(e) => handleThemeChange(e.target.value)}
              style={{ width: '100%', display: 'flex' }}
            >
              {themes.map((theme) => (
                <Radio.Button
                  key={theme.themeId}
                  value={theme.themeId}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {theme.themeName}
                </Radio.Button>
              ))}
            </Radio.Group>
            <div className="config-item-description">
              {themes.find((t) => t.themeId === selectedThemeId)?.description ||
                '选择画布和组件的整体颜色风格'}
            </div>
          </Form.Item>

          {/* 主题颜色预览（可选） */}
          {config.theme && (
            <Form.Item label="主题预览" className="config-item">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '8px 0',
                }}
              >
                {[config.theme.colors.componentBackground, ...getPalette(config.theme).slice(0, 4)].map(
                  (color, idx) => (
                    <div
                      key={`${color}-${idx}`}
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: color,
                        border: `1px solid ${config.theme.colors.componentBorder}`,
                        borderRadius: 4,
                      }}
                      title={idx === 0 ? '组件背景' : `图表配色 ${idx}`}
                    />
                  )
                )}
              </div>
            </Form.Item>
          )}

          <Form.Item label="背景类型" className="config-item">
          <Select
            value={config.backgroundType}
            onChange={(val) => handleChange('backgroundType', val)}
          >
            <Select.Option value="solid">纯色</Select.Option>
            <Select.Option value="gradient">渐变</Select.Option>
            <Select.Option value="image">图片</Select.Option>
            <Select.Option value="transparent">透明</Select.Option>
          </Select>
          <div className="config-item-description">选择画布背景的显示方式</div>
        </Form.Item>

        {config.backgroundType === 'solid' && (
          <Form.Item label="背景色" className="config-item">
            <div className="color-picker-wrapper">
              <div
                className="color-picker-preview"
                style={{ backgroundColor: config.backgroundColor }}
                onClick={() => {
                  // 这里可以打开颜色选择器
                }}
              />
              <Input
                className="color-picker-input"
                value={config.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                placeholder="#F5F5F5"
              />
            </div>
          </Form.Item>
        )}

        {config.backgroundType === 'gradient' && (
          <>
            <Form.Item label="渐变方向" className="config-item">
              <Select
                value={config.gradientDirection}
                onChange={(val) => handleChange('gradientDirection', val)}
              >
                <Select.Option value="top-bottom">从上到下</Select.Option>
                <Select.Option value="left-right">从左到右</Select.Option>
                <Select.Option value="diagonal">对角线</Select.Option>
                <Select.Option value="radial">径向</Select.Option>
              </Select>
              <div className="config-item-description">选择渐变色的方向</div>
            </Form.Item>
            <Form.Item label="渐变起始色" className="config-item">
              <div className="color-picker-wrapper">
                <div
                  className="color-picker-preview"
                  style={{ backgroundColor: config.gradientStartColor || '#FFFFFF' }}
                />
                <Input
                  className="color-picker-input"
                  value={config.gradientStartColor || '#FFFFFF'}
                  onChange={(e) => handleChange('gradientStartColor', e.target.value)}
                  placeholder="#FFFFFF"
                />
              </div>
            </Form.Item>
            <Form.Item label="渐变结束色" className="config-item">
              <div className="color-picker-wrapper">
                <div
                  className="color-picker-preview"
                  style={{ backgroundColor: config.gradientEndColor || '#F5F5F5' }}
                />
                <Input
                  className="color-picker-input"
                  value={config.gradientEndColor || '#F5F5F5'}
                  onChange={(e) => handleChange('gradientEndColor', e.target.value)}
                  placeholder="#F5F5F5"
                />
              </div>
            </Form.Item>
          </>
        )}

        {config.backgroundType === 'image' && (
          <>
            <Form.Item label="背景图片" className="config-item">
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
              >
                <div>
                  <PictureOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              </Upload>
              <div className="config-item-description">支持本地上传或URL输入</div>
            </Form.Item>
            <Form.Item label="图片缩放" className="config-item">
              <Select
                value={config.imageScale}
                onChange={(val) => handleChange('imageScale', val)}
              >
                <Select.Option value="stretch">拉伸</Select.Option>
                <Select.Option value="tile">平铺</Select.Option>
                <Select.Option value="center">居中</Select.Option>
              </Select>
              <div className="config-item-description">选择背景图片的显示方式</div>
            </Form.Item>
          </>
        )}

        <Form.Item label="画布边框" className="config-item">
          <Switch
            checked={config.borderEnabled}
            onChange={(checked) => handleChange('borderEnabled', checked)}
          />
          <div className="config-item-description">开启后显示画布边框</div>
        </Form.Item>

        {config.borderEnabled && (
          <>
            <Form.Item label="边框宽度" className="config-item">
              <InputNumber
                value={config.borderWidth || 1}
                onChange={(val) => handleChange('borderWidth', val || 1)}
                min={1}
                max={10}
                style={{ width: '100%' }}
              />
              <div className="config-item-description">边框线条的宽度（范围：1~10px）</div>
            </Form.Item>
            <Form.Item label="边框样式" className="config-item">
              <Select
                value={config.borderStyle || 'solid'}
                onChange={(val) => handleChange('borderStyle', val)}
              >
                <Select.Option value="solid">实线</Select.Option>
                <Select.Option value="dashed">虚线</Select.Option>
                <Select.Option value="dotted">点线</Select.Option>
              </Select>
              <div className="config-item-description">选择边框的线条样式</div>
            </Form.Item>
            <Form.Item label="边框颜色" className="config-item">
              <div className="color-picker-wrapper">
                <div
                  className="color-picker-preview"
                  style={{ backgroundColor: config.borderColor || '#E5E7EB' }}
                />
                <Input
                  className="color-picker-input"
                  value={config.borderColor || '#E5E7EB'}
                  onChange={(e) => handleChange('borderColor', e.target.value)}
                  placeholder="#E5E7EB"
                />
              </div>
            </Form.Item>
          </>
        )}

        <Form.Item label="全局字体" className="config-item">
          <Select
            value={config.globalFont}
            onChange={(val) => handleChange('globalFont', val)}
          >
            <Select.Option value="系统字体">系统字体</Select.Option>
            <Select.Option value="微软雅黑">微软雅黑</Select.Option>
            <Select.Option value="思源黑体">思源黑体</Select.Option>
            <Select.Option value="自定义">自定义</Select.Option>
          </Select>
          <div className="config-item-description">设置画布中所有组件的默认字体</div>
        </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default CanvasConfigTab;

