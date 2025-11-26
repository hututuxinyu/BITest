/**
 * 历史记录管理器（撤销/重做）
 */

export class HistoryManager<T> {
  private history: T[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * 添加历史记录
   */
  push(state: T): void {
    // 如果当前不在历史记录的末尾，删除后面的记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新状态
    this.history.push(JSON.parse(JSON.stringify(state)));

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * 撤销
   */
  undo(): T | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * 重做
   */
  redo(): T | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): T | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }
}

