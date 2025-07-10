import {
  Box,
  Button,
  Container,
  Icon,
  Link,
  Popover,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';

export type ValueComparisonProps = {
  value: number;
  previousValue: number;
  previousInfo?: string;
  formatter?: (x: number) => string;
  inverted?: boolean;
  variant?: 'percentage' | 'difference';
  unit?: string;
};

export function ValueComparison(props: ValueComparisonProps) {
  const formatter = props.formatter || ((x: number) => Math.round(x).toLocaleString());
  const diff = props.value - props.previousValue;
  const diffPercentage = props.previousValue === 0 ? 0 : (diff / props.previousValue) * 100;
  const goodColor = props.inverted ? 'text-status-error' : 'text-status-warning';
  const badColor = props.inverted ? 'text-status-warning' : 'text-status-error';
  const diffColor = diff > 0 ? goodColor : diff < 0 ? badColor : 'text-status-inactive';
  const diffPercentageColor =
    diffPercentage > 0 ? goodColor : diffPercentage < 0 ? badColor : 'text-status-inactive';

  const comparisonContent =
    props.variant === 'difference' ? (
      <Box color={diffColor} textAlign="center" variant="h4">
        {diff >= 0 ? '+' : ''}
        {formatter(diff)}
        {props.unit ? ` ${props.unit}` : undefined}
        {props.previousInfo && (
          <Box color="text-status-inactive" variant="span">
            {` ${props.previousInfo}`}
          </Box>
        )}
      </Box>
    ) : (
      <Box color={diffPercentageColor} textAlign="center" variant="h4">
        {diffPercentage >= 0 ? '+' : ''}
        {diffPercentage.toFixed(1)}%
        {props.previousInfo && (
          <Box color="text-status-inactive" variant="span">
            {` ${props.previousInfo}`}
          </Box>
        )}
      </Box>
    );

  return (
    <SpaceBetween direction="vertical" size="xxxs">
      <Box textAlign="center" variant="h3">
        {formatter(props.value)}
        {props.unit ? ` ${props.unit}` : undefined}
      </Box>
      {/* <Box variant='small' textAlign='center' color={diffColor}>{diff >= 0 ? '+' : ''}{formatter(diff)}</Box> */}
      {comparisonContent}
    </SpaceBetween>
  );
}

export type TextComparisonProps = {
  value: string;
  previousValue: string;
};

export function TextComparison(props: TextComparisonProps) {
  const comparisonContent = (
    <Box textAlign="center" variant="h4">
      {props.previousValue}
    </Box>
  );

  return (
    <SpaceBetween direction="vertical" size="xxxs">
      <Box textAlign="center" variant="h3">
        {props.value}
      </Box>
      {props.previousValue ? comparisonContent : null}
    </SpaceBetween>
  );
}

export type CenteredComparisonProps = {
  children: React.ReactNode;
  value: number | undefined;
  previousValue?: number;
  loading?: boolean;
  error?: string;
  formatter?: (x: number) => string;
  description?: React.ReactNode;
  inverted?: boolean;
  variant?: 'percentage' | 'difference';
  insideContainer?: boolean;
  link?: string;
  info?: string;
};

export function CenteredComparison(props: CenteredComparisonProps) {
  const formatter = props.formatter || ((x: number) => Math.round(x).toLocaleString());
  const content = (
    <Box textAlign="center" variant="div">
      {props.loading ? (
        <Spinner />
      ) : props.error ? (
        '-'
      ) : props.previousValue !== undefined && props.value !== undefined ? (
        <ValueComparison
          formatter={formatter}
          inverted={props.inverted}
          previousValue={props.previousValue}
          value={props.value}
          variant={props.variant}
        />
      ) : props.value ? (
        formatter(props.value)
      ) : (
        '-'
      )}
    </Box>
  );

  return props.insideContainer ? (
    <SpaceBetween direction="vertical" size="xxxs">
      <CenteredHeader description={props.description} info={props.info} link={props.link}>
        {props.children}
      </CenteredHeader>
      {content}
    </SpaceBetween>
  ) : (
    <Container
      header={
        <CenteredHeader description={props.description} info={props.info} link={props.link}>
          {props.children}
        </CenteredHeader>
      }
      fitHeight
    >
      {content}
    </Container>
  );
}

export type CenteredTextComparisonProps = {
  children: React.ReactNode;
  value: string | undefined;
  previousValue?: string;
  loading?: boolean;
  error?: string;
  description?: React.ReactNode;
  insideContainer?: boolean;
};

export function CenteredTextComparison(props: CenteredTextComparisonProps) {
  return props.insideContainer ? (
    <SpaceBetween direction="vertical" size="xxxs">
      <CenteredHeader description={props.description}>{props.children}</CenteredHeader>
      <Box textAlign="center" variant="h3">
        {props.loading ? (
          <Spinner />
        ) : props.error ? (
          '-'
        ) : props.previousValue && props.value ? (
          <TextComparison previousValue={props.previousValue} value={props.value} />
        ) : props.value ? (
          props.value
        ) : (
          '-'
        )}
      </Box>
    </SpaceBetween>
  ) : (
    <Container
      header={<CenteredHeader description={props.description}>{props.children}</CenteredHeader>}
      fitHeight
    >
      <Box textAlign="center" variant="h3">
        {props.loading ? (
          <Spinner />
        ) : props.error ? (
          '-'
        ) : props.previousValue && props.value ? (
          <TextComparison previousValue={props.previousValue} value={props.value} />
        ) : props.value ? (
          props.value
        ) : (
          '-'
        )}
      </Box>
    </Container>
  );
}

export type CenteredHeaderProps = {
  children: React.ReactNode;
  description?: React.ReactNode;
  link?: string;
  info?: string;
};

export function CenteredHeader(props: CenteredHeaderProps) {
  const header = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h2
        style={{
          margin: '2px',
        }}
      >
        {props.children} {props.link ? <Link href={props.link} target="_blank" external /> : null}
      </h2>
      {props.info && (
        <Popover content={props.info} triggerType="custom">
          <Button iconName="status-info" variant="icon" />
        </Popover>
      )}
    </div>
  );

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '0px',
        margin: '0px',
      }}
    >
      {header}
    </div>
  );
}
