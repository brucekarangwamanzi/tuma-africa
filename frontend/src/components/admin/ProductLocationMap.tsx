import React from 'react';
import { Package, MapPin, Truck, Warehouse, Home, CheckCircle, Clock } from 'lucide-react';

interface LocationStage {
  stage: string;
  location: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ProductLocationMapProps {
  currentStatus: string;
  trackingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  };
  stageHistory?: Array<{
    stage: string;
    timestamp: string;
    notes?: string;
  }>;
}

const ProductLocationMap: React.FC<ProductLocationMapProps> = ({
  currentStatus,
  trackingInfo,
  stageHistory = []
}) => {
  const stages: LocationStage[] = [
    {
      stage: 'pending',
      location: 'Order Received',
      icon: <Clock className="h-5 w-5" />,
      color: 'gray',
      description: 'Order is being reviewed'
    },
    {
      stage: 'approved',
      location: 'Order Approved',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'blue',
      description: 'Order approved, ready to purchase'
    },
    {
      stage: 'purchased',
      location: 'Supplier (Asia)',
      icon: <Package className="h-5 w-5" />,
      color: 'purple',
      description: 'Product purchased from supplier'
    },
    {
      stage: 'warehouse',
      location: 'Warehouse (Transit)',
      icon: <Warehouse className="h-5 w-5" />,
      color: 'orange',
      description: 'Product in transit warehouse'
    },
    {
      stage: 'shipped',
      location: 'In Transit to Africa',
      icon: <Truck className="h-5 w-5" />,
      color: 'indigo',
      description: 'Product shipped to destination'
    },
    {
      stage: 'delivered',
      location: 'Delivered',
      icon: <Home className="h-5 w-5" />,
      color: 'green',
      description: 'Product delivered to customer'
    }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.stage === currentStatus);
  };

  const currentStageIndex = getCurrentStageIndex();

  const getStageDate = (stage: string) => {
    const history = stageHistory.find(h => h.stage === stage);
    return history?.timestamp ? new Date(history.timestamp).toLocaleDateString() : null;
  };

  const getColorClasses = (color: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        bg: `bg-${color}-500`,
        text: `text-${color}-700`,
        border: `border-${color}-500`,
        ring: `ring-${color}-100`
      };
    }
    if (isActive) {
      return {
        bg: `bg-${color}-500`,
        text: `text-${color}-700`,
        border: `border-${color}-500`,
        ring: `ring-${color}-100`
      };
    }
    return {
      bg: 'bg-gray-200',
      text: 'text-gray-500',
      border: 'border-gray-300',
      ring: 'ring-gray-100'
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" />
            Product Location
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Track your product's journey from Asia to Africa
          </p>
        </div>
        {trackingInfo?.trackingNumber && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Tracking Number</p>
            <p className="font-mono font-semibold text-primary-600">
              {trackingInfo.trackingNumber}
            </p>
            {trackingInfo.carrier && (
              <p className="text-xs text-gray-500">{trackingInfo.carrier}</p>
            )}
          </div>
        )}
      </div>

      {/* Desktop View - Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-primary-500 transition-all duration-500"
              style={{
                width: `${(currentStageIndex / (stages.length - 1)) * 100}%`
              }}
            />
          </div>

          {/* Stages */}
          <div className="relative grid grid-cols-6 gap-4">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isActive = index === currentStageIndex;
              const stageDate = getStageDate(stage.stage);

              return (
                <div key={stage.stage} className="flex flex-col items-center">
                  {/* Icon Circle */}
                  <div
                    className={`
                      relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                      border-4 transition-all duration-300
                      ${isCompleted || isActive
                        ? 'bg-primary-500 border-primary-500 text-white shadow-lg'
                        : 'bg-white border-gray-300 text-gray-400'
                      }
                      ${isActive ? 'ring-4 ring-primary-100 scale-110' : ''}
                    `}
                  >
                    {stage.icon}
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="mt-4 text-center">
                    <p
                      className={`
                        text-sm font-semibold
                        ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-500'}
                      `}
                    >
                      {stage.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
                      {stage.description}
                    </p>
                    {stageDate && (
                      <p className="text-xs text-primary-600 font-medium mt-2">
                        {stageDate}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile View - Vertical Timeline */}
      <div className="md:hidden space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isActive = index === currentStageIndex;
          const stageDate = getStageDate(stage.stage);

          return (
            <div key={stage.stage} className="flex items-start">
              {/* Icon and Line */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    border-4 transition-all duration-300
                    ${isCompleted || isActive
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                    ${isActive ? 'ring-4 ring-primary-100' : ''}
                  `}
                >
                  {stage.icon}
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`
                      w-1 h-16 mt-2
                      ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1 pt-2">
                <p
                  className={`
                    font-semibold
                    ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-500'}
                  `}
                >
                  {stage.location}
                </p>
                <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                {stageDate && (
                  <p className="text-sm text-primary-600 font-medium mt-1">
                    {stageDate}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Delivery */}
      {trackingInfo?.estimatedDelivery && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Estimated Delivery
              </span>
            </div>
            <span className="text-sm font-semibold text-primary-600">
              {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}

      {/* Current Location Details */}
      {currentStageIndex >= 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Status</h4>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              {stages[currentStageIndex].icon}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {stages[currentStageIndex].location}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stages[currentStageIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductLocationMap;
