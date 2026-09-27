import { useProfile } from '@/hooks/useProfile';

export function useListPosition() {
  const { profile } = useProfile();
  return (index: number, total: number) =>
    profile?.screen_reader_support ? `item ${index + 1} of ${total}` : undefined;
}
