import type { CompanyResponse } from '@cl/api';
import { companyDetails } from '@cl/schemas';
import { ChevronRight, Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';
import { EYEBROW } from '@/utils/typography';

interface CompanyHeaderProps {
  company: CompanyResponse;
  /** The eyebrow over the name, e.g. the financial year shown. */
  eyebrow: string;
  clientName: string;
  onOpenClient: () => void;
  onEdit: () => void;
}

/** The company's name with an edit icon, its details line, and its client (a link back). */
export function CompanyHeader({ company, eyebrow, clientName, onOpenClient, onEdit }: CompanyHeaderProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-2">
      <Text className={EYEBROW}>{eyebrow}</Text>
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 text-3xl font-bold text-foreground">{company.companyName}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit Company"
          hitSlop={8}
          onPress={onEdit}
          className="rounded-md p-2 active:opacity-60"
        >
          <Pencil size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Text className="text-[15px] text-foreground">{companyDetails(company).join(' · ')}</Text>
      {clientName ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open ${clientName}`}
          onPress={onOpenClient}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <Text className="text-[15px] font-bold text-brand">{clientName}</Text>
          <ChevronRight size={16} color={colors.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}
