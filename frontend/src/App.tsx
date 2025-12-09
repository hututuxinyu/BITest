import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './pages/MainLayout.tsx';
import ProjectManagement from './pages/ProjectManagement';
import ProjectWorkspace from './pages/ProjectWorkspace';
import CanvasEditor from './pages/CanvasEditor';
import { EditorContextProvider } from './contexts/EditorContext';

/**
 * 主应用组件
 * 使用主布局，支持多模块路由
 */
const App: React.FC = () => {
  // 模拟用户信息
  const mockUser = {
    userId: 'user-001',
    username: 'admin',
  };

  return (
    <BrowserRouter>
      <EditorContextProvider>
        <MainLayout user={mockUser}>
          <Routes>
            <Route path="/projects" element={<ProjectManagement user={mockUser} />} />
            <Route path="/projects/:projectId/workspace" element={<ProjectWorkspace user={mockUser} />} />
            <Route
              path="/projects/:projectId/reports/:reportId/editor"
              element={<CanvasEditor user={mockUser} />}
            />
            <Route path="/" element={<Navigate to="/projects" replace />} />
          </Routes>
        </MainLayout>
      </EditorContextProvider>
    </BrowserRouter>
  );
};

export default App;

