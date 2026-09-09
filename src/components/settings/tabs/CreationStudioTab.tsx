/**
 * @fileoverview Creation Studio preferences tab (generation fields, tag browser, prompts, vortex).
 * @module components/settings/tabs/CreationStudioTab
 */

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, MessageSquare, RotateCcw, SlidersHorizontal, Tag, Wand2 } from 'lucide-react';
import type { StudioGenerationField, StudioPrompts } from '../../../db/characterTypes';
import { DEFAULT_STUDIO_PROMPTS } from '../../../db/characterTypes';
import { TAG_CATEGORIES } from '../../../pages/ai-creation-studio/tags/tagData';
import { STUDIO_PROMPT_REQUIRED_VARS } from '../../../pages/ai-creation-studio/generationPrompts';
import type { StudioPromptKey } from '../../../pages/ai-creation-studio/generationPrompts';
import { useI18n } from '../../../i18n';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsToggle } from '../components/SettingsToggle';
import type { SettingsTabProps } from '../types';

const StudioPromptEditor: React.FC<{
  promptKey: StudioPromptKey;
  label: string;
  hint: string;
  value: string;
  expanded: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}> = ({ promptKey, label, hint, value, expanded, onToggle, onChange }) => {
  const { t } = useI18n();
  const required = STUDIO_PROMPT_REQUIRED_VARS[promptKey];
  const missing = required.filter((v) => !value.includes(`\${${v}}`));
  return (
    <div className="border border-border rounded-lg mb-3 last:mb-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full min-h-12 flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-muted hover:bg-hover active:bg-hover transition-colors rounded-t-lg text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-fg-muted min-w-0">
          <MessageSquare className="w-4 h-4 text-fg-muted shrink-0" />
          <span className="truncate">{label}</span>
          {missing.length > 0 && <AlertCircle className="w-4 h-4 text-danger shrink-0" />}
        </span>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-fg-muted shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-fg-muted shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="p-3 sm:p-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-28 h-40 px-3 py-2.5 border border-border-strong rounded-lg bg-surface text-fg text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y transition-all duration-200"
            placeholder={t('settings.studio.enterPrompt', { label: label.toLowerCase() })}
          />
          <p className="mt-2 text-xs text-fg-muted">{hint}</p>
          {missing.map((v) => (
            <p key={v} className="mt-1 text-xs text-danger flex items-start gap-1">
              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
              {t('settings.studio.missingVar', { var: v })}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const CreationStudioTab: React.FC<SettingsTabProps> = ({ draft, setDraft }) => {
  const { t } = useI18n();
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const optionalFields: Array<{ key: StudioGenerationField; label: string; hint: string }> = [
    { key: 'first_mes', label: t('settings.studio.firstMes'), hint: t('settings.studio.firstMesHint') },
    { key: 'mes_example', label: t('settings.studio.examples'), hint: t('settings.studio.examplesHint') },
  ];

  const promptMeta: Array<{ key: StudioPromptKey; label: string; hint: string }> = [
    { key: 'system', label: t('settings.studio.systemPrompt'), hint: t('settings.studio.systemHint') },
    { key: 'name', label: t('settings.studio.namePrompt'), hint: t('settings.studio.nameHint') },
    { key: 'description', label: t('settings.studio.descriptionPrompt'), hint: t('settings.studio.descriptionHint') },
    { key: 'first_mes', label: t('settings.studio.firstMesPrompt'), hint: t('settings.studio.firstMesPromptHint') },
    { key: 'mes_example', label: t('settings.studio.examplesPrompt'), hint: t('settings.studio.examplesPromptHint') },
  ];

  const setStudioPrompt = (key: StudioPromptKey, value: string) => {
    setDraft((prev) => ({
      ...prev,
      studio: { ...prev.studio, prompts: { ...prev.studio.prompts, [key]: value } as StudioPrompts },
    }));
  };

  const resetStudioPrompts = () => {
    setDraft((prev) => ({
      ...prev,
      studio: { ...prev.studio, prompts: { ...DEFAULT_STUDIO_PROMPTS } },
    }));
  };

  return (
    <div className="space-y-5">
      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {t('settings.studio.generationFields')}
        </h3>
        <p className="text-xs text-fg-muted mb-4 leading-relaxed">
          {t('settings.studio.generationFieldsHelp')}
        </p>
        <div className="space-y-4">
          {optionalFields.map(({ key, label, hint }) => (
            <SettingsToggle
              key={key}
              stacked
              checked={draft.studio.enabledFields[key]}
              onChange={(next) =>
                setDraft((prev) => ({
                  ...prev,
                  studio: {
                    ...prev.studio,
                    enabledFields: { ...prev.studio.enabledFields, [key]: next },
                  },
                }))
              }
              label={label}
              description={hint}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          {t('settings.studio.tagBrowser')}
        </h3>
        <div className="space-y-4">
          <SettingsToggle
            stacked
            checked={draft.studio.tags.hideNsfw}
            onChange={(checked) =>
              setDraft((prev) => ({
                ...prev,
                studio: {
                  ...prev.studio,
                  tags: { ...prev.studio.tags, hideNsfw: checked },
                },
              }))
            }
            label={t('settings.studio.hideNsfw')}
            description={t('settings.studio.hideNsfwHelp')}
          />
          <div>
            <p className="text-sm font-medium text-fg mb-1">{t('settings.studio.visibleCategories')}</p>
            <p className="text-xs text-fg-muted mb-3 leading-relaxed">
              {t('settings.studio.visibleCategoriesHelp')}
            </p>
            <div className="space-y-2">
              {TAG_CATEGORIES.filter((c) => c.key !== 'generation').map((cat) => {
                const hidden = draft.studio.tags.hiddenCategories.includes(cat.key);
                const catLabel = t(`settings.studio.categories.${cat.key}`);
                return (
                  <SettingsToggle
                    key={cat.key}
                    checked={!hidden}
                    onChange={(checked) =>
                      setDraft((prev) => {
                        const hiddenList = prev.studio.tags.hiddenCategories.filter(
                          (k) => k !== cat.key
                        );
                        return {
                          ...prev,
                          studio: {
                            ...prev.studio,
                            tags: {
                              ...prev.studio.tags,
                              hiddenCategories: checked ? hiddenList : [...hiddenList, cat.key],
                            },
                          },
                        };
                      })
                    }
                    label={`${catLabel}${cat.nsfw ? t('settings.studio.nsfwSuffix') : ''}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            {t('settings.studio.generationPrompts')}
          </h3>
          <button
            type="button"
            onClick={resetStudioPrompts}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
            title={t('settings.studio.resetDefaultsTitle')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('settings.studio.resetDefaults')}
          </button>
        </div>
        <p className="text-xs text-fg-muted mb-3 leading-relaxed">
          {t('settings.studio.promptsHelp')}
        </p>
        {promptMeta.map(({ key, label, hint }) => (
          <StudioPromptEditor
            key={key}
            promptKey={key}
            label={label}
            hint={hint}
            value={draft.studio.prompts[key]}
            expanded={!!expandedPrompts[key]}
            onToggle={() => setExpandedPrompts((prev) => ({ ...prev, [key]: !prev[key] }))}
            onChange={(v) => setStudioPrompt(key, v)}
          />
        ))}
      </SettingsCard>

      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          {t('settings.studio.luckyVortex')}
        </h3>
        <SettingsToggle
          stacked
          checked={draft.showLuckyVortex}
          onChange={(checked) => setDraft((prev) => ({ ...prev, showLuckyVortex: checked }))}
          label={t('settings.studio.showVortex')}
          description={t('settings.studio.showVortexHelp')}
        />
      </SettingsCard>
    </div>
  );
};
