import { Box, PieChart } from "@cloudscape-design/components";
import { CRIMINALITY_DESCRIPTIONS, Facility, THREAT_LEVEL_COLORS, THREAT_LEVEL_DESCRIPTIONS, THREAT_LEVEL_ORDER, ThreatLevel } from "../../common/types";
import { useMemo, useState } from "react";

export type ThreatPieChartProps = {
  data: Facility[];
};

export const ThreatPieChart = (props: ThreatPieChartProps) => {
  const grouped = useMemo(() => {
    const gData: Record<ThreatLevel, number> = {
      'Level 1': 0,
      'Level 2': 0,
      'Level 3': 0,
      'No Threat': 0,
      Total: 0,
    };
    for (const f of props.data) {
      gData['Level 1'] = (f.ice_threat_level_1 ?? 0) + (gData['Level 1'] ?? 0);
      gData['Level 2'] = (f.ice_threat_level_2 ?? 0) + (gData['Level 2'] ?? 0);
      gData['Level 3'] = (f.ice_threat_level_3 ?? 0) + (gData['Level 3'] ?? 0);
      gData['No Threat'] = (f.no_ice_threat_level ?? 0) + (gData['No Threat'] ?? 0);
    }
    gData['Total'] = gData['Level 1'] + gData['Level 2'] + gData['Level 3'] + gData['No Threat'];
    return gData;
  }, [props.data]);

  const data = useMemo(() => {
    return Object.entries(grouped).filter(([key, value]) => key !== 'Total').map(([key, value]) => ({
      title: key,
      value,
      color: THREAT_LEVEL_COLORS[key as ThreatLevel],
    })).sort((a, b) => THREAT_LEVEL_ORDER.indexOf(a.title as ThreatLevel) - THREAT_LEVEL_ORDER.indexOf(b.title as ThreatLevel));
  }, [grouped]);

  
  const [visibleSegments, setVisibleSegments] = useState<string[]>(
    data.map((datum) => datum.title),
  );

  const visibleDataSum = useMemo(() => {
    return data
      .filter((datum) => visibleSegments.includes(datum.title))
      .reduce((acc, datum) => acc + datum.value, 0);
  }, [data, visibleSegments]);


  return (
    <PieChart
      variant="pie"
      data={data}
      fitHeight
      size="large"
      onFilterChange={({ detail }) => {
        const visibleSegments = detail.visibleSegments;
        setVisibleSegments(visibleSegments.map((segment) => segment.title));
      }}
      detailPopoverContent={({ title, value }) => {
        return [
          {
            key: 'Avg. Daily Population',
            value: value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
          },
          {
            key: 'Percentage',
            value: `${((value / visibleDataSum) * 100).toFixed(1)}%`,
          },
        ];
      }}
      segmentDescription={({ title, value }) => {
        return `${value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} people (${((value / visibleDataSum) * 100).toFixed(1)}%)`;
      }}
      legendTitle="Threat Level of Detainees"
      detailPopoverFooter={({ title, value }) => {
        return (
          <>
            <hr />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box variant="span" fontSize="body-s" color="text-body-secondary">
                {THREAT_LEVEL_DESCRIPTIONS[title as ThreatLevel]}
              </Box>
            </div>
          </>
        );
      }}
    />
  );
};