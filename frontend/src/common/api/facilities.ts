import { Facility } from '../types';
import axiosInstance from './axiosInstance';

export async function getCurrentFacilities() {
  const response = await axiosInstance.get('/facilities/current');
  return response.data as Facility[];
}
