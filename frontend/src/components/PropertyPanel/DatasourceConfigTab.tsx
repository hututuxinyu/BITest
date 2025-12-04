import React, { useState } from 'react';
import { Empty, Collapse, Alert } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import type { ComponentDefinition, Dataset } from '../../types';
import DatasourceConfigPanel from '../DatasourceConfigPanel';
import DataBindingPanel from './DataBindingPanel';
import DatasourceQueryConfigTab from './DatasourceQueryConfigTab';

interface DatasourceConfigTabProps {
  componentId: string; // 组件实例ID（用于API调用）
  componentTypeId?: string; // 组件类型ID（如 chart-table，用于判断组件类型）
  componentDefinition?: ComponentDefinition | null;
  availableComponents?: Array<{ id: string; name: string }>; // 可用的控制类组件列表
  datasets?: Dataset[]; // 数据集列表
  initialConfig?: any; // 初始数据源配置
  onQueryConfigChange?: (config: any) => void;
  onConfigChange?: (config: any) => void;
}

/**
 * 数据源配置标签页组件
 * 将数据绑定和查询配置合并到一个页面中
 */
const DatasourceConfigTab: React.FC<DatasourceConfigTabProps> = ({
  componentId,
  componentTypeId,
  componentDefinition,
  availableComponents = [],
  datasets = [],
  initialConfig,
  onQueryConfigChange,
  onConfigChange,
}) => {
  const [queryConfig, setQueryConfig] = useState<any>(null);

  if (!componentDefinition) {
    return (
      <div className="datasource-config-tab">
        <Empty description="组件定义加载中..." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  // 从 initialConfig 中获取 selectedDatasetId
  const selectedDatasetId = initialConfig?.datasetConfig?.datasetId || '';
  
  // 获取组件类型ID，优先使用传入的 componentTypeId，否则从 componentDefinition 中获取
  const actualComponentTypeId = componentTypeId || componentDefinition?.componentId || '';

  return (
    <div className="datasource-config-tab" style={{ padding: '16px 0' }}>
      <Collapse
        bordered={false}
        defaultActiveKey={['source', 'binding']}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined
            style={{
              transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        )}
        className="config-collapse"
      >
        <Collapse.Panel header="数据来源" key="source">
          <DatasourceConfigPanel
            componentId={componentId}
            componentDefinition={componentDefinition}
            datasets={datasets}
            initialConfig={initialConfig}
            onConfigChange={(config) => {
              if (onConfigChange) {
                onConfigChange(config);
              }
            }}
          />
        </Collapse.Panel>

        <Collapse.Panel header="数据绑定" key="binding">
          <DataBindingPanel
            componentId={actualComponentTypeId}
            componentDefinition={componentDefinition}
            selectedDatasetId={selectedDatasetId}
            datasets={datasets}
            initialConfig={initialConfig}
            onConfigChange={(config) => {
              if (onConfigChange) {
                onConfigChange(config);
              }
            }}
          />
        </Collapse.Panel>

        <Collapse.Panel 
          header="查询配置" 
          key="query"
          disabled={true}
        >
          <Alert
            message="暂不支持该功能"
            description="查询配置功能正在开发中，敬请期待。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default DatasourceConfigTab;

