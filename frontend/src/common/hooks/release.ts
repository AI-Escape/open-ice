import { useQuery } from '@tanstack/react-query';
import { getCurrentRelease } from '../api/release';
import { useMemo } from 'react';
import {
  BOOK_OUT_REASON_ORDER,
  BookOutReason,
  BookOutRelease,
  CRIMINALITY_ORDER,
  Criminality,
} from '../types';

function useCurrentRelease() {
  return useQuery({
    queryKey: ['release', 'current'],
    queryFn: getCurrentRelease,
    // 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export default useCurrentRelease;

export function useCurrentReleaseGrouped(data: BookOutRelease[], compareMonths: number) {
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return sorted;
  }, [data]);

  const groupedData = useMemo(() => {
    // group by agency
    const grouped: Record<
      Criminality,
      {
        data: Record<BookOutReason, BookOutRelease[]>;
      }
    > = {} as Record<Criminality, { data: Record<BookOutReason, BookOutRelease[]> }>;
    for (const item of sortedData) {
      if (!grouped[item.criminality]) {
        grouped[item.criminality] = {
          data: {} as Record<BookOutReason, BookOutRelease[]>,
        };
      }
      if (!grouped[item.criminality].data[item.reason]) {
        grouped[item.criminality].data[item.reason] = [];
      }
      grouped[item.criminality].data[item.reason].push(item);
    }
    return grouped;
  }, [sortedData]);

  const organizedData = useMemo(() => {
    const items = CRIMINALITY_ORDER.filter((criminality) => criminality !== 'Average').map(
      (criminality) => {
        const total = groupedData[criminality].data['Total'];

        if (!total) {
          // calculate total across all reasons and all dates
          // key is timestamp, value is sum of releases
          const cTotal = {} as Record<string, number>;
          const cTotalData = [] as BookOutRelease[];

          for (const reason of Object.keys(groupedData[criminality].data)) {
            for (const item of groupedData[criminality].data[reason as BookOutReason]) {
              cTotal[item.timestamp] = (cTotal[item.timestamp] || 0) + item.releases;
            }
          }
          for (const timestamp of Object.keys(cTotal)) {
            cTotalData.push({
              timestamp,
              criminality,
              reason: 'Total',
              incomplete: true,
              started: true,
              range: 'fy',
              releases: cTotal[timestamp],
            });
          }
          groupedData[criminality].data['Total'] = cTotalData;
        }

        const totalData = groupedData[criminality].data['Total'];

        return {
          criminality,
          data: totalData,
          groupedData: groupedData[criminality].data,
          lastData: totalData[totalData.length - 1],
          compareData: totalData[totalData.length - compareMonths - 1],
        };
      },
    );
    const lookup = {} as Record<
      Criminality,
      {
        data: BookOutRelease[];
        groupedData: Record<BookOutReason, BookOutRelease[]>;
        lastData: BookOutRelease;
        compareData: BookOutRelease;
      }
    >;
    for (const item of items) {
      lookup[item.criminality] = item;
    }
    return lookup;
  }, [groupedData]);

  return organizedData;
}
