import { DateRangePickerProps } from '@cloudscape-design/components';

export function checkIsValidRange(
  range: DateRangePickerProps.Value | null,
): DateRangePickerProps.ValidationResult {
  if (!range) {
    return {
      valid: true,
    };
  }

  if (range.type === 'absolute') {
    const [startDateWithoutTime] = range.startDate.split('T');
    const [endDateWithoutTime] = range.endDate.split('T');

    if (!startDateWithoutTime || !endDateWithoutTime) {
      return {
        valid: false,
        errorMessage:
          'The selected date range is incomplete. Select a start and end date for the date range.',
      };
    }

    if (new Date(range.startDate).getTime() - new Date(range.endDate).getTime() > 0) {
      return {
        valid: false,
        errorMessage:
          'The selected date range is invalid. The start date must be before the end date.',
      };
    }
  }

  return { valid: true };
}
