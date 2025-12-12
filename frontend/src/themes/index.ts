import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';

export { lightTheme, darkTheme };
export type { Theme, ThemeColors } from './types';

/**
 * 获取所有可用主题
 */
export function getAllThemes(): Theme[] {
  return [lightTheme, darkTheme];
}

/**
 * 根据主题ID获取主题
 */
export function getThemeById(themeId: 'light' | 'dark'): Theme | undefined {
  const themes = getAllThemes();
  return themes.find((theme) => theme.themeId === themeId);
}

/**
 * 获取默认主题
 */
export function getDefaultTheme(): Theme {
  return lightTheme;
}

