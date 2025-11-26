import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProjectManagement from './pages/ProjectManagement';
import TemplateManagement from './pages/TemplateManagement';
import ComponentLibrary from './pages/ComponentLibrary';
import CanvasEditor from './pages/CanvasEditor';
import DatasourceConfig from './pages/DatasourceConfig';
import InteractionConfig from './pages/InteractionConfig';
import SchemaGenerator from './pages/SchemaGenerator';
import I18nConfig from './pages/I18nConfig';
import CodehubIntegration from './pages/CodehubIntegration';

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
      <MainLayout user={mockUser}>
        <Routes>
          <Route path="/projects" element={<ProjectManagement user={mockUser} />} />
          <Route path="/templates" element={<TemplateManagement />} />
          <Route path="/components" element={<ComponentLibrary />} />
          <Route path="/canvas" element={<CanvasEditor />} />
          <Route path="/datasource" element={<DatasourceConfig />} />
          <Route path="/interaction" element={<InteractionConfig />} />
          <Route path="/schema" element={<SchemaGenerator />} />
          <Route path="/i18n" element={<I18nConfig />} />
          <Route path="/codehub" element={<CodehubIntegration />} />
          <Route path="/" element={<Navigate to="/projects" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;

