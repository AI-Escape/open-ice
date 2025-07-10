import { useMemo } from 'react';
import { useCurrentStayLengthGrouped } from '../../common/hooks/stay';
import { AverageDailyPopulation, AverageStayLength } from '../../common/types';
import { Box, Container, Header } from '@cloudscape-design/components';
import { EconomicImpactCalculator } from '../calculators/EconomicImpactCalculator';
import { useCurrentPopulationGrouped } from '../../common/hooks/population';

export type EconomicImpactStatsProps = {
  data: AverageStayLength[];
  popData: AverageDailyPopulation[];
  compareMonths: number;
};

const DEFAULT_WAGE = 17.0;
const DEFAULT_WEEKLY_WORK_HOURS = 39.5;
const EMPLOYMENT_RATE = 0.741;
const TAX_RATE = 0.295;

export function EconomicImpactStats(props: EconomicImpactStatsProps) {
  const { data, popData, compareMonths } = props;
  const organizedData = useCurrentStayLengthGrouped(data, compareMonths);
  const organizedPopulationData = useCurrentPopulationGrouped(popData, compareMonths);

  const currentMonth = useMemo(() => {
    return new Date(organizedData.Average.lastData.timestamp).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [organizedData]);

  return (
    <EconomicImpactCalculator
      groupedData={organizedData.Average.groupedData}
      defaultWage={DEFAULT_WAGE}
      defaultWeeklyWorkHours={DEFAULT_WEEKLY_WORK_HOURS}
      employmentRate={EMPLOYMENT_RATE}
      taxRate={TAX_RATE}
      iceData={organizedData.ICE.groupedData['Average']}
      cbpData={organizedData.CBP.groupedData['Average']}
      averageDailyPopulation={organizedPopulationData.Average.lastData.population}
    />
  );
}
