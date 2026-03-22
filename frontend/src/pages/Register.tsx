import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import type { FormProps } from 'antd';
import { useState, useEffect } from 'react';

const { Title } = Typography;

const Register: React.FC = () => {
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
      await authApi.register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error: any) {
      // 错误已在 axios 拦截器中处理，这里可以添加额外的错误处理逻辑
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
          <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 20 : 24, margin: 0, color: '#fff' }}>刷题系统</Title>
          <Title level={5} style={{ color: 'rgba(255,255,255,0.9)', margin: isMobile ? '8px 0 0' : '0' }}>创建账号</Title>
        </div>
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
            ]}
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
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱（选填）"
              size="large"
              style={{ minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 个字符' },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              style={{ minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
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
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', fontSize: isMobile ? 13 : 14 }}>
            <span>已有账号？</span>
            <Link to="/login" style={{ marginLeft: 4 }}>立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
