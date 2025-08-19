import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, companiesAPI } from '../../services/api';
import {
  BuildingOfficeIcon,
  UsersIcon,
  CalculatorIcon,
  Cog8ToothIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { usersAPI, User, UserUpdateRequest, UserCreateRequest } from '../../services/api';
import { useForm } from 'react-hook-form';

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const [companyName, setCompanyName] = useState(user?.company?.name || '');
  const [companyAddress, setCompanyAddress] = useState(user?.company?.address || '');
  const [companyPhone, setCompanyPhone] = useState(user?.company?.phone || '');
  const [companyEmail, setCompanyEmail] = useState(user?.company?.email || '');
  const [companyProfileMessage, setCompanyProfileMessage] = useState('');
  const [companyProfileError, setCompanyProfileError] = useState('');

  const [searchUsers, setSearchUsers] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      setPasswordChangeMessage('Password changed successfully!');
      setPasswordChangeError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: any) => {
      setPasswordChangeMessage('');
      setPasswordChangeError(error.response?.data?.message || 'Failed to change password.');
    },
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', searchUsers],
    queryFn: () => usersAPI.getAll({ q: searchUsers, take: 50 }),
    select: (res) => (res.data || []) as User[],
  });

  const { register: registerUserForm, handleSubmit: handleUserFormSubmit, reset: resetUserForm } = useForm<UserUpdateRequest | UserCreateRequest>();

  const updateUserMutation = useMutation({
    mutationFn: (payload: { id: string; data: UserUpdateRequest }) =>
      usersAPI.update(payload.id, payload.data),
    onSuccess: () => {
      setUserMessage('User updated successfully!');
      setUserError('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenUserModal(false);
      setEditingUser(null);
      resetUserForm({});
    },
    onError: (error: any) => {
      setUserMessage('');
      setUserError(error.response?.data?.message || 'Failed to update user.');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: UserCreateRequest) => usersAPI.create(payload),
    onSuccess: () => {
      setUserMessage('User created successfully!');
      setUserError('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenUserModal(false);
      setIsCreatingUser(false);
      resetUserForm({});
    },
    onError: (error: any) => {
      setUserMessage('');
      setUserError(error.response?.data?.message || 'Failed to create user.');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersAPI.delete(id),
    onSuccess: () => {
      setUserMessage('User deleted successfully!');
      setUserError('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      setUserMessage('');
      setUserError(error.response?.data?.message || 'Failed to delete user.');
    },
  });

  const startCreateUser = () => {
    setEditingUser(null);
    setIsCreatingUser(true);
    resetUserForm({});
    setOpenUserModal(true);
    setUserMessage('');
    setUserError('');
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setIsCreatingUser(false);
    resetUserForm(user);
    setOpenUserModal(true);
    setUserMessage('');
    setUserError('');
  };

  const onUserSubmit = (form: UserUpdateRequest | UserCreateRequest) => {
    if (isCreatingUser) {
      createUserMutation.mutate(form as UserCreateRequest);
    } else if (editingUser?.id) {
      updateUserMutation.mutate({ id: editingUser.id, data: form as UserUpdateRequest });
    }
  };

  const updateCompanyProfileMutation = useMutation({
    mutationFn: companiesAPI.updateCompanyProfile,
    onSuccess: () => {
      setCompanyProfileMessage('Company profile updated successfully!');
      setCompanyProfileError('');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: any) => {
      setCompanyProfileMessage('');
      setCompanyProfileError(error.response?.data?.message || 'Failed to update company profile.');
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage('');
    setPasswordChangeError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleUpdateCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyProfileMessage('');
    setCompanyProfileError('');

    updateCompanyProfileMutation.mutate({
      name: companyName,
      address: companyAddress,
      phone: companyPhone,
      email: companyEmail,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure system settings and user preferences.</p>
      </div>

      {/* Company Profile */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Profile</h3>
        <form onSubmit={handleUpdateCompanyProfile} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              id="companyPhone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="companyEmail"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          {companyProfileMessage && (
            <p className="text-success-600 text-sm">{companyProfileMessage}</p>
          )}
          {companyProfileError && (
            <p className="text-error-600 text-sm">{companyProfileError}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateCompanyProfileMutation.isPending}
          >
            {updateCompanyProfileMutation.isPending ? 'Saving...' : 'Save Company Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>
          {passwordChangeMessage && (
            <p className="text-success-600 text-sm">{passwordChangeMessage}</p>
          )}
          {passwordChangeError && (
            <p className="text-error-600 text-sm">{passwordChangeError}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* User Management */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">User Management</h3>
          <button onClick={startCreateUser} className="btn-primary">Add User</button>
        </div>
        <div className="flex gap-3 items-center mb-4">
          <input
            className="input-field max-w-sm"
            placeholder="Search users by name or email..."
            value={searchUsers}
            onChange={(e) => setSearchUsers(e.target.value)}
          />
        </div>

        {userMessage && <p className="text-success-600 text-sm mb-4">{userMessage}</p>}
        {userError && <p className="text-error-600 text-sm mb-4">{userError}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingUsers && (<tr><td className="table-cell" colSpan={5}>Loading users...</td></tr>)}
              {!isLoadingUsers && (!users || users.length === 0) && (<tr><td className="table-cell" colSpan={5}>No users found</td></tr>)}
              {Array.isArray(users) && users.map((u) => (
                <tr key={u.id}>
                  <td className="table-cell">{u.firstName} {u.lastName}</td>
                  <td className="table-cell">{u.email}</td>
                  <td className="table-cell">{u.role}</td>
                  <td className="table-cell">{u.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button className="btn-secondary p-2" onClick={() => startEditUser(u)}>
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button className="btn-danger p-2" onClick={() => u.id && deleteUserMutation.mutate(u.id)}>
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openUserModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{isCreatingUser ? 'Add New User' : 'Edit User'}</h3>
              <button className="btn-secondary" onClick={() => { setOpenUserModal(false); setEditingUser(null); setIsCreatingUser(false); resetUserForm({}); }}>Close</button>
            </div>
            <form onSubmit={handleUserFormSubmit(onUserSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input className="input-field mt-1" {...registerUserForm('firstName', { required: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input className="input-field mt-1" {...registerUserForm('lastName', { required: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input className="input-field mt-1" type="email" {...registerUserForm('email', { required: true })} />
              </div>
              {isCreatingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input className="input-field mt-1" type="password" {...registerUserForm('password', { required: isCreatingUser })} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select className="input-field mt-1" {...registerUserForm('role', { required: true })}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  {...registerUserForm('isActive')}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Is Active
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={() => { setOpenUserModal(false); setEditingUser(null); setIsCreatingUser(false); resetUserForm({}); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={updateUserMutation.isPending || createUserMutation.isPending}>
                  {isCreatingUser ? (createUserMutation.isPending ? 'Creating...' : 'Create User') : (updateUserMutation.isPending ? 'Saving...' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Configuration */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Configuration</h3>
        <form onSubmit={handleUpdateCompanyProfile} className="space-y-4">
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
              Tax ID (GST/VAT)
            </label>
            <input
              type="text"
              id="taxId"
              value={user?.company?.taxId || ''}
              onChange={(e) => { /* This field is read-only for now */ }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled
            />
            <p className="mt-2 text-sm text-gray-500">
              Tax ID can only be changed by a Super Admin.
            </p>
          </div>
          {companyProfileMessage && (
            <p className="text-success-600 text-sm">{companyProfileMessage}</p>
          )}
          {companyProfileError && (
            <p className="text-error-600 text-sm">{companyProfileError}</p>
          )}
          {/* No submit button here as taxId is read-only */}
        </form>
      </div>

      {/* System Preferences */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Preferences</h3>
        <form onSubmit={handleUpdateCompanyProfile} className="space-y-4">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Default Currency
            </label>
            <input
              type="text"
              id="currency"
              value={user?.company?.currency || ''}
              onChange={(e) => { /* This field is read-only for now */ }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled
            />
            <p className="mt-2 text-sm text-gray-500">
              Currency can only be changed by a Super Admin.
            </p>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <input
              type="text"
              id="timezone"
              value={user?.company?.timezone || ''}
              onChange={(e) => { /* This field is read-only for now */ }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled
            />
            <p className="mt-2 text-sm text-gray-500">
              Timezone can only be changed by a Super Admin.
            </p>
          </div>
          {companyProfileMessage && (
            <p className="text-success-600 text-sm">{companyProfileMessage}</p>
          )}
          {companyProfileError && (
            <p className="text-error-600 text-sm">{companyProfileError}</p>
          )}
          {/* No submit button here as these fields are read-only */}
        </form>
      </div>
    </div>
  );
};

export default Settings;
