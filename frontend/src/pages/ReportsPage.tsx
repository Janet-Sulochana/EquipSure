import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Wrench,
  Gauge,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Building,
} from 'lucide-react';
import api from '../api/client';

export const ReportsPage: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<'maintenance' | 'calibration' | 'warranty' | 'utilization'>('maintenance');
  const [maintenanceReport, setMaintenanceReport] = useState<any>(null);
  const [calibrationReport, setCalibrationReport] = useState<any>(null);
  const [warrantyReport, setWarrantyReport] = useState<any>(null);
  const [utilizationReport, setUtilizationReport] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReportData(activeReportTab);
  }, [activeReportTab]);

  const fetchReportData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'maintenance') {
        const res = await api.get('/reports/maintenance');
        if (res.data.success) setMaintenanceReport(res.data.report);
      } else if (tab === 'calibration') {
        const res = await api.get('/reports/calibration');
        if (res.data.success) setCalibrationReport(res.data.report);
      } else if (tab === 'warranty') {
        const res = await api.get('/reports/warranty');
        if (res.data.success) setWarrantyReport(res.data.report);
      } else if (tab === 'utilization') {
        const res = await api.get('/reports/utilization');
        if (res.data.success) setUtilizationReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = (type: string) => {
    window.open(`/api/reports/export?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector & Export Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveReportTab('maintenance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeReportTab === 'maintenance'
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Maintenance Report
          </button>

          <button
            onClick={() => setActiveReportTab('calibration')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeReportTab === 'calibration'
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> Calibration Audit
          </button>

          <button
            onClick={() => setActiveReportTab('warranty')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeReportTab === 'warranty'
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Warranty & Contract
          </button>

          <button
            onClick={() => setActiveReportTab('utilization')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeReportTab === 'utilization'
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Utilization Analytics
          </button>
        </div>

        <button
          onClick={() => {
            const exportMap: Record<string, string> = {
              maintenance: 'maintenance',
              calibration: 'calibrations',
              warranty: 'warranties',
              utilization: 'equipment',
            };
            handleExportCsv(exportMap[activeReportTab]);
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition ml-auto"
        >
          <Download className="w-4 h-4" /> Export {activeReportTab.toUpperCase()} CSV
        </button>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
          Loading audit compliance reports...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Maintenance Report */}
          {activeReportTab === 'maintenance' && maintenanceReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Schedules</span>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{maintenanceReport.summary.total_schedules}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Completed PPM</span>
                  <div className="mt-2 text-2xl font-bold text-emerald-600">{maintenanceReport.summary.completed}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Overdue Tasks</span>
                  <div className="mt-2 text-2xl font-bold text-rose-600">{maintenanceReport.summary.overdue}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Upcoming / Scheduled</span>
                  <div className="mt-2 text-2xl font-bold text-blue-600">{maintenanceReport.summary.upcoming}</div>
                </div>
              </div>

              {/* Departmental PPM Compliance Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Hospital Department PPM Compliance Rates</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Total PPM Tasks</th>
                        <th className="py-3 px-4">Completed Tasks</th>
                        <th className="py-3 px-4">Compliance Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {maintenanceReport.departmentCompliance.map((d: any) => (
                        <tr key={d.department}>
                          <td className="py-3 px-4 font-bold text-slate-900">{d.department}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{d.total_tasks}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">{d.completed_tasks}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{d.compliance_percentage || '100.0'}%</span>
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-teal-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, parseFloat(d.compliance_percentage || '100'))}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Calibration Report */}
          {activeReportTab === 'calibration' && calibrationReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Compliance Audit Rate</span>
                  <div className="mt-2 text-2xl font-bold text-teal-600">{calibrationReport.summary.complianceRate}% Passed</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Passed Certifications</span>
                  <div className="mt-2 text-2xl font-bold text-emerald-600">{calibrationReport.summary.passed} Verified</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Non-Compliant / Overdue</span>
                  <div className="mt-2 text-2xl font-bold text-rose-600">{calibrationReport.summary.overdue + calibrationReport.summary.failed} Devices</div>
                </div>
              </div>

              {/* Records Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Hospital Metrology & Calibration Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4">Certificate #</th>
                        <th className="py-3 px-4">Equipment</th>
                        <th className="py-3 px-4">Standard Applied</th>
                        <th className="py-3 px-4">Measured Drift</th>
                        <th className="py-3 px-4">Calibrated By</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calibrationReport.records.map((c: any, i: number) => (
                        <tr key={i}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.certificate_number}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{c.equipment_name} ({c.equipment_code})</td>
                          <td className="py-3 px-4 text-slate-600">{c.standard_used}</td>
                          <td className="py-3 px-4 font-mono text-[11px]">{c.accuracy_drift || 'Within tolerance'}</td>
                          <td className="py-3 px-4 text-slate-700">{c.calibrated_by}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Warranty Report */}
          {activeReportTab === 'warranty' && warrantyReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Annual Maintenance Budget</span>
                  <div className="mt-2 text-2xl font-bold text-slate-900">${Number(warrantyReport.summary.total_annual_commitment).toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Active Service Contracts</span>
                  <div className="mt-2 text-2xl font-bold text-emerald-600">{warrantyReport.summary.active_contracts} Active</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Expiring in 30 Days</span>
                  <div className="mt-2 text-2xl font-bold text-amber-600">{warrantyReport.summary.expiring_in_30_days} Renewals Due</div>
                </div>
              </div>

              {/* Warranties Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Active Service Agreements (AMC / CMC / OEM)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4">Equipment</th>
                        <th className="py-3 px-4">Service Provider</th>
                        <th className="py-3 px-4">Contract Type</th>
                        <th className="py-3 px-4">Expiry Date</th>
                        <th className="py-3 px-4">Annual Cost</th>
                        <th className="py-3 px-4">Days Left</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {warrantyReport.warranties.map((w: any) => (
                        <tr key={w.id}>
                          <td className="py-3 px-4 font-bold text-slate-900">{w.equipment_name}</td>
                          <td className="py-3 px-4 text-slate-700">{w.provider_name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded font-bold bg-teal-50 text-teal-700 text-[10px]">
                              {w.contract_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">{new Date(w.end_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">${Number(w.annual_cost).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              w.days_remaining <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {w.days_remaining} days
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Utilization Analytics Report */}
          {activeReportTab === 'utilization' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Hospital Equipment Duty-Cycle & Throughput Benchmark</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Average utilization, operating hours, and patient loads</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4">Biomedical Device</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Avg Utilization</th>
                        <th className="py-3 px-4">Avg Daily Hours</th>
                        <th className="py-3 px-4">Patients Treated</th>
                        <th className="py-3 px-4">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {utilizationReport.map((u: any) => (
                        <tr key={u.equipment_id}>
                          <td className="py-3 px-4 font-bold text-slate-900">{u.equipment_name}</td>
                          <td className="py-3 px-4 text-slate-600">{u.category}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{u.department}</td>
                          <td className="py-3 px-4 font-mono font-bold text-teal-600">{u.avg_utilization_rate}%</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{u.avg_daily_operating_hours} hrs/day</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{u.total_patients_served}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status_category === 'High Stress / Overused' ? 'bg-rose-100 text-rose-800' :
                              u.status_category === 'Underutilized' ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.status_category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
