/**
 * 画布核心交互层：
 * - 选中/拖拽/缩放/平移/框选/对齐线/网格吸附
 * - 调整大小、层级、复制粘贴、删除、右键菜单、快捷键
 * - 将渲染职责委托给 renderItem 回调
 */
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Menu, message } from 'antd';
import { DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import type { ComponentSummary, ComponentDefinition, DatasourceConfig } from '../../types';
import { HistoryManager } from '../../utils/historyManager';
import {
  Position,
  Size,
  Bounds,
  calculateAlignmentLines,
  snapToGrid,
  snapToAlignmentLine,
  isBoundsIntersecting,
} from '../../utils/canvasUtils';

export interface EnhancedCanvasItem {
  id: string;
  component: ComponentSummary;
  definition?: ComponentDefinition | null;
  loading: boolean;
  error?: string;
  propsValues?: Record<string, any>;
  position: Position;
  size: Size;
  zIndex: number;
  datasourceConfig?: DatasourceConfig;
  queryConfig?: any; // 查询配置（SQL、参数等）
  interactionConfig?: any; // 交互配置（events数组）
  visible?: boolean; // 是否可见
  locked?: boolean; // 是否锁定
  parentId?: string;
  children?: string[];
  parentSlot?: string;
}

export interface EnhancedCanvasProps {
  items: EnhancedCanvasItem[];
  selectedIds: string[];
  onItemsChange: (items: EnhancedCanvasItem[]) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onItemSelect: (id: string) => void;
  renderItem: (item: EnhancedCanvasItem) => React.ReactNode;
  canvasWidth?: number;
  canvasHeight?: number;
  canvasBackgroundColor?: string;
  gridSize?: number;
  showGrid?: boolean;
  showAlignmentLines?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  historyManager?: HistoryManager<EnhancedCanvasItem[]>;
}

const GRID_SIZE = 10;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1;
const ALIGNMENT_THRESHOLD = 5;

interface LayoutSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const getLayoutSlots = (item: EnhancedCanvasItem): LayoutSlot[] => {
  const width = item.size.width;
  const height = item.size.height;
  const props = { ...(item.definition?.defaultProps || {}), ...(item.propsValues || {}) };
  if (item.component.componentId === 'layout-top-bottom') {
    const gap = Number(props.gap) || 0;
    const topRatio = Number(props.topRatio) || 1;
    const bottomRatio = Number(props.bottomRatio) || 1;
    const totalRatio = topRatio + bottomRatio || 1;
    const topHeight = ((height - gap) * topRatio) / totalRatio;
    const bottomHeight = Math.max(0, height - gap - topHeight);
    return [
      { id: 'top', x: 0, y: 0, width, height: topHeight },
      { id: 'bottom', x: 0, y: topHeight + gap, width, height: bottomHeight },
    ];
  }
  if (item.component.componentId === 'layout-left-right') {
    const gap = Number(props.gap) || 0;
    const leftRatio = Number(props.leftRatio) || 1;
    const rightRatio = Number(props.rightRatio) || 1;
    const totalRatio = leftRatio + rightRatio || 1;
    const leftWidth = ((width - gap) * leftRatio) / totalRatio;
    const rightWidth = Math.max(0, width - gap - leftWidth);
    return [
      { id: 'left', x: 0, y: 0, width: leftWidth, height },
      { id: 'right', x: leftWidth + gap, y: 0, width: rightWidth, height },
    ];
  }
  return [];
};

const EnhancedCanvas: React.FC<EnhancedCanvasProps> = ({
  items,
  selectedIds,
  onItemsChange,
  onSelectionChange,
  renderItem,
  canvasWidth = 1920,
  canvasHeight = 1080,
  canvasBackgroundColor = '#fafafa',
  gridSize = GRID_SIZE,
  showGrid = false,
  showAlignmentLines = true,
  zoom: externalZoom,
  onZoomChange,
  historyManager,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(externalZoom || DEFAULT_ZOOM);
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ itemId: string; startPos: Position; startSize: Size; startItemPos: Position; handle: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ offset: Position; itemPositions: Map<string, Position> } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Position | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Position | null>(null);
  const [alignmentLines, setAlignmentLines] = useState<{ type: 'vertical' | 'horizontal'; value: number }[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);
  const [copiedItems, setCopiedItems] = useState<EnhancedCanvasItem[]>([]);

  const effectiveZoom = externalZoom !== undefined ? externalZoom : zoom;

  // 更新缩放
  const updateZoom = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      if (externalZoom !== undefined && onZoomChange) {
        onZoomChange(clampedZoom);
      } else {
        setZoom(clampedZoom);
      }
    },
    [externalZoom, onZoomChange]
  );

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    updateZoom(effectiveZoom + 0.1);
  }, [effectiveZoom, updateZoom]);

  const handleZoomOut = useCallback(() => {
    updateZoom(effectiveZoom - 0.1);
  }, [effectiveZoom, updateZoom]);

  const handleZoomFit = useCallback(() => {
    if (canvasRef.current) {
      const containerRect = canvasRef.current.getBoundingClientRect();
      const scaleX = containerRect.width / canvasWidth;
      const scaleY = containerRect.height / canvasHeight;
      const fitZoom = Math.min(scaleX, scaleY) * 0.9;
      updateZoom(fitZoom);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [canvasWidth, canvasHeight, updateZoom]);

  // 画布平移
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return;
      }

      // 如果点击在画布背景上（不是组件）
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd + 拖拽 = 平移画布
          setIsPanning(true);
          setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        } else {
          // 普通点击 = 开始框选
          setIsSelecting(true);
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const x = (e.clientX - rect.left) / effectiveZoom - panOffset.x;
            const y = (e.clientY - rect.top) / effectiveZoom - panOffset.y;
            setSelectionStart({ x, y });
            setSelectionEnd({ x, y });
            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
              onSelectionChange([]);
            }
          }
        }
      }
    },
    [panOffset, effectiveZoom, onSelectionChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const newOffset = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        };
        setPanOffset(newOffset);
      } else if (isSelecting && selectionStart) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left) / effectiveZoom - panOffset.x;
          const y = (e.clientY - rect.top) / effectiveZoom - panOffset.y;
          setSelectionEnd({ x, y });
        }
      } else if (isDragging && dragStart) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          // 计算鼠标当前位置在画布坐标系中的位置
          const currentMouseX = (e.clientX - rect.left) / effectiveZoom - panOffset.x;
          const currentMouseY = (e.clientY - rect.top) / effectiveZoom - panOffset.y;

          // 计算第一个选中组件的新位置（鼠标位置减去点击时的偏移）
          const firstItemId = selectedIds[0];
          const firstItemStartPos = dragStart.itemPositions.get(firstItemId);
          if (!firstItemStartPos) {
            return;
          }

          let newX = currentMouseX - dragStart.offset.x;
          let newY = currentMouseY - dragStart.offset.y;

          // 网格对齐
          if (showGrid) {
            newX = snapToGrid(newX, gridSize);
            newY = snapToGrid(newY, gridSize);
          }

          // 对齐辅助线
          if (showAlignmentLines && selectedIds.length > 0) {
            const movingItem = items.find((item) => item.id === firstItemId);
            if (movingItem) {
              const movingBounds: Bounds = {
                x: newX,
                y: newY,
                width: movingItem.size.width,
                height: movingItem.size.height,
              };

              const staticItems = items.filter((item) => !selectedIds.includes(item.id));
              const lines: { type: 'vertical' | 'horizontal'; value: number }[] = [];

              for (const staticItem of staticItems) {
                const staticBounds: Bounds = {
                  x: staticItem.position.x,
                  y: staticItem.position.y,
                  width: staticItem.size.width,
                  height: staticItem.size.height,
                };
                const itemLines = calculateAlignmentLines(movingBounds, staticBounds, ALIGNMENT_THRESHOLD);
                lines.push(...itemLines);
              }

              if (lines.length > 0) {
                setAlignmentLines(lines);
                const verticalLines = lines.filter((l) => l.type === 'vertical').map((l) => l.value);
                const horizontalLines = lines.filter((l) => l.type === 'horizontal').map((l) => l.value);
                newX = snapToAlignmentLine(newX, verticalLines, ALIGNMENT_THRESHOLD);
                newY = snapToAlignmentLine(newY, horizontalLines, ALIGNMENT_THRESHOLD);
              } else {
                setAlignmentLines([]);
              }
            }
          }

          // 计算所有选中组件的相对偏移
          const deltaX = newX - firstItemStartPos.x;
          const deltaY = newY - firstItemStartPos.y;

          // 更新所有选中项的位置
          const updatedItems = items.map((item) => {
            if (selectedIds.includes(item.id)) {
              const startPos = dragStart.itemPositions.get(item.id);
              if (startPos) {
                return {
                  ...item,
                  position: {
                    x: startPos.x + deltaX,
                    y: startPos.y + deltaY,
                  },
                };
              }
            }
            return item;
          });

          onItemsChange(updatedItems);
        }
      } else if (isResizing && resizeStart) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const item = items.find((i) => i.id === resizeStart.itemId);
          if (item) {
            const newX = (e.clientX - rect.left) / effectiveZoom - panOffset.x;
            const newY = (e.clientY - rect.top) / effectiveZoom - panOffset.y;

            const deltaX = newX - resizeStart.startPos.x;
            const deltaY = newY - resizeStart.startPos.y;

            let newWidth = resizeStart.startSize.width;
            let newHeight = resizeStart.startSize.height;
            let newPosX = resizeStart.startItemPos.x;
            let newPosY = resizeStart.startItemPos.y;

            const handle = resizeStart.handle;

            // 根据不同的锚点计算新的位置和大小
            if (handle.includes('e')) {
              // 右边缘
              newWidth = Math.max(50, resizeStart.startSize.width + deltaX);
            }
            if (handle.includes('w')) {
              // 左边缘
              newWidth = Math.max(50, resizeStart.startSize.width - deltaX);
              newPosX = resizeStart.startItemPos.x + (resizeStart.startSize.width - newWidth);
            }
            if (handle.includes('s')) {
              // 下边缘
              newHeight = Math.max(50, resizeStart.startSize.height + deltaY);
            }
            if (handle.includes('n')) {
              // 上边缘
              newHeight = Math.max(50, resizeStart.startSize.height - deltaY);
              newPosY = resizeStart.startItemPos.y + (resizeStart.startSize.height - newHeight);
            }

            if (showGrid) {
              newWidth = snapToGrid(newWidth, gridSize);
              newHeight = snapToGrid(newHeight, gridSize);
              newPosX = snapToGrid(newPosX, gridSize);
              newPosY = snapToGrid(newPosY, gridSize);
            }

            const updatedItems = items.map((i) =>
              i.id === resizeStart.itemId
                ? {
                    ...i,
                    position: { x: newPosX, y: newPosY },
                    size: { width: newWidth, height: newHeight },
                  }
                : i
            );
            onItemsChange(updatedItems);
          }
        }
      }
    },
    [
      isPanning,
      panStart,
      isSelecting,
      selectionStart,
      isDragging,
      dragStart,
      isResizing,
      resizeStart,
      items,
      selectedIds,
      effectiveZoom,
      panOffset,
      showGrid,
      gridSize,
      showAlignmentLines,
      onItemsChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart && selectionEnd) {
      const selectionBounds: Bounds = {
        x: Math.min(selectionStart.x, selectionEnd.x),
        y: Math.min(selectionStart.y, selectionEnd.y),
        width: Math.abs(selectionEnd.x - selectionStart.x),
        height: Math.abs(selectionEnd.y - selectionStart.y),
      };

      const selected: string[] = [];
      items.forEach((item) => {
        const itemBounds: Bounds = {
          x: item.position.x,
          y: item.position.y,
          width: item.size.width,
          height: item.size.height,
        };
        if (isBoundsIntersecting(selectionBounds, itemBounds)) {
          selected.push(item.id);
        }
      });

      onSelectionChange([...new Set([...selectedIds, ...selected])]);
    }

    if (isDragging || isResizing) {
      if (historyManager) {
        historyManager.push(items);
      }
    }

    setIsPanning(false);
    setIsSelecting(false);
    setIsDragging(false);
    setIsResizing(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setAlignmentLines([]);
    setDragStart(null);
  }, [isSelecting, selectionStart, selectionEnd, items, selectedIds, isDragging, isResizing, onSelectionChange, historyManager]);

  // 组件拖拽开始
  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      if (e.button !== 0) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const item = items.find((i) => i.id === itemId);
      if (!item) {
        return;
      }

      // 检查是否点击在调整大小的手柄上
      const target = e.target as HTMLElement;
      const isResizeHandle = target.classList.contains('resize-handle');
      if (isResizeHandle) {
        const handle = target.getAttribute('data-handle') || 'se';
        setIsResizing(true);
        setResizeStart({
          itemId,
          startPos: {
            x: (e.clientX - rect.left) / effectiveZoom - panOffset.x,
            y: (e.clientY - rect.top) / effectiveZoom - panOffset.y,
          },
          startSize: { ...item.size },
          startItemPos: { ...item.position },
          handle,
        });
        return;
      }

      // 选择组件
      if (!selectedIds.includes(itemId)) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          onSelectionChange([...selectedIds, itemId]);
        } else {
          onSelectionChange([itemId]);
        }
      }

      // 开始拖拽
      setIsDragging(true);
      
      // 计算鼠标点击位置在画布坐标系中的位置
      const mouseCanvasX = (e.clientX - rect.left) / effectiveZoom - panOffset.x;
      const mouseCanvasY = (e.clientY - rect.top) / effectiveZoom - panOffset.y;

      // 记录所有选中组件在拖拽开始时的位置
      const itemPositions = new Map<string, Position>();
      selectedIds.forEach((id) => {
        const selectedItem = items.find((i) => i.id === id);
        if (selectedItem) {
          itemPositions.set(id, { ...selectedItem.position });
        }
      });
      
      // 如果没有选中的组件，则选中当前点击的组件
      if (selectedIds.length === 0) {
        itemPositions.set(itemId, { ...item.position });
      }

      // 计算鼠标点击位置相对于第一个选中组件左上角的偏移
      const firstItemId = selectedIds.length > 0 ? selectedIds[0] : itemId;
      const firstItem = items.find((i) => i.id === firstItemId) || item;
      const offset: Position = {
        x: mouseCanvasX - firstItem.position.x,
        y: mouseCanvasY - firstItem.position.y,
      };

      setDragStart({
        offset,
        itemPositions,
      });
    },
    [items, selectedIds, effectiveZoom, panOffset, onSelectionChange]
  );

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 删除
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        const updatedItems = items.filter((item) => !selectedIds.includes(item.id));
        onItemsChange(updatedItems);
        onSelectionChange([]);
        if (historyManager) {
          historyManager.push(updatedItems);
        }
        message.success(`已删除 ${selectedIds.length} 个组件`);
      }

      // 复制
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.length > 0) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        const itemsToCopy = items.filter((item) => selectedIds.includes(item.id));
        setCopiedItems(itemsToCopy);
        message.success(`已复制 ${itemsToCopy.length} 个组件`);
      }

      // 粘贴
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedItems.length > 0) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        const newItems = copiedItems.map((item, index) => ({
          ...item,
          id: `${item.id}-copy-${Date.now()}-${index}`,
          position: {
            x: item.position.x + 20,
            y: item.position.y + 20,
          },
        }));
        onItemsChange([...items, ...newItems]);
        onSelectionChange(newItems.map((item) => item.id));
        if (historyManager) {
          historyManager.push([...items, ...newItems]);
        }
        message.success(`已粘贴 ${newItems.length} 个组件`);
      }

      // 撤销/重做
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        if (historyManager) {
          const state = historyManager.undo();
          if (state) {
            onItemsChange(state);
            onSelectionChange([]);
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        if (historyManager) {
          const state = historyManager.redo();
          if (state) {
            onItemsChange(state);
            onSelectionChange([]);
          }
        }
      }

      // 缩放快捷键
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleZoomFit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds, items, copiedItems, historyManager, onItemsChange, onSelectionChange, handleZoomIn, handleZoomOut, handleZoomFit]);

  // 右键菜单
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    },
    []
  );

  const handleContextMenuAction = useCallback(
    (action: 'delete' | 'copy') => {
      if (!contextMenu) {
        return;
      }

      if (action === 'delete') {
        const updatedItems = items.filter((item) => item.id !== contextMenu.itemId);
        onItemsChange(updatedItems);
        onSelectionChange(selectedIds.filter((id) => id !== contextMenu.itemId));
        if (historyManager) {
          historyManager.push(updatedItems);
        }
        message.success('已删除组件');
      } else if (action === 'copy') {
        const itemToCopy = items.find((item) => item.id === contextMenu.itemId);
        if (itemToCopy) {
          setCopiedItems([itemToCopy]);
          message.success('已复制组件');
        }
      }

      setContextMenu(null);
    },
    [contextMenu, items, selectedIds, onItemsChange, onSelectionChange, historyManager]
  );

  // 计算选择框
  const selectionBounds = useMemo(() => {
    if (!selectionStart || !selectionEnd) {
      return null;
    }
    return {
      x: Math.min(selectionStart.x, selectionEnd.x),
      y: Math.min(selectionStart.y, selectionEnd.y),
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y),
    };
  }, [selectionStart, selectionEnd]);

  const childrenMap = useMemo(() => {
    const map = new Map<string, EnhancedCanvasItem[]>();
    items.forEach((item) => {
      if (item.parentId) {
        const arr = map.get(item.parentId) || [];
        arr.push(item);
        map.set(item.parentId, arr);
      }
    });
    // 同一层级按 zIndex 升序渲染，确保拖拽层级一致
    map.forEach((arr, key) => {
      map.set(
        key,
        [...arr].sort((a, b) => a.zIndex - b.zIndex)
      );
    });
    return map;
  }, [items]);

  const renderItemNode = useCallback(
    (item: EnhancedCanvasItem, parent?: EnhancedCanvasItem, parentOffset?: Position) => {
      const isSelected = selectedIds.includes(item.id);
      const isBorderComponent =
        item.component.componentId === 'media-border' ||
        item.component.categories?.includes('border') ||
        item.component.type === 'border';
      const borderStyle = isSelected ? '2px solid #1890ff' : 'none';
      const parentPosition = parentOffset || (parent ? parent.position : { x: 0, y: 0 });
      const children = childrenMap.get(item.id) || [];
      const isLayoutContainer = item.component.type === 'layout';
      const layoutSlots = isLayoutContainer ? getLayoutSlots(item) : [];

      return (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: item.position.x - parentPosition.x,
            top: item.position.y - parentPosition.y,
            width: item.size.width,
            height: item.size.height,
            border: borderStyle,
            background: isBorderComponent ? 'transparent' : '#fff',
            cursor: isDragging && isSelected ? 'grabbing' : isSelected ? 'move' : 'grab',
            zIndex: item.zIndex,
            boxShadow: isSelected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
            overflow: layoutSlots.length > 0 ? 'hidden' : isLayoutContainer ? 'hidden' : 'visible',
          }}
          onMouseDown={(e) => handleItemMouseDown(e, item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id)}
        >
          {renderItem(item)}
          {isSelected && (
            <>
              {[{ pos: 'nw', cursor: 'nwse-resize', left: -4, top: -4 },
                { pos: 'n', cursor: 'ns-resize', left: '50%', top: -4, transform: 'translateX(-50%)' },
                { pos: 'ne', cursor: 'nesw-resize', right: -4, top: -4 },
                { pos: 'e', cursor: 'ew-resize', right: -4, top: '50%', transform: 'translateY(-50%)' },
                { pos: 'se', cursor: 'nwse-resize', right: -4, bottom: -4 },
                { pos: 's', cursor: 'ns-resize', left: '50%', bottom: -4, transform: 'translateX(-50%)' },
                { pos: 'sw', cursor: 'nesw-resize', left: -4, bottom: -4 },
                { pos: 'w', cursor: 'ew-resize', left: -4, top: '50%', transform: 'translateY(-50%)' }].map((handle) => (
                  <div
                    key={handle.pos}
                    className="resize-handle"
                    data-handle={handle.pos}
                    style={{
                      position: 'absolute',
                      ...(handle.left !== undefined && { left: handle.left }),
                      ...(handle.right !== undefined && { right: handle.right }),
                      ...(handle.top !== undefined && { top: handle.top }),
                      ...(handle.bottom !== undefined && { bottom: handle.bottom }),
                      ...(handle.transform && { transform: handle.transform }),
                      width: 8,
                      height: 8,
                      background: '#1890ff',
                      border: '1px solid #fff',
                      cursor: handle.cursor,
                      borderRadius: '50%',
                      zIndex: 1000,
                    }}
                  />
                ))}
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  left: 0,
                  fontSize: 12,
                  color: '#1890ff',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '2px 6px',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(item.size.width)} × {Math.round(item.size.height)}
              </div>
            </>
          )}
          {layoutSlots.length > 0 ? (
            layoutSlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  position: 'absolute',
                  left: slot.x,
                  top: slot.y,
                  width: slot.width,
                  height: slot.height,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
                  {children
                    .filter((child) => (child.parentSlot || layoutSlots[0].id) === slot.id)
                    .map((child) =>
                      renderItemNode(child, item, { x: (parentOffset?.x || item.position.x) + slot.x, y: (parentOffset?.y || item.position.y) + slot.y })
                    )}
                </div>
              </div>
            ))
          ) : (
            children.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                {children.map((child) => renderItemNode(child, item, parentPosition))}
              </div>
            )
          )}
        </div>
      );
    },
    [childrenMap, handleContextMenu, handleItemMouseDown, isDragging, renderItem, selectedIds]
  );

  return (
    <div
      ref={canvasRef}
      className="enhanced-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: showGrid
          ? `linear-gradient(to right, #e8e8e8 1px, transparent 1px),
             linear-gradient(to bottom, #e8e8e8 1px, transparent 1px),
             ${canvasBackgroundColor}`
          : canvasBackgroundColor,
        backgroundSize: showGrid ? `${gridSize * effectiveZoom}px ${gridSize * effectiveZoom}px` : 'auto',
        cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="canvas-background"
        style={{
          position: 'absolute',
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: canvasBackgroundColor,
          transform: `translate(${panOffset.x * effectiveZoom}px, ${panOffset.y * effectiveZoom}px) scale(${effectiveZoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* 对齐辅助线 */}
        {showAlignmentLines && alignmentLines.length > 0 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: canvasWidth,
              height: canvasHeight,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {alignmentLines.map((line, index) => (
              <line
                key={index}
                x1={line.type === 'vertical' ? line.value : 0}
                y1={line.type === 'horizontal' ? line.value : 0}
                x2={line.type === 'vertical' ? line.value : canvasWidth}
                y2={line.type === 'horizontal' ? line.value : canvasHeight}
                stroke="#1890ff"
                strokeWidth={1}
                strokeDasharray="5,5"
              />
            ))}
          </svg>
        )}

        {/* 选择框 */}
        {selectionBounds && (
          <div
            style={{
              position: 'absolute',
              left: selectionBounds.x,
              top: selectionBounds.y,
              width: selectionBounds.width,
              height: selectionBounds.height,
              border: '2px dashed #1890ff',
              background: 'rgba(24, 144, 255, 0.1)',
              pointerEvents: 'none',
              zIndex: 999,
            }}
          />
        )}

        {/* 组件 */}
        {items.map((item) => {
          if (item.parentId) {
            return null;
          }
          return renderItemNode(item);
        })}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <Menu
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 10000,
          }}
          onClick={() => setContextMenu(null)}
        >
          <Menu.Item key="copy" icon={<CopyOutlined />} onClick={() => handleContextMenuAction('copy')}>
            复制
          </Menu.Item>
          <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleContextMenuAction('delete')}>
            删除
          </Menu.Item>
        </Menu>
      )}
    </div>
  );
};

export default EnhancedCanvas;

