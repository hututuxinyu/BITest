import React from 'react';
import EnhancedInteractionConfigTab from './EnhancedInteractionConfigTab';
import './InteractionConfigTab.css';

interface InteractionConfigTabProps {
  componentId: string;
  availableComponents?: Array<{ id: string; name: string }>; // 画布中所有组件列表
  initialConfig?: any; // 从schema加载的交互配置
  onConfigChange?: (config: any) => void;
}

/**
 * 交互配置标签页组件
 * 直接使用增强配置，支持单个或多个事件的配置
 */
const InteractionConfigTab: React.FC<InteractionConfigTabProps> = ({
  componentId,
  availableComponents = [],
  initialConfig,
  onConfigChange,
}) => {
  return (
    <div className="interaction-config-tab">
      <EnhancedInteractionConfigTab
        componentId={componentId}
        availableComponents={availableComponents}
        initialConfig={initialConfig}
        onChange={(config) => {
          if (onConfigChange) {
            onConfigChange(config);
          }
        }}
      />
    </div>
  );
};

export default InteractionConfigTab;

