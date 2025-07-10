import { useQuery } from '@tanstack/react-query';
import { getCurrentProcessingDisposition } from '../api/disposition';

function useCurrentProcessingDisposition() {
  return useQuery({
    queryKey: ['disposition', 'current'],
    queryFn: getCurrentProcessingDisposition,
    // 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export default useCurrentProcessingDisposition;
