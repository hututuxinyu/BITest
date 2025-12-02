import React from 'react';
import { Empty } from 'antd';
import type { ComponentDefinition } from '../../types';
import DatasourceConfigPanel from '../DatasourceConfigPanel';

interface DatasourceConfigTabProps {
  componentId: string;
  componentDefinition?: ComponentDefinition | null;
}

const DatasourceConfigTab: React.FC<DatasourceConfigTabProps> = ({
  componentId,
  componentDefinition,
}) => {
  if (!componentDefinition) {
    return (
      <div className="datasource-config-tab">
        <Empty description="组件定义加载中..." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className="datasource-config-tab">
      <DatasourceConfigPanel
        componentId={componentId}
        componentDefinition={componentDefinition}
        onConfigChange={(config) => {
          // 配置变更处理
          console.log('数据源配置变更:', config);
        }}
      />
    </div>
  );
};

export default DatasourceConfigTab;

