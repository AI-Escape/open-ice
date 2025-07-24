import { Box, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import { ProcessingDisposition } from '../../common/types';
import { ProcessingDescriptionBarChart } from '../graphs/ProcessingDescriptionBarChart';
import MajorHeader from '../MajorHeader';

export type ProcessingDispositionStatsProps = {
  data: ProcessingDisposition[];
};

export function ProcessingDispositionStats(props: ProcessingDispositionStatsProps) {
  const { data } = props;

  return (
    <Container
      header={
        <MajorHeader description="How are detainees being processed?">
          Detainee Processing Methods
        </MajorHeader>
      }
      fitHeight
    >
      <ProcessingDescriptionBarChart data={data} />
    </Container>
  );
}
