import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { CharacterListItem } from '../../db';
import type { CardExportFormat } from './types';
import { CharacterCard } from './CharacterCard';
import { CharacterCardSkeleton } from './CharacterCardSkeleton';
import { getVisiblePageNumbers } from './utils';
import { useI18n } from '../../i18n';

export interface VaultGridProps {
  isLoading: boolean;
  pageSize: number;
  sortedCharacters: CharacterListItem[];
  visibleCharacters: CharacterListItem[];
  searchQuery: string;
  safeCurrentPage: number;
  totalPages: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  onExport: (id: string, format: CardExportFormat) => Promise<void>;
  exportingCardId: string | null;
  onImportClick: () => void;
}

export function VaultGrid({
  isLoading,
  pageSize,
  sortedCharacters,
  visibleCharacters,
  searchQuery,
  safeCurrentPage,
  totalPages,
  onPageChange,
  onOpen,
  onDuplicate,
  onDelete,
  onExport,
  exportingCardId,
  onImportClick,
}: VaultGridProps): React.ReactElement {
  const { t } = useI18n();
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
        {[...Array(pageSize)].map((_, i) => (
          <CharacterCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (sortedCharacters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 border border-border">
          <Users className="w-10 h-10 text-fg-subtle" />
        </div>
        <h3 className="text-lg font-medium text-fg">{t('vault.noCharacters')}</h3>
        <p className="text-fg-muted mt-2 mb-8 max-w-sm">
          {searchQuery
            ? t('vault.noResults', { query: searchQuery })
            : t('vault.emptyHint')}
        </p>
        {!searchQuery && (
          <button
            type="button"
            onClick={onImportClick}
            className="px-6 py-2.5 border border-border-strong rounded-xl hover:bg-accent-soft hover:text-accent transition-colors font-medium"
          >
            {t('vault.importCard')}
          </button>
        )}
      </div>
    );
  }

  const totalCount = sortedCharacters.length;
  const rangeStart = totalCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(rangeStart + visibleCharacters.length - 1, totalCount);
  const pageNumbers = getVisiblePageNumbers(safeCurrentPage, totalPages);

  const goToPage = (page: number | ((prev: number) => number)) => {
    onPageChange(page);
    requestAnimationFrame(() => {
      document.getElementById('vault-grid-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const pagination = (label: string) => (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => goToPage((prev) => Math.max(1, prev - 1))}
        disabled={safeCurrentPage === 1}
        aria-label={t('vault.previousPage')}
        className="inline-flex items-center gap-1 px-3 py-2 bg-surface border border-border rounded-full hover:border-accent/40 hover:bg-accent-soft hover:text-accent transition-all text-sm font-medium text-fg-muted disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface disabled:hover:text-fg-muted"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{t('common.previous')}</span>
      </button>
      {pageNumbers.map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-sm text-fg-subtle">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            disabled={page === safeCurrentPage}
            aria-label={t('vault.goToPage', { page })}
            aria-current={page === safeCurrentPage ? 'page' : undefined}
            className={`min-w-9 px-2.5 py-2 rounded-full text-sm font-medium transition-all border ${
              page === safeCurrentPage
                ? 'bg-accent text-accent-fg border-accent shadow-sm'
                : 'bg-surface border-border text-fg-muted hover:border-accent/40 hover:bg-accent-soft hover:text-accent'
            }`}
          >
            {page}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => goToPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={safeCurrentPage === totalPages}
        aria-label={t('vault.nextPage')}
        className="inline-flex items-center gap-1 px-3 py-2 bg-surface border border-border rounded-full hover:border-accent/40 hover:bg-accent-soft hover:text-accent transition-all text-sm font-medium text-fg-muted disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface disabled:hover:text-fg-muted"
      >
        <span className="hidden sm:inline">{t('common.next')}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );

  return (
    <>
      <div id="vault-grid-top" className="scroll-mt-20" />
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pb-6">
          {pagination('Library pages (top)')}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
        {visibleCharacters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onExport={onExport}
            isExporting={exportingCardId === char.id}
          />
        ))}
      </div>

      {totalPages <= 1 ? (
        <p className="pt-8 pb-20 text-center text-sm text-fg-muted">
          {t('vault.showing', { count: totalCount })}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 pt-8 pb-20">
          <p className="text-sm text-fg-muted" aria-live="polite">
            {t('vault.showingRange', { start: rangeStart, end: rangeEnd, total: totalCount })}
            <span className="text-fg-subtle"> · {t('vault.pageOf', { page: safeCurrentPage, total: totalPages })}</span>
          </p>
          {pagination('Library pages')}
        </div>
      )}
    </>
  );
}
