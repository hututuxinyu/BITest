import { getDefaultTheme, getThemeById } from '../themes';
import type { Theme } from '../themes';
import type { CanvasConfig } from '../components/PropertyPanel';

export function resolveTheme(themeId?: 'light' | 'dark'): Theme {
  if (!themeId) {
    return getDefaultTheme();
  }
  return getThemeById(themeId) || getDefaultTheme();
}

export function applyThemeToCanvas(config: CanvasConfig, theme: Theme): CanvasConfig {
  return {
    ...config,
    theme,
    backgroundType: 'solid',
    backgroundColor: theme.colors.background,
    borderColor: config.borderColor || theme.colors.componentBorder,
    borderEnabled: config.borderEnabled ?? false,
  };
}

export function getThemeIdFromConfig(config?: CanvasConfig): 'light' | 'dark' {
  if (config?.theme?.themeId === 'dark') {
    return 'dark';
  }
  return 'light';
}

