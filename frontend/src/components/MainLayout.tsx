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
  ExperimentOutlined,
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
  { key: '/scenario/report-create', label: '场景演示', icon: <ExperimentOutlined /> },
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

  const currentMenu = useMemo(
    () => leftMenuConfig.find((item) => location.pathname.startsWith(item.key)),
    [location.pathname]
  );
  const pageTitle = currentMenu?.label ?? '设计态系统';

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
      <Header className="dtc-header">
        <div className="dtc-header-left">BI系统 - 设计态</div>
        <div className="dtc-header-center">{pageTitle}</div>
        <div className="dtc-header-right">
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#666666', color: '#fff' }}>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <span>{user.username || user.userId}</span>
            </Space>
          </Dropdown>
        </div>
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
            background: '#001529',
            borderRight: '1px solid #002140',
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
            style={{ borderRight: 0, background: 'transparent' }}
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

