import { TextFilter } from '@cloudscape-design/components';
import { useEffect, useState } from 'react';

export type TextQueryFilterProps = {
  text: string;
  setText: (text: string) => void;
  loading: boolean;
};

export function TextQueryFilter(props: TextQueryFilterProps) {
  const { text, setText, loading } = props;
  const [internalText, setInternalText] = useState(text);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalText.trim() !== text.trim()) {
        setText(internalText);
      }
    }, 500); // Adjust the debounce delay as needed

    // Clear the timeout if the effect re-runs before the delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [internalText, text, setText]);

  return (
    <TextFilter
      filteringText={internalText}
      filteringPlaceholder="Search..."
      loading={loading}
      onChange={({ detail }) => setInternalText(detail.filteringText)}
    />
  );
}
