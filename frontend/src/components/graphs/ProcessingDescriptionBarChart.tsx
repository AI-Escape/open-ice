import {
  BarChart,
  Box,
  Header,
  LineChart,
  MixedLineBarChartProps,
} from '@cloudscape-design/components';
import {
  AverageStayLength,
  Criminality,
  CRIMINALITY_COLORS,
  CRIMINALITY_ORDER,
  Disposition,
  DISPOSITION_DESCRIPTIONS,
  DISPOSITION_ORDER,
  FacilityType,
  FACILITY_DESCRIPTIONS,
  FACILITY_DESCRIPTIONS_DETAILS,
  FACILITY_ORDER,
  ProcessingDisposition,
} from '../../common/types';
import { useMemo, useState } from 'react';

export type ProcessingDescriptionBarChartProps = {
  data: ProcessingDisposition[];
};

export function ProcessingDescriptionBarChart(props: ProcessingDescriptionBarChartProps) {
  const { data } = props;

  const groupedData = useMemo(() => {
    const grouped = {} as Record<FacilityType, Record<Disposition, number>>;
    for (const item of data) {
      if (!grouped[item.facility]) {
        grouped[item.facility] = {} as Record<Disposition, number>;
      }
      if (!grouped[item.facility][item.disposition]) {
        grouped[item.facility][item.disposition] = 0;
      }
      grouped[item.facility][item.disposition] += item.population;
    }
    return grouped;
  }, [data]);

  const chartData = useMemo(() => {
    const items = Object.keys(groupedData)
      .filter((key) => key !== 'Total')
      .map((key) => {
        const dData = Object.keys(groupedData[key as FacilityType])
          .filter((key) => key !== 'Total')
          .map((disposition) => ({
            x: disposition,
            y: groupedData[key as FacilityType][disposition as Disposition],
          }));
        dData.sort((a, b) => {
          return b.y - a.y;
        });
        return {
          title: FACILITY_DESCRIPTIONS[key as FacilityType],
          data: dData,
          type: 'bar',
          valueFormatter: (y: number) => {
            return y.toLocaleString();
          },
        };
      }) as MixedLineBarChartProps.BarDataSeries<string>[];
    items.sort((a, b) => {
      return FACILITY_ORDER.indexOf(a.title) - FACILITY_ORDER.indexOf(b.title);
    });
    return items;
  }, [groupedData]);

  const [visibleSeries, setVisibleSeries] = useState<string[]>(
    chartData.map((series) => series.title),
  );

  const totals = useMemo(() => {
    const data = {} as Record<string, number>;
    for (const key of Object.keys(groupedData)) {
      if (key === 'Total') continue;
      if (!visibleSeries.includes(FACILITY_DESCRIPTIONS[key as FacilityType])) continue;
      for (const item of Object.keys(groupedData[key as FacilityType])) {
        if (item === 'Total') continue;
        const dist = item as Disposition;
        const dkey = dist;
        data[dkey] = (data[dkey] || 0) + groupedData[key as FacilityType][dist];
      }
    }
    return data;
  }, [groupedData, visibleSeries]);

  const maxValue = useMemo(() => {
    return Math.max(...Object.values(totals));
  }, [totals]);

  return (
    <BarChart
      series={chartData}
      horizontalBars
      stackedBars
      xScaleType="categorical"
      xTitle="Processing Method"
      yTitle="Population (people)"
      yDomain={[0, maxValue * 1.1]}
      noMatch={
        <Box variant="p" textAlign="center" color="text-body-secondary">
          No matching data to display
        </Box>
      }
      xTickFormatter={(x) => {
        return x;
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
                {FACILITY_DESCRIPTIONS_DETAILS[series.title as FacilityType]}
              </Box>
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
      legendTitle="Type of Individual"
      detailPopoverFooter={(x) => {
        const total = totals[x];
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
                {DISPOSITION_DESCRIPTIONS[x as Disposition]}
              </Box>
            </div>
          </>
        );
      }}
    />
  );
}
