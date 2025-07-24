import { Box, PieChart } from '@cloudscape-design/components';

import {
  AverageDailyPopulation,
  Criminality,
  CRIMINALITY_COLORS,
  CRIMINALITY_ORDER,
  CRIMINALITY_DESCRIPTIONS,
  CRIMINALITY_NAMES,
  CRIMINALITY_NAMES_INVERSE,
} from '../../common/types';
import { useMemo, useState } from 'react';
import { useCurrentPopulationGrouped } from '../../common/hooks/population';

export type AverageDailyPopulationPieChartProps = {
  data: AverageDailyPopulation[];
  compareMonths: number;
};

export function AverageDailyPopulationPieChart(props: AverageDailyPopulationPieChartProps) {
  const { data, compareMonths } = props;

  const groupedData = useCurrentPopulationGrouped(data, compareMonths);

  const chartData = useMemo(() => {
    const avgData = groupedData['Average'];
    const cData = Object.keys(avgData.groupedData)
      .filter((key) => key !== 'Average')
      .map((key) => {
        const gData = avgData.groupedData[key as keyof typeof avgData.groupedData];
        return {
          title: CRIMINALITY_NAMES[key as keyof typeof CRIMINALITY_NAMES],
          value: Math.round(gData[gData.length - 1].population),
          type: 'pie',
          color: CRIMINALITY_COLORS[key as keyof typeof CRIMINALITY_COLORS],
        };
      });
    cData.sort((a, b) => {
      return (
        CRIMINALITY_ORDER.indexOf(CRIMINALITY_NAMES_INVERSE[a.title] as Criminality) -
        CRIMINALITY_ORDER.indexOf(CRIMINALITY_NAMES_INVERSE[b.title] as Criminality)
      );
    });
    return cData;
  }, [groupedData]);

  const [visibleSegments, setVisibleSegments] = useState<string[]>(
    chartData.map((datum) => datum.title),
  );

  const visibleDataSum = useMemo(() => {
    return chartData
      .filter((datum) => visibleSegments.includes(datum.title))
      .reduce((acc, datum) => acc + datum.value, 0);
  }, [chartData, visibleSegments]);

  const nonConvictedData = useMemo(() => {
    return chartData
      .filter((datum) => datum.title !== CRIMINALITY_NAMES['Convicted Criminal'])
      .filter((datum) => visibleSegments.includes(datum.title))
      .reduce((acc, datum) => acc + datum.value, 0);
  }, [chartData, visibleSegments]);

  return (
    <PieChart
      data={chartData}
      variant="donut"
      size="large"
      detailPopoverContent={({ title, value }) => {
        return [
          {
            key: 'People Detained',
            value: value.toLocaleString(),
          },
          {
            key: 'Percentage',
            value: `${((value / visibleDataSum) * 100).toFixed(1)}%`,
          },
        ];
      }}
      detailPopoverFooter={({ title, value }) => {
        return (
          <>
            <hr />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box variant="span" fontSize="body-s" color="text-body-secondary">
                {CRIMINALITY_DESCRIPTIONS[CRIMINALITY_NAMES_INVERSE[title] as Criminality]}
              </Box>
            </div>
          </>
        );
      }}
      segmentDescription={({ title, value }) => {
        return `${value.toLocaleString()} people (${((value / visibleDataSum) * 100).toFixed(1)}%)`;
      }}
      innerMetricDescription="No Conviction"
      legendTitle="Detainee Characteristics"
      innerMetricValue={`${((nonConvictedData / visibleDataSum) * 100).toFixed(1)}%`}
      fitHeight
      onFilterChange={({ detail }) => {
        const visibleSegments = detail.visibleSegments;
        setVisibleSegments(visibleSegments.map((segment) => segment.title));
      }}
    />
  );
}
