import React from 'react';
import { Package } from 'lucide-react';
import ProductManagementCMS from '../../components/admin/ProductManagementCMS';

/**
 * CMS Page - Product Management Only
 * 
 * This is a dedicated CMS page that focuses solely on product management.
 * It provides a clean interface for admins to manage products.
 */
const CMS: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your products and catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Management Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductManagementCMS />
      </div>
    </div>
  );
};

export default CMS;


