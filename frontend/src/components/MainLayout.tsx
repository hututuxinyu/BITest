import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Layout, Avatar, Dropdown, Space, message, Menu, Button, Input, Tag, Select, Tooltip, Modal } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FolderOutlined,
  ExperimentOutlined,
  BlockOutlined,
  FileTextOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  SaveOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import ComponentPanel from './ComponentPanel';
import TemplatePanel from './TemplatePanel';
import CanvasWorkspace from './CanvasWorkspace';
import { useEditorContext } from '../contexts/EditorContext';
import { projectApi, reportApi } from '../services/api';

const { Header, Content, Sider } = Layout;

const SUB_PANEL_WIDTH = 250;
const SUB_PANEL_COLLAPSED_WIDTH = 0;

interface MainLayoutProps {
  children: React.ReactNode;
  user: { userId: string; username?: string };
}

interface LeftMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  hasSubPanel?: boolean;
}

const leftMenuConfig: LeftMenuItem[] = [
  { key: '/projects', label: '工程管理', icon: <FolderOutlined /> },
  { key: '/components', label: '组件库', icon: <BlockOutlined />, hasSubPanel: true },
  { key: '/templates', label: '模板', icon: <FileTextOutlined />, hasSubPanel: true },
  { key: '/scenario/report-create', label: '场景演示', icon: <ExperimentOutlined /> },
];

