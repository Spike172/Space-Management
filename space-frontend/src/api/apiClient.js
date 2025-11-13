import axios from 'axios'

const api = axios.create({
  baseURL: 'https://space-management-api.onrender.com/docs#/', // LOOK HERE 0_0
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export default api
