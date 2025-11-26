import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, message } from 'antd';
import {
  FolderOutlined,
  AppstoreOutlined,
  BlockOutlined,
  EditOutlined,
  SettingOutlined,
  DatabaseOutlined,
  InteractionOutlined,
  FileTextOutlined,
  GlobalOutlined,
  GitlabOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  user: { userId: string; username?: string };
}

/**
 * 主布局组件
 * 包含顶部导航栏、左侧菜单和主内容区
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: '工程管理',
    },
    {
      key: '/templates',
      icon: <AppstoreOutlined />,
      label: '模板管理',
    },
    {
      key: '/components',
      icon: <BlockOutlined />,
      label: '组件库管理',
    },
    {
      key: '/canvas',
      icon: <EditOutlined />,
      label: '画布编辑',
    },
    {
      key: '/datasource',
      icon: <DatabaseOutlined />,
      label: '数据源配置',
    },
    {
      key: '/interaction',
      icon: <InteractionOutlined />,
      label: '交互配置',
    },
    {
      key: '/schema',
      icon: <FileTextOutlined />,
      label: 'Schema生成',
    },
    {
      key: '/i18n',
      icon: <GlobalOutlined />,
      label: '国际化配置',
    },
    {
      key: '/codehub',
      icon: <GitlabOutlined />,
      label: 'Codehub集成',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人设置',
    },
    {
      key: 'logout',
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      // 处理退出登录
      message.info('退出登录功能待实现');
    } else if (key === 'profile') {
      message.info('个人设置功能待实现');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          background: '#e1f5ff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 60,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <div style={{ fontSize: 18, fontWeight: 500 }}>BI系统 - 设计态</div>
        </div>
        <Space>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1890ff' }}>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <span>{user.username || user.userId}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout style={{ marginTop: 60 }}>
        {/* 左侧菜单 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          style={{
            overflow: 'auto',
            height: 'calc(100vh - 60px)',
            position: 'fixed',
            left: 0,
            top: 60,
            bottom: 0,
            background: '#fff4e1',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0, background: '#fff4e1' }}
          />
        </Sider>

        {/* 主内容区 */}
        <Layout
          style={{
            marginLeft: collapsed ? 80 : 250,
            transition: 'margin-left 0.2s',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <Content
            style={{
              margin: '20px',
              padding: 24,
              background: '#fafafa',
              minHeight: 'calc(100vh - 100px)',
              borderRadius: 4,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

