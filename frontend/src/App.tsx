import React from 'react';
import ProjectManagement from './pages/ProjectManagement';

/**
 * 主应用组件
 * 直接进入工程管理界面
 */
const App: React.FC = () => {
  // 模拟用户信息
  const mockUser = {
    userId: 'user-001',
    username: 'admin',
  };

  return <ProjectManagement user={mockUser} />;
};

export default App;

