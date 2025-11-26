import React, { useMemo } from 'react';
import { Layout, Avatar, Dropdown, Space, message, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FolderOutlined,
  AppstoreOutlined,
  BlockOutlined,
  DatabaseOutlined,
  InteractionOutlined,
  CodeOutlined,
  TranslationOutlined,
  BranchesOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  user: { userId: string; username?: string };
}

interface LeftMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const leftMenuConfig: LeftMenuItem[] = [
  { key: '/projects', label: '工程管理', icon: <FolderOutlined /> },
  { key: '/templates', label: '模板管理', icon: <AppstoreOutlined /> },
  { key: '/canvas', label: '组件库', icon: <BlockOutlined /> },
  { key: '/datasource', label: '数据源配置', icon: <DatabaseOutlined /> },
  { key: '/interaction', label: '交互配置', icon: <InteractionOutlined /> },
  { key: '/schema', label: 'Schema生成', icon: <CodeOutlined /> },
  { key: '/i18n', label: '国际化配置', icon: <TranslationOutlined /> },
  { key: '/codehub', label: 'Codehub集成', icon: <BranchesOutlined /> },
];

/**
 * 主布局组件
 * 包含顶部导航栏和主内容区
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuCollapsed = true;

  const selectedMenuKey = useMemo(() => {
    const matched = leftMenuConfig.find((item) => location.pathname.startsWith(item.key));
    return matched?.key ?? leftMenuConfig[0].key;
  }, [location.pathname]);

  const leftMenuItems: MenuProps['items'] = useMemo(
    () => leftMenuConfig.map((item) => ({ key: item.key, label: item.label, icon: item.icon })),
    []
  );

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

  const handleLeftMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (typeof key === 'string' && key !== location.pathname) {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          background: '#111c3a',
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, fontWeight: 500 }}>BI系统 - 设计态</div>
        <Space>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#2563eb' }}>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <span style={{ color: '#f1f5f9' }}>{user.username || user.userId}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout
        style={{
          marginTop: 60,
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Sider
          width={216}
          collapsedWidth={72}
          theme="dark"
          style={{
            background: '#0f172a',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 16,
          }}
          collapsed={menuCollapsed}
          trigger={null}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            items={leftMenuItems}
            onClick={handleLeftMenuClick}
            style={{ borderRight: 0, background: 'transparent', color: '#e2e8f0' }}
            inlineCollapsed={menuCollapsed}
            theme="dark"
          />
        </Sider>
        {/* 主内容区 */}
        <Layout style={{ background: '#f5f7fa' }}>
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

