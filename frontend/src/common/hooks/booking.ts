import { useQuery } from '@tanstack/react-query';
import { getCurrentBooking } from '../api/booking';
import { useMemo } from 'react';
import { AGENCY_ORDER, Agency, BookIn } from '../types';

function useCurrentBooking() {
  return useQuery({
    queryKey: ['booking', 'current'],
    queryFn: getCurrentBooking,
    // 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export default useCurrentBooking;

export function useCurrentBookingGrouped(data: BookIn[], compareMonths: number) {
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return sorted;
  }, [data]);

  const groupedData = useMemo(() => {
    // group by agency
    const grouped: Record<
      Agency,
      {
        data: BookIn[];
      }
    > = {} as Record<Agency, { data: BookIn[] }>;
    for (const item of sortedData) {
      if (!grouped[item.agency]) {
        grouped[item.agency] = {
          data: [] as BookIn[],
        };
      }
      grouped[item.agency].data.push(item);
    }
    return grouped;
  }, [sortedData]);

  const organizedData = useMemo(() => {
    const items = AGENCY_ORDER.filter((agency) => agency !== 'Total' && agency !== 'Average').map(
      (agency) => {
        const totalData = groupedData[agency].data;

        return {
          agency,
          data: totalData,
        };
      },
    );
    const lookup = {} as Record<Agency, BookIn[]>;
    for (const item of items) {
      lookup[item.agency] = item.data;
    }
    return lookup;
  }, [groupedData]);

  return organizedData;
}