/**
 * 主布局组件
 * 包含顶部导航栏和主内容区
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ projectId?: string; reportId?: string }>();
  const menuCollapsed = true;
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>('/projects');
  const [subPanelCollapsed, setSubPanelCollapsed] = useState<boolean>(false);
  
  // 报表编辑界面相关状态
  const isEditorPage = location.pathname.includes('/reports/') && location.pathname.includes('/editor');
  // 注意：Hooks 必须在顶层调用，不能条件调用
  let editorContext: ReturnType<typeof useEditorContext> | null = null;
  try {
    editorContext = useEditorContext();
  } catch (e) {
    // 如果不在 EditorContextProvider 中，editorContext 为 null
    // 这是正常的，因为非编辑页面不需要这个 context
  }
  const effectiveUserId = user?.userId || 'user-001';
  
  // 加载工程和报表信息
  useEffect(() => {
    if (isEditorPage && params.projectId && !editorContext?.projectContext) {
      projectApi
        .enterProject(effectiveUserId, params.projectId)
        .then((response) => {
          if (response.success) {
            editorContext?.setProjectContext(response.data);
          } else {
            message.error(response.message || '工程信息加载失败');
          }
        })
        .catch(() => message.error('工程信息加载失败'));
    }
  }, [isEditorPage, params.projectId, effectiveUserId, editorContext]);

  useEffect(() => {
    if (isEditorPage && params.projectId && params.reportId && !editorContext?.reportContext) {
      reportApi
        .getReportDetail(params.projectId, params.reportId)
        .then((response) => {
          if (response.success) {
            editorContext?.setReportContext(response.data);
            if (response.data.reportName) {
              editorContext?.setReportTitle(response.data.reportName);
            }
          } else {
            message.error(response.message || '报表信息加载失败');
          }
        })
        .catch(() => message.error('报表信息加载失败'));
    }
  }, [isEditorPage, params.projectId, params.reportId, editorContext]);

  // 发布报表处理函数
  const handlePublish = useCallback(async () => {
    if (!params.projectId || !params.reportId || !editorContext) {
      message.warning('请先创建或选择报表');
      return;
    }

    try {
      // 先验证Schema
      const validateResponse = await reportApi.validateReportSchema(params.projectId, params.reportId);
      if (!validateResponse.success) {
        message.error(validateResponse.message || 'Schema验证失败');
        return;
      }

      if (!validateResponse.data.valid) {
        Modal.warning({
          title: 'Schema验证失败',
          content: validateResponse.data.errorMessage || 'Schema格式不正确，无法发布',
        });
        return;
      }

      // 确认发布
      Modal.confirm({
        title: '确认发布',
        content: '发布后报表将在运行态可见，是否确认发布？',
        onOk: async () => {
          try {
            const response = await reportApi.publishReport(effectiveUserId, params.projectId!, params.reportId!);
            if (response.success && response.data) {
              message.success('发布成功');
              // 更新报表上下文状态
              editorContext.setReportContext({
                ...editorContext.reportContext!,
                status: 'published',
              });
            } else {
              message.error(response.message || '发布失败');
            }
          } catch (error: any) {
            message.error(error.message || '发布失败');
          }
        },
      });
    } catch (error: any) {
      message.error(error.message || '发布失败');
    }
  }, [params.projectId, params.reportId, effectiveUserId, editorContext]);

  // 返回工程管理
  const handleBackToProject = useCallback(() => {
    if (editorContext?.projectContext) {
      navigate(`/projects/${editorContext.projectContext.projectId}/workspace`, { 
        state: { project: editorContext.projectContext } 
      });
    } else {
      navigate('/projects');
    }
  }, [editorContext, navigate]);

  // 根据路径确定当前选中的菜单项
  const currentMenuKey = useMemo(() => {
    // 特殊处理：报表编辑界面应该显示组件库面板
    if (location.pathname.includes('/reports/') && location.pathname.includes('/editor')) {
      return '/components';
    }
    // 工程工作区应该选中"工程管理"
    if (location.pathname.includes('/workspace')) {
      return '/projects';
    }
    // 其他情况按路径前缀匹配
    const matched = leftMenuConfig.find((item) => location.pathname.startsWith(item.key));
    return matched?.key ?? leftMenuConfig[0].key;
  }, [location.pathname]);

  // 同步当前路径对应的菜单项
  React.useEffect(() => {
    setSelectedMenuKey(currentMenuKey);
  }, [currentMenuKey]);

  const currentMenu = useMemo(
    () => leftMenuConfig.find((item) => location.pathname.startsWith(item.key)),
    [location.pathname]
  );

  // 获取当前菜单项
  const currentMenuItem = useMemo(
    () => leftMenuConfig.find((item) => item.key === selectedMenuKey),
    [selectedMenuKey]
  );
  
  // 根据路径显示更具体的页面标题
  const pageTitle = useMemo(() => {
    // 报表编辑界面
    if (location.pathname.includes('/reports/') && location.pathname.includes('/editor')) {
      return '报表编辑';
    }
    // 工程工作区
    if (location.pathname.includes('/workspace')) {
      return '工程工作区';
    }
    // 如果当前选中的菜单项有子面板，显示该菜单项的标签
    if (currentMenuItem?.hasSubPanel) {
      return currentMenuItem.label;
    }
    // 其他情况使用菜单标签
    return currentMenu?.label ?? '设计态系统';
  }, [location.pathname, currentMenu, currentMenuItem]);

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
    if (typeof key === 'string') {
      const menuItem = leftMenuConfig.find((item) => item.key === key);
      // 如果有子面板，只切换菜单选中状态，不导航
      if (menuItem?.hasSubPanel) {
        setSelectedMenuKey(key);
      } else {
        // 没有子面板的菜单项，正常导航，并清除子面板选中状态
        setSelectedMenuKey(key);
        if (key !== location.pathname) {
          navigate(key);
        }
      }
    }
  };

  // 渲染右侧子面板
  const renderSubPanel = () => {
    if (!currentMenuItem?.hasSubPanel) {
      return null;
    }
    if (selectedMenuKey === '/components') {
      return <ComponentPanel />;
    }
    if (selectedMenuKey === '/templates') {
      return <TemplatePanel />;
    }
    return null;
  };

  // 渲染报表编辑界面的header - 单层结构
  const renderEditorHeader = () => {
    if (!isEditorPage || !editorContext) {
      return null;
    }

    const canvasTitle = editorContext.reportContext?.reportName || '未命名报表';

    return (
      <>
        {/* 左侧：BI系统 + 返回按钮和上下文信息 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '0 0 auto' }}>
          <div className="dtc-header-left">BI系统 - 设计态</div>
          <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 8px' }}></div>
          <Space size="middle" wrap>
            <Button icon={<CaretLeftOutlined />} onClick={handleBackToProject} size="small">
              返回工程管理
            </Button>
            {(editorContext.projectContext || editorContext.reportContext) && (
              <>
                {editorContext.projectContext && (
                  <Tag color={editorContext.projectContext.projectType === 'private' ? 'gold' : 'green'}>
                    {editorContext.projectContext.projectType === 'private' ? '个人工程' : '公共工程'}
                  </Tag>
                )}
                {editorContext.reportContext && (
                  <Tag color={editorContext.reportContext.status === 'published' ? 'green' : 'gold'}>
                    {editorContext.reportContext.status === 'published' ? '已发布' : '草稿'}
                  </Tag>
                )}
                <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>当前报表：{canvasTitle}</span>
              </>
            )}
          </Space>
        </div>
        {/* 中间：报表名称（可编辑） */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Input
            value={editorContext.reportTitle}
            onChange={(e) => editorContext.setReportTitle(e.target.value)}
            placeholder="请输入报表名称"
            style={{ width: 300, textAlign: 'center' }}
            bordered={false}
          />
        </div>
        {/* 右侧：操作按钮组、语言切换和用户信息 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flex: '0 0 auto' }}>
          <Space size="middle" wrap align="center">
            <Tooltip title="保存">
              <Button
                type="primary"
                shape="circle"
                icon={<SaveOutlined />}
                aria-label="保存"
              />
            </Tooltip>
            <Tooltip title="预览">
              <Button
                shape="circle"
                icon={<EyeOutlined />}
                aria-label="预览"
              />
            </Tooltip>
            <Tooltip title={editorContext.reportContext?.status === 'published' ? '已发布' : '发布报表'}>
              <Button
                type={editorContext.reportContext?.status === 'published' ? 'default' : 'dashed'}
                shape="circle"
                icon={<SendOutlined style={{ transform: 'rotate(315deg)' }} />}
                aria-label="发布"
                onClick={handlePublish}
                disabled={!params.projectId || !params.reportId || editorContext.reportContext?.status === 'published'}
              />
            </Tooltip>
            <Select
              className="editor-language-select"
              value={editorContext.language}
              onChange={(value: 'zh-CN' | 'en-US') => editorContext.setLanguage(value)}
              options={[
                { label: '中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
              ]}
            />
          </Space>
          <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 8px' }}></div>
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
        </div>
      </>
    );
  };

  // 渲染普通header
  const renderNormalHeader = () => (
    <>
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
    </>
  );

  // Header高度统一为60px，避免进入编辑界面时高度变化
  const headerHeight = 60;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header 
        className={isEditorPage ? "dtc-header dtc-header-editor" : "dtc-header"}
        style={isEditorPage ? { 
          display: 'flex',
          alignItems: 'center',
          height: `${headerHeight}px`,
          minHeight: `${headerHeight}px`,
        } : {
          height: `${headerHeight}px`,
          minHeight: `${headerHeight}px`,
        }}
      >
        {isEditorPage ? renderEditorHeader() : renderNormalHeader()}
      </Header>

      <Layout
        style={{
          marginTop: headerHeight,
          height: `calc(100vh - ${headerHeight}px)`,
          overflow: 'hidden',
          paddingTop: 0,
        }}
      >
        {/* 左侧主菜单 */}
        <Sider
          width={216}
          collapsedWidth={72}
          theme="light"
          style={{
            background: '#ffffff',
            borderRight: '1px solid #f0f0f0',
            paddingTop: 16,
            height: '100%',
            overflow: 'auto',
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
            theme="light"
          />
        </Sider>
        {/* 右侧子面板（组件库/模板） */}
        {currentMenuItem?.hasSubPanel && (
          <div style={{ position: 'relative', display: 'flex', height: '100%' }}>
            <Sider
              width={SUB_PANEL_WIDTH}
              collapsedWidth={SUB_PANEL_COLLAPSED_WIDTH}
              theme="light"
              collapsed={subPanelCollapsed}
              trigger={null}
              style={{
                background: '#fff',
                borderRight: '1px solid #f0f0f0',
                overflow: 'hidden',
                height: '100%',
                transition: 'width 0.2s ease',
                padding: 0,
              }}
            >
              {renderSubPanel()}
            </Sider>
            {/* 折叠/展开按钮 */}
            <Button
              type="text"
              icon={subPanelCollapsed ? <CaretRightOutlined /> : <CaretLeftOutlined />}
              onClick={() => setSubPanelCollapsed(!subPanelCollapsed)}
              style={{
                position: 'absolute',
                left: subPanelCollapsed ? 0 : SUB_PANEL_WIDTH - 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e8e8e8',
                transition: 'left 0.2s ease',
              }}
              title={subPanelCollapsed ? '展开面板' : '收起面板'}
            />
          </div>
        )}
        {/* 主内容区 */}
        <Layout style={{ background: '#f5f7fa', height: '100%', overflow: 'hidden' }}>
          <Content
            style={{
              margin: 0,
              padding: 0,
              background: '#fafafa',
              height: '100%',
              borderRadius: 0,
              overflow: 'hidden',
            }}
          >
            {location.pathname.includes('/reports/') && location.pathname.includes('/editor') ? (
              <div style={{ height: '100%', overflow: 'hidden' }}>
                {children}
              </div>
            ) : currentMenuItem?.hasSubPanel ? (
              <CanvasWorkspace />
            ) : (
              <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
                {children}
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

