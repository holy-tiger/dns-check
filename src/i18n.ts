import { SupportedLang } from './types';

export interface Translations {
  appTitle: string;
  appBadge: string;
  appSubtitle: string;
  navDns: string;
  navTcp: string;
  navTls: string;

  // Input & Header
  targetsLabel: string;
  targetsHelp: string;
  inputTitle: string;
  inputSubtitle: string;
  advancedSettings: string;
  advancedBtn: string;
  clear: string;
  clearBtn: string;
  placeholderText: string;
  placeholder: string;
  readyCount: string;
  targetsReadyCount: string;

  // DNS & Timeout
  dnsServerLabel: string;
  customDnsLabel: string;
  dnsDefault: string;
  dnsAli: string;
  dnsTencent: string;
  dnsCloudflare: string;
  dnsGoogle: string;
  dnsCustom: string;
  customDnsPlaceholder: string;
  timeoutLabel: string;
  timeoutHelp: string;
  timeoutDesc: string;
  seconds: string;

  // Presets & Buttons
  quickFill: string;
  presetLabel: string;
  presetHealthy: string;
  presetFaulty: string;
  presetTrouble: string;
  startDetection: string;
  detecting: string;
  diagnosing: string;
  generateShareLink: string;
  generateLinkBtn: string;
  shareLinkTooltip: string;

  // Share Modal
  shareLinkModalTitle: string;
  shareLinkModalDesc: string;
  shareLinkSuccessNotice: string;
  copyLink: string;
  linkCopied: string;
  openLinkPreview: string;
  close: string;
  shareModalLangLabel: string;

  // Summary Metrics & Filters
  totalTargets: string;
  normalReach: string;
  statusHealthy: string;
  abnormalFailed: string;
  statusFailed: string;
  avgTime: string;
  avgDuration: string;
  filterAll: string;
  filterFailed: string;
  filterNormal: string;
  filterOk: string;
  searchPlaceholder: string;
  copyReport: string;
  reportCopied: string;
  copied: string;
  exportJson: string;
  viewFullReport: string;
  viewMarkdownReport: string;

  // Results List
  resultsListTitle: string;
  showingItems: string;
  showingCount: string;
  noMatchingItems: string;
  noFilterMatches: string;
  readyToStart: string;
  readyToDiagnoseTitle: string;
  readyToStartDesc: string;
  readyToDiagnoseDesc: string;
  footerText: string;
  footerNote: string;

  // Result Card
  retestTarget: string;
  copySingleReport: string;
  copySingle: string;
  openInNewTab: string;
  openInBrowser: string;
  errorReasonTitle: string;
  errorReasonLabel: string;
  phase: string;
  stage: string;
  troubleshootingSuggestions: string;
  suggestionLabel: string;
  showRawError: string;
  rawSystemError: string;
  normal: string;
  failed: string;
  stepOk: string;
  stepFailed: string;
  skipped: string;
  skippedNotice: string;
  dnsFailed: string;
  tcpTimeout: string;
  tcpFailed: string;
  tlsFailed: string;
  httpFailed: string;
  dnsStageName: string;
  dnsStage: string;
  tcpStageName: string;
  tcpStage: string;
  tlsStageName: string;
  tlsStage: string;
  httpStageName: string;
  httpStage: string;
  portLabel: string;
  port: string;
  expiredLabel: string;
  certExpired: string;
  remainingDays: string;
  certDaysRemaining: string;
  statusLabel: string;
  resolvedIpLabel: string;
  resolvedIp: string;
  toggleDetailsShow: string;
  toggleDetailsHide: string;
  collapseTechDetails: string;
  expandTechDetails: string;

  // Drawer
  dnsRecordsDetails: string;
  dnsRecordsTitle: string;
  aRecord: string;
  aaaaRecord: string;
  cnameRecord: string;
  noArecords: string;
  noAaaaRecords: string;
  tlsDetailsTitle: string;
  tlsCertTitle: string;
  tlsIssuer: string;
  certIssuer: string;
  tlsSubject: string;
  certSubject: string;
  tlsValidity: string;
  certValidity: string;
  tlsProtocol: string;
  certProtocol: string;
  httpDetailsTitle: string;
  httpHeaderTitle: string;
  httpStatus: string;
  httpServerHeader: string;
  httpContentType: string;
  httpRedirectLocation: string;
  httpLocation: string;

  // Report Modal
  reportModalTitle: string;
  reportModalHeader: string;
  reportTime: string;
  copyMarkdown: string;
  downloadMarkdown: string;
  downloadReport: string;
  copiedToClipboard: string;
  totalTestedCount: string;
  diagnosticDetectingTitle: string;
  diagnosingBannerTitle: string;
  diagnosticDetectingDesc: string;
  diagnosingBannerDesc: string;
  autoTestingNotice: string;

  // Upload & Local File Persistence & Restore
  uploadReportBtn: string;
  uploadingReport: string;
  autoUploadLabel: string;
  autoUploadBadge: string;
  autoSavedToast: string;
  viewReportBtn: string;
  uploadModalTitle: string;
  uploadModalDesc: string;
  reportUniqueId: string;
  restoreLink: string;
  copyRestoreLink: string;
  openInNewWindow: string;
  snapshotBannerTitle: string;
  snapshotBannerDesc: string;
  retestSnapshotBtn: string;
  exitSnapshotBtn: string;
  loadReportByIdBtn: string;
  loadReportModalTitle: string;
  loadReportModalDesc: string;
  inputReportIdPlaceholder: string;
  loadBtn: string;
  recentReportsTitle: string;
  noRecentReports: string;
  loadingReportData: string;
  reportNotFound: string;
  uploaderIpLabel: string;
  uploaderCountryLabel: string;
  uploaderLocationLabel: string;
}

