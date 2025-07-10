import {
  BarChart,
  Box,
  Header,
  LineChart,
  MixedLineBarChartProps,
} from '@cloudscape-design/components';
import {
  Agency,
  BookIn,
  Criminality,
  AGENCY_ORDER,
  AGENCY_COLORS,
  AGENCY_DESCRIPTIONS,
} from '../../common/types';
import { useMemo, useState } from 'react';

export type BookInGraphProps = {
  groupedData: Record<Agency, BookIn[]>;
};

export function BookInGraph(props: BookInGraphProps) {
  const { groupedData } = props;

  const chartData = useMemo(() => {
    const items = Object.keys(groupedData)
      .filter((key) => key !== 'Total')
      .map((key) => {
        return {
          title: key,
          data: groupedData[key as keyof typeof groupedData].map((item) => ({
            x: new Date(item.timestamp),
            y: item.bookings,
          })),
          type: 'bar',
          color: AGENCY_COLORS[key as keyof typeof AGENCY_COLORS],
          valueFormatter: (y: number) => {
            return y.toLocaleString();
          },
        };
      }) as MixedLineBarChartProps.BarDataSeries<Date>[];
    items.sort((a, b) => {
      return AGENCY_ORDER.indexOf(a.title as Agency) - AGENCY_ORDER.indexOf(b.title as Agency);
    });
    return items;
  }, [groupedData]);

  const [visibleSeries, setVisibleSeries] = useState<string[]>(
    chartData.map((series) => series.title),
  );

  const dateTotals = useMemo(() => {
    const data = {} as Record<string, number>;
    for (const key of Object.keys(groupedData)) {
      if (key === 'Total') continue;
      if (!visibleSeries.includes(key)) continue;
      for (const item of groupedData[key as keyof typeof groupedData]) {
        data[new Date(item.timestamp).toISOString()] =
          (data[new Date(item.timestamp).toISOString()] || 0) + item.bookings;
      }
    }
    return data;
  }, [groupedData, visibleSeries]);

  const maxValue = useMemo(() => {
    return Math.max(
      ...chartData
        .filter((series) => visibleSeries.includes(series.title))
        .map((series) => Math.max(...series.data.map((item) => item.y))),
    );
  }, [chartData, visibleSeries]);

  return (
    <BarChart
      series={chartData}
      stackedBars={false}
      xScaleType="categorical"
      xTitle="Month"
      yTitle="Number of Arrests (in people)"
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
              <Box variant="span" fontSize="body-s" color="text-body-secondary">
                {AGENCY_DESCRIPTIONS[series.title as Agency]}
              </Box>
            </div>
          ),
          value: y.toLocaleString(),
        };
      }}
      detailPopoverSize="large"
      onFilterChange={({ detail }) => {
        const visibleSeries = detail.visibleSeries;
        setVisibleSeries(visibleSeries.map((series) => series.title));
      }}
      emphasizeBaselineAxis
      legendTitle="Arresting Agency"
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
                The number of people arrested by each agency every month. ICE arrests typically
                occur anywhere in the U.S., while CBP arrests typically occur at the border.
                Arrested detainees are overwhelmingly non-criminal, and have not necessarily been
                convicted of any immigration violations while in custody.
              </Box>
            </div>
          </>
        );
      }}
    />
  );
}
