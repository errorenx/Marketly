import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, ReportItem } from '../../types';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Users,
  Store,
  ShoppingBag,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface AdminPanelViewProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ currentUser, onNavigate }) => {
  const { t } = useI18n();

  const [dashboard, setDashboard] = useState<any | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionReason, setResolutionReason] = useState('');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminDashboard(currentUser.id);
      setDashboard(res);
      setReports(res.reports || []);
      setAuditLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser.id]);

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await api.resolveReport(
        reportId,
        status,
        resolutionReason || 'Reviewed and verified by supervisor admin',
        currentUser.id
      );
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status, resolutionReason: resolutionReason || 'Actioned by admin' }
            : r
        )
      );
      setActiveReportId(null);
      setResolutionReason('');
    } catch (err) {
      console.error('Error resolving report:', err);
    }
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="font-bold text-white text-base">Unauthorized Access</p>
        <p className="text-xs">The Admin Panel is strictly reserved for platform supervisors.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 pt-2 px-3 sm:px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/40 border border-amber-600/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/40 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{t('admin_panel')}</h1>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Platform governance, live ecosystem metrics, and content moderation
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('feed')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
      </div>

      {/* Platform Real-Time Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" /> Total Users
          </span>
          <p className="text-2xl font-black text-white">{dashboard?.counts?.users || 4}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-violet-400" /> Active Sellers
          </span>
          <p className="text-2xl font-black text-violet-300">{dashboard?.counts?.sellers || 1}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-400" /> Live Products
          </span>
          <p className="text-2xl font-black text-emerald-300">{dashboard?.counts?.products || 3}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" /> Feed Posts
          </span>
          <p className="text-2xl font-black text-indigo-300">{dashboard?.counts?.posts || 3}</p>
        </div>
      </div>

      {/* Moderation & Flagged Reports */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Reports & Content Moderation</span>
          </h2>
          <span className="text-xs text-slate-400">Queue: {reports.length} items</span>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No open moderation reports.</p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {reports.map((r) => (
              <div key={r.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Type: {r.targetType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      r.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : r.status === 'dismissed'
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-200">
                  <strong className="text-amber-400">Reason:</strong> {r.reason}
                </p>
                {r.details && <p className="text-xs text-slate-400">{r.details}</p>}

                {r.status === 'pending' && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(r.id, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Action / Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(r.id, 'dismissed')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-400" />
          <span>Audit Logs</span>
        </h2>
        <div className="space-y-2 text-xs">
          {auditLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-violet-300">{log.action}</span>
                <p className="text-slate-400 mt-0.5">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
