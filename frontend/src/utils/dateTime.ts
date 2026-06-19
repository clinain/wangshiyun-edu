const CHINA_TIME_ZONE = 'Asia/Shanghai';

const hasExplicitTimezone = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());

export const parseAppDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const date = new Date(hasExplicitTimezone(normalized) ? normalized : normalized + 'Z');
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatChinaDateTime = (value?: string | null) => {
  const date = parseAppDate(value);
  if (!date) return value || '-';

  return date.toLocaleString('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatChinaDate = (value?: string | null) => {
  const date = parseAppDate(value);
  if (!date) return value || '-';

  return date.toLocaleDateString('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
