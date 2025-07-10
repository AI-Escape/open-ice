import { PropertyFilterQuery, PropertyFilterToken } from '@cloudscape-design/collection-hooks';
import { DateRangePickerProps } from '@cloudscape-design/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrayParam,
  NumberParam,
  StringParam,
  useQueryParam,
  useQueryParams,
  withDefault,
} from 'use-query-params';

export const TEXT_FILTER_OPERATORS = ['=', '!=', ':', '!:'];
export const NUMBER_FILTER_OPERATORS = ['=', '!=', '>', '>=', '<', '<='];
export const EXACT_FILTER_OPERATORS = ['=', '!='];

function filterOperator(a: boolean, b: boolean, operator: 'and' | 'or') {
  return operator === 'and' ? a && b : a || b;
}

export function filterTextMatch(token: PropertyFilterToken, value: string) {
  switch (token.operator) {
    case '=':
      return value === token.value;
    case '!=':
      return value !== token.value;
    default:
      console.warn(`Unknown operator: ${token.operator}`);

      return false;
  }
}

export function filterText(token: PropertyFilterToken, value: string) {
  if (token.operator === '=') {
    return value.toLowerCase() === token.value.toLowerCase();
  } else if (token.operator === '!=') {
    return value.toLowerCase() !== token.value.toLowerCase();
  } else if (token.operator === ':') {
    return value.toLowerCase().includes(token.value.toLowerCase());
  } else if (token.operator === '!:') {
    return !value.toLowerCase().includes(token.value.toLowerCase());
  }
  console.warn(`Unknown operator: ${token.operator}`);

  return false;
}

export function filterNumber(token: PropertyFilterToken, value: number) {
  switch (token.operator) {
    case '=':
      return value === Number(token.value);
    case '!=':
      return value !== Number(token.value);
    case '>':
      return value > Number(token.value);
    case '>=':
      return value >= Number(token.value);
    case '<':
      return value < Number(token.value);
    case '<=':
      return value <= Number(token.value);
    default:
      console.warn(`Unknown operator: ${token.operator}`);

      return false;
  }
}
export function filterPercentage(token: PropertyFilterToken, value: number) {
  const percentage = Number(token.value.replace('%', ''));

  switch (token.operator) {
    case '=':
      return value === percentage;
    case '!=':
      return value !== percentage;
    case '>':
      return value > percentage;
    case '>=':
      return value >= percentage;
    case '<':
      return value < percentage;
    case '<=':
      return value <= percentage;
    default:
      console.warn(`Unknown operator: ${token.operator}`);

      return false;
  }
}

export function filterPercentageOrNumber(
  token: PropertyFilterToken,
  value: number | undefined,
  total: number,
) {
  if (value === undefined) {
    return token.value === '?' && token.operator === '=';
  }

  if (token.value.includes('%')) {
    return filterPercentage(token, (100 * value) / total);
  }

  return filterNumber(token, value);
}

export function filterCurrency(token: PropertyFilterToken, value: number) {
  const tokenValue = parseFloat(
    token.value.replace('$', '').replace('USD', '').replace(' ', '').replace(',', ''),
  );

  switch (token.operator) {
    case '=':
      return value === tokenValue;
    case '!=':
      return value !== tokenValue;
    case '>':
      return value > tokenValue;
    case '>=':
      return value >= tokenValue;
    case '<':
      return value < tokenValue;
    case '<=':
      return value <= tokenValue;
    default:
      console.warn(`Unknown operator: ${token.operator}`);

      return false;
  }
}

export function filterDuration(token: PropertyFilterToken, value: number) {
  const tokenValue = reverseDurationString(token.value);

  switch (token.operator) {
    case '=':
      return value === tokenValue;
    case '!=':
      return value !== tokenValue;
    case '>':
      return value > tokenValue;
    case '>=':
      return value >= tokenValue;
    case '<':
      return value < tokenValue;
    case '<=':
      return value <= tokenValue;
    default:
      console.warn(`Unknown operator: ${token.operator}`);

      return false;
  }
}

export type FilterFunction<T> = (token: PropertyFilterToken, item: T) => boolean;
export type FilterConfig<T> = {
  propertyKey: string;
  func: FilterFunction<T>;
};

export type RangeFilterFunction<T> = (item: T) => Date;

export function rangeStartEnd(range: DateRangePickerProps.Value, now = new Date()) {
  let start: Date | null = null;
  let end: Date | null = null;

  if (range.type === 'relative') {
    const absolute = relativeToAbsoluteRange(range, range.key?.startsWith('next') ?? false, now);
    // In ISO8601 format, so convert to Date
    start = new Date(absolute.startDate);
    end = new Date(absolute.endDate);
  } else {
    start = new Date(range.startDate);
    end = new Date(range.endDate);
  }

  return { start, end };
}

