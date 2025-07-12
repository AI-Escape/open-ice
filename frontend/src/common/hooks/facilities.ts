import { useQuery } from '@tanstack/react-query';
import { getCurrentFacilities } from '../api/facilities';

function useCurrentFacilities() {
  return useQuery({
    queryKey: ['facilities', 'current'],
    queryFn: getCurrentFacilities,
    // 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export default useCurrentFacilities;
