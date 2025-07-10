import { BookOutRelease } from '../types';
import axiosInstance from './axiosInstance';

export async function getCurrentRelease() {
  const response = await axiosInstance.get('/release/current');
  return response.data as BookOutRelease[];
}
