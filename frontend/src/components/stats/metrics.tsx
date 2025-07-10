import {
  Box,
  Button,
  Container,
  DatePicker,
  FormField,
  Grid,
  Header,
  KeyValuePairs,
  Link,
  Modal,
  PieChart,
  Popover,
  Select,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import { useState } from 'react';

import { CenteredHeader, ValueComparison } from './reporting';

export type MetricComparisonProps = {
  header: React.ReactNode;
  value: number | undefined;
  previousValue?: number;
  previousInfo?: string;
  loading?: boolean;
  error?: Error | null;
  formatter?: (x: number) => string;
  inverted?: boolean;
  unit?: string;
  variant?: 'percentage' | 'difference';
  insideContainer?: boolean;
  link?: string;
  info?: string;
  children?: React.ReactNode;
  popupSize?: 'small' | 'medium' | 'large' | 'max';
};

export function MetricComparison(props: MetricComparisonProps) {
  const [open, setOpen] = useState(false);

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
          previousInfo={props.previousInfo}
          value={props.value}
          variant={props.variant}
          unit={props.unit}
        />
      ) : props.value ? (
        formatter(props.value)
      ) : (
        '-'
      )}
    </Box>
  );
  const modal = !props.loading && props.value !== undefined && (
    <Modal
      closeAriaLabel="Close"
      header={props.header}
      visible={open}
      onDismiss={() => setOpen(false)}
      size={props.popupSize}
    >
      <SpaceBetween direction="vertical" size="xs">
        {props.info && <Box variant="p">{props.info}</Box>}
        <hr />
        {props.children}
      </SpaceBetween>
    </Modal>
  );

  return (
    <>
      <Button
        className="dashboard-metric"
        disabled={props.loading}
        variant="link"
        fullWidth
        onClick={() => {
          setOpen(true);
        }}
      >
        <SpaceBetween direction="vertical" size="xxxs">
          <CenteredHeader>{props.header}</CenteredHeader>
          {content}
        </SpaceBetween>
      </Button>
      {modal}
    </>
  );
}
