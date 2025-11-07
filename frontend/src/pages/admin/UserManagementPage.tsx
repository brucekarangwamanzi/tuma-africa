import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Check,
  X,
  Eye,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { formatDistanceToNow } from 'date-fns';

const UserManagementPage: React.FC = () => {
  const {
    users,
    stats,
    pagination,
    isLoading,
    fetchUsers,
    approveUser,
    updateUserRole,
    deactivateUser
  } = useUserStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [approvalFilter, setApprovalFilter] = useState(searchParams.get('approved') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('verified') || '');

  useEffect(() => {
    loadUsers();
  }, [searchParams]);

  const loadUsers = async () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (roleFilter) params.set('role', roleFilter);
    if (approvalFilter) params.set('approved', approvalFilter);
    if (statusFilter) params.set('verified', statusFilter);
    params.set('page', searchParams.get('page') || '1');
    params.set('limit', '20');

    await fetchUsers(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleApproval = async (userId: string, approved: boolean, userName: string) => {
    const action = approved ? 'approve' : 'deny';
    if (window.confirm(`Are you sure you want to ${action} ${userName}?`)) {
      await approveUser(userId, approved);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    if (window.confirm(`Are you sure you want to change ${userName}'s role to ${newRole}?`)) {
      await updateUserRole(userId, newRole);
    }
  };

  const handleDeactivate = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${userName}? This action cannot be undone.`)) {
      await deactivateUser(userId);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      user: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Users className="w-3 h-3" /> },
      admin: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Shield className="w-3 h-3" /> },
      super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Shield className="w-3 h-3" /> }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{role.replace('_', ' ').toUpperCase()}</span>
      </span>
    );
  };

  const getStatusBadge = (approved: boolean, verified: boolean, isActive: boolean) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="w-3 h-3" />
          <span>Inactive</span>
        </span>
      );
    }
    
    if (!approved) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          <span>Pending Approval</span>
        </span>
      );
    }
    
    if (!verified) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3" />
          <span>Unverified</span>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        <span>Active</span>
      </span>
    );
  };

  if (isLoading && !users.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage user registrations, approvals, and permissions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadUsers}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.verified}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.active}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      handleFilterChange('role', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <UserCheck className="w-4 h-4 text-gray-500" />
                  <select
                    value={approvalFilter}
                    onChange={(e) => {
                      setApprovalFilter(e.target.value);
                      handleFilterChange('approved', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Status</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange('verified', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Verification</option>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center py-16 px-6">
                <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No users found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery || roleFilter || approvalFilter || statusFilter
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'No users have registered yet'}
                </p>
                {(searchQuery || roleFilter || approvalFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('');
                      setApprovalFilter('');
                      setStatusFilter('');
                      setSearchParams({});
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            users.map((user) => (
              <div key={user._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                          <div className="relative">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.fullName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                            )}
                            {user.isActive && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.fullName}</h3>
                            <p className="text-sm text-gray-500">
                              Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.approved, user.verified, user.isActive)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{user.email}</p>
                          </div>
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-gray-500">Phone</p>
                              <p className="font-medium text-gray-900">{user.phone}</p>
                            </div>
                          </div>
                        )}
                        
                        {user.address && (user.address.city || user.address.country) && (
                          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium text-gray-900">
                                {[user.address.city, user.address.country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {user.lastLogin && (
                          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-gray-500">Last Login</p>
                              <p className="font-medium text-gray-900">
                                {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 xl:mt-0 xl:ml-8 flex flex-col sm:flex-row xl:flex-col gap-3">
                      {!user.approved && user.isActive && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproval(user._id, true, user.fullName)}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproval(user._id, false, user.fullName)}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Deny
                          </button>
                        </div>
                      )}
                      
                      {user.approved && user.isActive && (
                        <div className="flex space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value, user.fullName)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="flex-1 flex items-center justify-center px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                        
                        {user.isActive && (
                          <button
                            onClick={() => handleDeactivate(user._id, user.fullName)}
                            className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              {pagination.hasPrev && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current - 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Previous
                </Link>
              )}
              
              <div className="flex items-center space-x-1 px-4">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.current;
                  
                  return (
                    <Link
                      key={pageNum}
                      to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pageNum) })}`}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              
              <div className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                Page {pagination.current} of {pagination.pages}
              </div>
              
              {pagination.hasNext && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current + 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;