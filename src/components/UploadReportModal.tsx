import React, { useState } from 'react';
import { X, CloudUpload, Copy, Check, ExternalLink, HardDrive, ShieldCheck, Globe, MapPin } from 'lucide-react';
import { SupportedLang, ReportUploadResponse } from '../types';
import { translations, tFormat } from '../i18n';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportInfo: ReportUploadResponse | null;
  currentLang: SupportedLang;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  isOpen,
  onClose,
  reportInfo,
  currentLang,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !reportInfo) return null;

  const t = translations[currentLang];

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const fullRestoreUrl = `${origin}${pathname}?reportId=${reportInfo.id}&lang=${currentLang}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullRestoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(reportInfo.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2200);
  };

  const handleOpenPreview = () => {
    window.open(fullRestoreUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.uploadModalTitle}
              </h3>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>已存入本地文件系统: data/reports/{reportInfo.id}.json</span>
              </p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.uploadModalDesc}
          </p>

          {/* Unique ID Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t.reportUniqueId}
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-slate-800">
                {reportInfo.id}
              </span>
            </div>
            <button
              id="copy-report-id-btn"
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.copyReport}</span>
                </>
              )}
            </button>
          </div>

          {/* Client IP and Location Info */}
          {reportInfo.clientInfo && reportInfo.clientInfo.ip && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2.5 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-blue-600 font-semibold block uppercase">
                    {t.uploaderIpLabel}
                  </span>
                  <span className="font-mono font-medium text-blue-900 truncate block">
                    {reportInfo.clientInfo.ip}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-600 font-semibold block uppercase">
                    {t.uploaderCountryLabel}
                  </span>
                  <span className="font-medium text-emerald-900 truncate block">
                    {reportInfo.clientInfo.country}
                    {reportInfo.clientInfo.region && reportInfo.clientInfo.region !== reportInfo.clientInfo.country
                      ? ` (${reportInfo.clientInfo.region})`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Restore URL Card */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.restoreLink}
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="restore-url-input"
                type="text"
                readOnly
                value={fullRestoreUrl}
                className="flex-1 px-3 py-2 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-300 rounded-xl select-all focus:outline-hidden"
              />
              <button
                id="copy-restore-url-btn"
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyRestoreLink}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-semibold">无需区分语言：</span>
              上报数据以标准 JSON 结构保存在本地磁盘。任何客户端访问还原链接时，页面将根据访问者的语言设置（中文、English、العربية）自动本地化显示各项诊断详情与错误分析。
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            id="open-restore-preview-btn"
            type="button"
            onClick={handleOpenPreview}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t.openInNewWindow}</span>
          </button>

          <button
            id="close-upload-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
