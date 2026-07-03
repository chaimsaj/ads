import { useMemo, useRef, useState, type MouseEvent } from 'react';
import styles from './TimeSeriesChart.module.css';

export interface ChartSeries {
  /** Legend/tooltip label. */
  name: string;
  /** CSS color (token or hex) for the line and area. */
  color: string;
  /** One value per label; must align with `labels`. */
  values: number[];
  /** Draw a soft area fill under the line. */
  area?: boolean;
  /** Per-series value formatter for the tooltip (falls back to `yFormat`). */
  format?: (value: number) => string;
}

export interface TimeSeriesChartProps {
  /** X-axis labels (typically dates), one per data point. */
  labels: string[];
  series: ChartSeries[];
  /** ViewBox height; the chart scales responsively to its container width. */
  height?: number;
  /** Formatter for the Y-axis ticks and default tooltip values. */
  yFormat?: (value: number) => string;
}

const VIEW_WIDTH = 760;
const PADDING = { top: 16, right: 20, bottom: 30, left: 56 };
const Y_TICKS = 4;

/** Round a maximum up to a clean axis bound (1/2/2.5/5 × 10ⁿ). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

const defaultFormat = (value: number): string =>
  new Intl.NumberFormat('en-US', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);

/**
 * Dependency-free, responsive multi-series line/area chart with a Y grid,
 * thinned X labels, and an interactive hover tooltip. Styled via design tokens.
 */
export function TimeSeriesChart({ labels, series, height = 260, yFormat = defaultFormat }: TimeSeriesChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const count = labels.length;
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const yMax = useMemo(() => {
    const max = Math.max(0, ...series.flatMap((s) => s.values));
    return niceCeil(max);
  }, [series]);

  const xFor = (index: number): number =>
    count <= 1 ? PADDING.left + plotWidth / 2 : PADDING.left + (index / (count - 1)) * plotWidth;
  const yFor = (value: number): number => PADDING.top + plotHeight - (value / yMax) * plotHeight;

  const buildLine = (values: number[]): string =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
  const buildArea = (values: number[]): string => {
    const baseline = yFor(0);
    return `${buildLine(values)} L${xFor(count - 1).toFixed(1)},${baseline.toFixed(1)} L${xFor(0).toFixed(1)},${baseline.toFixed(1)} Z`;
  };

  const yGrid = Array.from({ length: Y_TICKS + 1 }, (_, i) => (yMax / Y_TICKS) * i);
  const xStep = Math.max(1, Math.ceil(count / 8));

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || count === 0) return;
    const viewX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    const ratio = count <= 1 ? 0 : (viewX - PADDING.left) / plotWidth;
    setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  };

  const tooltipLeftPct = hover === null ? 0 : (xFor(hover) / VIEW_WIDTH) * 100;

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} className={styles.svg} role="img" aria-label="Performance trend chart">
        {yGrid.map((value) => (
          <g key={value}>
            <line
              x1={PADDING.left}
              x2={VIEW_WIDTH - PADDING.right}
              y1={yFor(value)}
              y2={yFor(value)}
              className={styles.grid}
            />
            <text x={PADDING.left - 8} y={yFor(value) + 4} className={styles.yLabel} textAnchor="end">
              {yFormat(value)}
            </text>
          </g>
        ))}

        {labels.map((label, i) =>
          i % xStep === 0 || i === count - 1 ? (
            <text key={label + i} x={xFor(i)} y={height - 10} className={styles.xLabel} textAnchor="middle">
              {label}
            </text>
          ) : null,
        )}

        {series.map((s) =>
          s.area ? <path key={`a-${s.name}`} d={buildArea(s.values)} fill={s.color} className={styles.area} /> : null,
        )}
        {series.map((s) => (
          <path key={`l-${s.name}`} d={buildLine(s.values)} fill="none" stroke={s.color} className={styles.line} />
        ))}

        {hover !== null && (
          <>
            <line
              x1={xFor(hover)}
              x2={xFor(hover)}
              y1={PADDING.top}
              y2={PADDING.top + plotHeight}
              className={styles.hoverLine}
            />
            {series.map((s) => (
              <circle key={`d-${s.name}`} cx={xFor(hover)} cy={yFor(s.values[hover] ?? 0)} r={3.5} fill={s.color} className={styles.dot} />
            ))}
          </>
        )}
      </svg>

      {hover !== null && (
        <div
          className={styles.tooltip}
          style={{ left: `${tooltipLeftPct}%`, transform: `translateX(${tooltipLeftPct > 70 ? '-100%' : tooltipLeftPct < 30 ? '0' : '-50%'})` }}
        >
          <span className={styles.tooltipDate}>{labels[hover]}</span>
          {series.map((s) => (
            <span key={s.name} className={styles.tooltipRow}>
              <span className={styles.tooltipDot} style={{ backgroundColor: s.color }} />
              <span className={styles.tooltipName}>{s.name}</span>
              <span className={styles.tooltipValue}>{(s.format ?? yFormat)(s.values[hover] ?? 0)}</span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.legend}>
        {series.map((s) => (
          <span key={s.name} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
