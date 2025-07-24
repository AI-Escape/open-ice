import { Box, Header } from "@cloudscape-design/components";

export type CenteredSecondaryHeaderProps = {
  description: string;
  children: React.ReactNode;
};

export function CenteredSecondaryHeader(props: CenteredSecondaryHeaderProps) {
  const { description, children } = props;

  return (
    <Header variant="h2">
      <Box
        variant="span"
        color="text-status-info"
        fontSize="heading-l"
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
      <Box
        variant="span"
        color="text-body-secondary"
        fontSize="heading-xs"
        textAlign="center"
      >
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