export function createFilter<T>(query: PropertyFilterQuery, config: FilterConfig<T>[]) {
  function filterItems(item: T) {
    let matches = query.operation === 'and';

    // create lookup table for property keys
    const propertyLookup = new Map<string, FilterFunction<T>>();

    for (const filter of config) {
      propertyLookup.set(filter.propertyKey, filter.func);
    }

    for (const token of query.tokens) {
      const func = propertyLookup.get(token.propertyKey!);

      if (func) {
        matches = filterOperator(matches, func(token, item), query.operation);
      } else {
        console.warn(`No filter function found for property key: ${token.propertyKey}`);
      }
    }

    return matches;
  }

  return filterItems;
}

const OpParam = withDefault(StringParam, 'and');
const OParam = withDefault(ArrayParam, []);
const KParam = withDefault(ArrayParam, []);
const VParam = withDefault(ArrayParam, []);

export function useUrlFilterState() {
  const [urlQuery, urlSetQuery] = useQueryParams({
    op: OpParam,
    o: OParam,
    k: KParam,
    v: VParam,
  });

  const query: PropertyFilterQuery = useMemo(() => {
    const operators = urlQuery.o;
    const propertyKeys = urlQuery.k;
    const values = urlQuery.v;

    // console.log('operators', operators);

    if (operators.length !== propertyKeys.length || propertyKeys.length !== values.length) {
      return {
        operation: 'and',
        tokens: [],
      };
    }

    const tokens: PropertyFilterToken[] = [];

    for (let i = 0; i < operators.length; i++) {
      const operator = operators[i];
      const propertyKey = propertyKeys[i];
      const value = values[i];

      if (
        typeof operator !== 'string' ||
        typeof propertyKey !== 'string' ||
        typeof value !== 'string'
      ) {
        continue;
      }
      tokens.push({
        operator,
        propertyKey,
        value,
      });
    }

    return {
      operation: urlQuery.op === 'or' ? 'or' : 'and',
      tokens,
    };
  }, [urlQuery]);
  const setQuery = useCallback(
    (query: PropertyFilterQuery) => {
      const operators = query.tokens.map((token) => token.operator);
      // assume all property keys and values are strings
      const propertyKeys = query.tokens.map((token) => token.propertyKey as string);
      const values = query.tokens.map((token) => token.value as string);
      urlSetQuery({
        op: query.operation === 'or' ? 'or' : undefined,
        o: operators,
        k: propertyKeys,
        v: values,
      });
    },
    [urlSetQuery],
  );

  return { query, setQuery };
}

const KeyParamFuture = withDefault(StringParam, 'next-1-month');
const KeyParamPast = withDefault(StringParam, 'last-1-year');
const AmountParam = withDefault(NumberParam, 1);
const UnitParam = withDefault(StringParam, 'year');
const TypeParam = withDefault(StringParam, 'relative');
const StartParam = withDefault(StringParam, undefined);
const EndParam = withDefault(StringParam, undefined);

export function useUrlRangeState(past = false, initialKey = 'last-1-year') {
  const KeyParam = useMemo(
    () =>
      initialKey
        ? withDefault(StringParam, initialKey === 'null' ? null : initialKey)
        : past
          ? KeyParamPast
          : KeyParamFuture,
    [past, initialKey],
  );
  const [urlRange, urlSetRange] = useQueryParams({
    key: KeyParam,
    amount: AmountParam,
    unit: UnitParam,
    type: TypeParam,
    start: StartParam,
    end: EndParam,
  });
  const range: DateRangePickerProps.Value | null = useMemo(() => {
    if (urlRange.key === null) {
      return null;
    }
    if (urlRange.type === 'relative') {
      return {
        key: urlRange.key,
        amount: urlRange.amount,
        unit: urlRange.unit as DateRangePickerProps.TimeUnit,
        type: 'relative',
      };
    } else if (urlRange.type === 'absolute') {
      return {
        startDate: urlRange.start ?? '',
        endDate: urlRange.end ?? '',
        type: 'absolute',
      };
    }

    return null;
  }, [urlRange]);
  const setRange = (range: DateRangePickerProps.Value | null) => {
    if (range?.type === 'relative') {
      urlSetRange({
        key: range.key,
        amount: range.amount,
        unit: range.unit,
        type: 'relative',
      });
    } else if (range?.type === 'absolute') {
      urlSetRange({
        start: range.startDate,
        end: range.endDate,
        type: 'absolute',
      });
    } else {
      urlSetRange({});
    }
  };

  return {
    range,
    setRange,
  };
}

