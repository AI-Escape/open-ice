import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { BrowserRouter, useLocation } from 'react-router';
import enMessages from '@cloudscape-design/components/i18n/messages/all.en';
import { I18nProvider } from '@cloudscape-design/components/i18n';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import queryString from 'query-string';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { ErrorBoundary } from 'react-error-boundary';

import { Route, Routes } from 'react-router';
import { useEffect, useMemo, useState } from 'react';

import { LocalTopNavigation, NavigationContext } from './common/navigation';

import HomePage from './views/home';
import ErrorPage from './views/error';
import '@cloudscape-design/global-styles/index.css';
import './global.css';
import { getErrorDetails } from './components/Loading';

function NavRoutes() {
  const { pathname, hash, key, search } = useLocation();

  useEffect(() => {
    if (hash !== '') {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } else if (!search) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key]); // do this on route change

  return (
    <>
      <LocalTopNavigation />
      <ErrorBoundary
        // TODO can use FallbackComponent for more info to display on page
        fallback={<ErrorPage />}
        onError={(error) => {
          const { title, description } = getErrorDetails(error);
          posthog.captureException(error, { title, description });
        }}
      >
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<ErrorPage />} path="*" />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

function AppWithUserContext() {
  const { innerWidth: width } = window;
  const navigationSize = 200;

  const [navigationOpen, setNavigationOpen] = useState(width > 688);

  const asyncStoragePersister = useMemo(() => {
    return createAsyncStoragePersister({
      storage: window.localStorage,
    });
  }, []);

  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 24 * 60 * 60 * 1000, // 24 h
          gcTime: 1000 * 60 * 60 * 25, // 25 hours (1 hour longer)
        },
      },
      queryCache: new QueryCache({
        onError: async (error, query) => {
          const { title, description } = getErrorDetails(error);
          posthog.captureException(error, { title, description, queryKey: `${query.queryKey}` });
        },
      }),
      mutationCache: new MutationCache({
        onError: async (error) => {
          const { title, description } = getErrorDetails(error);
          posthog.captureException(error, { title, description });
        },
      }),
    });
  }, []);

  return (
    <PostHogProvider
      apiKey="phc_jk60guHTFOvvO6sYMsX9B4kMiHDSgah3YdlkNB2Uwqn"
      options={{
        api_host: 'https://ph.openice.org',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
        autocapture: process.env.ENVIRONMENT != 'development',
        loaded: (ph) => {
          if (process.env.ENVIRONMENT == 'development') {
            ph.opt_out_capturing(); // opts a user out of event capture
            ph.set_config({ disable_session_recording: true });
          }
        },
      }}
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <NavigationContext.Provider value={{ navigationOpen, setNavigationOpen, navigationSize }}>
          <NavRoutes />
        </NavigationContext.Provider>
      </PersistQueryClientProvider>
    </PostHogProvider>
  );
}

function App() {
  // useEffect(() => {
  //   applyMode(Mode.Dark);
  // }, []);
  return (
    <BrowserRouter>
      <QueryParamProvider
        adapter={ReactRouter6Adapter}
        options={{
          searchStringToObject: queryString.parse,
          objectToSearchString: queryString.stringify,
          removeDefaultsFromUrl: true,
        }}
      >
        <I18nProvider locale="en" messages={[enMessages]}>
          <AppWithUserContext />
        </I18nProvider>
      </QueryParamProvider>
    </BrowserRouter>
  );
}

export default App;
