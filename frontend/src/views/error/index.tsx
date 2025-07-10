import { Container, Box, Header, Link } from '@cloudscape-design/components';
import { useNavigate } from 'react-router';

import { ViewLayout } from '../../components/ViewLayout';

export default function View() {
  const navigate = useNavigate();

  return (
    <ViewLayout
      breadcrumbs={[{ text: 'Error', href: '' }]}
      header={<Header variant="h1">404 Not Found</Header>}
    >
      <Container header={<Header variant="h2">Oops! We've Hit a Dead End</Header>}>
        <Box variant="p">
          The page you are looking for does not exist. Please check the URL or go back to the home
          page.
        </Box>
        <Link
          href="/"
          variant="secondary"
          onFollow={(event) => {
            event.preventDefault();
            navigate('/');
          }}
        >
          Back to Home
        </Link>
      </Container>
    </ViewLayout>
  );
}
