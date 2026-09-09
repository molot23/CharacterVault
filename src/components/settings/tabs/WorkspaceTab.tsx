/**
 * @fileoverview Character workspace preferences tab (default chat, agent edits, editor links, spellcheck).
 * @module components/settings/tabs/WorkspaceTab
 */

import React from 'react';
import { Bot, ExternalLink, Languages, MessageSquare, ShieldCheck } from 'lucide-react';
import type { DefaultChatPanel } from '../../../db/characterTypes';
import { useI18n } from '../../../i18n';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsToggle } from '../components/SettingsToggle';
import type { SettingsTabProps } from '../types';

export const WorkspaceTab: React.FC<SettingsTabProps> = ({ draft, setDraft }) => {
  const { t } = useI18n();

  const chatPanelOptions: Array<{
    id: DefaultChatPanel;
    label: string;
    hint: string;
    Icon: typeof MessageSquare;
  }> = [
    { id: 'orion', label: 'Orion', hint: t('settings.workspace.orionHint'), Icon: MessageSquare },
    { id: 'agent', label: 'Agent', hint: t('settings.workspace.agentHint'), Icon: Bot },
  ];

  return (
    <div className="space-y-5">
      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {t('settings.workspace.chatPanel')}
        </h3>
        <p className="text-sm font-medium text-fg mb-1">{t('settings.workspace.defaultChat')}</p>
        <p className="text-xs text-fg-muted mb-3 leading-relaxed">
          {t('settings.workspace.defaultChatHelp')}
        </p>
        <div
          role="radiogroup"
          aria-label={t('settings.workspace.defaultChatAria')}
          className="grid grid-cols-2 gap-2"
        >
          {chatPanelOptions.map(({ id, label, hint, Icon }) => {
            const selected = draft.defaultChatPanel === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDraft((prev) => ({ ...prev, defaultChatPanel: id }))}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? 'border-accent/40 bg-accent-soft text-accent'
                    : 'border-border bg-surface text-fg-muted hover:bg-hover/60 hover:text-fg'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </span>
                <span className={`text-[11px] leading-snug ${selected ? 'text-accent/80' : 'text-fg-subtle'}`}>
                  {hint}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {t('settings.workspace.agentEdits')}
        </h3>
        <SettingsToggle
          stacked
          checked={draft.requireAgentReview}
          onChange={(checked) =>
            setDraft((prev) => ({ ...prev, requireAgentReview: checked }))
          }
          label={t('settings.workspace.reviewEdits')}
          description={t('settings.workspace.reviewEditsHelp')}
        />
      </SettingsCard>

      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          {t('settings.workspace.editorLinks')}
        </h3>
        <SettingsToggle
          stacked
          checked={draft.markdownImageOpenLinks}
          onChange={(checked) =>
            setDraft((prev) => ({ ...prev, markdownImageOpenLinks: checked }))
          }
          label={t('settings.workspace.openMarkdownLinks')}
          description={t('settings.workspace.openMarkdownLinksHelp')}
        />
      </SettingsCard>

      <SettingsCard>
        <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Languages className="w-4 h-4" />
          {t('settings.workspace.spellcheck')}
        </h3>
        <div className="space-y-4">
          <SettingsToggle
            stacked
            checked={draft.spellcheckEnabled}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, spellcheckEnabled: checked }))
            }
            label={t('settings.workspace.enableSpellcheck')}
            description={t('settings.workspace.enableSpellcheckHelp')}
          />

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-fg-muted mb-2">
              <span className="p-1.5 rounded-md bg-muted text-fg-muted">
                <Languages className="w-4 h-4" />
              </span>
              {t('settings.workspace.spellcheckLanguage')}
            </label>
            <select
              value={draft.spellcheckLanguage}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, spellcheckLanguage: e.target.value }))
              }
              className="w-full px-3 py-2.5 border border-border-strong rounded-lg bg-surface text-fg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200"
            >
              <option value="en">{t('settings.workspace.spellcheckEnglish')}</option>
            </select>
            <p className="mt-2 text-xs text-fg-muted">
              {t('settings.workspace.spellcheckMoreSoon')}
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
