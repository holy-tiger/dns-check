// URL params that mark a page as "opened from a generated share link":
// - targets / domains / urls / autostart: generated test link (ShareLinkModal)
// - reportId / id: restored report link (UploadReportModal / auto-upload viewUrl)
// - share: explicit marker for share links
export const SHARE_VIEW_PARAM_KEYS = [
  'share',
  'targets',
  'domains',
  'urls',
  'autostart',
  'reportId',
  'id',
];

/**
 * Whether the current page was opened from a generated share link.
 *
 * Used to hide owner-only entries ("按 ID 查阅报告" / "生成测试链接") from recipients
 * of a shared test link or a shared report link, while keeping them on the
 * normal workbench page.
 */
export const detectShareLinkView = (search?: string): boolean => {
  let query = search;

  if (query === undefined) {
    if (typeof window === 'undefined') return false;
    query = window.location.search;
  }

  const params = new URLSearchParams(query);
  return SHARE_VIEW_PARAM_KEYS.some((key) => params.has(key));
};
