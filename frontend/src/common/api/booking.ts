import { BookIn } from '../types';
import axiosInstance from './axiosInstance';

export async function getCurrentBooking() {
  const response = await axiosInstance.get('/booking/current');
  return response.data as BookIn[];
}
