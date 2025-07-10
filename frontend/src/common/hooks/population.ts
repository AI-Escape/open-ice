import { useQuery } from '@tanstack/react-query';
import { getCurrentPopulation } from '../api/population';
import { useMemo } from 'react';
import { AverageDailyPopulation } from '../types';

function useCurrentPopulation() {
  return useQuery({
    queryKey: ['population', 'current'],
    queryFn: getCurrentPopulation,
    // 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export default useCurrentPopulation;

export function useCurrentPopulationGrouped(data: AverageDailyPopulation[], compareMonths: number) {
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return sorted;
  }, [data]);

  const groupedData = useMemo(() => {
    // group by agency
    const grouped: Record<
      string,
      {
        data: Record<string, AverageDailyPopulation[]>;
      }
    > = {};
    for (const item of sortedData) {
      if (!grouped[item.agency]) {
        grouped[item.agency] = {
          data: {},
        };
      }
      if (!grouped[item.agency].data[item.criminality]) {
        grouped[item.agency].data[item.criminality] = [];
      }
      grouped[item.agency].data[item.criminality].push(item);
    }
    return grouped;
  }, [sortedData]);

  const organizedData = useMemo(() => {
    return {
      ICE: {
        data: groupedData['ICE'].data['Average'],
        groupedData: groupedData['ICE'].data,
        lastData: groupedData['ICE'].data['Average'][groupedData['ICE'].data['Average'].length - 1],
        compareData:
          groupedData['ICE'].data['Average'][
            groupedData['ICE'].data['Average'].length - compareMonths - 1
          ],
      },
      CBP: {
        data: groupedData['CBP'].data['Average'],
        groupedData: groupedData['CBP'].data,
        lastData: groupedData['CBP'].data['Average'][groupedData['CBP'].data['Average'].length - 1],
        compareData:
          groupedData['CBP'].data['Average'][
            groupedData['CBP'].data['Average'].length - compareMonths - 1
          ],
      },
      Average: {
        data: groupedData['Average'].data['Average'],
        groupedData: groupedData['Average'].data,
        lastData:
          groupedData['Average'].data['Average'][groupedData['Average'].data['Average'].length - 1],
        compareData:
          groupedData['Average'].data['Average'][
            groupedData['Average'].data['Average'].length - compareMonths - 1
          ],
      },
    };
  }, [sortedData]);

  return organizedData;
}
