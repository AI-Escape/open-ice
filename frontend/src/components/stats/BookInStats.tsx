import { Box, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import { BookIn } from '../../common/types';
import { BookInGraph } from '../graphs/BookInGraph';
import { useCurrentBookingGrouped } from '../../common/hooks/booking';

export type BookInStatsProps = {
  data: BookIn[];
  compareMonths: number;
};

export function BookInStats(props: BookInStatsProps) {
  const { data, compareMonths } = props;

  const organizedData = useCurrentBookingGrouped(data, compareMonths);

  return (
    <SpaceBetween direction="vertical" size="m">
      <Header variant="h1" description="How many people are being arrested?">
        <Box
          variant="span"
          color="text-status-info"
          fontSize="heading-xl"
          textAlign="center"
          fontWeight="bold"
        >
          <div>Arrests by Agency</div>
        </Box>
      </Header>
      <BookInGraph groupedData={organizedData} />
    </SpaceBetween>
  );
}
