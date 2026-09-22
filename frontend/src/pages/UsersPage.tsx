import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Building,
  Phone,
  Mail,
  Shield,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';
import api from '../api/client';
import { User, UserRole, Department } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'hospital_staff' as UserRole,
    department: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [roleFilter, departmentFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {}
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'hospital_staff',
      department: departments[0]?.name || 'Intensive Care Unit (ICU)',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      phone: user.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          name: formData.name,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
        });
        showToast(`Staff profile for ${formData.name} updated successfully!`, 'success');
      } else {
        if (!formData.password || formData.password.length < 8) {
          showToast('Password must be at least 8 characters.', 'error');
          setSubmitting(false);
          return;
        }
        await api.post('/users', formData);
        showToast(`New staff member ${formData.name} registered into clinical directory!`, 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving user profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to deactivate and remove staff member "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showToast(`Staff record for ${name} removed from registry.`, 'info');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error removing staff member', 'error');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">System Admin</span>;
      case 'biomedical_engineer':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">Biomedical Engineer</span>;
      case 'hospital_staff':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Clinical Staff</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by staff name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="biomedical_engineer">Biomedical Engineers</option>
            <option value="hospital_staff">Clinical Staff</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {hasRole(['admin']) && (
          <button
            onClick={handleOpenCreate}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition ml-auto"
          >
            <Plus className="w-4 h-4" /> Add Hospital Personnel
          </button>
        )}
      </div>

      {/* Users Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Institutional Email</th>
                <th className="py-3.5 px-4">Assigned Department</th>
                <th className="py-3.5 px-4">Direct Contact</th>
                <th className="py-3.5 px-4">Role & Access Level</th>
                {hasRole(['admin']) && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                    Loading hospital personnel registry...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No personnel found matching the query.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                          {item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-teal-600 transition">
                            {item.name}
                          </span>
                          {currentUser?.id === item.id && (
                            <span className="ml-2 text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.2 rounded border border-teal-200">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {item.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {item.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {item.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getRoleBadge(item.role)}
                    </td>
                    {hasRole(['admin']) && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Personnel"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {currentUser?.id !== item.id && (
                            <button
                              onClick={() => handleDeleteUser(item.id, item.name)}
                              title="Deactivate Staff Account"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit Personnel: ${editingUser.name}` : 'Register New Hospital Personnel'}
        subtitle="Manage access permissions, department assignment, and staff credentials."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name & Credentials *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Catherine Price, MD"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="c.price@equipsure.com"
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-teal-500 ${
                editingUser ? 'bg-slate-100 text-slate-500 border-slate-200' : 'border-slate-200'
              }`}
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password * (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Temporary secure password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role / Access Level *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="hospital_staff">Hospital Staff (Report Incidents)</option>
                <option value="biomedical_engineer">Biomedical Engineer (PPM & Work Orders)</option>
                <option value="admin">System Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Direct Contact Phone / Bleep</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +1-555-0199 or Ext. 402"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? 'Saving...' : editingUser ? 'Update Profile' : 'Register Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
