import { Box, ColumnLayout, Container, Grid, Header } from '@cloudscape-design/components';
import { AverageDailyPopulation } from '../../common/types';
import { useMemo } from 'react';
import { MetricComparison } from './metrics';
import { AverageDailyPopulationGraph } from '../graphs/AverageDailyPopulationGraph';
import { useCurrentPopulationGrouped } from '../../common/hooks/population';

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
              <Header variant="h2">
                <Box
                  variant="span"
                  color="text-status-info"
                  fontSize="heading-l"
                  textAlign="center"
                  fontWeight="bold"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    ICE
                  </div>
                </Box>
                <Box
                  variant="span"
                  color="text-body-secondary"
                  fontSize="heading-xs"
                  textAlign="center"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    Immigration and Customs Enforcement
                  </div>
                </Box>
              </Header>
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
              <Header variant="h2">
                <Box
                  variant="span"
                  color="text-status-info"
                  fontSize="heading-l"
                  textAlign="center"
                  fontWeight="bold"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    CBP
                  </div>
                </Box>
                <Box
                  variant="span"
                  color="text-body-secondary"
                  fontSize="heading-xs"
                  textAlign="center"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    Customs and Border Protection
                  </div>
                </Box>
              </Header>
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
          <Header variant="h1">
            <Box
              variant="span"
              color="text-status-info"
              fontSize="heading-xl"
              textAlign="center"
              fontWeight="bold"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                Total Daily Population
              </div>
            </Box>
            <Box variant="span" color="text-body-secondary" fontSize="heading-s" textAlign="center">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                How many people are detained?
              </div>
            </Box>
          </Header>
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
