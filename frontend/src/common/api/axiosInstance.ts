import axios from 'axios';
import { useEffect } from 'react';

const useLive = false;

export const liveApiUrl = 'https://api.openice.org';

export const apiUrl =
  (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && !useLive
    ? 'http://localhost:80'
    : liveApiUrl;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
