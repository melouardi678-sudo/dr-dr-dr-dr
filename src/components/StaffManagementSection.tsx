import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
  UserX,
  AlertTriangle,
  Info,
  Calendar,
  FileText,
  Stethoscope,
  Receipt,
  Package,
  Settings,
  Database,
  ShieldAlert,
  Pill,
} from 'lucide-react';
import { AppUser, UserRole, StaffPermissions } from '../types';
import {
  getUsers,
  saveUsers,
  updateUser,
  deleteUser,
  addAuditLog,
} from '../utils/storage';
import {
  getDefaultPermissionsForRole,
  getRoleLabel,
} from '../utils/permissions';

interface StaffManagementSectionProps {
  currentUser: AppUser;
  onUpdateCurrentUser?: (user: AppUser) => void;
}

export const StaffManagementSection: React.FC<StaffManagementSectionProps> = ({
  currentUser,
  onUpdateCurrentUser,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showPins, setShowPins] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Delete State
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form Fields State
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('secretary');
  const [formPin, setFormPin] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formPermissions, setFormPermissions] = useState<StaffPermissions>(
    getDefaultPermissionsForRole('secretary')
  );

  useEffect(() => {
    loadUsersList();
  }, []);

  const loadUsersList = () => {
    const list = getUsers();
    setUsers(list);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const generateRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setFormPin(random);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormFullName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('secretary');
    setFormPin(Math.floor(1000 + Math.random() * 9000).toString());
    setFormStatus('active');
    setFormPermissions(getDefaultPermissionsForRole('secretary'));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setFormFullName(user.fullName || '');
    setFormUsername(user.username || '');
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormRole(user.role || 'secretary');
    setFormPin(user.pinCode || '1234');
    setFormStatus(user.status || 'active');
    setFormPermissions(
      user.permissions || getDefaultPermissionsForRole(user.role)
    );
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    // Automatically apply default permissions for the selected role
    setFormPermissions(getDefaultPermissionsForRole(newRole));
  };

  const handleTogglePermission = (key: keyof StaffPermissions) => {
    setFormPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApplyPreset = (preset: 'all' | 'secretary' | 'doctor' | 'none') => {
    if (preset === 'all') {
      setFormPermissions(getDefaultPermissionsForRole('admin'));
    } else if (preset === 'secretary') {
      setFormPermissions(getDefaultPermissionsForRole('secretary'));
    } else if (preset === 'doctor') {
      setFormPermissions(getDefaultPermissionsForRole('doctor'));
    } else {
      const empty: any = {};
      Object.keys(getDefaultPermissionsForRole('admin')).forEach((k) => {
        empty[k] = false;
      });
      setFormPermissions(empty);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFullName.trim() || !formUsername.trim()) {
      showToast('error', 'Veuillez remplir le nom et le nom d’utilisateur.');
      return;
    }

    if (!formPin.trim() || formPin.length < 4) {
      showToast('error', 'Le code PIN doit comporter au moins 4 chiffres.');
      return;
    }

    const isExistingPinDuplicate = users.some(
      (u) => u.pinCode === formPin.trim() && u.id !== editingUser?.id
    );

    if (isExistingPinDuplicate) {
      showToast(
        'error',
        'Ce code PIN est déjà attribué à un autre employé. Choisissez un code unique.'
      );
      return;
    }

    const userId = editingUser ? editingUser.id : `usr_${Date.now()}`;
    const newUser: AppUser = {
      id: userId,
      fullName: formFullName.trim(),
      username: formUsername.trim().toLowerCase(),
      email: formEmail.trim().toLowerCase() || `${formUsername.trim().toLowerCase()}@cabinet.ma`,
      phone: formPhone.trim(),
      role: formRole,
      pinCode: formPin.trim(),
      status: formStatus,
      permissions: formPermissions,
      passwordHash: editingUser ? editingUser.passwordHash : '',
      passwordSalt: editingUser ? editingUser.passwordSalt : 'salt123',
    };

    updateUser(newUser);
    loadUsersList();

    if (currentUser.id === newUser.id && onUpdateCurrentUser) {
      onUpdateCurrentUser(newUser);
    }

    addAuditLog(
      editingUser ? 'UPDATE_STAFF' : 'CREATE_STAFF',
      `${editingUser ? 'Modification' : 'Création'} du membre du personnel : ${newUser.fullName} (${newUser.role})`
    );

    setIsModalOpen(false);
    showToast(
      'success',
      editingUser
        ? `L'employé ${newUser.fullName} a été mis à jour avec succès.`
        : `Nouveau membre ${newUser.fullName} créé avec succès !`
    );
  };

  const handleDeleteClick = (user: AppUser) => {
    if (user.id === currentUser.id) {
      showToast('error', 'Vous ne pouvez pas supprimer votre propre compte actif.');
      return;
    }
    if (user.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) {
      showToast(
        'error',
        'Impossible de supprimer le seul administrateur principal du cabinet.'
      );
      return;
    }

    setDeletingUser(user);
    setIsDeletingModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!deletingUser) return;

    deleteUser(deletingUser.id);
    loadUsersList();

    addAuditLog(
      'DELETE_STAFF',
      `Suppression du membre du personnel : ${deletingUser.fullName} (${deletingUser.id})`
    );

    setIsDeletingModalOpen(false);
    showToast(
      'success',
      `L'employé ${deletingUser.fullName} a été supprimé de la base.`
    );
    setDeletingUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.pinCode && u.pinCode.includes(searchTerm));

    const matchesRole =
      selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'doctor':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'secretary':
        return 'bg-sky-950 text-sky-300 border-sky-800';
      case 'nurse':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'accountant':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Direct Quick Action Box */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>إضافة موظف جديد وتحديد صلاحيات الوصول</span>
              <span className="text-xs text-emerald-400 font-semibold dir-ltr">(Staff & Permissions)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إضافة موظف جديد (سكرتيرة، طبيب، ممرض) مع تحديد الصلاحيات والرمز السري PIN للدخول
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-xl shadow-emerald-950/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm">+ إضافة موظف جديد / Ajouter Employé</span>
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg border animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
              : 'bg-rose-950 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-white">{users.length}</div>
            <div className="text-[11px] text-slate-400">Total Employés</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {users.filter((u) => u.role === 'admin' || u.role === 'doctor').length}
            </div>
            <div className="text-[11px] text-slate-400">Médecins & Admins</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {users.filter((u) => u.role === 'secretary' || u.role === 'receptionist').length}
            </div>
            <div className="text-[11px] text-slate-400">Secrétariat</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-emerald-400">
              {users.filter((u) => u.pinCode).length}
            </div>
            <div className="text-[11px] text-slate-400">Codes PIN Actifs</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email, PIN..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 shrink-0 font-medium">Filtrer par rôle :</span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'admin', label: 'Admins' },
              { id: 'doctor', label: 'Médecins' },
              { id: 'secretary', label: 'Secrétaires' },
              { id: 'nurse', label: 'Infirmiers' },
              { id: 'accountant', label: 'Comptables' },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleFilter(role.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedRoleFilter === role.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {role.label}
              </button>
            ))}

            <button
              onClick={() => setShowPins(!showPins)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 ml-2"
              title="Afficher/Masquer les codes PIN"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{showPins ? 'Masquer PIN' : 'Afficher PIN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userPerms = user.permissions || getDefaultPermissionsForRole(user.role);
          const isCurrentLoggedIn = user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-xl relative transition-all duration-200 hover:border-slate-700 ${
                user.status === 'suspended'
                  ? 'border-rose-950 opacity-75'
                  : isCurrentLoggedIn
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'border-slate-800'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-white truncate">
                        {user.fullName}
                      </h3>
                      {isCurrentLoggedIn && (
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[9px] font-extrabold">
                          Vous
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      @{user.username}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getRoleBadgeStyle(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>

              {/* Contact and PIN section */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email</span>
                  </span>
                  <span className="font-mono text-slate-200 truncate max-w-[180px]">
                    {user.email || 'Non renseigné'}
                  </span>
                </div>

                {user.phone && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center space-x-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Téléphone</span>
                    </span>
                    <span className="font-mono text-slate-200">{user.phone}</span>
                  </div>
                )}

                {/* PIN Code Badge */}
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Code PIN Accès</span>
                  </span>
                  <span className="font-mono font-bold text-sm text-white tracking-wider">
                    {showPins ? user.pinCode || 'Non défini' : '••••'}
                  </span>
                </div>
              </div>

              {/* Rights Badges Summary */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Accès Autorisés :
                </span>
                <div className="flex flex-wrap gap-1">
                  {userPerms.canViewPatients && (
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px]">
                      Patients
                    </span>
                  )}
                  {userPerms.canViewAgenda && (
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px]">
                      Agenda
                    </span>
                  )}
                  {userPerms.canCreateConsultations && (
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px]">
                      Consultations
                    </span>
                  )}
                  {userPerms.canViewBilling && (
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px]">
                      Factures
                    </span>
                  )}
                  {userPerms.canViewStock && (
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px]">
                      Stocks
                    </span>
                  )}
                  {userPerms.canManageStaff && (
                    <span className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 rounded text-[10px]">
                      Gérer Staff
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span
                  className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    user.status === 'suspended'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {user.status === 'suspended' ? (
                    <>
                      <UserX className="w-3 h-3" />
                      <span>Suspendu</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>Actif</span>
                    </>
                  )}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition-colors border border-emerald-800/80 flex items-center space-x-1 text-xs font-bold shadow-sm"
                    title="Modifier l'employé"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل (Edit)</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClick(user)}
                    disabled={isCurrentLoggedIn}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors border border-rose-800/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1 text-xs font-bold shadow-sm"
                    title="Supprimer l'employé"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف (Delete)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Aucun employé trouvé</h3>
          <p className="text-xs text-slate-500">Essayez d'ajuster votre recherche ou filtre par rôle.</p>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full text-slate-100 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingUser
                    ? `تعديل معلومات الموظف : ${editingUser.fullName}`
                    : 'إضافة موظف جديد وتحديد صلاحيات الوصول'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5 text-xs overflow-y-auto custom-scrollbar flex-1">
              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>المعطيات الشخصية للموظف (Informations)</span>
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      الاسم الكامل للموظف (Nom complet) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="مثال: سهام العمري"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      اسم المستخدم للدخول (Identifiant) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="مثال: siham.sec"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      البريد الإلكتروني (Email)
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="siham@cabinet.ma"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      رقم الهاتف (Téléphone)
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="06 61 98 76 54"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Role, PIN Code and Status */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-1 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>الوظيفة، الرمز السري PIN وحالة الحساب</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      الصفة / الوظيفة (Rôle) *
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="secretary">سكرتيرة طبية (Secrétaire)</option>
                      <option value="receptionist">موظف استقبال (Réceptionniste)</option>
                      <option value="doctor">طبيب مشارك (Médecin)</option>
                      <option value="nurse">ممرض(ة) (Infirmier)</option>
                      <option value="accountant">محاسب (Comptable)</option>
                      <option value="admin">مدير النظام (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      رمز PIN السري للدخول *
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value)}
                        placeholder="1234"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold text-center tracking-wider focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={generateRandomPin}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shrink-0 flex items-center gap-1"
                        title="توليد رمز عشوائي"
                      >
                        <RefreshCw className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      حالة الحساب (Statut)
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="active">🟢 مفعّل / Actif</option>
                      <option value="suspended">🔴 موقوف / Suspendu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Permissions Checkboxes Matrix */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                  <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    <span>تحديد صلاحيات الوصول الممنوحة للموظف (Matrix Droits)</span>
                  </h4>

                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('all')}
                      className="px-2 py-1 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-bold whitespace-nowrap"
                    >
                      كامل الصلاحيات (Admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('secretary')}
                      className="px-2 py-1 bg-sky-950 border border-sky-800 hover:bg-sky-900 text-sky-300 rounded text-[10px] font-bold whitespace-nowrap"
                    >
                      صلاحيات السكرتارية
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('none')}
                      className="px-2 py-1 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 rounded text-[10px] font-bold whitespace-nowrap"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {/* Category 1: Agenda */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>الأجندة والمواعيد (Agenda)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewAgenda}
                        onChange={() => handleTogglePermission('canViewAgenda')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>رؤية جدول المواعيد (Planning)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageAppointments}
                        onChange={() => handleTogglePermission('canManageAppointments')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>إضافة، تعديل وإلغاء المواعيد</span>
                    </label>
                  </div>

                  {/* Category 2: Patients */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>ملفات المرضى (Patients)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewPatients}
                        onChange={() => handleTogglePermission('canViewPatients')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>رؤية قائمة وجدول المرضى</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canEditPatients}
                        onChange={() => handleTogglePermission('canEditPatients')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>إنشاء وتعديل بطاقات المرضى</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canDeletePatients}
                        onChange={() => handleTogglePermission('canDeletePatients')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span className="text-rose-300">حذف ملفات المرضى نهائيا</span>
                    </label>
                  </div>

                  {/* Category 3: Medical & Consultations */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>الفحوصات والوصفات (Consultations)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewConsultations}
                        onChange={() => handleTogglePermission('canViewConsultations')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>الإطلاع على زيارات وفحوصات المرضى</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canCreateConsultations}
                        onChange={() => handleTogglePermission('canCreateConsultations')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>تحرير وتعديل الزيارات والوصفات الطبية</span>
                    </label>
                  </div>

                  {/* Category 4: Billing & Finance */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>الفواتير ومداخيل الصندوق (Facturation)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewBilling}
                        onChange={() => handleTogglePermission('canViewBilling')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>استخلاص المداخيل وإصدار الفواتير</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewAccounting}
                        onChange={() => handleTogglePermission('canViewAccounting')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>رؤية السجل المحاسبي الشامل للعيادة</span>
                    </label>
                  </div>

                  {/* Category 5: Stock & Inventory */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>المخزون والأدوية (Stock)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewStock}
                        onChange={() => handleTogglePermission('canViewStock')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>رؤية كميات المواد والأدوية المخزنة</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageStock}
                        onChange={() => handleTogglePermission('canManageStock')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>تعديل وإضافة مخزون المنتجات</span>
                    </label>
                  </div>

                  {/* Category 6: Medications & Drug Database */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-cyan-400 flex items-center space-x-1.5">
                      <Pill className="w-3.5 h-3.5" />
                      <span>بنك الأدوية والوصفات (Médicaments)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canViewMedications !== false}
                        onChange={() => handleTogglePermission('canViewMedications')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span>الإطلاع على بنك الأدوية والتراكيز (Consultation)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canAddMedications !== false}
                        onChange={() => handleTogglePermission('canAddMedications')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span>إضافة أدوية جديدة للعيادة (+ Nouveau)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canEditMedications !== false}
                        onChange={() => handleTogglePermission('canEditMedications')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span>تعديل بيانات وجرعات الأدوية (Modification)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canDeleteMedications !== false}
                        onChange={() => handleTogglePermission('canDeleteMedications')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span className="text-rose-300">حذف أو تعطيل الأدوية (Suppression)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageDrugDatabase !== false}
                        onChange={() => handleTogglePermission('canManageDrugDatabase')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span className="text-amber-300">إدارة قاعدة البيانات (Import/Export Excel)</span>
                    </label>
                  </div>

                  {/* Category 7: Admin & System */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Settings className="w-3.5 h-3.5" />
                      <span>إدارة العيادة والنظام (Administration)</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageStaff}
                        onChange={() => handleTogglePermission('canManageStaff')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span className="font-bold text-purple-300">
                        إدارة الموظفين والرموز السرية PIN
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageBackup}
                        onChange={() => handleTogglePermission('canManageBackup')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span>إدارة النسخ الاحتياطي والأمان</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء (Annuler)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-lg flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {editingUser ? 'حفظ التغييرات (Enregistrer)' : 'حفظ الموظف الجديد (Créer)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingModalOpen && deletingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 bg-rose-950/80 rounded-2xl border border-rose-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Confirmation de Suppression
                </h3>
                <p className="text-xs text-rose-300/80">Action irréversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le membre du personnel{' '}
              <strong className="text-white">{deletingUser.fullName}</strong> (@
              {deletingUser.username}) ? Son code PIN et ses accès seront révoqués.
            </p>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsDeletingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Oui, Supprimer Définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
