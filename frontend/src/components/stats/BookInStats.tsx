import { Box, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import { BookIn } from '../../common/types';
import { BookInGraph } from '../graphs/BookInGraph';
import { useCurrentBookingGrouped } from '../../common/hooks/booking';
import MajorHeader from '../MajorHeader';

export type BookInStatsProps = {
  data: BookIn[];
  compareMonths: number;
};

export function BookInStats(props: BookInStatsProps) {
  const { data, compareMonths } = props;

  const organizedData = useCurrentBookingGrouped(data, compareMonths);

  return (
    <SpaceBetween direction="vertical" size="m">
      <MajorHeader description="How many people are being arrested?">
        Arrests by Agency
      </MajorHeader>
      <BookInGraph groupedData={organizedData} />
    </SpaceBetween>
  );
}
