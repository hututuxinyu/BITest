import React, { useState } from 'react';
import { Empty, Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import type { ComponentDefinition } from '../../types';
import DatasourceConfigPanel from '../DatasourceConfigPanel';
import DatasourceQueryConfigTab from './DatasourceQueryConfigTab';

interface DatasourceConfigTabProps {
  componentId: string;
  componentDefinition?: ComponentDefinition | null;
  availableComponents?: Array<{ id: string; name: string }>; // 可用的控制类组件列表
  onQueryConfigChange?: (config: any) => void;
}

/**
 * 数据源配置标签页组件
 * 将数据绑定和查询配置合并到一个页面中
 */
const DatasourceConfigTab: React.FC<DatasourceConfigTabProps> = ({
  componentId,
  componentDefinition,
  availableComponents = [],
  onQueryConfigChange,
}) => {
  const [queryConfig, setQueryConfig] = useState<any>(null);

  if (!componentDefinition) {
    return (
      <div className="datasource-config-tab">
        <Empty description="组件定义加载中..." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className="datasource-config-tab" style={{ padding: '16px 0' }}>
      <Collapse
        bordered={false}
        defaultActiveKey={['binding', 'query']}
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
        <Collapse.Panel header="数据绑定" key="binding">
          <DatasourceConfigPanel
            componentId={componentId}
            componentDefinition={componentDefinition}
            onConfigChange={(config) => {
              console.log('数据源配置变更:', config);
            }}
          />
        </Collapse.Panel>

        <Collapse.Panel header="查询配置" key="query">
          <DatasourceQueryConfigTab
            componentId={componentId}
            datasourceType="mysql"
            queryConfig={queryConfig}
            availableComponents={availableComponents}
            onChange={(config) => {
              setQueryConfig(config);
              if (onQueryConfigChange) {
                onQueryConfigChange(config);
              }
            }}
          />
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default DatasourceConfigTab;

