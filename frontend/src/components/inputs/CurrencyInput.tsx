import { RoundedInput } from './RoundedInput';

export type CurrencyInputProps = {
  value: number | undefined | null;
  setValue?: (value: number | undefined | null) => void;
  placeholder?: string;
  label?: string;
  description?: React.ReactNode;
  initialValue?: number | undefined | null;
  disabled?: boolean;
  readOnly?: boolean;
  info?: React.ReactNode;
};

export function CurrencyInput(props: CurrencyInputProps) {
  return <RoundedInput {...props} precision={2} prefix="$" />;
}
