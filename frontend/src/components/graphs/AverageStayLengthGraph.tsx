import { BarChart, Box, LineChart, MixedLineBarChartProps } from '@cloudscape-design/components';
import {
  AverageStayLength,
  Criminality,
  CRIMINALITY_COLORS,
  CRIMINALITY_DESCRIPTIONS,
  CRIMINALITY_ORDER,
} from '../../common/types';
import { useMemo, useState } from 'react';

export type AverageStayLengthGraphProps = {
  groupedData: Record<
    'Convicted Criminal' | 'Pending Criminal Charges' | 'Other Immigration Violator' | 'Average',
    AverageStayLength[]
  >;
};

export function AverageStayLengthGraph(props: AverageStayLengthGraphProps) {
  const { groupedData } = props;

  const chartData = useMemo(() => {
    const items = Object.keys(groupedData)
      // .filter((key) => key !== 'Average')
      .map((key) => {
        return {
          title: key,
          data: groupedData[key as keyof typeof groupedData].map((item) => ({
            x: new Date(item.timestamp),
            y: item.length_of_stay,
          })),
          type: 'line',
          color: CRIMINALITY_COLORS[key as keyof typeof CRIMINALITY_COLORS],
          valueFormatter: (y: number) => {
            return y.toLocaleString();
          },
        };
      }) as MixedLineBarChartProps.LineDataSeries<Date>[];
    items.sort((a, b) => {
      return (
        CRIMINALITY_ORDER.indexOf(a.title as Criminality) -
        CRIMINALITY_ORDER.indexOf(b.title as Criminality)
      );
    });
    return items;
  }, [groupedData]);

  const [visibleSeries, setVisibleSeries] = useState<string[]>(
    chartData.map((series) => series.title),
  );

  const maxValue = useMemo(() => {
    return Math.max(
      ...chartData
        .filter((series) => visibleSeries.includes(series.title))
        .map((series) => Math.max(...series.data.map((item) => item.y))),
    );
  }, [chartData, visibleSeries]);

  return (
    <LineChart
      series={chartData}
      xScaleType="categorical"
      xTitle="Month"
      yTitle="Average Length of Stay (in days)"
      yDomain={[0, maxValue * 1.1]}
      noMatch={
        <Box variant="p" textAlign="center" color="text-body-secondary">
          No matching data to display
        </Box>
      }
      xTickFormatter={(x) => {
        return new Date(x).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      }}
      yTickFormatter={(y) => {
        return y.toFixed(1);
      }}
      detailPopoverSeriesContent={({ series, x, y }) => {
        return {
          key: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box variant="span" fontSize="heading-xs" fontWeight="normal">
                {series.title}
              </Box>
              {CRIMINALITY_DESCRIPTIONS[series.title as Criminality] && (
                <Box variant="span" fontSize="body-s" color="text-body-secondary">
                  {CRIMINALITY_DESCRIPTIONS[series.title as Criminality]}
                </Box>
              )}
            </div>
          ),
          value: y.toFixed(1),
        };
      }}
      detailPopoverSize="large"
      legendTitle="Criminal Status of Detainees"
      onFilterChange={({ detail }) => {
        const visibleSeries = detail.visibleSeries;
        setVisibleSeries(visibleSeries.map((series) => series.title));
      }}
      emphasizeBaselineAxis
      detailPopoverFooter={(x) => {
        return (
          <>
            <hr />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box variant="span" fontSize="body-s" color="text-body-secondary">
                Detainment length is the average number of{' '}
                <Box variant="span" fontWeight="bold" fontSize="body-s">
                  days
                </Box>{' '}
                that detainees are held in custody. Detainees are overwhelmingly non-criminal, and
                have not necessarily been convicted of any immigration violations while in custody.
              </Box>
            </div>
          </>
        );
      }}
    />
  );
}
