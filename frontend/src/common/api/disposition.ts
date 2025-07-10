import { ProcessingDisposition } from '../types';
import axiosInstance from './axiosInstance';

export async function getCurrentProcessingDisposition() {
  const response = await axiosInstance.get('/disposition/current');
  return response.data as ProcessingDisposition[];
}
