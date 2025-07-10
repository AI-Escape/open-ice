import { Alert, Button } from '@cloudscape-design/components';
import { getErrorDetails } from './Loading';

export type ErrorMessageProps = {
  error: Error;
  retry?: () => void;
  loading?: boolean;
};

export function ErrorMessage(props: ErrorMessageProps) {
  const { error, retry, loading } = props;
  const { title, description } = error ? getErrorDetails(error) : { title: '', description: '' };

  return (
    <Alert
      action={
        retry && (
          <Button loading={loading} onClick={retry}>
            Retry
          </Button>
        )
      }
      header={description}
      statusIconAriaLabel="Error"
      type="error"
    >
      {title}
    </Alert>
  );
}
