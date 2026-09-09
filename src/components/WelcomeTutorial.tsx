/**
 * @fileoverview Welcome tutorial overlay for first-time users.
 * Multi-step animated walkthrough explaining CharacterVault's features.
 * @module @components/WelcomeTutorial
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Users,
  Upload,
  Plus,
  Type,
  Image,
  MessageCircle,
  Download,
  Sparkles,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  PenTool,
  Book,
  Zap,
  ExternalLink,
  History,
  Bot,
  Link,
  Map,
  Archive,
} from 'lucide-react';
import './tutorial.css';
import { useI18n } from '../i18n';

interface TutorialStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ElementType; label: string; detail: string }[];
  accentIcon: React.ElementType;
  showSillyTavernCallout?: boolean;
}

const TUTORIAL_STEP_DEFINITIONS: Array<{
  key: string;
  accentIcon: React.ElementType;
  featureIcons: React.ElementType[];
  showSillyTavernCallout?: boolean;
}> = [
  { key: 'welcome', accentIcon: BookOpen, featureIcons: [Users, PenTool, Sparkles] },
  {
    key: 'vault',
    accentIcon: Upload,
    featureIcons: [Upload, Plus, Download, ExternalLink],
    showSillyTavernCallout: true,
  },
  { key: 'editor', accentIcon: PenTool, featureIcons: [Type, Image, Book] },
  { key: 'ai', accentIcon: Sparkles, featureIcons: [Zap, MessageCircle, Bot] },
  { key: 'lorebook', accentIcon: Book, featureIcons: [Book, Link, Map] },
  { key: 'snapshots', accentIcon: History, featureIcons: [History, Download, Archive] },
  { key: 'ready', accentIcon: Rocket, featureIcons: [Rocket, BookOpen, Users] },
];

const FEATURE_KEYS = ['one', 'two', 'three', 'four'];

const STORAGE_KEY = 'charactervault-tutorial-completed';

// --- Component ---

interface WelcomeTutorialProps {
  onComplete: () => void;
  skipEntranceAnimation?: boolean;
}

export function WelcomeTutorial({ onComplete, skipEntranceAnimation = false }: WelcomeTutorialProps): React.ReactElement {
  const { t } = useI18n();
  const tutorialSteps: TutorialStep[] = TUTORIAL_STEP_DEFINITIONS.map((definition, id) => ({
    id,
    title: t(`tutorial.steps.${definition.key}.title`),
    subtitle: t(`tutorial.steps.${definition.key}.subtitle`),
    description: t(`tutorial.steps.${definition.key}.description`),
    features: definition.featureIcons.map((icon, index) => ({
      icon,
      label: t(`tutorial.steps.${definition.key}.features.${FEATURE_KEYS[index]}.label`),
      detail: t(`tutorial.steps.${definition.key}.features.${FEATURE_KEYS[index]}.detail`),
    })),
    accentIcon: definition.accentIcon,
    showSillyTavernCallout: definition.showSillyTavernCallout,
  }));
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(skipEntranceAnimation);

  // Entrance animation (skipped on initial page load to prevent flash)
  useEffect(() => {
    if (skipEntranceAnimation) return;
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [skipEntranceAnimation]);

  const step = tutorialSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tutorialSteps.length - 1;

  const animateTransition = useCallback((newStep: number, dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);

    setTimeout(() => {
      setCurrentStep(newStep);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating]);

  const handleNext = useCallback(() => {
    if (!isLast) animateTransition(currentStep + 1, 'next');
  }, [currentStep, isLast, animateTransition]);

  const handlePrev = useCallback(() => {
    if (!isFirst) animateTransition(currentStep - 1, 'prev');
  }, [currentStep, isFirst, animateTransition]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) handleComplete();
        else handleNext();
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev, handleComplete, handleSkip, isLast]);

  const AccentIcon = step.accentIcon;

  // Compute animation classes for step content
  const stepContentClass = isAnimating
    ? direction === 'next'
      ? 'tutorial-step-exiting-next'
      : 'tutorial-step-exiting-prev'
    : 'tutorial-step-entering';

  return (
    <div
      className={`fixed inset-0 z-100 flex items-start sm:items-center justify-center transition-all duration-500 overflow-y-auto
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-overlay tutorial-backdrop"
        onClick={handleSkip}
      />

      {/* Content Card Container - handles scrolling */}
      <div
        className={`relative z-10 w-full max-w-2xl mx-4 my-2 sm:my-8 transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
      >
        {/* Main Card - max height with scroll on mobile */}
        <div className="bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden tutorial-card-enter max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col">
          
          {/* Header band with accent */}
          <div className="relative px-4 pt-3 pb-3 sm:px-8 sm:pt-8 sm:pb-6 overflow-hidden shrink-0">
            {/* Skip button - inside card header on mobile */}
            {!isLast && (
              <button
                onClick={handleSkip}
                className="absolute top-2 right-10 sm:top-4 sm:right-16 z-20 flex items-center gap-1 px-2 py-1 text-xs font-medium text-fg-subtle hover:text-fg transition-colors rounded-lg hover:bg-hover"
              >
                <span>{t('tutorial.skip')}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {/* Decorative accent background */}
            <div className="absolute -top-2 -right-1 w-24 h-24 sm:w-40 sm:h-40 opacity-[0.06] dark:opacity-[0.08] tutorial-float rotate-15 pointer-events-none z-0" style={{ animationDelay: '1.2s' }}>
              <AccentIcon className="w-full h-full" strokeWidth={1.5} />
            </div>

            {/* Shimmer accent */}
            <div className="absolute inset-0 tutorial-shimmer pointer-events-none" />

            {/* Step indicator pills */}
            <div className="flex items-center gap-1.5 mb-4 sm:mb-6 relative">
              {tutorialSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full tutorial-dot
                    ${i === currentStep
                      ? 'w-8 bg-accent'
                      : i < currentStep
                        ? 'w-3 bg-fg-subtle'
                        : 'w-3 bg-hover'
                    }`}
                />
              ))}
              <span className="ml-auto text-xs font-medium text-fg-subtle tabular-nums">
                {currentStep + 1} / {tutorialSteps.length}
              </span>
            </div>

            {/* Title area with transition */}
            <div className={`tutorial-step-content ${stepContentClass}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-2">
                {step.subtitle}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
                {step.title}
              </h2>
            </div>
          </div>

          {/* Body - scrollable on mobile */}
          <div className="px-4 pb-4 sm:px-8 sm:pb-6 overflow-y-auto">
            <div className={`tutorial-step-content ${stepContentClass}`}>
              <p className="text-fg-muted text-sm sm:text-[15px] leading-relaxed mb-4 sm:mb-6">
                {step.description}
              </p>

              {/* Feature cards */}
              <div className="grid gap-2 sm:gap-3">
                {step.features.map((feature, idx) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div
                      key={`${step.id}-${idx}`}
                      className="tutorial-feature-card group flex items-start gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-muted border border-border hover:border-border-strong"
                      style={{
                        opacity: isAnimating ? 0 : 1,
                        transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
                      }}
                    >
                      <div className="shrink-0 p-2 sm:p-2.5 rounded-md sm:rounded-lg bg-hover group-hover:bg-accent transition-colors duration-200">
                        <FeatureIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-fg-muted group-hover:text-accent-fg transition-colors duration-200" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-fg mb-0.5">
                          {feature.label}
                        </h4>
                        <p className="text-xs text-fg-muted leading-relaxed">
                          {feature.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {step.showSillyTavernCallout && (
                <div className="mt-3 sm:mt-4 relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl overflow-hidden bg-linear-to-r from-amber-900/80 via-yellow-800/80 to-amber-900/80 dark:from-amber-900/60 dark:via-yellow-700/50 dark:to-amber-900/60 border border-amber-500/30 shadow-[0_0_24px_-4px_rgba(251,191,36,0.3)]">
                  {/* Golden shimmer sweep */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 big-linear-to-r from-transparent via-amber-200/30 to-transparent animate-[golden-shimmer_2s_linear_infinite]" />
                  </div>
                  {/* Glow dots */}
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-400/20 rounded-full blur-lg pointer-events-none" />
                  <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-yellow-300/15 rounded-full blur-md pointer-events-none" />

                  <Zap className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                  <span className="relative text-xs sm:text-sm text-amber-50 font-semibold leading-tight">
                    {t('tutorial.integration')}
                  </span>
                  <a
                    href="https://github.com/spaceman2408/SillyTavern-CharacterVaultExport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative shrink-0 ml-auto p-1.5 text-amber-300 hover:text-white hover:bg-surface/10 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <style>{`
                    @keyframes golden-shimmer {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(200%); }
                    }
                  `}</style>
                </div>
              )}
            </div>
          </div>

          {/* Footer / Navigation */}
          <div className="px-4 py-3 sm:px-8 sm:py-5 border-t border-border bg-muted flex items-center justify-between shrink-0">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                ${isFirst
                  ? 'text-fg-subtle cursor-not-allowed'
                  : 'text-fg-muted hover:bg-hover active:scale-95'
                }`}
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('tutorial.back')}</span>
            </button>

            <button
              onClick={isLast ? handleComplete : handleNext}
              className="flex items-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-accent text-accent-fg hover:opacity-90 active:scale-95 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isLast ? (
                <>
                  <span className="hidden sm:inline">{t('tutorial.getStarted')}</span>
                  <span className="sm:hidden">{t('tutorial.start')}</span>
                  <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              ) : (
                <>
                  {t('tutorial.next')}
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tutorial utility functions are attached to the component
// to avoid breaking React Fast Refresh (no non-component exports allowed)
WelcomeTutorial.isCompleted = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

WelcomeTutorial.reset = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
