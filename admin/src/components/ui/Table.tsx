import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortDirection, TableColumn } from '../../types';
import styles from './Table.module.css';

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onSort?: (key: string, direction: SortDirection) => void;
  sortKey?: string;
  sortDirection?: SortDirection;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No data available',
  loading = false,
}: TableProps<T>) {
  const [localSortKey, setLocalSortKey] = useState<string | undefined>(sortKey);
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(sortDirection || 'asc');

  const handleSort = (key: string) => {
    const newDirection = localSortKey === key && localSortDirection === 'asc' ? 'desc' : 'asc';
    setLocalSortKey(key);
    setLocalSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      onSelectionChange?.(new Set());
    } else {
      const allIds = new Set(data.map((item) => String(item[keyField])));
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange?.(newSelected);
  };

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {selectable && (
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartialSelected;
                  }}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`${styles.th} ${column.sortable ? styles.sortable : ''} ${
                  localSortKey === column.key ? styles.sorted : ''
                }`}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className={styles.thContent}>
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className={styles.sortIcon}>
                      {localSortKey === column.key ? (
                        localSortDirection === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronDown size={14} className={styles.sortIconInactive} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className={styles.tr}>
                {selectable && (
                  <td className={styles.checkboxCell}>
                    <div className={styles.skeleton} style={{ width: 16, height: 16 }} />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={String(column.key)} className={styles.td}>
                    <div className={styles.skeleton} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.emptyCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const id = String(item[keyField]);
              const isSelected = selectedIds.has(id);

              return (
                <tr key={id} className={`${styles.tr} ${isSelected ? styles.selected : ''}`}>
                  {selectable && (
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(id)}
                        className={styles.checkbox}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={String(column.key)} className={styles.td}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