export const translations: Record<SupportedLang, Translations> = {
  zh: {
    appTitle: 'DNS & 服务器网络连通性诊断工具',
    appBadge: '实时全链路诊断',
    appSubtitle: '多维度检测 DNS 解析、TCP 端口握手、SSL 证书状态与 HTTP 服务响应',
    navDns: 'DNS A/AAAA 权威解析',
    navTcp: 'TCP 端口与路由',
    navTls: 'TLS 证书校验',

    targetsLabel: '需要检测的目标地址 / 域名',
    targetsHelp: '支持直接输入域名（如 baidu.com）、完整链接（如 https://api.site.com:8443）或 IP 地址，每行一个或逗号隔开',
    inputTitle: '需要检测的目标地址 / 域名',
    inputSubtitle: '支持直接输入域名、URL 或 IP 地址，每行一个或逗号隔开',
    advancedSettings: '高级设置 (DNS / 超时)',
    advancedBtn: '高级设置',
    clear: '清空',
    clearBtn: '清空',
    placeholderText: '请输入待检测地址，例如：\nbaidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com',
    placeholder: '请输入待检测地址，例如：\nbaidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com',
    readyCount: '已就绪 {n} 个地址',
    targetsReadyCount: '已就绪 {count} 个地址',

    dnsServerLabel: '指定 DNS 解析服务器',
    customDnsLabel: '指定 DNS 解析服务器',
    dnsDefault: '系统默认 DNS (推荐)',
    dnsAli: '阿里 DNS (223.5.5.5)',
    dnsTencent: '腾讯 DNSPod (119.29.29.29)',
    dnsCloudflare: 'Cloudflare DNS (1.1.1.1)',
    dnsGoogle: 'Google Public DNS (8.8.8.8)',
    dnsCustom: '自定义 DNS 服务器',
    customDnsPlaceholder: '例如: 8.8.4.4 或 208.67.222.222',
    timeoutLabel: '单项阶段检测超时阈值',
    timeoutHelp: '包含 DNS 查询、TCP 握手和 TLS 验证各自的最大等待时间',
    timeoutDesc: '包含 DNS 查询、TCP 握手和 TLS 验证各自的最大等待时间',
    seconds: '{n} 秒',

    quickFill: '快速填入：',
    presetLabel: '快速预设',
    presetHealthy: '常见健康域名',
    presetFaulty: '故障与异常对照组 (查看具体错误)',
    presetTrouble: '故障与异常对照组',
    startDetection: '开始全面检测',
    detecting: '正在逐项探测网络链路...',
    diagnosing: '正在诊断中...',
    generateShareLink: '生成测试链接',
    generateLinkBtn: '生成测试链接',
    shareLinkTooltip: '将当前填写的域名生成专属测试链接，用户点击即可自动执行检测',

    shareLinkModalTitle: '生成并分享测试链接',
    shareLinkModalDesc: '将包含当前输入域名的专用链接发送给用户。打开链接后，将自动加载域名并立即开始连通性测试：',
    shareLinkSuccessNotice: '链接已生成！包含当前选中的语言与输入的域名',
    copyLink: '复制完整测试链接',
    linkCopied: '已复制链接到剪贴板',
    openLinkPreview: '在当前页面立即模拟打开',
    close: '关闭',
    shareModalLangLabel: '测试链接展示语言 (URL 参数: ?lang=)',

    totalTargets: '总检测地址',
    normalReach: '正常可连通',
    statusHealthy: '正常可连通',
    abnormalFailed: '异常 / 失败',
    statusFailed: '异常 / 失败',
    avgTime: '平均总耗时',
    avgDuration: '平均总耗时',
    filterAll: '全部 ({count})',
    filterFailed: '仅失败/异常 ({count})',
    filterNormal: '仅正常 ({count})',
    filterOk: '仅正常 ({count})',
    searchPlaceholder: '搜索域名或 IP...',
    copyReport: '复制简报',
    reportCopied: '已复制',
    copied: '已复制',
    exportJson: '导出 JSON',
    viewFullReport: '查看完整 Markdown 报告 →',
    viewMarkdownReport: '查看完整 Markdown 报告 →',

    resultsListTitle: '检测结果列表',
    showingItems: '展示 {filtered} / {total} 项',
    showingCount: '展示 {current} / {total} 项',
    noMatchingItems: '未找到符合筛选条件的检测项',
    noFilterMatches: '未找到符合筛选条件的检测项',
    readyToStart: '准备开始检测',
    readyToDiagnoseTitle: '准备开始检测',
    readyToStartDesc: '请在上方输入需要检测的网站域名或服务器地址，点击“开始全面检测”分析 DNS、TCP 及证书状态',
    readyToDiagnoseDesc: '请在上方输入需要检测的网站域名或服务器地址，点击“开始全面检测”分析 DNS、TCP 及证书状态',
    footerText: 'DNS & 服务器网络连通性诊断工具 · 提供详尽的 DNS 解析错误分析、TCP 握手与 SSL/TLS 证书检查',
    footerNote: 'DNS & 服务器网络连通性诊断工具 · 提供详尽的 DNS 解析错误分析、TCP 握手与 SSL/TLS 证书检查',

    retestTarget: '重新检测该域名',
    copySingleReport: '复制检测报告',
    copySingle: '复制检测报告',
    openInNewTab: '在浏览器新标签页中打开目标地址',
    openInBrowser: '在浏览器新标签页中打开目标地址',
    errorReasonTitle: '具体错误原因分析',
    errorReasonLabel: '具体错误原因分析',
    phase: '阶段',
    stage: '阶段',
    troubleshootingSuggestions: '排查与修复建议',
    suggestionLabel: '排查与修复建议',
    showRawError: '查看底层系统原生报错信息',
    rawSystemError: '查看底层系统原生报错信息',
    normal: '正常',
    failed: '失败',
    stepOk: '正常',
    stepFailed: '失败',
    skipped: '已跳过',
    skippedNotice: '因前序失败未执行',
    dnsFailed: 'DNS 解析失败',
    tcpTimeout: '连接超时',
    tcpFailed: '端口连接拒绝',
    tlsFailed: 'TLS 证书异常',
    httpFailed: 'HTTP 服务异常',
    dnsStageName: 'DNS 解析',
    dnsStage: 'DNS 解析',
    tcpStageName: 'TCP 连通',
    tcpStage: 'TCP 连通',
    tlsStageName: 'TLS 证书',
    tlsStage: 'TLS 证书',
    httpStageName: 'HTTP 响应',
    httpStage: 'HTTP 响应',
    portLabel: '端口',
    port: '端口',
    expiredLabel: '已过期',
    certExpired: '已过期',
    remainingDays: '有效期剩 {days} 天',
    certDaysRemaining: '有效期剩 {days} 天',
    statusLabel: '状态',
    resolvedIpLabel: '解析 IP',
    resolvedIp: '解析 IP',
    toggleDetailsShow: '展开技术详情 (A/AAAA记录/证书/Header)',
    toggleDetailsHide: '收起技术参数',
    collapseTechDetails: '收起技术参数',
    expandTechDetails: '展开技术详情 (A/AAAA记录/证书/Header)',

    dnsRecordsDetails: 'DNS 解析记录详情',
    dnsRecordsTitle: 'DNS 解析记录详情',
    aRecord: 'A 记录 (IPv4)',
    aaaaRecord: 'AAAA 记录 (IPv6)',
    cnameRecord: 'CNAME 别名',
    noArecords: '无 IPv4 记录',
    noAaaaRecords: '无 IPv6 记录',
    tlsDetailsTitle: 'SSL / TLS 证书与握手信息',
    tlsCertTitle: 'SSL / TLS 证书与握手信息',
    tlsIssuer: '证书颁发机构 (Issuer)',
    certIssuer: '证书颁发机构 (Issuer)',
    tlsSubject: '证书主体 (Subject)',
    certSubject: '证书主体 (Subject)',
    tlsValidity: '起止有效期',
    certValidity: '起止有效期',
    tlsProtocol: '协商协议',
    certProtocol: '协商协议',
    httpDetailsTitle: 'HTTP 服务响应首部信息',
    httpHeaderTitle: 'HTTP 服务响应首部信息',
    httpStatus: 'HTTP 状态',
    httpServerHeader: 'Server 首部',
    httpContentType: 'Content-Type',
    httpRedirectLocation: '重定向目标 (Location)',
    httpLocation: '重定向目标 (Location)',

    reportModalTitle: '网络连通与 DNS 诊断完整报告',
    reportModalHeader: '网络与 DNS 连通性诊断报告',
    reportTime: '生成时间',
    copyMarkdown: '复制 Markdown 报告',
    downloadMarkdown: '下载 .md 报告文件',
    downloadReport: '下载 .md 报告文件',
    copiedToClipboard: '已复制到剪贴板',
    totalTestedCount: '共计 {total} 个地址的诊断结果',
    diagnosticDetectingTitle: '正在执行全链路诊断探测...',
    diagnosingBannerTitle: '正在执行全链路诊断探测...',
    diagnosticDetectingDesc: '系统正在依次对目标地址执行权威 DNS A/AAAA 解析、TCP 端口握手、TLS 证书完整性校验以及 HTTP 服务首部探测',
    diagnosingBannerDesc: '系统正在依次对目标地址执行权威 DNS A/AAAA 解析、TCP 端口握手、TLS 证书完整性校验以及 HTTP 服务首部探测',
    autoTestingNotice: '已根据 URL 参数自动载入目标地址并启动检测...',

    // Upload & Local File Persistence & Restore
    uploadReportBtn: '上报保存结果',
    uploadingReport: '正在上报保存...',
    autoUploadLabel: '检测完成后自动上报并保存',
    autoUploadBadge: '已开启自动上报保存',
    autoSavedToast: '已自动上报并保存到服务器文件 ({id})',
    viewReportBtn: '查看快照',
    uploadModalTitle: '检测结果已成功上报并保存到本地文件',
    uploadModalDesc: '本次诊断的所有数据已生成唯一标识，并写入服务器本地文件。其他用户打开还原链接后，可完整重现全部指标与详细错误原因：',
    reportUniqueId: '报告唯一标识 (ID)',
    restoreLink: '快照还原查看链接',
    copyRestoreLink: '复制还原链接',
    openInNewWindow: '在新标签页打开快照',
    snapshotBannerTitle: '正在查看已上报的历史诊断快照',
    snapshotBannerDesc: '报告 ID: {id} · 上报时间: {time} · 包含 {count} 个目标',
    retestSnapshotBtn: '以此目标重新检测',
    exitSnapshotBtn: '退出快照模式',
    loadReportByIdBtn: '按 ID 查阅报告',
    loadReportModalTitle: '载入已上报的历史诊断快照',
    loadReportModalDesc: '输入已生成的报告 ID（如 rep_xxx），或从下方服务器最近保存的报告文件中直接选取载入：',
    inputReportIdPlaceholder: '请输入报告 ID，例如 rep_123456',
    loadBtn: '载入并还原',
    recentReportsTitle: '服务器最近保存的报告文件',
    noRecentReports: '暂无已保存的报告文件',
    loadingReportData: '正在从服务器读取已保存的报告文件...',
    reportNotFound: '未找到指定的报告文件，请检查 ID 是否正确',
    uploaderIpLabel: '上报者客户端 IP',
    uploaderCountryLabel: 'IP 所属国家/地区',
    uploaderLocationLabel: '地理位置归属',
  },

  en: {
    appTitle: 'DNS & Server Connectivity Checker',
    appBadge: 'Real-Time Full Pipeline Probe',
    appSubtitle: 'In-depth diagnostics for DNS resolution, TCP port handshakes, SSL certificates, and HTTP response',
    navDns: 'Authoritative DNS A/AAAA',
    navTcp: 'TCP Port & Route',
    navTls: 'TLS Certificate Verification',

    targetsLabel: 'Targets to Test (Domains / URLs / IPs)',
    targetsHelp: 'Enter domain names (e.g. baidu.com), complete URLs (e.g. https://api.site.com:8443) or IP addresses, one per line or comma-separated',
    inputTitle: 'Targets to Test (Domains / URLs / IPs)',
    inputSubtitle: 'Enter domain names, URLs, or IP addresses, one per line or comma-separated',
    advancedSettings: 'Advanced Settings (DNS / Timeout)',
    advancedBtn: 'Advanced Settings',
    clear: 'Clear',
    clearBtn: 'Clear',
    placeholderText: 'Enter targets to diagnose, e.g.:\nbaidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com',
    placeholder: 'Enter targets to diagnose, e.g.:\nbaidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com',
    readyCount: '{n} target(s) ready',
    targetsReadyCount: '{count} target(s) ready',

    dnsServerLabel: 'DNS Resolver Server',
    customDnsLabel: 'DNS Resolver Server',
    dnsDefault: 'System Default DNS (Recommended)',
    dnsAli: 'Ali DNS (223.5.5.5)',
    dnsTencent: 'Tencent DNSPod (119.29.29.29)',
    dnsCloudflare: 'Cloudflare DNS (1.1.1.1)',
    dnsGoogle: 'Google Public DNS (8.8.8.8)',
    dnsCustom: 'Custom DNS Server',
    customDnsPlaceholder: 'e.g. 8.8.4.4 or 208.67.222.222',
    timeoutLabel: 'Per-Step Timeout Threshold',
    timeoutHelp: 'Maximum wait time for DNS resolution, TCP handshake, and TLS verification',
    timeoutDesc: 'Maximum wait time for DNS resolution, TCP handshake, and TLS verification',
    seconds: '{n}s',

    quickFill: 'Quick presets:',
    presetLabel: 'Quick Presets',
    presetHealthy: 'Healthy Public Domains',
    presetFaulty: 'Failure & Anomaly Benchmarks',
    presetTrouble: 'Failure & Anomaly Benchmarks',
    startDetection: 'Start Diagnostics',
    detecting: 'Probing network pipeline...',
    diagnosing: 'Diagnosing...',
    generateShareLink: 'Generate Test Link',
    generateLinkBtn: 'Generate Test Link',
    shareLinkTooltip: 'Generate a shareable link with current domains; clicking it will start diagnostics automatically',

    shareLinkModalTitle: 'Generate & Share Test Link',
    shareLinkModalDesc: 'Send this unique link to users. When opened, it will prefill the domains and automatically trigger the connectivity check:',
    shareLinkSuccessNotice: 'Link generated! Includes the selected language and target domains',
    copyLink: 'Copy Full Test Link',
    linkCopied: 'Link copied to clipboard',
    openLinkPreview: 'Simulate open now',
    close: 'Close',
    shareModalLangLabel: 'Display language for test link (?lang=)',

    totalTargets: 'Total Targets',
    normalReach: 'Operational',
    statusHealthy: 'Operational',
    abnormalFailed: 'Errors / Anomalies',
    statusFailed: 'Errors / Anomalies',
    avgTime: 'Average Latency',
    avgDuration: 'Average Latency',
    filterAll: 'All ({count})',
    filterFailed: 'Errors Only ({count})',
    filterNormal: 'Operational Only ({count})',
    filterOk: 'Operational Only ({count})',
    searchPlaceholder: 'Search domain or IP...',
    copyReport: 'Copy Brief',
    reportCopied: 'Copied',
    copied: 'Copied',
    exportJson: 'Export JSON',
    viewFullReport: 'View Full Markdown Report →',
    viewMarkdownReport: 'View Full Markdown Report →',

    resultsListTitle: 'Diagnostic Results',
    showingItems: 'Showing {filtered} / {total} items',
    showingCount: 'Showing {current} / {total} items',
    noMatchingItems: 'No results match your filter criteria',
    noFilterMatches: 'No results match your filter criteria',
    readyToStart: 'Ready for Diagnosis',
    readyToDiagnoseTitle: 'Ready for Diagnosis',
    readyToStartDesc: 'Enter target domain names or server addresses above and click "Start Diagnostics" to analyze DNS, TCP, and TLS security',
    readyToDiagnoseDesc: 'Enter target domain names or server addresses above and click "Start Diagnostics" to analyze DNS, TCP, and TLS security',
    footerText: 'DNS & Server Connectivity Checker · Comprehensive DNS failure root cause analysis, TCP handshake & TLS certificate inspection',
    footerNote: 'DNS & Server Connectivity Checker · Comprehensive DNS failure root cause analysis, TCP handshake & TLS certificate inspection',

    retestTarget: 'Retest this target',
    copySingleReport: 'Copy report',
    copySingle: 'Copy report',
    openInNewTab: 'Open target in new browser tab',
    openInBrowser: 'Open target in new browser tab',
    errorReasonTitle: 'Root Cause Error Analysis',
    errorReasonLabel: 'Root Cause Error Analysis',
    phase: 'Phase',
    stage: 'Phase',
    troubleshootingSuggestions: 'Troubleshooting & Fix Suggestions',
    suggestionLabel: 'Troubleshooting & Fix Suggestions',
    showRawError: 'View low-level system error log',
    rawSystemError: 'View low-level system error log',
    normal: 'OK',
    failed: 'Failed',
    stepOk: 'OK',
    stepFailed: 'Failed',
    skipped: 'Skipped',
    skippedNotice: 'Skipped due to prior failure',
    dnsFailed: 'DNS Lookup Failed',
    tcpTimeout: 'Connection Timeout',
    tcpFailed: 'Connection Refused',
    tlsFailed: 'TLS Certificate Error',
    httpFailed: 'HTTP Service Error',
    dnsStageName: 'DNS Lookup',
    dnsStage: 'DNS Lookup',
    tcpStageName: 'TCP Handshake',
    tcpStage: 'TCP Handshake',
    tlsStageName: 'TLS / SSL',
    tlsStage: 'TLS / SSL',
    httpStageName: 'HTTP Probe',
    httpStage: 'HTTP Probe',
    portLabel: 'Port',
    port: 'Port',
    expiredLabel: 'Expired',
    certExpired: 'Expired',
    remainingDays: '{days} days remaining',
    certDaysRemaining: '{days} days remaining',
    statusLabel: 'Status',
    resolvedIpLabel: 'Resolved IP',
    resolvedIp: 'Resolved IP',
    toggleDetailsShow: 'Expand Technical Details (A/AAAA/Cert/Headers)',
    toggleDetailsHide: 'Hide Technical Details',
    collapseTechDetails: 'Hide Technical Details',
    expandTechDetails: 'Expand Technical Details (A/AAAA/Cert/Headers)',

    dnsRecordsDetails: 'DNS Record Details',
    dnsRecordsTitle: 'DNS Record Details',
    aRecord: 'A Record (IPv4)',
    aaaaRecord: 'AAAA Record (IPv6)',
    cnameRecord: 'CNAME Alias',
    noArecords: 'No IPv4 records',
    noAaaaRecords: 'No IPv6 records',
    tlsDetailsTitle: 'SSL / TLS Certificate & Handshake',
    tlsCertTitle: 'SSL / TLS Certificate & Handshake',
    tlsIssuer: 'Certificate Issuer',
    certIssuer: 'Certificate Issuer',
    tlsSubject: 'Certificate Subject',
    certSubject: 'Certificate Subject',
    tlsValidity: 'Validity Period',
    certValidity: 'Validity Period',
    tlsProtocol: 'Negotiated Protocol',
    certProtocol: 'Negotiated Protocol',
    httpDetailsTitle: 'HTTP Response Headers',
    httpHeaderTitle: 'HTTP Response Headers',
    httpStatus: 'HTTP Status',
    httpServerHeader: 'Server Header',
    httpContentType: 'Content-Type',
    httpRedirectLocation: 'Redirect Location',
    httpLocation: 'Redirect Location',

    reportModalTitle: 'Full Connectivity & DNS Diagnostic Report',
    reportModalHeader: 'Network & DNS Diagnostic Report',
    reportTime: 'Generated At',
    copyMarkdown: 'Copy Markdown Report',
    downloadMarkdown: 'Download .md File',
    downloadReport: 'Download .md File',
    copiedToClipboard: 'Copied to clipboard',
    totalTestedCount: 'Diagnostic results for {total} targets',
    diagnosticDetectingTitle: 'Executing Full Pipeline Diagnostics...',
    diagnosingBannerTitle: 'Executing Full Pipeline Diagnostics...',
    diagnosticDetectingDesc: 'System is sequentially performing authoritative DNS A/AAAA resolution, TCP socket connection, TLS certificate validation, and HTTP header probes',
    diagnosingBannerDesc: 'System is sequentially performing authoritative DNS A/AAAA resolution, TCP socket connection, TLS certificate validation, and HTTP header probes',
    autoTestingNotice: 'Automatically loaded targets from URL and started diagnostics...',

    // Upload & Local File Persistence & Restore
    uploadReportBtn: 'Upload & Save Report',
    uploadingReport: 'Uploading & Saving...',
    autoUploadLabel: 'Auto-upload & save report upon completion',
    autoUploadBadge: 'Auto-save enabled',
    autoSavedToast: 'Report automatically uploaded & saved to server ({id})',
    viewReportBtn: 'View Snapshot',
    uploadModalTitle: 'Report Successfully Uploaded & Saved to Local File',
    uploadModalDesc: 'All diagnostic data from this test has been assigned a unique ID and saved to the server local file system. Anyone with the restore link can inspect and verify the full results:',
    reportUniqueId: 'Unique Report ID',
    restoreLink: 'Restore & View Link',
    copyRestoreLink: 'Copy Restore Link',
    openInNewWindow: 'Open in New Tab',
    snapshotBannerTitle: 'Viewing Uploaded Diagnostic Snapshot',
    snapshotBannerDesc: 'Report ID: {id} · Uploaded: {time} · {count} target(s)',
    retestSnapshotBtn: 'Retest These Targets',
    exitSnapshotBtn: 'Exit Snapshot Mode',
    loadReportByIdBtn: 'View by Report ID',
    loadReportModalTitle: 'Load Saved Diagnostic Snapshot',
    loadReportModalDesc: 'Enter a report ID (e.g. rep_xxx) or select from recently saved reports on the server below:',
    inputReportIdPlaceholder: 'Enter Report ID, e.g. rep_123456',
    loadBtn: 'Load & Restore',
    recentReportsTitle: 'Recently Saved Reports on Server',
    noRecentReports: 'No saved reports found yet',
    loadingReportData: 'Loading saved report file from server...',
    reportNotFound: 'Report file not found. Please verify the ID.',
    uploaderIpLabel: 'Uploader Client IP',
    uploaderCountryLabel: 'IP Country / Region',
    uploaderLocationLabel: 'Geographic Location',
  },

  ar: {
    appTitle: 'أداة فحص نظام أسماء النطاقات (DNS) والاتصال بالخادم',
    appBadge: 'فحص فوري للمسار بالكامل',
    appSubtitle: 'تشخيص شامل لتحليل DNS، ومصافحة منافذ TCP، وحالة شهادات SSL، واستجابة خادم HTTP',
    navDns: 'تحليل DNS الرسمي A/AAAA',
    navTcp: 'منفذ وتوجيه TCP',
    navTls: 'التحقق من شهادة TLS',

    targetsLabel: 'العناوين والنطاقات المطلوب فحصها',
    targetsHelp: 'أدخل أسماء النطاقات (مثل baidu.com) أو الروابط الكاملة أو عناوين IP، سطرًا بسطر أو مفصولة بفواصل',
    inputTitle: 'العناوين والنطاقات المطلوب فحصها',
    inputSubtitle: 'أدخل أسماء النطاقات أو الروابط أو عناوين IP، سطرًا بسطر أو مفصولة بفواصل',
    advancedSettings: 'إعدادات متقدمة (DNS / المهلة)',
    advancedBtn: 'إعدادات متقدمة',
    clear: 'مسح',
    clearBtn: 'مسح',
    placeholderText: 'أدخل العناوين المطلوب فحصها، على سبيل المثال:\nbaidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com',
    placeholder: 'أدخل العناوين المطلوب فحصها، على سبيل المثال:\nbaidu.com\ngithub.com\ninvalid-domain-notfound-999.xyz\nexpired.badssl.com',
    readyCount: 'تم تجهيز {n} من العناوين',
    targetsReadyCount: 'تم تجهيز {count} من العناوين',

    dnsServerLabel: 'خادم محلل DNS المخصص',
    customDnsLabel: 'خادم محلل DNS المخصص',
    dnsDefault: 'خادم DNS الافتراضي للنظام (موصى به)',
    dnsAli: 'خادم Ali DNS (223.5.5.5)',
    dnsTencent: 'خادم Tencent DNSPod (119.29.29.29)',
    dnsCloudflare: 'خادم Cloudflare DNS (1.1.1.1)',
    dnsGoogle: 'خادم Google Public DNS (8.8.8.8)',
    dnsCustom: 'خادم DNS مخصص',
    customDnsPlaceholder: 'مثال: 8.8.4.4 أو 208.67.222.222',
    timeoutLabel: 'حد مهلة كل مرحلة فحص',
    timeoutHelp: 'أقصى وقت انتظار لاستعلام DNS، ومصافحة TCP، والتحقق من TLS',
    timeoutDesc: 'أقصى وقت انتظار لاستعلام DNS، ومصافحة TCP، والتحقق من TLS',
    seconds: '{n} ثوانٍ',

    quickFill: 'تعبئة سريعة:',
    presetLabel: 'خيارات جاهزة',
    presetHealthy: 'نطاقات عامة سليمة',
    presetFaulty: 'أمثلة أعطال وأخطاء',
    presetTrouble: 'أمثلة أعطال وأخطاء',
    startDetection: 'بدء الفحص الشامل',
    detecting: 'جاري استكشاف مسار الشبكة خطوة بخطوة...',
    diagnosing: 'جاري الفحص الآن...',
    generateShareLink: 'إنشاء رابط اختبار',
    generateLinkBtn: 'إنشاء رابط اختبار',
    shareLinkTooltip: 'توليد رابط فريد يحتوي على النطاقات المكتوبة، عند فتحه يبدأ الفحص تلقائيًا',

    shareLinkModalTitle: 'توليد ومشاركة رابط الاختبار',
    shareLinkModalDesc: 'أرسل هذا الرابط للمستخدمين، وعند النقر عليه سيتم ملء النطاقات وتشغيل الفحص فورياً تلقائياً:',
    shareLinkSuccessNotice: 'تم إنشاء الرابط بنجاح مع النطاقات واللغة المحددة',
    copyLink: 'نسخ رابط الاختبار الكامل',
    linkCopied: 'تم نسخ الرابط إلى الحافظة',
    openLinkPreview: 'معاينة وفتح الرابط الآن',
    close: 'إغلاق',
    shareModalLangLabel: 'لغة عرض رابط الاختبار (?lang=)',

    totalTargets: 'إجمالي العناوين',
    normalReach: 'متصل وسليم',
    statusHealthy: 'متصل وسليم',
    abnormalFailed: 'أخطاء / أعطال',
    statusFailed: 'أخطاء / أعطال',
    avgTime: 'متوسط وقت الاستجابة',
    avgDuration: 'متوسط وقت الاستجابة',
    filterAll: 'الكل ({count})',
    filterFailed: 'الفاشلة فقط ({count})',
    filterNormal: 'السليمة فقط ({count})',
    filterOk: 'السليمة فقط ({count})',
    searchPlaceholder: 'بحث بالاسم أو عنوان IP...',
    copyReport: 'نسخ الموجز',
    reportCopied: 'تم النسخ',
    copied: 'تم النسخ',
    exportJson: 'تصدير JSON',
    viewFullReport: 'عرض التقرير الكامل بصيغة Markdown ←',
    viewMarkdownReport: 'عرض التقرير الكامل بصيغة Markdown ←',

    resultsListTitle: 'قائمة نتائج الفحص',
    showingItems: 'عرض {filtered} من إجمالي {total}',
    showingCount: 'عرض {current} من إجمالي {total}',
    noMatchingItems: 'لا توجد نتائج تطابق معايير التصفية',
    noFilterMatches: 'لا توجد نتائج تطابق معايير التصفية',
    readyToStart: 'جاهز لبدء الفحص',
    readyToDiagnoseTitle: 'جاهز لبدء الفحص',
    readyToStartDesc: 'يرجى إدخال أسماء النطاقات أو عناوين الخوادم أعلاه والنقر على "بدء الفحص الشامل" لتحليل DNS و TCP و TLS',
    readyToDiagnoseDesc: 'يرجى إدخال أسماء النطاقات أو عناوين الخوادم أعلاه والنقر على "بدء الفحص الشامل" لتحليل DNS و TCP و TLS',
    footerText: 'أداة تشخيص اتصال الخوادم و DNS · تحليل تفصيلي لأسباب تعذر الوصول وأعطال الشهادات ومصافحة TCP',
    footerNote: 'أداة تشخيص اتصال الخوادم و DNS · تحليل تفصيلي لأسباب تعذر الوصول وأعطال الشهادات ومصافحة TCP',

    retestTarget: 'إعادة فحص هذا النطاق',
    copySingleReport: 'نسخ التقرير',
    copySingle: 'نسخ التقرير',
    openInNewTab: 'فتح الرابط في علامة تبويب جديدة',
    openInBrowser: 'فتح الرابط في علامة تبويب جديدة',
    errorReasonTitle: 'تحليل السبب الدقيق للفشل',
    errorReasonLabel: 'تحليل السبب الدقيق للفشل',
    phase: 'المرحلة',
    stage: 'المرحلة',
    troubleshootingSuggestions: 'إرشادات استكشاف الأخطاء والحلول',
    suggestionLabel: 'إرشادات استكشاف الأخطاء والحلول',
    showRawError: 'عرض رسالة الخطأ الأصلية من النظام',
    rawSystemError: 'عرض رسالة الخطأ الأصلية من النظام',
    normal: 'سليم',
    failed: 'فشل',
    stepOk: 'سليم',
    stepFailed: 'فشل',
    skipped: 'تم التخطي',
    skippedNotice: 'تم التخطي بسبب فشل خطوة سابقة',
    dnsFailed: 'فشل تحليل DNS',
    tcpTimeout: 'انتهت مهلة الاتصال',
    tcpFailed: 'تم رفض الاتصال بالمنفذ',
    tlsFailed: 'خطأ في شهادة TLS',
    httpFailed: 'خطأ في خدمة HTTP',
    dnsStageName: 'تحليل DNS',
    dnsStage: 'تحليل DNS',
    tcpStageName: 'اتصال TCP',
    tcpStage: 'اتصال TCP',
    tlsStageName: 'شهادة TLS',
    tlsStage: 'شهادة TLS',
    httpStageName: 'استجابة HTTP',
    httpStage: 'استجابة HTTP',
    portLabel: 'المنفذ',
    port: 'المنفذ',
    expiredLabel: 'منتهية الصلاحية',
    certExpired: 'منتهية الصلاحية',
    remainingDays: 'متبقي {days} يومًا',
    certDaysRemaining: 'متبقي {days} يومًا',
    statusLabel: 'الحالة',
    resolvedIpLabel: 'عنوان IP المحلل',
    resolvedIp: 'عنوان IP المحلل',
    toggleDetailsShow: 'عرض التفاصيل الفنية (سجلات A/AAAA والشهادة والرؤوس)',
    toggleDetailsHide: 'إخفاء التفاصيل الفنية',
    collapseTechDetails: 'إخفاء التفاصيل الفنية',
    expandTechDetails: 'عرض التفاصيل الفنية (سجلات A/AAAA والشهادة والرؤوس)',

    dnsRecordsDetails: 'تفاصيل سجلات نظام DNS',
    dnsRecordsTitle: 'تفاصيل سجلات نظام DNS',
    aRecord: 'سجل A (IPv4)',
    aaaaRecord: 'AAAA سجل (IPv6)',
    cnameRecord: 'الاسم المستعار CNAME',
    noArecords: 'لا يوجد سجل IPv4',
    noAaaaRecords: 'لا يوجد سجل IPv6',
    tlsDetailsTitle: 'معلومات شهادة SSL / TLS والمصافحة',
    tlsCertTitle: 'معلومات شهادة SSL / TLS والمصافحة',
    tlsIssuer: 'الجهة المصدرة للشهادة (Issuer)',
    certIssuer: 'الجهة المصدرة للشهادة (Issuer)',
    tlsSubject: 'موضوع الشهادة (Subject)',
    certSubject: 'موضوع الشهادة (Subject)',
    tlsValidity: 'فترة الصلاحية',
    certValidity: 'فترة الصلاحية',
    tlsProtocol: 'البروتوكول المتفاوض عليه',
    certProtocol: 'البروتوكول المتفاوض عليه',
    httpDetailsTitle: 'رؤوس استجابة خادم HTTP',
    httpHeaderTitle: 'رؤوس استجابة خادم HTTP',
    httpStatus: 'رمز حالة HTTP',
    httpServerHeader: 'رأس الخادم (Server)',
    httpContentType: 'نوع المحتوى (Content-Type)',
    httpRedirectLocation: 'موقع إعادة التوجيه (Location)',
    httpLocation: 'موقع إعادة التوجيه (Location)',

    reportModalTitle: 'تقرير الفحص الكامل للاتصال و DNS',
    reportModalHeader: 'تقرير تشخيص الاتصال بالشبكة و DNS',
    reportTime: 'وقت التوليد',
    copyMarkdown: 'نسخ التقرير بصيغة Markdown',
    downloadMarkdown: 'تنزيل ملف .md',
    downloadReport: 'تنزيل ملف .md',
    copiedToClipboard: 'تم النسخ إلى الحافظة',
    totalTestedCount: 'نتائج الفحص لـ {total} من العناوين',
    diagnosticDetectingTitle: 'جاري تنفيذ الفحص الشامل لمسار الشبكة...',
    diagnosingBannerTitle: 'جاري تنفيذ الفحص الشامل لمسار الشبكة...',
    diagnosticDetectingDesc: 'يقوم النظام بالتسلسل بالتحقق من سجلات DNS A/AAAA الرسمية، ومصافحة مقبس TCP، وسلامة شهادة TLS، واستجابة رؤوس HTTP',
    diagnosingBannerDesc: 'يقوم النظام بالتسلسل بالتحقق من سجلات DNS A/AAAA الرسمية، ومصافحة مقبس TCP، وسلامة شهادة TLS، واستجابة رؤوس HTTP',
    autoTestingNotice: 'تم تحميل العناوين تلقائياً من الرابط وبدء الفحص الفوري...',

    // Upload & Local File Persistence & Restore
    uploadReportBtn: 'إرسال وحفظ التقرير',
    uploadingReport: 'جاري الإرسال والحفظ...',
    autoUploadLabel: 'إرسال وحفظ التقرير تلقائياً بعد الفحص',
    autoUploadBadge: 'الحفظ التلقائي مفعّل',
    autoSavedToast: 'تم إرسال وحفظ التقرير تلقائياً على الخادم ({id})',
    viewReportBtn: 'عرض اللقطة',
    uploadModalTitle: 'تم إرسال التقرير وحفظه في ملف محلي بنجاح',
    uploadModalDesc: 'تم تعيين معرّف فريد لكافة بيانات الفحص وحفظها في ملف محلي على الخادم. يمكن لأي شخص استخدام رابط الاسترجاع لمعاينة النتائج بالكامل:',
    reportUniqueId: 'معرّف التقرير الفريد (ID)',
    restoreLink: 'رابط استرجاع ومعاينة التقرير',
    copyRestoreLink: 'نسخ رابط الاسترجاع',
    openInNewWindow: 'فتح في علامة تبويب جديدة',
    snapshotBannerTitle: 'معاينة لقطة تشخيصية محفوظة',
    snapshotBannerDesc: 'معرّف التقرير: {id} · وقت الحفظ: {time} · {count} عنوان',
    retestSnapshotBtn: 'إعادة فحص هذه العناوين',
    exitSnapshotBtn: 'الخروج من وضع اللقطة',
    loadReportByIdBtn: 'عرض بواسطة معرّف التقرير',
    loadReportModalTitle: 'تحميل لقطة تشخيصية محفوظة',
    loadReportModalDesc: 'أدخل معرّف التقرير (مثل rep_xxx) أو اختر من قائمة التقارير المحفوظة حديثًا أدناه:',
    inputReportIdPlaceholder: 'أدخل معرّف التقرير، مثل rep_123456',
    loadBtn: 'تحميل واسترجاع',
    recentReportsTitle: 'أحدث التقارير المحفوظة على الخادم',
    noRecentReports: 'لا توجد تقارير محفوظة بعد',
    loadingReportData: 'جاري قراءة ملف التقرير من الخادم...',
    reportNotFound: 'لم يتم العثور على ملف التقرير المحدد، يرجى التحقق من المعرّف',
    uploaderIpLabel: 'عنوان IP للمُرسل',
    uploaderCountryLabel: 'الدولة / المنطقة الجغرافية للـ IP',
    uploaderLocationLabel: 'الموقع الجغرافي',
  },
};

/**
 * Helper to get current language from URL search param `?lang=xx`
 */
export function getInitialLanguage(): SupportedLang {
  if (typeof window === 'undefined') return 'zh';
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang')?.toLowerCase();
  if (lang === 'en' || lang === 'ar' || lang === 'zh') {
    return lang;
  }
  const navLang = navigator.language?.toLowerCase() || '';
  if (navLang.startsWith('ar')) return 'ar';
  if (navLang.startsWith('en')) return 'en';
  return 'zh';
}

/**
 * Update document language & direction attribute
 */
export function applyDocumentLanguage(lang: SupportedLang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Format string with variables: e.g. "Showing {current} / {total}"
 * Extremely defensive against undefined/null templates
 */
export function tFormat(
  template?: string | null,
  vars?: Record<string, string | number | undefined | null>
): string {
  if (!template || typeof template !== 'string') return '';
  if (!vars) return template;
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val ?? ''));
  }
  return result;
}
