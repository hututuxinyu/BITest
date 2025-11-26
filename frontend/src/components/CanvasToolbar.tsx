import React from 'react';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  CompressOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  ColumnWidthOutlined,
  MenuOutlined,
} from '@ant-design/icons';

export interface CanvasToolbarProps {
  // 缩放相关
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  // 网格相关
  showGrid: boolean;
  onToggleGrid: () => void;
  // 撤销/重做
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // 对齐相关
  selectedCount: number;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
  // 分布相关
  onDistributeHorizontally: () => void;
  onDistributeVertically: () => void;
  // 层级相关
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  showGrid,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedCount,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onDistributeHorizontally,
  onDistributeVertically,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
}) => {
  const hasSelection = selectedCount > 0;
  const hasMultipleSelection = selectedCount > 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <Space size="small" wrap>
        {/* 缩放工具 */}
        <Space.Compact>
          <Tooltip title="放大 (Ctrl +)">
            <Button icon={<ZoomInOutlined />} onClick={onZoomIn} size="small" />
          </Tooltip>
          <Tooltip title="缩小 (Ctrl -)">
            <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} size="small" />
          </Tooltip>
          <Tooltip title="适应画布 (Ctrl 0)">
            <Button icon={<CompressOutlined />} onClick={onZoomFit} size="small" />
          </Tooltip>
        </Space.Compact>
        <span style={{ fontSize: 12, color: '#666' }}>{Math.round(zoom * 100)}%</span>

        <Divider type="vertical" />

        {/* 网格工具 */}
        <Tooltip title={showGrid ? '隐藏网格' : '显示网格'}>
          <Button
            icon={<BorderOutlined />}
            onClick={onToggleGrid}
            size="small"
            type={showGrid ? 'primary' : 'default'}
          />
        </Tooltip>

        <Divider type="vertical" />

        {/* 撤销/重做 */}
        <Space.Compact>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo} size="small" />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo} size="small" />
          </Tooltip>
        </Space.Compact>

        {hasSelection && (
          <>
            <Divider type="vertical" />

            {/* 对齐工具 */}
            <Space.Compact>
              <Tooltip title="左对齐">
                <Button
                  icon={<AlignLeftOutlined />}
                  onClick={onAlignLeft}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="水平居中">
                <Button
                  icon={<AlignCenterOutlined />}
                  onClick={onAlignCenter}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="右对齐">
                <Button
                  icon={<AlignRightOutlined />}
                  onClick={onAlignRight}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="顶部对齐">
                <Button
                  icon={<VerticalAlignTopOutlined />}
                  onClick={onAlignTop}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="垂直居中">
                <Button
                  icon={<VerticalAlignMiddleOutlined />}
                  onClick={onAlignMiddle}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="底部对齐">
                <Button
                  icon={<VerticalAlignBottomOutlined />}
                  onClick={onAlignBottom}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
            </Space.Compact>

            {/* 分布工具 */}
            <Space.Compact>
              <Tooltip title="水平分布">
                <Button
                  icon={<ColumnWidthOutlined />}
                  onClick={onDistributeHorizontally}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="垂直分布">
                <Button
                  icon={<MenuOutlined />}
                  onClick={onDistributeVertically}
                  disabled={!hasMultipleSelection}
                  size="small"
                />
              </Tooltip>
            </Space.Compact>

            {/* 层级工具 */}
            <Space.Compact>
              <Tooltip title="置顶">
                <Button icon={<VerticalAlignTopOutlined />} onClick={onBringToFront} size="small" />
              </Tooltip>
              <Tooltip title="上移一层">
                <Button icon={<VerticalAlignMiddleOutlined />} onClick={onBringForward} size="small" />
              </Tooltip>
              <Tooltip title="下移一层">
                <Button icon={<VerticalAlignBottomOutlined />} onClick={onSendBackward} size="small" />
              </Tooltip>
              <Tooltip title="置底">
                <Button icon={<VerticalAlignTopOutlined rotate={180} />} onClick={onSendToBack} size="small" />
              </Tooltip>
            </Space.Compact>
          </>
        )}
      </Space>
    </div>
  );
};

export default CanvasToolbar;

