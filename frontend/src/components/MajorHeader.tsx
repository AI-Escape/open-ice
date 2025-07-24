import { Box, Header } from "@cloudscape-design/components";

export type MajorHeaderProps = {
  description: string;
  children: React.ReactNode;
};

export default function MajorHeader(props: MajorHeaderProps) {
  const { description, children } = props;
  return (
    <Header variant="h1" description={description}>
          <Box
            variant="span"
            color="text-status-info"
            fontSize="heading-xl"
            textAlign="center"
            fontWeight="bold"
          >
        <div>{children}</div>
    </Box>
  </Header>
  );
}