import { useQuery } from '@tanstack/react-query';
import { getRecentExperiences } from '../api/experiences';

export default function useRecentExperiences() {
  return useQuery({
    queryKey: ['experiences', 'recent'],
    queryFn: getRecentExperiences,
    staleTime: 1000 * 60 * 60,
  });
}
