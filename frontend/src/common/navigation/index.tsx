import { createContext, useContext, useEffect } from 'react';
import SideNavigation, { SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup, {
  BreadcrumbGroupProps,
} from '@cloudscape-design/components/breadcrumb-group';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import { useLocation, useNavigate, useParams } from 'react-router';

export type NavigationContextType = {
  navigationOpen: boolean;
  setNavigationOpen: (value: boolean) => void;
  navigationSize: number;
};

export const NavigationContext = createContext<NavigationContextType>({
  navigationOpen: true,
  navigationSize: 200,
  setNavigationOpen: (_value: boolean) => {
    return;
  },
});

const HOME = { text: 'OpenICE', href: '/' };

export function Breadcrumbs({ items }: { items: BreadcrumbGroupProps.Item[] }) {
  const navigate = useNavigate();

  return (
    <BreadcrumbGroup
      items={[HOME, ...items]}
      onClick={(event) => {
        if (event.detail.external) {
          return;
        }
        event.preventDefault();
        navigate(event.detail.href);
      }}
    />
  );
}

export function LocalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SideNavigation
      activeHref={location.pathname}
      className="side-navigation"
      items={[
        {
          type: 'section-group',
          title: 'Statistics',
          items: [
            {
              type: 'link',
              text: 'Home',
              href: '/',
            },
            // {
            //   type: 'link',
            //   text: 'Detainees',
            //   href: '/detainees',
            // },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section-group',
          title: 'Resources',
          items: [
            {
              type: 'link',
              text: 'Legal (ILRC)',
              href: 'https://www.ilrc.org/',
              external: true,
            },
            {
              type: 'link',
              text: 'Advocacy (NILC)',
              href: 'https://www.nilc.org/resources/',
              external: true,
            },
            {
              type: 'link',
              text: 'Information',
              href: 'https://www.informedimmigrant.com/',
              external: true,
            },
            {
              type: 'link',
              text: 'Education',
              href: 'https://unitedwedream.org/resources/',
              external: true,
            },
          ],
        },
      ]}
      onFollow={(event) => {
        if (event.detail.external) {
          return;
        }
        event.preventDefault();
        navigate(event.detail.href);
      }}
    />
  );
}

export function LocalTopNavigation() {
  const navigate = useNavigate();

  return (
    <TopNavigation
      className="top-navigation"
      identity={{
        title: 'OpenICE',
        href: '/',
        logo: {
          src: 'https://cdn.aiescape.io/open-ice/logo.png',
          alt: 'OpenICE Logo',
        },
        onFollow: (event) => {
          event.preventDefault();
          navigate('/');
        },
      }}
      // search
      // utilities={
      //   user
      //     ? [
      //         {
      //           type: 'button',
      //           text: user.email,
      //           iconName: 'user-profile',
      //         },
      //       ]
      //     : []
      // }
    />
  );
}
