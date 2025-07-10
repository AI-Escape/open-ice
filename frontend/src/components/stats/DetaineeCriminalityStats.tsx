import { Box, Container, Header } from '@cloudscape-design/components';
import { AverageDailyPopulationPieChart } from '../graphs/AverageDailyPopulationPieChart';
import { AverageDailyPopulation } from '../../common/types';

export type DetaineeCriminalityStatsProps = {
  data: AverageDailyPopulation[];
  compareMonths: number;
};

export function DetaineeCriminalityStats(props: DetaineeCriminalityStatsProps) {
  const { data, compareMonths } = props;

  return (
    <Container
      header={
        <Header variant="h1" description="Who is being detained?">
          <Box
            variant="span"
            color="text-status-info"
            fontSize="heading-xl"
            textAlign="center"
            fontWeight="bold"
          >
            <div>Detainee Criminal Status</div>
          </Box>
        </Header>
      }
      fitHeight
    >
      <AverageDailyPopulationPieChart data={data} compareMonths={compareMonths} />
    </Container>
  );
}
