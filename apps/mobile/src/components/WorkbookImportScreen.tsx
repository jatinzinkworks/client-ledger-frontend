import { errorMessage, type WorkbookImport } from '@cl/api';
import {
  CHOOSE_WORKBOOK_LABEL,
  DOWNLOAD_TEMPLATE_LABEL,
  IMPORT_LABEL,
  NOTHING_IMPORTED,
  NOT_A_WORKBOOK,
  XLSX_MIME,
  importFailure,
  isWorkbookName,
  type ImportCopy,
  type ImportSummary,
} from '@cl/schemas';
import * as DocumentPicker from 'expo-document-picker';
import { router, type Href } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { useThemeColors } from '@/theme/useThemeColors';
import { shareFile } from '@/utils/download';

/** A picked workbook: a File in the browser, else what React Native's FormData uploads by uri. */
type PickedWorkbook = { name: string; upload: Blob };

const toUpload = (asset: DocumentPicker.DocumentPickerAsset): Blob =>
  asset.file ?? ({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? XLSX_MIME } as unknown as Blob);

interface WorkbookImportScreenProps<TResult> {
  copy: ImportCopy;
  /** From `useServiceImport` / `useClientImport`. */
  io: WorkbookImport<TResult>;
  /** What the import created, as a heading and a line per record. */
  summarize: (result: TResult) => ImportSummary;
  /** Where Cancel / Done go when there is nothing to go back to. */
  fallbackHref: Href;
}

/**
 * An import from an Excel workbook, full screen: share the template (to fill in on a computer or
 * in a spreadsheet app), pick the filled-in workbook, import. Then what was created, or each cell
 * at fault — the same flow and copy as the web side sheet. Import Services and Import Clients are
 * thin wrappers. Picking uses expo-document-picker, a native module (needs a fresh dev build).
 */
export function WorkbookImportScreen<TResult>({ copy, io, summarize, fallbackHref }: WorkbookImportScreenProps<TResult>) {
  const colors = useThemeColors();
  const [workbook, setWorkbook] = useState<PickedWorkbook>();
  const [fileError, setFileError] = useState<string>();
  const [shareError, setShareError] = useState<string>();
  const close = () => (router.canGoBack() ? router.back() : router.replace(fallbackHref));

  const shareTemplate = async () => {
    setShareError(undefined);
    let template;
    try {
      template = await io.downloadTemplate();
    } catch {
      return; // Shown from templateError.
    }
    try {
      await shareFile(template.blob, template.fileName ?? copy.templateFileName);
    } catch (error) {
      setShareError(errorMessage(error));
    }
  };

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: XLSX_MIME, copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    io.resetImport();
    const ok = isWorkbookName(asset.name);
    setFileError(ok ? undefined : NOT_A_WORKBOOK);
    setWorkbook(ok ? { name: asset.name, upload: toUpload(asset) } : undefined);
  };

  const runImport = async () => {
    if (!workbook) return;
    try {
      await io.importWorkbook(workbook.upload);
    } catch {
      // Shown from importError.
    }
  };

  const failure = io.importError ? importFailure(io.importError) : undefined;
  const summary = io.imported !== undefined ? summarize(io.imported) : undefined;

  return (
    <FormScreen title={copy.title}>
      {summary ? (
        <>
          <View className="flex-row items-center gap-2">
            <CircleCheck size={24} color={colors.success} />
            <Text className="flex-1 text-xl font-bold text-foreground">{summary.title}</Text>
          </View>
          <View className="rounded-lg border border-border bg-card">
            {summary.items.map((item, i) => (
              <View key={item.key} className={i ? 'gap-0.5 border-t border-border p-3' : 'gap-0.5 p-3'}>
                <Text className="text-base font-bold text-card-foreground">{item.name}</Text>
                <Text className="text-[13px] text-muted-foreground">{item.detail}</Text>
              </View>
            ))}
          </View>
          <Button label="Done" onPress={close} />
        </>
      ) : (
        <>
          <View className="gap-2">
            <Text className="text-lg font-bold text-foreground">{copy.steps.template.title}</Text>
            <Text className="text-sm text-muted-foreground">{copy.steps.template.body}</Text>
            <Button
              variant="outline"
              label={io.downloadingTemplate ? 'Downloading…' : DOWNLOAD_TEMPLATE_LABEL}
              disabled={io.downloadingTemplate}
              onPress={shareTemplate}
            />
            {io.templateError || shareError ? (
              <Text className="text-sm text-destructive">{io.templateError?.message ?? shareError}</Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="text-lg font-bold text-foreground">{copy.steps.upload.title}</Text>
            <Text className="text-sm text-muted-foreground">{copy.steps.upload.body}</Text>
            <Button variant="outline" label={CHOOSE_WORKBOOK_LABEL} disabled={io.importing} onPress={pick} />
            {workbook ? <Text className="text-sm font-bold text-foreground">{workbook.name}</Text> : null}
            {fileError ? <Text className="text-sm text-destructive">{fileError}</Text> : null}
          </View>

          {failure ? (
            <View className="gap-2 rounded-lg border border-destructive p-3">
              <Text className="font-bold text-destructive">{NOTHING_IMPORTED}</Text>
              <Text className="text-sm text-destructive">{failure.message}</Text>
              {failure.cells.map((c, i) => (
                <Text key={`${c.cell}-${i}`} className="text-sm text-destructive">
                  {c.cell ? <Text className="font-bold">{c.cell}: </Text> : null}
                  {c.message}
                </Text>
              ))}
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <Button variant="outline" label="Cancel" className="flex-1" disabled={io.importing} onPress={close} />
            <Button
              label={io.importing ? 'Importing…' : IMPORT_LABEL}
              className="flex-1"
              disabled={!workbook || io.importing}
              onPress={runImport}
            />
          </View>
        </>
      )}
    </FormScreen>
  );
}
