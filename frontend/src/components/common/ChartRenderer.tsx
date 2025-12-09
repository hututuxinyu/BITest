import React, { useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';
import type { EChartsOption } from 'echarts';
import type { ComponentDefinition } from '../../types';

interface ChartRendererProps {
  componentId: string;
  definition: ComponentDefinition;
  height?: number | string;
  width?: number | string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
  componentId,
  definition,
  height = '100%',
  width = '100%',
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 安全地清理 ECharts 实例
      if (chartRef.current) {
        try {
          const echartsInstance = chartRef.current.getEchartsInstance();
          if (echartsInstance && !echartsInstance.isDisposed()) {
            echartsInstance.dispose();
          }
        } catch (error) {
          // 忽略清理时的错误
          console.warn('ECharts cleanup error:', error);
        }
      }
    };
  }, []);

  const option = useMemo(() => {
    if (componentId === 'chart-bar') {
      return buildBarOption(definition);
    }
    if (componentId === 'custom-bar-chart') {
      return buildBarChartOption(definition);
    }
    if (componentId === 'chart-pie') {
      return buildPieOption(definition);
    }
    if (componentId === 'chart-line') {
      return buildLineOption(definition);
    }
    if (componentId === 'custom-area-chart') {
      return buildAreaOption(definition);
    }
    if (componentId === 'custom-dashboard') {
      return buildDashboardOption(definition);
    }
    if (componentId === 'custom-donut-chart') {
      return buildDonutOption(definition);
    }
    if (componentId === 'custom-pictorial-chart') {
      return buildPictorialOption(definition);
    }
    if (componentId === 'custom-scatter-chart') {
      return buildScatterOption(definition);
    }
    if (componentId === 'custom-bar-line-chart') {
      return buildBarLineOption(definition);
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

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height, width }}
      opts={{ renderer: 'canvas' }}
      notMerge={false}
      lazyUpdate={false}
    />
  );
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

function buildBarChartOption(definition: ComponentDefinition): EChartsOption {
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
      return row ? row.value : 0;
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
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: safeCategories,
    },
    series: seriesWithStack,
  };

  return option;
}

function buildDashboardOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const value = dataRows.length > 0 && typeof dataRows[0].value === 'number' ? dataRows[0].value : 75;
  const min = definition.defaultProps?.min ?? 0;
  const max = definition.defaultProps?.max ?? 100;

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title, left: 'center' } : undefined,
    tooltip: {
      formatter: '{b}: {c}',
    },
    series: [
      {
        name: '仪表盘',
        type: 'gauge',
        min,
        max,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [value / max, '#91CC75'],
              [1, '#EE6666'],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4,
          },
        },
        axisLabel: {
          color: 'auto',
          distance: 40,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}',
          color: 'auto',
        },
        data: [
          {
            value,
            name: '指标',
          },
        ],
      },
    ],
  };

  return option;
}

function buildDonutOption(definition: ComponentDefinition): EChartsOption {
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

  const innerRadius = definition.defaultProps?.innerRadius ?? 50;

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: definition.defaultProps?.showLegend === false ? { show: false } : { orient: 'vertical', left: 'left' },
    series: [
      {
        name: definition.defaultProps?.title || '环形图',
        type: 'pie',
        radius: [`${innerRadius}%`, '70%'],
        data: safeData,
        label: { formatter: '{b}\n{d}%' },
      },
    ],
  };

  return option;
}

function buildPictorialOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const normalizedRows = dataRows.map((row: any) => ({
    name: row.name ?? '未命名',
    value: typeof row.value === 'number' ? row.value : Number(row.value) || 0,
  }));

  const safeData =
    normalizedRows.length > 0
      ? normalizedRows
      : [
          { name: '类别1', value: 100 },
          { name: '类别2', value: 80 },
          { name: '类别3', value: 60 },
        ];

  const maxValue = Math.max(...safeData.map((d) => d.value), 100);

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: maxValue,
    },
    yAxis: {
      type: 'category',
      data: safeData.map((d) => d.name),
    },
    series: [
      {
        name: '数值',
        type: 'pictorialBar',
        symbol: definition.defaultProps?.symbol || 'rect',
        symbolSize: [20, 20],
        symbolRepeat: true,
        symbolMargin: 2,
        data: safeData.map((d) => d.value),
      },
    ],
  };

  return option;
}

function buildScatterOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const normalizedRows = dataRows.map((row: any) => ({
    x: typeof row.x === 'number' ? row.x : Number(row.x) || 0,
    y: typeof row.y === 'number' ? row.y : Number(row.y) || 0,
    series: row.series ?? '默认系列',
  }));

  const seriesNames = Array.from(new Set(normalizedRows.map((row) => row.series)));
  const safeSeries = seriesNames.length > 0 ? seriesNames : ['默认系列'];

  const series = safeSeries.map((name) => ({
    name,
    type: 'scatter' as const,
    data: normalizedRows.filter((row) => row.series === name).map((row) => [row.x, row.y]),
    symbolSize: 10,
  }));

  const option: EChartsOption = {
    title: definition.defaultProps?.title ? { text: definition.defaultProps.title } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.seriesName}<br/>X: ${params.value[0]}<br/>Y: ${params.value[1]}`;
      },
    },
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
      type: 'value',
      scale: true,
    },
    yAxis: {
      type: 'value',
      scale: true,
    },
    series,
  };

  return option;
}

function buildBarLineOption(definition: ComponentDefinition): EChartsOption {
  const dataRows = Array.isArray(definition.defaultData) ? definition.defaultData : [];
  const normalizedRows = dataRows.map((row: any) => ({
    category: row.category ?? '未命名分类',
    value: typeof row.value === 'number' ? row.value : Number(row.value) || 0,
    series: row.series ?? '默认系列',
    type: row.type ?? 'bar',
  }));

  const categories = Array.from(new Set(normalizedRows.map((row) => row.category)));
  const seriesNames = Array.from(new Set(normalizedRows.map((row) => row.series)));

  const safeCategories = categories.length > 0 ? categories : ['分类一', '分类二', '分类三'];
  const safeSeries = seriesNames.length > 0 ? seriesNames : ['默认系列'];

  const barSeries = safeSeries
    .filter((name) => {
      const row = normalizedRows.find((r) => r.series === name);
      return row && row.type === 'bar';
    })
    .map((name) => ({
      name,
      type: 'bar' as const,
      data: safeCategories.map((category) => {
        const row = normalizedRows.find((item) => item.category === category && item.series === name && item.type === 'bar');
        return row ? row.value : 0;
      }),
    }));

  const lineSeries = safeSeries
    .filter((name) => {
      const row = normalizedRows.find((r) => r.series === name);
      return row && row.type === 'line';
    })
    .map((name) => ({
      name,
      type: 'line' as const,
      yAxisIndex: 1,
      data: safeCategories.map((category) => {
        const row = normalizedRows.find((item) => item.category === category && item.series === name && item.type === 'line');
        return row ? row.value : 0;
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
      data: safeCategories,
    },
    yAxis: [
      {
        type: 'value',
        name: '柱状',
        position: 'left',
      },
      {
        type: 'value',
        name: '折线',
        position: 'right',
      },
    ],
    series: [...barSeries, ...lineSeries],
  };

  return option;
}

function buildAreaOption(definition: ComponentDefinition): EChartsOption {
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
    areaStyle: {},
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

export default ChartRenderer;


