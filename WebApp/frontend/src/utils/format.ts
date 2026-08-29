/** 时间格式化：7 天内显示 MM-DD HH:mm，更早显示 YYYY-MM-DD；非法输入返回空串 */
export function formatTime(value?: string | null): string {
  if (!value) return "";
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return t.getTime() >= weekAgo
    ? `${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
    : `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}
