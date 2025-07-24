import { DetainmentExperience } from '../types';
import axiosInstance from './axiosInstance';

export async function getRecentExperiences() {
  const response = await axiosInstance.get('/experiences/recent');
  return response.data as DetainmentExperience[];
}
