import { AverageStayLength } from '../types';
import axiosInstance from './axiosInstance';

export async function getCurrentStayLength() {
  const response = await axiosInstance.get('/stay/current');
  return response.data as AverageStayLength[];
}
