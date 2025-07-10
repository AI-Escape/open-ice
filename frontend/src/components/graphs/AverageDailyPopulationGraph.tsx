import { BarChart, Box, LineChart, MixedLineBarChartProps } from '@cloudscape-design/components';
import {
  AverageDailyPopulation,
  Criminality,
  CRIMINALITY_COLORS,
  CRIMINALITY_DESCRIPTIONS,
  CRIMINALITY_ORDER,
} from '../../common/types';
import { useMemo, useState } from 'react';

export type AverageDailyPopulationGraphProps = {
  groupedData: Record<
    'Convicted Criminal' | 'Pending Criminal Charges' | 'Other Immigration Violator' | 'Average',
    AverageDailyPopulation[]
  >;
};

export function AverageDailyPopulationGraph(props: AverageDailyPopulationGraphProps) {
  const { groupedData } = props;

  const chartData = useMemo(() => {
    const items = Object.keys(groupedData)
      .filter((key) => key !== 'Average')
      .map((key) => {
        return {
          title: key,
          data: groupedData[key as keyof typeof groupedData].map((item) => ({
            x: new Date(item.timestamp),
            y: Math.round(item.population),
          })),
          type: 'bar',
          color: CRIMINALITY_COLORS[key as keyof typeof CRIMINALITY_COLORS],
          valueFormatter: (y: number) => {
            return y.toLocaleString();
          },
        };
      }) as MixedLineBarChartProps.BarDataSeries<Date>[];
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

  const dateTotals = useMemo(() => {
    const data = {} as Record<string, number>;
    for (const key of Object.keys(groupedData)) {
      if (key === 'Average') continue;
      if (!visibleSeries.includes(key)) continue;
      for (const item of groupedData[key as keyof typeof groupedData]) {
        data[new Date(item.timestamp).toISOString()] =
          (data[new Date(item.timestamp).toISOString()] || 0) + Math.round(item.population);
      }
    }
    return data;
  }, [groupedData, visibleSeries]);

  const maxValue = useMemo(() => {
    return Math.max(...Object.values(dateTotals));
  }, [dateTotals]);

  return (
    <BarChart
      series={chartData}
      stackedBars
      xScaleType="categorical"
      xTitle="Month"
      yTitle="Average Daily Population (in people)"
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
        return y.toLocaleString();
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
          value: y.toLocaleString(),
        };
      }}
      onFilterChange={({ detail }) => {
        const visibleSeries = detail.visibleSeries;
        setVisibleSeries(visibleSeries.map((series) => series.title));
      }}
      detailPopoverSize="large"
      legendTitle="Criminal Status of Detainees"
      emphasizeBaselineAxis
      detailPopoverFooter={(x) => {
        const total = dateTotals[x.toISOString()];
        return (
          <>
            <hr />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Total</span>
              <span>{total.toLocaleString()} people</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box variant="span" fontSize="body-s" color="text-body-secondary">
                The average daily population is the average number of people held in custody each
                day. Detainees are overwhelmingly non-criminal, and have not necessarily been
                convicted of any immigration violations while in custody.
              </Box>
            </div>
          </>
        );
      }}
    />
  );
}
