import axios from 'axios'

const api = axios.create({
  baseURL: 'https://space-management-api.onrender.com/', // LOOK HERE 0_0
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export default api
