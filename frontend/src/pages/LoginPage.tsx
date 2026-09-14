import React, { useState } from 'react';
import { Activity, Shield, KeyRound, Building2, User, Wrench, Stethoscope, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState<string>('admin@equipsure.com');
  const [password, setPassword] = useState<string>('Password123!');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ok = await login(email, password);
      if (!ok) setError('Authentication failed. Please verify credentials.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    setLoading(true);
    setError('');
    try {
      await quickDemoLogin(role);
    } catch (err: any) {
      setError('Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/40">
        {/* Left Side: Hospital Brand & Features (Dark Medical Teal) */}
        <div className="md:col-span-5 bg-gradient-to-b from-slate-900 via-slate-850 to-teal-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">EquipSure</h1>
                <p className="text-[11px] text-teal-300 font-medium">Biomedical Equipment Management</p>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Full Lifecycle Tracking</h4>
                  <p className="text-slate-400 mt-0.5">Inventory, calibrations, PPM recurrence cycles, and warranty contracts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Clinical Work Orders</h4>
                  <p className="text-slate-400 mt-0.5">Instant breakdown incident reporting with engineer downtime auditing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Utilization & Overuse Alerts</h4>
                  <p className="text-slate-400 mt-0.5">Automated detection of underutilized vs high-stress clinical devices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" /> St. Jude Hospital
            </span>
            <span className="font-mono text-[10px] text-slate-500">PERN + Redis</span>
          </div>
        </div>

        {/* Right Side: Sign-In Form & 1-Click Role Switcher */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Portal Login</h2>
              <p className="text-xs text-slate-500 mt-1">Sign in with your authorized hospital credentials or pick a demo role.</p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Standard Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  placeholder="name@equipsure.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Demo Login Panel */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                1-Click Role-Based Quick Access:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoClick('admin')}
                  className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition text-left group"
                >
                  <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                    Admin
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">Dr. Eleanor Vance (All Modules)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('biomedical_engineer')}
                  className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 transition text-left group"
                >
                  <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs">
                    <Wrench className="w-3.5 h-3.5" />
                    Biomedical Eng.
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">Marcus Reynolds (PPM, Calib, Repairs)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('hospital_staff')}
                  className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition text-left group"
                >
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Hospital Staff
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">Nurse Sarah Jenkins (Report Tickets)</p>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-400">
            EquipSure Hospital CMMS • HIPAA / ISO 13485 Compliant Architecture
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
