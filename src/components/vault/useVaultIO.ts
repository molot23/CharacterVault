import { useCallback, useEffect, useRef, useState } from 'react';
import { characterImportService } from '../../services/CharacterImportService';
import { characterExportService } from '../../services/CharacterExportService';
import { characterDb } from '../../db/CharacterDatabase';
import { useI18n } from '../../i18n';
import type { CardExportFormat, VaultTab } from './types';
import { downloadBlob } from './utils';

interface UseVaultIOOptions {
  characterCount: number;
  lorebookCount: number;
  vaultTab: VaultTab;
  refreshCharacters: () => Promise<void>;
  importLorebookFile: (file: File) => Promise<unknown>;
}

function isJsonFile(file: File): boolean {
  return file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
}

function isCharacterImportFile(file: File): boolean {
  return (
    isJsonFile(file) ||
    file.type === 'image/png' ||
    file.name.toLowerCase().endsWith('.png')
  );
}

export function useVaultIO({
  characterCount,
  lorebookCount,
  vaultTab,
  refreshCharacters,
  importLorebookFile,
}: UseVaultIOOptions) {
  const { t } = useI18n();
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingVault, setIsExportingVault] = useState(false);
  const [exportingCardId, setExportingCardId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [backupConfirmOpen, setBackupConfirmOpen] = useState(false);
  const dragDepthRef = useRef(0);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vaultTabRef = useRef(vaultTab);
  vaultTabRef.current = vaultTab;

  const showStatus = useCallback((message: string, durationMs = 5000) => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setStatusMessage(message);
    statusTimeoutRef.current = setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const importCharacterFiles = useCallback(
    async (files: File[]) => {
      const fileArray = files.filter(isCharacterImportFile);
      if (fileArray.length === 0) {
        showStatus(t('vault.io.noCharacterFiles'));
        return;
      }

      setIsImporting(true);
      try {
        const result = await characterImportService.importFromFiles(fileArray);
        await refreshCharacters();

        if (result.successCount === 0) {
          const firstError = result.errors[0];
          showStatus(
            firstError
              ? t('vault.io.importFailedNamed', {
                  detail: `${firstError.filename} — ${firstError.error}`,
                })
              : t('vault.io.importFailed'),
            7000
          );
        } else if (result.failCount > 0) {
          showStatus(
            t('vault.io.importedPartial', {
              success: result.successCount,
              total: fileArray.length,
              failed: result.failCount,
            }),
            7000
          );
        } else {
          showStatus(
            result.successCount === 1
              ? t('vault.io.importedOneCharacter', {
                  name: result.firstImportedName ?? 'character',
                })
              : t('vault.io.importedCharacters', { count: result.successCount })
          );
        }
      } catch {
        showStatus(t('vault.io.importFailed'));
      } finally {
        setIsImporting(false);
      }
    },
    [refreshCharacters, showStatus, t]
  );

  const importLorebookFiles = useCallback(
    async (files: File[]) => {
      const fileArray = files.filter(isJsonFile);
      if (fileArray.length === 0) {
        showStatus(t('vault.io.noLorebookFiles'));
        return;
      }

      setIsImporting(true);
      let successCount = 0;
      const errors: string[] = [];
      try {
        for (const file of fileArray) {
          try {
            await importLorebookFile(file);
            successCount += 1;
          } catch (err) {
            errors.push(
              `${file.name} — ${err instanceof Error ? err.message : t('vault.io.importFailed')}`,
            );
          }
        }

        if (successCount === 0) {
          showStatus(
            errors[0]
              ? t('vault.io.importFailedNamed', { detail: errors[0] })
              : t('vault.io.importFailed'),
            7000,
          );
        } else if (errors.length > 0) {
          showStatus(
            t('vault.io.importedPartial', {
              success: successCount,
              total: fileArray.length,
              failed: errors.length,
            }),
            7000,
          );
        } else {
          showStatus(
            successCount === 1
              ? t('vault.io.importedOneLorebook', {
                  name: fileArray[0].name.replace(/\.json$/i, ''),
                })
              : t('vault.io.importedLorebooks', { count: successCount }),
          );
        }
      } catch {
        showStatus(t('vault.io.importFailed'));
      } finally {
        setIsImporting(false);
      }
    },
    [importLorebookFile, showStatus, t]
  );

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (vaultTabRef.current === 'lorebooks') {
        await importLorebookFiles(list);
        return;
      }
      await importCharacterFiles(list);
    },
    [importCharacterFiles, importLorebookFiles]
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await importFiles(files);
    e.target.value = '';
  };

  const canBackup = characterCount > 0 || lorebookCount > 0;

  const handleBackupClick = () => {
    if (!canBackup || isExportingVault) return;
    setBackupConfirmOpen(true);
  };

  const handleBackupCancel = () => {
    if (isExportingVault) return;
    setBackupConfirmOpen(false);
  };

  const handleExportVault = async () => {
    if (!canBackup || isExportingVault) return;
    setIsExportingVault(true);
    try {
      const result = await characterExportService.exportVaultAsZip(
        characterDb.iterateAllCharacters(),
        characterDb.iterateAllLorebooks(),
      );
      if (result.success && result.blob && result.filename) {
        downloadBlob(result.blob, result.filename);
        const parts: string[] = [];
        if (characterCount > 0) {
          parts.push(
            t(characterCount === 1 ? 'vault.io.cardSingular' : 'vault.io.cardPlural', {
              count: characterCount,
            })
          );
        }
        if (lorebookCount > 0) {
          parts.push(
            t(
              lorebookCount === 1 ? 'vault.io.lorebookSingular' : 'vault.io.lorebookPlural',
              { count: lorebookCount }
            )
          );
        }
        showStatus(
          result.error
            ? t('vault.io.backupDownloadedPartial', { error: result.error })
            : t('vault.io.backupDownloaded', { parts: parts.join(', ') }),
          6000
        );
        setBackupConfirmOpen(false);
      } else {
        showStatus(result.error || t('vault.io.backupFailed'), 7000);
      }
    } catch {
      showStatus(t('vault.io.backupFailed'));
    } finally {
      setIsExportingVault(false);
    }
  };

  const handleCardExport = useCallback(
    async (id: string, format: CardExportFormat) => {
      if (exportingCardId) return;
      setExportingCardId(id);
      try {
        const character = await characterDb.getCharacter(id);
        if (!character) {
          showStatus(t('vault.io.characterNotFound'));
          return;
        }

        const result =
          format === 'png'
            ? await characterExportService.exportAsPNG(character)
            : await characterExportService.exportAsJSON(character);

        if (result.success && result.blob && result.filename) {
          downloadBlob(result.blob, result.filename);
          showStatus(
            format === 'png'
              ? t('vault.io.exportedPng', { name: character.name })
              : t('vault.io.exportedJson', { name: character.name })
          );
        } else {
          showStatus(
            result.error ||
              (format === 'png' ? t('vault.io.pngExportFailed') : t('vault.io.exportFailed')),
            7000
          );
        }
      } catch {
        showStatus(t('vault.io.exportFailed'));
      } finally {
        setExportingCardId(null);
      }
    },
    [exportingCardId, showStatus, t]
  );

  const isImportableDrag = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return false;
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return true;
    return Array.from(items).some((item) => {
      if (item.kind !== 'file') return false;
      if (vaultTabRef.current === 'lorebooks') {
        return item.type === 'application/json' || item.type === '';
      }
      return (
        item.type === 'application/json' ||
        item.type === 'image/png' ||
        item.type === '' ||
        item.type.startsWith('image/')
      );
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isImportableDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isImportableDrag(e) && dragDepthRef.current === 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isImportableDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    if (isImporting) return;
    const files = e.dataTransfer.files;
    if (files?.length) {
      await importFiles(files);
    }
  };

  return {
    fileInputRef,
    isImporting,
    isExportingVault,
    exportingCardId,
    isDragOver,
    statusMessage,
    setStatusMessage,
    canBackup,
    backupConfirmOpen,
    showStatus,
    handleImport,
    handleBackupClick,
    handleBackupCancel,
    handleExportVault,
    handleCardExport,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFilePicker: () => fileInputRef.current?.click(),
  };
}
