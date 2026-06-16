import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showPageSize?: boolean;
}

const pageSizeOptions = [10, 25, 50, 100];

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  showPageSize = true,
}: PaginationProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        Showing {startItem} to {endItem} of {total} results
      </div>

      <div className={styles.controls}>
        {showPageSize && onLimitChange && (
          <div className={styles.pageSize}>
            <label htmlFor="page-size" className={styles.label}>
              Show
            </label>
            <select
              id="page-size"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className={styles.select}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.buttons}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrev}
            aria-label="First page"
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrev}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </Button>

          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Last page"
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
