import { Alert, SpaceBetween } from '@cloudscape-design/components';
import { AxiosError } from 'axios';

import { StreamingError } from '../../common/api/errors';

export type ErrorDetails = {
  title: string;
  description: string;
};

export function getErrorDetails(error: Error) {
  let errorTitle = '';
  let errorDescription = '';

  if (error instanceof AxiosError) {
    console.info(error.response);

    if (error.response) {
      if (error.response.statusText) {
        errorTitle = `${error.response.statusText}, error code ${error.response.status}`;
      } else {
        errorTitle = `Error code ${error.response.status}`;
      }

      if (error.response.data?.detail) {
        errorDescription = `${error.response.data.detail}`;
      } else {
        errorDescription = error?.message ?? 'An unknown error occurred';
      }
    } else {
      if (error.code) {
        const codeText = error.code
          .replaceAll('_', ' ')
          .split(' ')
          .filter((word) => word !== 'ERR')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase())
          .join(' ');
        errorDescription = `${codeText}`;
      } else {
        errorDescription = `An unknown error occurred`;
      }
      errorTitle = error.message;
    }
  } else if (error instanceof StreamingError) {
    if (error.statusText) {
      errorTitle = `${error.statusText}, error code ${error.status}`;
    } else {
      errorTitle = `Error code ${error.status}`;
    }

    if (error?.detail) {
      errorDescription = `${error.detail}`;
    } else {
      errorDescription = error?.message ?? 'An unknown error occurred';
    }
  } else {
    errorTitle = 'An error occurred, please try again';
    errorDescription = error?.message ?? 'An unknown error occurred';
  }

  return {
    title: errorTitle,
    description: errorDescription,
  };
}

export type ErrorTurnProps = {
  error: Error;
  retry?: () => void;
  loading?: boolean;
};

export function ErrorTurn(props: ErrorTurnProps) {
  const { error, retry, loading } = props;
  const { title, description } = error ? getErrorDetails(error) : { title: '', description: '' };

  return (
    <Alert
      // TODO add retry option
      // action={
      //   retry && (
      //     <Button disabled={loading} onClick={retry}>
      //       Retry
      //     </Button>
      //   )
      // }
      header={description}
      statusIconAriaLabel="Error"
      type="error"
    >
      <span className="text-s text-gray-400">{title}</span>
    </Alert>
  );
}
