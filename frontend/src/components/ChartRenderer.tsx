import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';
import type { EChartsOption } from 'echarts';
import type { ComponentDefinition } from '../types';

interface ChartRendererProps {
  componentId: string;
  definition: ComponentDefinition;
  height?: number;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ componentId, definition, height = 260 }) => {
  const option = useMemo(() => {
    if (componentId === 'chart-bar') {
      return buildBarOption(definition);
    }
    if (componentId === 'chart-pie') {
      return buildPieOption(definition);
    }
    if (componentId === 'chart-line') {
      return buildLineOption(definition);
    }
    return null;
  }, [componentId, definition]);

  if (!option) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂不支持该组件的实时渲染"
        style={{ margin: 0, padding: '32px 0' }}
      />
    );
  }

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};

function buildBarOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const normalizedRows = dataRows.map((row: any) => ({
    category: row.category ?? '未命名分类',
    value: typeof row.value === 'number' ? row.value : Number(row.value) || 0,
    series: row.series ?? '默认系列',
  }));

  const categories = Array.from(new Set(normalizedRows.map((row) => row.category)));
  const seriesNames = Array.from(new Set(normalizedRows.map((row) => row.series)));

  const safeCategories = categories.length > 0 ? categories : ['分类一', '分类二', '分类三'];
  const safeSeries = seriesNames.length > 0 ? seriesNames : ['默认系列'];

  const series = safeSeries.map((name) => ({
    name,
    type: 'bar' as const,
    data: safeCategories.map((category) => {
      const row = normalizedRows.find((item) => item.category === category && item.series === name);
      if (row) {
        return row.value;
      }
      return 0;
    }),
  }));

  const stackMode = definition.defaultProps?.stack;
  const seriesWithStack = stackMode && stackMode !== 'none' ? series.map((s) => ({ ...s, stack: stackMode })) : series;

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title } : undefined,
    tooltip: { trigger: 'axis' },
    legend: {
      show: definition.defaultProps?.showLegend !== false,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: safeCategories,
    },
    yAxis: {
      type: 'value',
    },
    series: seriesWithStack,
  };

  return option;
}

function buildPieOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const normalizedRows = dataRows.map((row: any) => ({
    name: row.name ?? '未命名',
    value: typeof row.value === 'number' ? row.value : Number(row.value) || 0,
  }));

  const safeData =
    normalizedRows.length > 0
      ? normalizedRows
      : [
          { name: '分类 A', value: 40 },
          { name: '分类 B', value: 32 },
          { name: '分类 C', value: 28 },
        ];

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: definition.defaultProps?.showLegend === false ? { show: false } : { orient: 'vertical', left: 'left' },
    series: [
      {
        name: definition.defaultProps?.title || '饼图',
        type: 'pie',
        radius:
          definition.defaultProps?.innerRadius && definition.defaultProps.innerRadius > 0
            ? [`${definition.defaultProps.innerRadius}%`, '70%']
            : '60%',
        roseType: definition.defaultProps?.roseType && definition.defaultProps.roseType !== 'none' ? definition.defaultProps.roseType : undefined,
        data: safeData,
        label: { formatter: '{b}\n{d}%' },
      },
    ],
  };

  return option;
}

export default ChartRenderer;

function buildLineOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const normalizedRows = dataRows.map((row: any) => ({
    category: row.category ?? '未命名分类',
    value: typeof row.value === 'number' ? row.value : Number(row.value) || 0,
    series: row.series ?? '默认系列',
  }));

  const categories = Array.from(new Set(normalizedRows.map((row) => row.category)));
  const seriesNames = Array.from(new Set(normalizedRows.map((row) => row.series)));

  const safeCategories = categories.length > 0 ? categories : ['分类一', '分类二', '分类三', '分类四'];
  const safeSeries = seriesNames.length > 0 ? seriesNames : ['默认系列'];

  const series = safeSeries.map((name) => ({
    name,
    type: 'line' as const,
    smooth: definition.defaultProps?.smooth === true,
    areaStyle: definition.defaultProps?.showArea === true ? {} : undefined,
    data: safeCategories.map((category) => {
      const row = normalizedRows.find((item) => item.category === category && item.series === name);
      if (row) {
        return row.value;
      }
      return 0;
    }),
  }));

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title } : undefined,
    tooltip: { trigger: 'axis' },
    legend: {
      show: definition.defaultProps?.showLegend !== false,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: safeCategories,
    },
    yAxis: {
      type: 'value',
    },
    series,
  };

  return option;
}


