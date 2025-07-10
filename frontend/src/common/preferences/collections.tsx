import { CollectionPreferencesProps } from '@cloudscape-design/components';
import { useLocalStorage } from 'react-use';

export function useCollectionPreferences(resourceName: string) {
  const DEFAULT_PREFERENCES = {
    pageSize: 20,
  };

  const PAGE_SIZE_OPTIONS = [
    { value: 10, label: `10 ${resourceName}` },
    { value: 20, label: `20 ${resourceName}` },
    { value: 50, label: `50 ${resourceName}` },
  ];

  const [preferences, setPreferences] = useLocalStorage<
    CollectionPreferencesProps.Preferences<unknown>
  >('React-Cards-Preferences', DEFAULT_PREFERENCES);

  const pageSize = preferences?.pageSize || DEFAULT_PREFERENCES.pageSize;

  return { preferences, setPreferences, PAGE_SIZE_OPTIONS, pageSize };
}
