import { Box, ColumnLayout, Container, Grid, Header } from '@cloudscape-design/components';
import { AverageDailyPopulation } from '../../common/types';
import { useMemo } from 'react';
import { MetricComparison } from './metrics';
import { AverageDailyPopulationGraph } from '../graphs/AverageDailyPopulationGraph';
import { useCurrentPopulationGrouped } from '../../common/hooks/population';
import { CenteredHeader } from '../CenteredHeader';
import { CenteredSecondaryHeader } from '../CenteredSecondaryHeader';

export type AverageDailyPopulationStatsProps = {
  data: AverageDailyPopulation[];
  compareMonths: number;
};

export function AverageDailyPopulationStats(props: AverageDailyPopulationStatsProps) {
  const { data, compareMonths } = props;
  const organizedData = useCurrentPopulationGrouped(data, compareMonths);

  const currentMonth = useMemo(() => {
    return new Date(organizedData.Average.lastData.timestamp).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [organizedData]);

  return (
    <Container
      fitHeight
      footer={
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xxs: 6 } },
            { colspan: { default: 12, xxs: 6 } },
          ]}
        >
          <MetricComparison
            header={
              <CenteredSecondaryHeader description="Immigration and Customs Enforcement">
                ICE
              </CenteredSecondaryHeader>
            }
            value={organizedData.ICE.lastData.population}
            unit="people"
            previousValue={organizedData.ICE.compareData.population}
            previousInfo={`in ${compareMonths} months`}
            inverted
            popupSize="large"
            info={`The average number of ICE detainees per day, as of ${currentMonth}.`}
          >
            <AverageDailyPopulationGraph groupedData={organizedData.ICE.groupedData} />
          </MetricComparison>
          <MetricComparison
            header={
              <CenteredSecondaryHeader description="Customs and Border Protection">
                CBP
              </CenteredSecondaryHeader>
            }
            value={organizedData.CBP.lastData.population}
            unit="people"
            previousValue={organizedData.CBP.compareData.population}
            previousInfo={`in ${compareMonths} months`}
            inverted
            popupSize="large"
            info={`The average number of CBP detainees per day, as of ${currentMonth}.`}
          >
            <AverageDailyPopulationGraph groupedData={organizedData.CBP.groupedData} />
          </MetricComparison>
        </Grid>
      }
    >
      <MetricComparison
        header={
          <CenteredHeader description="How many people are detained?">
            Total Daily Population
          </CenteredHeader>
        }
        value={organizedData.Average.lastData.population}
        unit="people"
        previousValue={organizedData.Average.compareData.population}
        previousInfo={`in ${compareMonths} months`}
        inverted
        popupSize="large"
        info={`The average number of detainees per day, as of ${currentMonth}. This includes ICE and CBP detainees.`}
      >
        <AverageDailyPopulationGraph groupedData={organizedData.Average.groupedData} />
      </MetricComparison>
    </Container>
  );
}
