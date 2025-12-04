import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  Check,
  X,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Edit,
  Clock
} from 'lucide-react';
import { useUserStore, getUserId } from '../../store/userStore';
import { formatDistanceToNow } from 'date-fns';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { 
    currentUser: user, 
    isLoading, 
    fetchUser, 
    approveUser, 
    updateUserRole, 
    deactivateUser,
    clearCurrentUser 
  } = useUserStore();

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }

    return () => {
      clearCurrentUser();
    };
  }, [userId]);

  const handleApproval = async (approved: boolean) => {
    if (!user) return;
    
    const action = approved ? 'approve' : 'deny';
    const userId = getUserId(user);
    if (!userId) {
      console.error('User ID is missing');
      return;
    }
    if (window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) {
      await approveUser(userId, approved);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    
    const userId = getUserId(user);
    if (!userId) {
      console.error('User ID is missing');
      return;
    }
    if (window.confirm(`Are you sure you want to change ${user.fullName}'s role to ${newRole}?`)) {
      await updateUserRole(userId, newRole);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    
    const userId = getUserId(user);
    if (!userId) {
      console.error('User ID is missing');
      return;
    }
    if (window.confirm(`Are you sure you want to deactivate ${user.fullName}? This action cannot be undone.`)) {
      await deactivateUser(userId);
      navigate('/admin/users');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      user: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Users className="w-4 h-4" /> },
      admin: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Shield className="w-4 h-4" /> },
      super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Shield className="w-4 h-4" /> }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
    return (
      <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{role.replace('_', ' ').toUpperCase()}</span>
      </span>
    );
  };

  const getStatusBadge = (approved: boolean, verified: boolean, isActive: boolean) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <X className="w-4 h-4" />
          <span>Inactive</span>
        </span>
      );
    }
    
    if (!approved) {
      return (
        <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-4 h-4" />
          <span>Pending Approval</span>
        </span>
      );
    }
    
    if (!verified) {
      return (
        <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-4 h-4" />
          <span>Unverified</span>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-4 h-4" />
        <span>Active & Verified</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/admin/users"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Users
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="relative mr-6">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.fullName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                )}
                {user.isActive && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Member since {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getRoleBadge(user.role)}
              {getStatusBadge(user.approved, user.verified, user.isActive)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Mail className="w-6 h-6 text-blue-600 mr-3" />
                Contact Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            {user.address && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 text-green-600 mr-3" />
                  Address Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.address.street && (
                    <div>
                      <p className="text-sm text-gray-600">Street Address</p>
                      <p className="font-medium text-gray-900">{user.address.street}</p>
                    </div>
                  )}
                  
                  {user.address.city && (
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-medium text-gray-900">{user.address.city}</p>
                    </div>
                  )}
                  
                  {user.address.state && (
                    <div>
                      <p className="text-sm text-gray-600">State/Province</p>
                      <p className="font-medium text-gray-900">{user.address.state}</p>
                    </div>
                  )}
                  
                  {user.address.country && (
                    <div>
                      <p className="text-sm text-gray-600">Country</p>
                      <p className="font-medium text-gray-900">{user.address.country}</p>
                    </div>
                  )}
                  
                  {user.address.zipCode && (
                    <div>
                      <p className="text-sm text-gray-600">ZIP/Postal Code</p>
                      <p className="font-medium text-gray-900">{user.address.zipCode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="w-6 h-6 text-purple-600 mr-3" />
                Account Activity
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Account Created</p>
                      <p className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Edit className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {user.lastLogin && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Last Login</p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {!user.approved && user.isActive && (
                  <>
                    <button
                      onClick={() => handleApproval(true)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve User
                    </button>
                    
                    <button
                      onClick={() => handleApproval(false)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Deny User
                    </button>
                  </>
                )}
                
                {user.approved && user.isActive && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Change Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}
                
                {user.isActive && (
                  <button
                    onClick={handleDeactivate}
                    className="w-full flex items-center justify-center px-4 py-3 text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate User
                  </button>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Active</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.approved ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {user.verified ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID</span>
                  <span className="font-mono text-gray-900 text-xs">{getUserId(user)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium text-gray-900">{user.role.replace('_', ' ').toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Member For</span>
                  <span className="font-medium text-gray-900">
                    {formatDistanceToNow(new Date(user.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;