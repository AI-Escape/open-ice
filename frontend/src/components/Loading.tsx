import {
  Alert,
  Box,
  Button,
  Container,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import { AxiosError } from 'axios';

export type ErrorDetails = {
  title: string;
  description: string;
};

export function getErrorDetails(error: Error) {
  let errorTitle = '';
  let errorDescription = '';

  if (error instanceof AxiosError && error.response) {
    errorTitle = `${error.response.status} ${error.response.statusText}`;
    if (error.response.data?.detail) {
      errorDescription = `${error.response.data.detail}`;
    } else {
      errorDescription = error?.message ?? 'An unknown error occurred';
    }
  } else {
    errorTitle = 'An error occurred';
    errorDescription = error?.message ?? 'An unknown error occurred';
  }
  return {
    title: errorTitle,
    description: errorDescription,
  };
}

export type LoadingOrErrorProps = {
  loading?: boolean;
  retry?: () => void;
  error?: Error | null;
};

export function LoadingOrError(props: LoadingOrErrorProps) {
  const { loading, retry, error } = props;

  const content = (
    <Box textAlign="center">
      {!error ? (
        <Box variant="h4">Loading...</Box>
      ) : (
        <Box variant="h4">
          <br />
        </Box>
      )}
      <Spinner size="large" variant={error ? 'inverted' : 'normal'} />
    </Box>
  );
  const { title, description } = error ? getErrorDetails(error) : { title: '', description: '' };

  return (
    <SpaceBetween direction="vertical" size="s">
      {error ? (
        <Alert
          action={
            retry ? (
              <Button disabled={loading} onClick={retry}>
                Retry
              </Button>
            ) : undefined
          }
          header={title}
          statusIconAriaLabel="Error"
          type="error"
        >
          {description}
        </Alert>
      ) : (
        content
      )}
    </SpaceBetween>
  );
}

export type ResourceErrorProps = {
  error: Error;
  refetch: () => void;
  resourceName: string;
};

export function ResourceError(props: ResourceErrorProps) {
  const { error, refetch, resourceName } = props;
  const { title, description } = getErrorDetails(error);

  return (
    <SpaceBetween size="xxs">
      <div>
        <b>Error retrieving {resourceName.toLowerCase()}</b>
        <Box color="inherit" variant="p">
          {title}
        </Box>
        <Box color="inherit" variant="small">
          {description}
        </Box>
      </div>
      <Button onClick={() => refetch()}>Retry</Button>
    </SpaceBetween>
  );
}
