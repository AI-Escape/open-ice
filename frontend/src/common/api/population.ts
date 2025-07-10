import { AverageDailyPopulation } from '../types';
import axiosInstance from './axiosInstance';

export async function getCurrentPopulation() {
  const response = await axiosInstance.get('/population/current');
  return response.data as AverageDailyPopulation[];
}
