import React from 'react';
import { Empty } from 'antd';
import InteractionConfigPanel from '../InteractionConfigPanel';
import './InteractionConfigTab.css';

interface InteractionConfigTabProps {
  componentId: string;
}

const InteractionConfigTab: React.FC<InteractionConfigTabProps> = ({ componentId }) => {
  return (
    <div className="interaction-config-tab">
      <InteractionConfigPanel
        componentId={componentId}
        onConfigChange={() => {
          // 配置变更处理
          console.log('交互配置变更');
        }}
      />
    </div>
  );
};

export default InteractionConfigTab;

