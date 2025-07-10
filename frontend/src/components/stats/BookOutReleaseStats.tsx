import {
  Box,
  ColumnLayout,
  Container,
  Grid,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { BookOutRelease } from '../../common/types';
import { useMemo } from 'react';
import { MetricComparison } from './metrics';
import { BookOutReleaseGraph } from '../graphs/BookOutReleaseGraph';
import { useCurrentReleaseGrouped } from '../../common/hooks/release';

export type BookOutReleaseStatsProps = {
  data: BookOutRelease[];
  compareMonths: number;
};

export function BookOutReleaseStats(props: BookOutReleaseStatsProps) {
  const { data, compareMonths } = props;
  const organizedData = useCurrentReleaseGrouped(data, compareMonths);

  const currentMonth = useMemo(() => {
    return new Date(organizedData['Total'].lastData.timestamp).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [organizedData]);

  return (
    <SpaceBetween direction="vertical" size="m">
      <Header variant="h1" description="How are detainees being released?">
        <Box
          variant="span"
          color="text-status-info"
          fontSize="heading-xl"
          textAlign="center"
          fontWeight="bold"
        >
          <div>Release of Detainees</div>
        </Box>
      </Header>
      <BookOutReleaseGraph groupedData={organizedData} />
    </SpaceBetween>
  );
}
