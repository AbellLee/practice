import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 只处理有 success 字段的响应
    if (res.hasOwnProperty('success') && !res.success) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res;
  },
  (error) => {
    // 401 错误：未授权或 token 过期
    if (error.response?.status === 401) {
      // 只有在确实有 token 的情况下才清除并跳转
      const token = localStorage.getItem('token');
      if (token) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 延迟跳转，避免竞态条件
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      // 如果没有 token，可能是某些公开 API 返回 401，忽略它
    } else if (error.response?.status === 403) {
      message.error('无权访问');
      return Promise.reject(error);
    } else if (error.response) {
      // 其他 HTTP 错误
      message.error(`请求失败：${error.response.status}`);
      return Promise.reject(error);
    } else {
      message.error('网络错误，请检查后端服务');
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;
