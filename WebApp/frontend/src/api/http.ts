import axios from "axios";

export const http = axios.create({
  // 生产构建通过 VITE_API_BASE 注入后端公网域名（微信云托管）；开发环境走 vite 代理 /api
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  timeout: 8000,
});

// 业务约定：响应体 { code, message, data }，code !== 0 视为业务错误
http.interceptors.response.use(
  (res) => {
    const data = res.data;
    if (data && typeof data.code === "number" && data.code !== 0) {
      return Promise.reject(new Error(data.message || "接口返回错误"));
    }
    return res;
  },
  (err) => Promise.reject(err)
);

// 竞速超时：axios 8s 超时 + 10s 定时器兜底，防止 XHR 永久挂起阻塞离线降级
export function requestWithTimeout<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("请求超时（网络不可达或响应异常）"));
    }, 10000);
    http
      .get(path, { params })
      .then((res) => {
        window.clearTimeout(timer);
        resolve(res.data);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}
