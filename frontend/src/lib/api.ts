import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('machinery-log.access-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
