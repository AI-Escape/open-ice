import { Box, Container, Header } from '@cloudscape-design/components';
import { AverageDailyPopulationPieChart } from '../graphs/AverageDailyPopulationPieChart';
import { AverageDailyPopulation } from '../../common/types';
import MajorHeader from '../MajorHeader';

export type DetaineeCriminalityStatsProps = {
  data: AverageDailyPopulation[];
  compareMonths: number;
};

export function DetaineeCriminalityStats(props: DetaineeCriminalityStatsProps) {
  const { data, compareMonths } = props;

  return (
    <Container
      header={
        <MajorHeader description="Who is being detained?">
          Detainee Characteristics
        </MajorHeader>
      }
      fitHeight
    >
      <AverageDailyPopulationPieChart data={data} compareMonths={compareMonths} />
    </Container>
  );
}
