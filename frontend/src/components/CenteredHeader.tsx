import { Box, Header } from "@cloudscape-design/components";

export type CenteredHeaderProps = {
  description: string;
  children: React.ReactNode;
};

export function CenteredHeader(props: CenteredHeaderProps) {
  const { description, children } = props;

  return (
    <Header variant="h1">
      <Box
        variant="span"
        color="text-status-info"
        fontSize="heading-xl"
        textAlign="center"
        fontWeight="bold"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {children}
        </div>
      </Box>
      <Box variant="span" color="text-body-secondary" fontSize="heading-s" textAlign="center">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {description}
        </div>
      </Box>
    </Header>
  );
}