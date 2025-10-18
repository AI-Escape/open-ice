import {
  AppLayout,
  ContentLayout,
  BreadcrumbGroupProps,
  AppLayoutProps,
  Flashbar,
  Button,
  SpaceBetween,
  Box,
  Header,
} from '@cloudscape-design/components';
import { useContext } from 'react';

import { LocalNavigation, Breadcrumbs, NavigationContext } from '../common/navigation';
import InfoFooter from './InfoFooter';
import NewsBanner from './NewsBanner';

export type ViewLayoutProps = {
  header?: React.ReactNode;
  secondaryHeader?: React.ReactNode;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
  children: React.ReactNode;
  contentType?: AppLayoutProps.ContentType;
  navigationHide?: boolean;
  headerVariant?: 'default' | 'high-contrast';
  maxContentWidth?: number;
};

export function ViewLayout(props: ViewLayoutProps) {
  const { navigationSize, navigationOpen, setNavigationOpen } = useContext(NavigationContext);

  return (
    <div>
      <AppLayout
        breadcrumbs={props.breadcrumbs ? <Breadcrumbs items={props.breadcrumbs} /> : undefined}
        className="app-layout"
        headerVariant={props.headerVariant}
        content={
          <ContentLayout
            header={props.header}
            secondaryHeader={props.secondaryHeader}
            headerVariant={props.headerVariant}
          >
            {props.children}
            <InfoFooter />
            {/* a div with like 300 vertical height to add height to site below footer */}
            <div style={{ height: '500px' }} />
          </ContentLayout>
        }
        contentType={props.contentType ?? 'default'}
        headerSelector=".top-navigation"
        navigation={<LocalNavigation />}
        navigationOpen={navigationOpen}
        navigationWidth={navigationSize}
        navigationHide={props.navigationHide}
        toolsHide
        onNavigationChange={(event) => setNavigationOpen(event.detail.open)}
        maxContentWidth={props.maxContentWidth}
        stickyNotifications
        notifications={
          <Flashbar
            items={[
              {
                id: 'funding-lapse',
                type: 'warning',
                dismissible: false,
                header: (
                  "Government Shutdown"
                ),
                content: (
                  <SpaceBetween 
                    direction="vertical"
                    size="xxs"
                  >
                    <Box variant="p" color="inherit">
                      The United States government has shut down due to a funding lapse.
                      As a consequence, ICE has stopped publishing data on detainees. 
                      Until the government reopens and ICE resumes publishing data, statistics on this site will be outdated.
                    </Box>
                    <Box variant="p" color="inherit">
                      ICE last published data on September 25th, 2025.
                      As the month of September was not fully published by ICE, statistics on this site are current through the end of August 2025.
                    </Box>
                    <Button
                      onClick={() => {
                        window.open('https://www.ice.gov/funding-lapse', '_blank');
                      }}
                      
                    >
                      Learn more
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
          />
        }
      />
      <NewsBanner />
    </div>
  );
}
