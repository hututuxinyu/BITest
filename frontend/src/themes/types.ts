/**
 * 主题颜色配置接口
 */
export interface ThemeColors {
  /** 画布背景颜色 */
  background: string;
  /** 组件默认背景颜色 */
  componentBackground: string;
  /** 组件默认文本颜色 */
  componentText: string;
  /** 组件默认边框颜色 */
  componentBorder: string;
  /** 图表主色 */
  chartPrimary: string;
  /** 图表次色 */
  chartSecondary: string;
  /** 图表强调色 */
  chartAccent: string;
  /** 主要文本颜色 */
  textPrimary: string;
  /** 次要文本颜色 */
  textSecondary: string;
}

/**
 * 主题配置接口
 */
export interface Theme {
  /** 主题ID */
  themeId: 'light' | 'dark';
  /** 主题名称 */
  themeName: string;
  /** 主题描述 */
  description?: string;
  /** 主题颜色配置 */
  colors: ThemeColors;
}



