import axios from 'axios'

const api = axios.create({
  baseURL: 'https://space-management-api.onrender.com', // LOOK HERE 0_0
  timeout: 30000,
})

export default api
