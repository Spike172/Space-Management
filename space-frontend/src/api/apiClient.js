import axios from 'axios'

const api = axios.create({
  baseURL: 'https://space-management-api.onrender.com/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export default api
