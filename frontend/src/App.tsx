import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Register from './pages/Register';
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
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
    </ConfigProvider>
  );
}

export default App;
