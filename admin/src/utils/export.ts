import { formatCurrency } from './formatters';

type ExportData = Record<string, unknown>[];

const titleCase = (v: unknown): string =>
  String(v)
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

interface ExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function exportToCSV(
  data: ExportData,
  columns: ExportColumn[],
  filename: string
): void {
  const headers = columns.map((col) => escapeCSV(col.label)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.format ? col.format(value) : formatValue(value);
        return escapeCSV(formatted);
      })
      .join(',')
  );

  const csv = [headers, ...rows].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportUsersToCSV(users: ExportData): void {
  const columns: ExportColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', format: titleCase },
    { key: 'status', label: 'Status', format: titleCase },
    { key: 'totalCampaigns', label: 'Campaigns' },
    { key: 'totalSpend', label: 'Total Spend', format: (v) => formatCurrency(Number(v)) },
    { key: 'createdAt', label: 'Joined', format: (v) => new Date(String(v)).toLocaleDateString() },
    { key: 'lastLogin', label: 'Last Login', format: (v) => v ? new Date(String(v)).toLocaleDateString() : 'Never' },
  ];

  exportToCSV(users, columns, `users_export_${Date.now()}`);
}

export function exportCampaignsToCSV(campaigns: ExportData): void {
  const columns: ExportColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'userName', label: 'Owner' },
    { key: 'status', label: 'Status', format: titleCase },
    { key: 'adType', label: 'Ad Type', format: titleCase },
    { key: 'adFormat', label: 'Ad Format', format: titleCase },
    { key: 'boostType', label: 'Boost Type', format: titleCase },
    { key: 'budget', label: 'Budget', format: (v) => formatCurrency(Number(v)) },
    { key: 'spent', label: 'Spent', format: (v) => formatCurrency(Number(v)) },
    { key: 'impressions', label: 'Impressions' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr', label: 'CTR', format: (v) => `${Number(v).toFixed(2)}%` },
    { key: 'conversions', label: 'Conversions' },
    { key: 'revenue', label: 'Revenue', format: (v) => formatCurrency(Number(v)) },
    { key: 'roi', label: 'ROI', format: (v) => `${Number(v).toFixed(2)}%` },
    { key: 'startDate', label: 'Start Date', format: (v) => new Date(String(v)).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', format: (v) => new Date(String(v)).toLocaleDateString() },
    { key: 'createdAt', label: 'Created', format: (v) => new Date(String(v)).toLocaleDateString() },
  ];

  exportToCSV(campaigns, columns, `campaigns_export_${Date.now()}`);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
