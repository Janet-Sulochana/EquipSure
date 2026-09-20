import React, { useState, useEffect } from 'react';
import { Activity, Shield, KeyRound, Building2, User, Wrench, Stethoscope, ArrowRight, UserPlus, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { Department } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Sign In Form
  const [email, setEmail] = useState<string>('admin@equipsure.com');
  const [password, setPassword] = useState<string>('Password123!');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Registration Form
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('hospital_staff');
  const [regDept, setRegDept] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showTestAccounts, setShowTestAccounts] = useState<boolean>(false);

  useEffect(() => {
    api.get('/departments').then((res) => {
      if (res.data.success) {
        setDepartments(res.data.data);
        if (res.data.data.length > 0) {
          setRegDept(res.data.data[0].name);
        }
      }
    }).catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ok = await login(email, password);
      if (ok) {
        showToast('Authenticated successfully. Welcome to EquipSure!', 'success');
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid institutional credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters according to hospital security policy.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        department: regDept,
        phone: regPhone,
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem('equipsure_token', res.data.token);
        localStorage.setItem('equipsure_user', JSON.stringify(res.data.user));
        showToast('Account created successfully! Logging into clinical portal...', 'success');
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error during staff registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    setActiveTab('login');
    showToast(`Autofilled credentials for ${testEmail}`, 'info');
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
                  <p className="text-slate-400 mt-0.5">Asset registry, PPM recurrence cycles, and ISO metrology calibrations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Breakdown Incident Logging</h4>
                  <p className="text-slate-400 mt-0.5">Direct work orders from clinical staff to on-duty biomedical engineers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Duty-Cycle & High Stress Alerts</h4>
                  <p className="text-slate-400 mt-0.5">Continuous tracking of underutilized vs high-stress clinical devices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" /> St. Jude Memorial Hospital
            </span>
            <span className="font-mono text-[10px] text-slate-500">PostgreSQL + Redis</span>
          </div>
        </div>

        {/* Right Side: Sign-In / Register Form */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Tab Header */}
            <div className="flex border-b border-slate-200 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`pb-3 px-4 border-b-2 transition ${
                  activeTab === 'login'
                    ? 'border-teal-500 text-teal-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Authorized Staff Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`pb-3 px-4 border-b-2 transition ${
                  activeTab === 'register'
                    ? 'border-teal-500 text-teal-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Register Staff Account
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* TAB 1: Standard Login */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Email Address</label>
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
                  {loading ? 'Authenticating...' : 'Sign In to Clinical Portal'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: Staff Registration */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name & Professional Title *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Jennifer Hayes, MD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hospital Email *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="j.hayes@equipsure.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Password * (min 8 chars)</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Department Access *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="hospital_staff">Clinical Staff (Doctor / Nurse)</option>
                      <option value="biomedical_engineer">Biomedical Engineer</option>
                      <option value="admin">Hospital Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Department *</label>
                    <select
                      required
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Direct Contact Phone / Ext</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91-XXXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Creating Staff Account...' : 'Complete Staff Registration'}
                </button>
              </form>
            )}

            {/* Test Accounts Reference Accordion */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="text-[11px] font-semibold text-slate-500 hover:text-teal-600 flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showTestAccounts ? 'Hide Clinical Test Accounts' : 'View Clinical Test Accounts (Password: Password123!)'}
              </button>

              {showTestAccounts && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span><strong>Admin:</strong> admin@equipsure.com</span>
                    <button
                      type="button"
                      onClick={() => handleAutofill('admin@equipsure.com')}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Autofill
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>Biomedical Eng:</strong> bme@equipsure.com</span>
                    <button
                      type="button"
                      onClick={() => handleAutofill('bme@equipsure.com')}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Autofill
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>Clinical Staff:</strong> staff@equipsure.com</span>
                    <button
                      type="button"
                      onClick={() => handleAutofill('staff@equipsure.com')}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Autofill
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-400">
            EquipSure Hospital CMMS • HIPAA / ISO 13485 Compliant Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
