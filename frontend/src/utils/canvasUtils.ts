/**
 * 画布工具函数
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 计算两个矩形的对齐线
 */
export function calculateAlignmentLines(
  movingBounds: Bounds,
  staticBounds: Bounds,
  threshold: number = 5
): { type: 'vertical' | 'horizontal'; value: number }[] {
  const lines: { type: 'vertical' | 'horizontal'; value: number }[] = [];

  // 垂直对齐线（左、中、右）
  if (Math.abs(movingBounds.x - staticBounds.x) < threshold) {
    lines.push({ type: 'vertical', value: staticBounds.x });
  }
  if (Math.abs(movingBounds.x + movingBounds.width - (staticBounds.x + staticBounds.width)) < threshold) {
    lines.push({ type: 'vertical', value: staticBounds.x + staticBounds.width });
  }
  if (Math.abs(movingBounds.x + movingBounds.width / 2 - (staticBounds.x + staticBounds.width / 2)) < threshold) {
    lines.push({ type: 'vertical', value: staticBounds.x + staticBounds.width / 2 });
  }

  // 水平对齐线（上、中、下）
  if (Math.abs(movingBounds.y - staticBounds.y) < threshold) {
    lines.push({ type: 'horizontal', value: staticBounds.y });
  }
  if (Math.abs(movingBounds.y + movingBounds.height - (staticBounds.y + staticBounds.height)) < threshold) {
    lines.push({ type: 'horizontal', value: staticBounds.y + staticBounds.height });
  }
  if (Math.abs(movingBounds.y + movingBounds.height / 2 - (staticBounds.y + staticBounds.height / 2)) < threshold) {
    lines.push({ type: 'horizontal', value: staticBounds.y + staticBounds.height / 2 });
  }

  return lines;
}

/**
 * 对齐到网格
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * 对齐到对齐线
 */
export function snapToAlignmentLine(value: number, lines: number[], threshold: number = 5): number {
  for (const line of lines) {
    if (Math.abs(value - line) < threshold) {
      return line;
    }
  }
  return value;
}

/**
 * 计算多个组件的边界框
 */
export function calculateBoundingBox(bounds: Bounds[]): Bounds | null {
  if (bounds.length === 0) {
    return null;
  }

  let minX = bounds[0].x;
  let minY = bounds[0].y;
  let maxX = bounds[0].x + bounds[0].width;
  let maxY = bounds[0].y + bounds[0].height;

  for (let i = 1; i < bounds.length; i++) {
    minX = Math.min(minX, bounds[i].x);
    minY = Math.min(minY, bounds[i].y);
    maxX = Math.max(maxX, bounds[i].x + bounds[i].width);
    maxY = Math.max(maxY, bounds[i].y + bounds[i].height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 计算水平分布
 */
export function distributeHorizontally(bounds: Bounds[]): Bounds[] {
  if (bounds.length <= 2) {
    return bounds;
  }

  const sorted = [...bounds].sort((a, b) => a.x - b.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalWidth = last.x + last.width - first.x;
  const totalComponentWidth = sorted.reduce((sum, b) => sum + b.width, 0);
  const gap = (totalWidth - totalComponentWidth) / (sorted.length - 1);

  let currentX = first.x;
  return sorted.map((b, index) => {
    if (index === 0) {
      return b;
    }
    currentX += sorted[index - 1].width + gap;
    return { ...b, x: currentX };
  });
}

/**
 * 计算垂直分布
 */
export function distributeVertically(bounds: Bounds[]): Bounds[] {
  if (bounds.length <= 2) {
    return bounds;
  }

  const sorted = [...bounds].sort((a, b) => a.y - b.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalHeight = last.y + last.height - first.y;
  const totalComponentHeight = sorted.reduce((sum, b) => sum + b.height, 0);
  const gap = (totalHeight - totalComponentHeight) / (sorted.length - 1);

  let currentY = first.y;
  return sorted.map((b, index) => {
    if (index === 0) {
      return b;
    }
    currentY += sorted[index - 1].height + gap;
    return { ...b, y: currentY };
  });
}

/**
 * 检查点是否在矩形内
 */
export function isPointInBounds(point: Position, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * 检查两个矩形是否相交
 */
export function isBoundsIntersecting(bounds1: Bounds, bounds2: Bounds): boolean {
  return !(
    bounds1.x + bounds1.width < bounds2.x ||
    bounds2.x + bounds2.width < bounds1.x ||
    bounds1.y + bounds1.height < bounds2.y ||
    bounds2.y + bounds2.height < bounds1.y
  );
}

