import axios from 'axios';

const api = axios.create({
  baseURL: 'https://space-management-api.onrender.com', // LOOK HERE 0_0
  timeout: 45000,
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

export default api
