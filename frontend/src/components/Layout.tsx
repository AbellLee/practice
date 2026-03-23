import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, theme, Modal, message, Drawer, Switch, Form, Input } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  SunOutlined,
  MoonOutlined,
  StarOutlined,
  BookFilled,
  LineChartOutlined,
  ThunderboltOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { MenuProps } from 'antd';
import { authApi } from '../api';

const { Header, Content, Sider } = AntLayout;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(isMobile);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const {
    token: { colorBgContainer, colorBgLayout, borderRadiusLG },
  } = theme.useToken();

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsed(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 初始化用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
  }, []);

  const menuItems: MenuProps['items'] = [
    {
      key: '/questions',
      icon: <BookOutlined />,
      label: '刷题练习',
    },
    {
      key: '/practice',
      icon: <ThunderboltOutlined />,
      label: '快速答题',
    },
    {
      key: '/records',
      icon: <FileTextOutlined />,
      label: '答题记录',
    },
    {
      key: '/favorites',
      icon: <StarOutlined />,
      label: '我的收藏',
    },
    {
      key: '/wrong-book',
      icon: <BookFilled />,
      label: '错题本',
    },
    {
      key: '/statistics',
      icon: <LineChartOutlined />,
      label: '统计分析',
    },
    {
      key: '/manage',
      icon: <DashboardOutlined />,
      label: '题目管理',
    },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('已退出登录');
        navigate('/login');
      },
    });
  };

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    document.documentElement.setAttribute('data-theme', checked ? 'dark' : 'light');
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    message.success(checked ? '已切换到深色模式' : '已切换到浅色模式');
  };

  const handleChangePassword = async (values: { old_password: string; new_password: string }) => {
    try {
      await authApi.changePassword(values);
      message.success('密码修改成功');
      setChangePasswordVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      // 错误已在 axios 拦截器中处理
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'changePassword',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => setChangePasswordVisible(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 移动端：使用 Drawer 代替 Sider */}
      {isMobile ? (
        <>
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={280}
            styles={{ 
              body: { padding: 0 },
              header: { display: 'none' }
            }}
          >
            <div
              style={{
                height: 60,
                margin: '0 0 16px 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              刷题系统
            </div>
            <Menu
              theme="light"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => {
                navigate(key);
                setDrawerVisible(false);
              }}
              style={{ borderRight: 0 }}
            />
          </Drawer>
          <Sider
            collapsed={true}
            theme="dark"
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="dark"
          breakpoint="lg"
          width={200}
        >
          <div
            style={{
              height: 32,
              margin: 16,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: collapsed ? 12 : 14,
            }}
          >
            {collapsed ? '刷题' : '刷题系统'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
      )}
      
      <AntLayout>
        <Header
          style={{
            padding: isMobile ? '0 12px' : '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: isMobile ? 56 : 64,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            borderBottom: isDarkMode ? '1px solid #424242' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <MenuOutlined
                style={{ fontSize: 20, cursor: 'pointer', padding: '8px' }}
                onClick={() => setDrawerVisible(true)}
              />
            )}
            <div 
              style={{ 
                fontSize: isMobile ? 16 : 18, 
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? 'calc(100vw - 120px)' : 'none',
              }}
            >
              {(menuItems.find((item) => item?.key === location.pathname) as any)?.label || '刷题系统'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            {/* 深色模式切换 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SunOutlined style={{ color: '#faad14', fontSize: 16 }} />
              <Switch
                checked={isDarkMode}
                onChange={handleThemeToggle}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                size={isMobile ? 'small' : 'default'}
              />
              <MoonOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            </div>
            {user && (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div 
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: isMobile ? '4px 8px' : '4px 12px',
                    borderRadius: 6,
                    transition: 'background 0.3s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} />
                  {!isMobile && <span style={{ fontSize: 14 }}>{user.username}</span>}
                </div>
              </Dropdown>
            )}
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? 8 : 24,
            padding: isMobile ? 12 : 24,
            background: isDarkMode ? colorBgLayout : colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>

      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onCancel={() => { setChangePasswordVisible(false); passwordForm.resetFields(); }}
        onOk={() => passwordForm.submit()}
        okText="确认修改"
        cancelText="取消"
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="old_password"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </AntLayout>
  );
};

export default Layout;
