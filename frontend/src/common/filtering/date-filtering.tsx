import {
  PropertyFilterOption,
  PropertyFilterQuery,
  useCollection,
} from '@cloudscape-design/collection-hooks';
import {
  Box,
  Header,
  SpaceBetween,
  Button,
  Table,
  Pagination,
  PropertyFilter,
  DateRangePicker,
  DateRangePickerProps,
  PropertyFilterProps,
} from '@cloudscape-design/components';
import { ReactNode, useEffect } from 'react';

import { checkIsValidRange } from './range';

export type PropertyDateFilterProps = {
  query: PropertyFilterQuery;
  setQuery: (query: PropertyFilterQuery) => void;
  propertyFilteringOptions: PropertyFilterOption[];
  filteringProperties: PropertyFilterProps.FilteringProperty[];
  loading: boolean;
  range: DateRangePickerProps.Value | null;
  setRange: (range: DateRangePickerProps.Value | null) => void;
  skipColumns?: string[];
  past?: boolean;
};

export function PropertyDateFilter(props: PropertyDateFilterProps) {
  const { query, setQuery, propertyFilteringOptions, loading, range, setRange } = props;

  return (
    <SpaceBetween direction="horizontal" size="s">
      <PropertyFilter
        disabled={loading}
        filteringOptions={propertyFilteringOptions}
        filteringProperties={props.filteringProperties.filter(
          (f) => !props.skipColumns?.includes(f.key),
        )}
        query={query}
        onChange={({ detail }) => setQuery(detail)}
      />
      <DateRangePicker
        isValidRange={checkIsValidRange}
        placeholder="Filter by a date and time range"
        i18nStrings={{
          customRelativeRangeOptionDescription: 'Set a custom range in the future',
          formatRelativeRange: (value) =>
            `${props.past ? 'Last' : 'Next'} ${value.amount} ${value.unit}${value.amount > 1 ? 's' : ''}`,
        }}
        relativeOptions={
          props.past
            ? [
                {
                  key: 'last-12-hours',
                  amount: 12,
                  unit: 'hour',
                  type: 'relative',
                },
                {
                  key: 'last-1-day',
                  amount: 1,
                  unit: 'day',
                  type: 'relative',
                },
                {
                  key: 'last-1-week',
                  amount: 1,
                  unit: 'week',
                  type: 'relative',
                },
                {
                  key: 'last-1-month',
                  amount: 1,
                  unit: 'month',
                  type: 'relative',
                },
                {
                  key: 'last-1-year',
                  amount: 1,
                  unit: 'year',
                  type: 'relative',
                },
              ]
            : [
                {
                  key: 'next-12-hours',
                  amount: 12,
                  unit: 'hour',
                  type: 'relative',
                },
                {
                  key: 'next-1-day',
                  amount: 1,
                  unit: 'day',
                  type: 'relative',
                },
                {
                  key: 'next-1-week',
                  amount: 1,
                  unit: 'week',
                  type: 'relative',
                },
                {
                  key: 'next-1-month',
                  amount: 1,
                  unit: 'month',
                  type: 'relative',
                },
                {
                  key: 'next-1-year',
                  amount: 1,
                  unit: 'year',
                  type: 'relative',
                },
              ]
        }
        value={range}
        onChange={({ detail }) => setRange(detail.value)}
        disabled={loading}
      />
    </SpaceBetween>
  );
}
