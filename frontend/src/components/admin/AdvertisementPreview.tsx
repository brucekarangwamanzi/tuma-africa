import React from 'react';
import { Eye, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Advertisement } from '../../store/settingsStore';

interface AdvertisementPreviewProps {
  advertisement: Advertisement;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}

const AdvertisementPreview: React.FC<AdvertisementPreviewProps> = ({
  advertisement,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const getPositionBadge = (position: string) => {
    const colors = {
      banner: 'bg-blue-100 text-blue-800',
      sidebar: 'bg-green-100 text-green-800',
      footer: 'bg-gray-100 text-gray-800',
      popup: 'bg-purple-100 text-purple-800',
      inline: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[position as keyof typeof colors] || colors.banner}`}>
        {position.charAt(0).toUpperCase() + position.slice(1)}
      </span>
    );
  };

  const isExpired = advertisement.endDate && new Date(advertisement.endDate) < new Date();
  const isScheduled = new Date(advertisement.startDate) > new Date();

  return (
    <div className={`bg-white rounded-lg border-2 p-4 transition-all ${
      advertisement.isActive && !isExpired ? 'border-green-200' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getPositionBadge(advertisement.position)}
          {!advertisement.isActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Inactive
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Expired
            </span>
          )}
          {isScheduled && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Scheduled
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit advertisement"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete advertisement"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start space-x-3">
        {advertisement.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={advertisement.imageUrl}
              alt={advertisement.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {advertisement.title}
          </h3>
          
          {advertisement.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {advertisement.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {new Date(advertisement.startDate).toLocaleDateString()}
              {advertisement.endDate && ` - ${new Date(advertisement.endDate).toLocaleDateString()}`}
            </div>
            
            {advertisement.linkUrl && (
              <a
                href={advertisement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                title="Visit link"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {onToggleActive && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={onToggleActive}
            className={`w-full text-xs font-medium py-2 px-3 rounded transition-colors ${
              advertisement.isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {advertisement.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvertisementPreview;