import { Box, ColumnLayout, Container, Grid, Header } from '@cloudscape-design/components';
import { AverageDailyPopulation, AverageStayLength } from '../../common/types';
import { useMemo } from 'react';
import { MetricComparison } from './metrics';
import { AverageStayLengthGraph } from '../graphs/AverageStayLengthGraph';
import { useCurrentStayLengthGrouped } from '../../common/hooks/stay';

export type AverageStayLengthStatsProps = {
  data: AverageStayLength[];
  compareMonths: number;
};

export function AverageStayLengthStats(props: AverageStayLengthStatsProps) {
  const { data, compareMonths } = props;
  const organizedData = useCurrentStayLengthGrouped(data, compareMonths);

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
            formatter={(x) => {
              return x.toFixed(1);
            }}
            unit="days"
            value={organizedData.ICE.lastData.length_of_stay}
            previousValue={organizedData.ICE.compareData.length_of_stay}
            previousInfo={`in ${compareMonths} months`}
            inverted
            popupSize="large"
            info={`The average length of stay for ICE detainees, as of ${currentMonth}.`}
          >
            <AverageStayLengthGraph groupedData={organizedData.ICE.groupedData} />
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
            formatter={(x) => {
              return x.toFixed(1);
            }}
            unit="days"
            value={organizedData.CBP.lastData.length_of_stay}
            previousValue={organizedData.CBP.compareData.length_of_stay}
            previousInfo={`in ${compareMonths} months`}
            inverted
            popupSize="large"
            info={`The average length of stay for CBP detainees, as of ${currentMonth}.`}
          >
            <AverageStayLengthGraph groupedData={organizedData.CBP.groupedData} />
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
                Average Detainment Period
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
                How long are people being detained?
              </div>
            </Box>
          </Header>
        }
        formatter={(x) => {
          return x.toFixed(1);
        }}
        unit="days"
        value={organizedData.Average.lastData.length_of_stay}
        previousValue={organizedData.Average.compareData.length_of_stay}
        previousInfo={`in ${compareMonths} months`}
        inverted
        popupSize="large"
        info={`The average length of stay for detainees, as of ${currentMonth}. This includes ICE and CBP detainees.`}
      >
        <AverageStayLengthGraph groupedData={organizedData.Average.groupedData} />
      </MetricComparison>
    </Container>
  );
}
