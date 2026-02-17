import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10_000,
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

export default axiosInstance
