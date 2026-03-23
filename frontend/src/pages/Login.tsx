import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import type { FormProps } from 'antd';
import { useState, useEffect } from 'react';

const { Title } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onFinish: FormProps['onFinish'] = async (values) => {
    try {
      const res = await authApi.login(values);
      
      if (res.data && res.data.token) {
        // 保存 token 和用户信息
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        
        message.success('登录成功');
        navigate('/', { replace: true });
      } else {
        message.error('登录响应格式错误');
      }
    } catch (error: any) {
      // 错误已在 axios 拦截器中处理
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: isMobile ? '12px' : '16px',
      }}
      data-theme="light"
    >
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        }}
        size={isMobile ? 'small' : 'default'}
      >
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 30 }}>
          <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 20 : 24, margin: 0 }}>刷题系统</Title>
          <Title level={5} style={{ color: 'rgba(0,0,0,0.45)', margin: isMobile ? '8px 0 0' : '0' }}>欢迎登录</Title>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
              style={{ minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: 20 }}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              style={{ minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              style={{ minHeight: 48, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>

          {/* 注册功能已禁用 */}
        </Form>
      </Card>
    </div>
  );
};

export default Login;
