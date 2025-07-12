import {
  AppLayout,
  ContentLayout,
  BreadcrumbGroupProps,
  AppLayoutProps,
} from '@cloudscape-design/components';
import { useContext } from 'react';

import { LocalNavigation, Breadcrumbs, NavigationContext } from '../common/navigation';
import Footer from './Footer';

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
            <Footer />
            {/* a div with like 300 vertical height to add height to site below footer */}
            <div style={{ height: '1000px' }}></div>
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
      />
    </div>
  );
}
