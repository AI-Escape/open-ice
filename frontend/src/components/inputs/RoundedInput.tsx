import { FormField, Input } from '@cloudscape-design/components';
import { useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  helpers                                                           */
/* ------------------------------------------------------------------ */

export type RoundedInputProps = {
  value: number | undefined | null; // 12.34  ↔  “12.34 %”
  setValue?: (value: number | undefined | null) => void;
  placeholder?: string;
  label?: string;
  description?: React.ReactNode;
  initialValue?: number | undefined | null; // starting % (plain number)
  disabled?: boolean;
  readOnly?: boolean;
  precision?: number;
  prefix?: string;
  suffix?: string;
  info?: React.ReactNode;
};

export function RoundedInput(props: RoundedInputProps) {
  const { value, setValue } = props;

  const formatter = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: props.precision || 2,
      maximumFractionDigits: props.precision || 2,
    });
  }, []);

  const precisionFactor = useMemo(() => {
    return 10 ** (props.precision || 2);
  }, [props.precision]);

  /* ------------------------------------------------------------------ */
  /*  local state                                                       */
  /* ------------------------------------------------------------------ */
  const [text, setText] = useState<string>(
    props.initialValue
      ? (props.prefix || '') + `${formatter.format(props.initialValue)}` + (props.suffix || '')
      : '-',
  );
  const [errorText, setErrorText] = useState<string | undefined>();

  /* ------------------------------------------------------------------ */
  /*  handlers                                                          */
  /* ------------------------------------------------------------------ */
  const handleBlur = () => {
    // empty/placeholder
    if (text.trim() === '-' || text.trim() === '') {
      setErrorText(undefined);
      setValue?.(null);
      return;
    }

    // strip “%”, commas, spaces → parse
    const cleaned = text
      .replaceAll(props.suffix || '', '')
      .replaceAll(props.prefix || '', '')
      .replaceAll(',', '')
      .trim();
    const num = Number(cleaned);

    if (Number.isNaN(num)) {
      setErrorText('Invalid number');
      return;
    }

    const rounded = Math.round(num * precisionFactor) / precisionFactor;
    setText(`${props.prefix || ''}${formatter.format(rounded)}${props.suffix || ''}`); // prettified
    setErrorText(undefined);
    setValue?.(rounded);
  };

  const handleChange = ({ detail }: { detail: { value: string } }) => {
    setText(detail.value);

    const cleaned = detail.value
      .replaceAll(props.suffix || '', '')
      .replaceAll(props.prefix || '', '')
      .replaceAll(',', '')
      .trim();
    const num = Number(cleaned);

    if (!Number.isNaN(num)) {
      setValue?.(Math.round(num * precisionFactor) / precisionFactor);
      setErrorText(undefined);
    } else {
      setValue?.(null);
    }
  };

  const handleFocus = () => {
    // show raw numeric value for easier editing
    if (value) {
      setText(value.toFixed(props.precision || 2));
    }
  };

  /* ------------------------------------------------------------------ */
  /*  sync with initialValue updates                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (props.initialValue) {
      setText(`${props.prefix || ''}${formatter.format(props.initialValue)}${props.suffix || ''}`);
    } else {
      setText('-');
    }
  }, [props.initialValue]);

  /* ------------------------------------------------------------------ */
  /*  render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <FormField
      constraintText={props.description}
      label={props.label}
      errorText={errorText}
      info={props.info}
    >
      <Input
        value={text}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        type="text"
        inputMode="decimal"
        placeholder={props.placeholder}
        disabled={props.disabled}
        readOnly={props.readOnly}
      />
    </FormField>
  );
}
