import {
  Box,
  ColumnLayout,
  Container,
  Grid,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import useCurrentPopulation from '../../common/hooks/population';
import useCurrentStayLength from '../../common/hooks/stay';
import { LoadingOrError } from '../Loading';
import { AverageDailyPopulationStats } from './AverageDailyPopulationStats';
import { AverageStayLengthStats } from './AverageStayLengthStats';
import { AverageDailyPopulationPieChart } from '../graphs/AverageDailyPopulationPieChart';
import useCurrentRelease from '../../common/hooks/release';
import useCurrentProcessingDisposition from '../../common/hooks/disposition';
import { DetaineeCriminalityStats } from './DetaineeCriminalityStats';
import { ProcessingDispositionStats } from './ProcessingDispositionStats';
import { BookOutReleaseStats } from './BookOutReleaseStats';
import useCurrentBooking from '../../common/hooks/booking';
import { BookInStats } from './BookInStats';
import { EconomicImpactStats } from './EconomicImpactStats';

export default function StatsHeader() {
  const popQuery = useCurrentPopulation();
  const stayQuery = useCurrentStayLength();
  const releaseQuery = useCurrentRelease();
  const bookingQuery = useCurrentBooking();
  const dispositionQuery = useCurrentProcessingDisposition();

  const loading =
    popQuery.isLoading ||
    popQuery.isPending ||
    stayQuery.isLoading ||
    stayQuery.isPending ||
    releaseQuery.isLoading ||
    releaseQuery.isPending ||
    dispositionQuery.isLoading ||
    dispositionQuery.isPending ||
    bookingQuery.isLoading ||
    bookingQuery.isPending;
  const error =
    popQuery.error ||
    stayQuery.error ||
    releaseQuery.error ||
    dispositionQuery.error ||
    bookingQuery.error ||
    bookingQuery.error;
  const compareMonths = 6;

  return (
    <SpaceBetween direction="vertical" size="m">
      {loading ||
      error ||
      !(popQuery.data || stayQuery.data || releaseQuery.data || dispositionQuery.data) ? (
        error ? (
          <LoadingOrError
            loading={loading}
            error={error}
            retry={() => {
              popQuery.refetch();
              stayQuery.refetch();
              releaseQuery.refetch();
              dispositionQuery.refetch();
              bookingQuery.refetch();
              dispositionQuery.refetch();
            }}
          />
        ) : (
          <div />
        )
      ) : (
        <Grid
          gridDefinition={[
            { colspan: { default: 12, s: 6 } },
            { colspan: { default: 12, s: 6 } },
            { colspan: { default: 12, s: 12 } },
            { colspan: { default: 12, s: 6 } },
            { colspan: { default: 12, s: 6 } },
            { colspan: { default: 12, s: 12 } },
          ]}
        >
          <SpaceBetween direction="vertical" size="m">
            <AverageDailyPopulationStats data={popQuery.data} compareMonths={compareMonths} />
            <AverageStayLengthStats data={stayQuery.data} compareMonths={compareMonths} />
          </SpaceBetween>

          <DetaineeCriminalityStats data={popQuery.data} compareMonths={compareMonths} />
          <BookInStats data={bookingQuery.data} compareMonths={compareMonths} />
          <EconomicImpactStats
            data={stayQuery.data}
            popData={popQuery.data}
            compareMonths={compareMonths}
          />
          <ProcessingDispositionStats data={dispositionQuery.data} />
          <BookOutReleaseStats data={releaseQuery.data} compareMonths={compareMonths} />
        </Grid>
      )}
    </SpaceBetween>
  );
}
