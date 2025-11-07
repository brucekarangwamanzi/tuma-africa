import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  Reply,
  Star,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'waiting' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  tags: string[];
}

const ChatManagement: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    waiting: 0,
    resolved: 0,
    avgResponseTime: '0m'
  });

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/chat/admin/sessions');
      const sessions = response.data.sessions || [];
      setChatSessions(sessions);
      
      // Calculate stats
      const total = sessions.length;
      const active = sessions.filter((s: ChatSession) => s.status === 'active').length;
      const waiting = sessions.filter((s: ChatSession) => s.status === 'waiting').length;
      const resolved = sessions.filter((s: ChatSession) => s.status === 'resolved').length;
      
      setStats({
        total,
        active,
        waiting,
        resolved,
        avgResponseTime: '2.5m' // Mock data - would come from API
      });
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ChatSession['status']) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: ChatSession['priority']) => {
    const priorityConfig = {
      low: 'bg-blue-100 text-blue-800',
      normal: 'bg-gray-100 text-gray-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Chats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Waiting</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-600">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Management Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Customer Conversations</h2>
                <p className="text-sm text-gray-600">Manage and respond to customer support chats</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchChatSessions}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                {filteredSessions.length} conversations
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or message content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-xl px-3 py-3 border border-gray-300 shadow-sm">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sessions List */}
        <div className="divide-y divide-gray-100">
          {filteredSessions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No customer conversations yet'
                }
              </p>
              {searchQuery || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`px-6 py-5 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                  selectedChat === session.id ? 'bg-blue-50 border-r-4 border-blue-500 shadow-sm' : ''
                }`}
                onClick={() => setSelectedChat(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      {session.status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                      {session.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                          {session.unreadCount > 9 ? '9+' : session.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {session.userName}
                        </p>
                        {getStatusBadge(session.status)}
                        {getPriorityBadge(session.priority)}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mb-2 flex items-center space-x-1">
                        <span>{session.userEmail}</span>
                      </p>
                      
                      <p className="text-sm text-gray-500 truncate leading-relaxed">
                        {session.lastMessage}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(session.lastMessageTime), { addSuffix: true })}</span>
                      </div>
                      
                      {session.assignedTo && (
                        <div className="text-xs text-blue-600 font-medium">
                          Assigned to {session.assignedTo}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Reply to conversation"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                        title="Star conversation"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {session.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatManagement;