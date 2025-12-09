import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useSettingsStore, Advertisement } from '../../store/settingsStore';

interface AdvertisementBannerProps {
  position: 'banner' | 'sidebar' | 'footer' | 'popup' | 'inline';
  className?: string;
  maxAds?: number;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position, 
  className = '', 
  maxAds = 1 
}) => {
  const { settings } = useSettingsStore();
  const [visibleAds, setVisibleAds] = useState<Advertisement[]>([]);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  useEffect(() => {
    if (!settings?.advertisements) return;

    const now = new Date();
    const activeAds = settings.advertisements.filter((ad: Advertisement) => {
      // Check if ad is active
      if (!ad.isActive) return false;
      
      // Check if ad matches position
      if (ad.position !== position) return false;
      
      // Check if ad is dismissed (for popups)
      if (position === 'popup' && dismissedAds.includes(ad.id)) return false;
      
      // Check date range
      const startDate = new Date(ad.startDate);
      if (startDate > now) return false;
      
      if (ad.endDate) {
        const endDate = new Date(ad.endDate);
        if (endDate < now) return false;
      }
      
      return true;
    });

    // Limit number of ads shown
    setVisibleAds(activeAds.slice(0, maxAds));
  }, [settings?.advertisements, position, maxAds, dismissedAds]);

  const handleAdClick = (ad: Advertisement) => {
    // Track click (you can implement analytics here)
    console.log('Ad clicked:', ad.title);
    
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismiss = (adId: string) => {
    setDismissedAds(prev => [...prev, adId]);
  };

  if (visibleAds.length === 0) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'banner':
        return 'w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'sidebar':
        return 'w-full bg-white border border-gray-200 rounded-lg shadow-sm';
      case 'footer':
        return 'w-full bg-gray-800 text-white';
      case 'popup':
        return 'fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm';
      case 'inline':
        return 'w-full bg-gray-50 border border-gray-200 rounded-lg';
      default:
        return 'w-full';
    }
  };

  return (
    <div className={`${getPositionStyles()} ${className}`}>
      {visibleAds.map((ad) => (
        <div key={ad.id} className="relative">
          {/* Dismiss button for popups */}
          {position === 'popup' && (
            <button
              onClick={() => handleDismiss(ad.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div
            onClick={() => handleAdClick(ad)}
            className={`
              cursor-pointer transition-all duration-200 hover:opacity-90
              ${position === 'banner' ? 'p-4' : 'p-6'}
              ${position === 'popup' ? 'pr-8' : ''}
            `}
          >
            <div className={`
              flex items-center space-x-4
              ${position === 'banner' ? 'justify-center text-center' : ''}
            `}>
              {ad.imageUrl && (
                <div className={`
                  flex-shrink-0
                  ${position === 'banner' ? 'w-12 h-12' : 'w-16 h-16'}
                `}>
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-semibold
                  ${position === 'banner' ? 'text-lg' : 'text-base'}
                  ${position === 'footer' ? 'text-white' : 'text-gray-900'}
                `}>
                  {ad.title}
                </h3>
                
                {ad.description && (
                  <p className={`
                    text-sm mt-1
                    ${position === 'banner' ? 'text-orange-100' : ''}
                    ${position === 'footer' ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    {ad.description}
                  </p>
                )}
              </div>

              {ad.linkUrl && (
                <div className="flex-shrink-0">
                  <ExternalLink className={`
                    h-5 w-5
                    ${position === 'banner' || position === 'footer' ? 'text-white' : 'text-gray-400'}
                  `} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdvertisementBanner;