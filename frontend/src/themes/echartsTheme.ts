import * as echarts from 'echarts';
import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';
import type { Theme } from './types';

const registered = new Set<string>();

export function getPalette(theme: Theme): string[] {
  if (theme.themeId === 'dark') {
    return [
      '#1E88FF',
      '#274B8A',
      '#1ED1DC',
      '#7C8DFF',
      '#F39C35',
      '#5F6B7A',
      '#8BC6FF',
      '#F7B267',
    ];
  }
  return [
    '#3B82F6',
    '#67C3C0',
    '#B48CF2',
    '#F2C94C',
    '#7AA7FF',
    '#9AD5D0',
    '#F59E0B',
    '#8B5CF6',
  ];
}

function buildEchartsTheme(theme: Theme) {
  return {
    color: getPalette(theme),
    backgroundColor: theme.colors.background,
    textStyle: {
      color: theme.colors.textPrimary,
    },
    title: {
      textStyle: { color: theme.colors.textPrimary },
      subtextStyle: { color: theme.colors.textSecondary },
    },
    legend: {
      textStyle: { color: theme.colors.textSecondary },
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderColor: theme.colors.componentBorder,
      textStyle: { color: '#fff' },
    },
    axisPointer: {
      lineStyle: { color: theme.colors.chartAccent },
      crossStyle: { color: theme.colors.chartAccent },
    },
    grid: {
      containLabel: true,
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: theme.colors.textSecondary } },
      axisTick: { lineStyle: { color: theme.colors.textSecondary } },
      axisLabel: { color: theme.colors.textSecondary },
      splitLine: { lineStyle: { color: theme.colors.componentBorder } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: theme.colors.textSecondary } },
      axisTick: { lineStyle: { color: theme.colors.textSecondary } },
      axisLabel: { color: theme.colors.textSecondary },
      splitLine: { lineStyle: { color: theme.colors.componentBorder } },
    },
  };
}

export function registerEchartsThemes() {
  const themes: Theme[] = [lightTheme, darkTheme];
  themes.forEach((theme) => {
    const name = `${theme.themeId}-bi`;
    if (!registered.has(name)) {
      echarts.registerTheme(name, buildEchartsTheme(theme));
      registered.add(name);
    }
  });
}

export function getEchartsThemeName(themeId: 'light' | 'dark' = 'light') {
  registerEchartsThemes();
  return `${themeId}-bi`;
}
 