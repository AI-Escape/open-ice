import {
  AppLayout,
  ContentLayout,
  BreadcrumbGroupProps,
  AppLayoutProps,
  Flashbar,
  Box,
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
                id: 'missing-september-data',
                type: 'warning',
                dismissible: true,
                header: (
                  <Box fontSize="heading-m" fontWeight="bold">
                    Missing Data for September 2025
                  </Box>
                ),
                content: (
                  <Box variant="p" color="inherit">
                    Due to the government shutdown in late September 2025, ICE never published
                    data for the second half of that month. As a result, September 2025 is not
                    included in the statistics on this site since we only have partial data for
                    that period.
                  </Box>
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