export function useUrlPageState(initialPage = 1) {
  const PageParam = useMemo(() => withDefault(NumberParam, initialPage), [initialPage]);
  const [urlPage, urlSetPage] = useQueryParams({
    page: PageParam,
  });
  const page = urlPage.page;
  const setPage = (page: number) => {
    urlSetPage({ page });
  };

  return [page, setPage] as const;
}

export function getDurationString(diff: number | null): string {
  if (diff === null) {
    return 'N/A';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60)) - hours * 60;
  const seconds = Math.floor(diff / 1000) - hours * 60 * 60 - minutes * 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function reverseDurationString(duration: string): number {
  let total = 0;

  for (const part of duration.split(' ')) {
    if (part.includes('h')) {
      total += parseInt(part.replace('h', '')) * (1000 * 60 * 60);
    } else if (part.includes('m')) {
      total += parseInt(part.replace('m', '')) * (1000 * 60);
    } else if (part.includes('s')) {
      total += parseInt(part.replace('s', '')) * 1000;
    }
  }

  return total;
}

export function relativeToAbsoluteRange(
  range: DateRangePickerProps.RelativeValue,
  future = false,
  now = new Date(),
): DateRangePickerProps.AbsoluteValue {
  const start = new Date(now);
  const end = new Date(now);

  if (!future) {
    // "day" | "week" | "month" | "year"
    if (range.unit === 'day') {
      start.setDate(start.getDate() - range.amount);
    } else if (range.unit === 'week') {
      start.setDate(start.getDate() - range.amount * 7);
    } else if (range.unit === 'month') {
      // start.setMonth(start.getMonth() - range.amount);
      // 1 month = 30 days
      start.setDate(start.getDate() - range.amount * 30);
    } else if (range.unit === 'year') {
      start.setFullYear(start.getFullYear() - range.amount);
      // "second" | "minute" | "hour" |
    } else if (range.unit === 'second') {
      start.setSeconds(start.getSeconds() - range.amount);
    } else if (range.unit === 'minute') {
      start.setMinutes(start.getMinutes() - range.amount);
    } else if (range.unit === 'hour') {
      start.setHours(start.getHours() - range.amount);
    }
  } else {
    if (range.unit === 'day') {
      end.setDate(end.getDate() + range.amount);
    } else if (range.unit === 'week') {
      end.setDate(end.getDate() + range.amount * 7);
    } else if (range.unit === 'month') {
      // end.setMonth(end.getMonth() + range.amount);
      // 1 month = 30 days
      end.setDate(end.getDate() + range.amount * 30);
    } else if (range.unit === 'year') {
      end.setFullYear(end.getFullYear() + range.amount);
    } else if (range.unit === 'second') {
      end.setSeconds(end.getSeconds() + range.amount);
    } else if (range.unit === 'minute') {
      end.setMinutes(end.getMinutes() + range.amount);
    } else if (range.unit === 'hour') {
      end.setHours(end.getHours() + range.amount);
    }
  }

  return {
    type: 'absolute',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function useLocalFilterState() {
  const [query, setQuery] = useState<PropertyFilterQuery>({
    operation: 'and',
    tokens: [],
  });

  return { query, setQuery };
}

export function useLocalSortState(
  defaultSortingField?: string,
  defaultSortDirection?: 'asc' | 'desc',
) {
  const [sortingField, setSortingField] = useState<string | undefined>(defaultSortingField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection ?? 'asc');

  return { sortingField, setSortingField, sortDirection, setSortDirection };
}

export function useUrlSortState(
  defaultSortingField?: string,
  defaultSortDirection?: 'asc' | 'desc',
) {
  const SortingFieldParam = useMemo(
    () => withDefault(StringParam, defaultSortingField),
    [defaultSortingField],
  );
  const SortDirectionParam = useMemo(
    () => withDefault(StringParam, defaultSortDirection ?? 'asc'),
    [defaultSortDirection],
  );
  const [sortingField, setSortingField] = useQueryParam('sortingField', SortingFieldParam);
  const [sortDirection, setSortDirection] = useQueryParam('sortDirection', SortDirectionParam);

  return {
    sortingField,
    setSortingField,
    sortDirection: sortDirection as 'asc' | 'desc',
    setSortDirection,
  };
}

export function useLocalRangeState(past = false, initialKey = 'last-1-year') {
  const [range, setRange] = useState<DateRangePickerProps.Value | null>({
    key: initialKey,
    amount: 1,
    unit: 'year',
    type: 'relative',
  });

  return { range, setRange };
}

export function useLocalPageState(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  return [page, setPage] as const;
}
