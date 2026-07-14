import axios from "axios";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, unknown>).Authorization = `Bearer ${token}`;
    }

    // Do not force JSON header when sending multipart form data
    if (config.data instanceof FormData) {
      const headers = config.headers as Record<string, unknown> | undefined;
      if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;