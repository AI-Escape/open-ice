import { BarChart, Box, LineChart, MixedLineBarChartProps } from '@cloudscape-design/components';
import {
  AverageDailyPopulation,
  BOOK_OUT_DETAILS,
  BOOK_OUT_FRIENDLY_NAMES,
  BOOK_OUT_REASON_COLORS,
  BOOK_OUT_REASON_ORDER,
  BookOutReason,
  BookOutRelease,
  Criminality,
  CRIMINALITY_COLORS,
  CRIMINALITY_ORDER,
} from '../../common/types';
import { useMemo, useState } from 'react';

export type BookOutReleaseGraphProps = {
  groupedData: Record<
    Criminality,
    {
      data: BookOutRelease[];
      groupedData: Record<BookOutReason, BookOutRelease[]>;
      lastData: BookOutRelease;
      compareData: BookOutRelease;
    }
  >;
};

const SKIP_REASONS = ['Total', 'Bonded Out'];

export function BookOutReleaseGraph(props: BookOutReleaseGraphProps) {
  const { groupedData } = props;

  const chartData = useMemo(() => {
    const totalGroupedData = groupedData['Total'].groupedData;
    const items = Object.keys(totalGroupedData)
      .filter((key) => !SKIP_REASONS.includes(key))
      .map((key) => {
        return {
          title: key,
          data: totalGroupedData[key as keyof typeof totalGroupedData].map((item) => ({
            x: new Date(item.timestamp),
            y: item.releases,
          })),
          type: 'bar',
          // reasons not criminality
          color: BOOK_OUT_REASON_COLORS[key as keyof typeof BOOK_OUT_REASON_COLORS],
          valueFormatter: (y: number) => {
            return y.toLocaleString();
          },
        };
      }) as MixedLineBarChartProps.BarDataSeries<Date>[];
    items.sort((a, b) => {
      return (
        BOOK_OUT_REASON_ORDER.indexOf(b.title as BookOutReason) -
        BOOK_OUT_REASON_ORDER.indexOf(a.title as BookOutReason)
      );
    });

    return items;
  }, [groupedData]);

  const [visibleSeries, setVisibleSeries] = useState<string[]>(
    chartData.map((series) => series.title),
  );

  const dateTotals = useMemo(() => {
    const totalGroupedData = groupedData['Total'].groupedData;
    const data = {} as Record<string, number>;
    for (const key of Object.keys(totalGroupedData)) {
      if (SKIP_REASONS.includes(key)) continue;
      if (!visibleSeries.includes(key)) continue;
      for (const item of totalGroupedData[key as keyof typeof totalGroupedData]) {
        data[new Date(item.timestamp).toISOString()] =
          (data[new Date(item.timestamp).toISOString()] || 0) + item.releases;
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
      yTitle="Number of Detainees Released (by reason)"
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
              {BOOK_OUT_DETAILS[series.title as BookOutReason] && (
                <Box variant="span" fontSize="body-s" color="text-body-secondary">
                  {BOOK_OUT_DETAILS[series.title as BookOutReason]}
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
      legendTitle="Reason for Release"
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
          </>
        );
      }}
    />
  );
}
