import { Text, View } from 'react-native';

/** A labelled value that cannot be changed here, styled like a disabled field. */
export function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-bold text-foreground">{label}</Text>
      <View className="min-h-11 justify-center rounded-md border border-border bg-muted px-3 py-2.5">
        <Text className="text-base text-foreground">{value}</Text>
      </View>
      {hint ? <Text className="text-sm text-muted-foreground">{hint}</Text> : null}
    </View>
  );
}
