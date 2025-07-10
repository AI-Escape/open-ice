import { Box, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import { ProcessingDisposition } from '../../common/types';
import { ProcessingDescriptionBarChart } from '../graphs/ProcessingDescriptionBarChart';

export type ProcessingDispositionStatsProps = {
  data: ProcessingDisposition[];
};

export function ProcessingDispositionStats(props: ProcessingDispositionStatsProps) {
  const { data } = props;

  return (
    <Container
      header={
        <Header variant="h1" description="How are detainees being processed?">
          <Box
            variant="span"
            color="text-status-info"
            fontSize="heading-xl"
            textAlign="center"
            fontWeight="bold"
          >
            <div>Detainee Processing Methods</div>
          </Box>
        </Header>
      }
      fitHeight
    >
      <ProcessingDescriptionBarChart data={data} />
    </Container>
  );
}
