import {
  Container,
  Box,
  Header,
  Button,
  Grid,
  SpaceBetween,
  ProgressBar,
} from '@cloudscape-design/components';

import { ViewLayout } from '../../components/ViewLayout';
import { useNavigate } from 'react-router';
import useWindowDimensions from '../../common/window';
import StatsHeader from '../../components/stats/StatsHeader';
import ChatWidget from '../../components/chat/ChatWidget';

export default function View() {
  const navigate = useNavigate();
  const { width } = useWindowDimensions();

  return (
    <ViewLayout
      breadcrumbs={[{ text: 'Home', href: '' }]}
      headerVariant="high-contrast"
      // maxContentWidth={1200}
    >
      <Grid
        gridDefinition={[
          { colspan: { default: 12, xs: 12 } },
          { colspan: { default: 12, xs: 12 } },
          { colspan: { default: 12, xs: 12 } },
          { colspan: { default: 12, xs: 6 } },
          { colspan: { default: 12, xs: 6 } },
          { colspan: { default: 12, xs: 6 } },
          { colspan: { default: 12, xs: 6 } },
        ]}
      >
        <StatsHeader />
        {/* <SpaceBetween size="m">
          <div className="w-full m-auto max-w-3xl">
            <ProgressBar
              value={50}
              status="in-progress"
              variant="standalone"
              label={<Header variant="h1">Progress</Header>}
              description={<Box variant="p">Description</Box>}
              additionalInfo={<Box variant="p">Additional info</Box>}
            />
          </div>
        </SpaceBetween> */}
        {/* <Container header={<Header variant="h1">OpenICE</Header>}>
          <Box variant="p">...</Box>
        </Container>
        <Container header={<Header variant="h1">About</Header>}>
          <Box variant="p">...</Box>
        </Container>
        <Container header={<Header variant="h1">Data</Header>}>
          <Box variant="p">...</Box>
        </Container>
        <Container header={<Header variant="h1">Info</Header>}>
          <Box variant="p">...</Box>
        </Container> */}
      </Grid>
      <ChatWidget />
    </ViewLayout>
  );
}
