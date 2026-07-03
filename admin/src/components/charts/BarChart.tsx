import styles from './BarChart.module.css';

export interface BarChartItem {
  label: string;
  value: number;
  /** Optional secondary caption shown to the right of the formatted value. */
  caption?: string;
}

export interface BarChartProps {
  items: BarChartItem[];
  /** Bar/label color (token or hex). */
  color?: string;
  format?: (value: number) => string;
}

const defaultFormat = (value: number): string => new Intl.NumberFormat('en-US').format(value);

/** Compact horizontal bar chart for rankings (e.g. top campaigns by spend). */
export function BarChart({ items, color = 'var(--color-primary-700)', format = defaultFormat }: BarChartProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className={styles.chart}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <span className={styles.label} title={item.label}>
            {item.label}
          </span>
          <div className={styles.track}>
            <div
              className={styles.bar}
              style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%`, backgroundColor: color }}
            />
          </div>
          <span className={styles.value}>
            {format(item.value)}
            {item.caption ? <span className={styles.caption}> · {item.caption}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
