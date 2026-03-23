import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import QuestionList from './pages/QuestionList';
import QuestionDetail from './pages/QuestionDetail';
import AnswerRecord from './pages/AnswerRecord';
import QuestionManage from './pages/QuestionManage';
import Favorites from './pages/Favorites';
import WrongBook from './pages/WrongBook';
import Statistics from './pages/Statistics';
import PracticeSession from './pages/PracticeSession';
import Layout from './components/Layout';
import { useEffect, useState } from 'react';
import './dark-mode.css';

// 认证提供者组件
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 监听 storage 变化
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查 token 状态
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 如果在登录页且有 token，跳转到首页
  useEffect(() => {
    if (location.pathname === '/login' && isAuthenticated) {
      navigate('/', { replace: true });
    }
    // 如果不在登录页且没有 token，跳转到登录页
    if (location.pathname !== '/login' && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return <>{children}</>;
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从 localStorage 读取主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 检测系统偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // 应用主题到 document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 监听 data-theme 属性变化（Layout 中切换主题时会修改此属性）
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          const newIsDark = newTheme === 'dark';
          setIsDarkMode(prev => prev !== newIsDark ? newIsDark : prev);
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        ...(isDarkMode ? {
          token: {
            colorBgContainer: '#1f1f1f',
            colorBgElevated: '#2a2a2a',
            colorBgLayout: '#141414',
            colorBorder: '#424242',
            colorBorderSecondary: '#353535',
          },
          components: {
            Layout: {
              bodyBg: '#141414',
              headerBg: '#1f1f1f',
              siderBg: '#001529',
            },
            Card: {
              colorBgContainer: '#1f1f1f',
            },
            Table: {
              colorBgContainer: '#1f1f1f',
              headerBg: '#262626',
              rowHoverBg: 'rgba(255,255,255,0.06)',
              borderColor: '#424242',
            },
            Input: {
              colorBgContainer: '#141414',
              activeBorderColor: '#1890ff',
              hoverBorderColor: '#40a9ff',
            },
            Select: {
              colorBgContainer: '#141414',
              colorBgElevated: '#1f1f1f',
              optionActiveBg: 'rgba(255,255,255,0.08)',
              optionSelectedBg: 'rgba(24,144,255,0.15)',
            },
            Modal: {
              contentBg: '#1f1f1f',
              headerBg: '#1f1f1f',
            },
            Pagination: {
              colorBgContainer: '#1f1f1f',
              itemActiveBg: '#1890ff',
            },
            Button: {
              defaultBg: '#1f1f1f',
              defaultBorderColor: '#424242',
            },
            Radio: {
              buttonSolidCheckedBg: '#1890ff',
            },
            Statistic: {
              colorTextDescription: 'rgba(255,255,255,0.65)',
            },
            Drawer: {
              colorBgElevated: '#1f1f1f',
            },
            Dropdown: {
              colorBgElevated: '#1f1f1f',
            },
            Tag: {
              defaultBg: '#262626',
              defaultColor: 'rgba(255,255,255,0.85)',
            },
            Alert: {
              colorInfoBg: 'rgba(24,144,255,0.1)',
              colorSuccessBg: 'rgba(82,196,26,0.1)',
              colorWarningBg: 'rgba(250,173,20,0.1)',
              colorErrorBg: 'rgba(255,77,79,0.1)',
            },
            Message: {
              contentBg: '#2a2a2a',
            },
            Notification: {
              colorBgElevated: '#2a2a2a',
            },
          },
        } : {}),
      }}
    >
      <AntApp>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/*" element={<Layout />}>
              <Route index element={<Navigate to="/questions" replace />} />
              <Route path="questions" element={<QuestionList />} />
              <Route path="questions/:id" element={<QuestionDetail />} />
              <Route path="practice" element={<PracticeSession />} />
              <Route path="records" element={<AnswerRecord />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="wrong-book" element={<WrongBook />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="manage" element={<QuestionManage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
