import React, { useState, useEffect } from 'react';
import { Save, Upload, Eye, EyeOff, Palette, Image, Type, Settings, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSettingsStore, AdminSettings } from '../../store/settingsStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ProductsSectionManager from '../../components/admin/ProductsSectionManager';
import ProductManagementCMS from '../../components/admin/ProductManagementCMS';

const SuperAdminCMS: React.FC = () => {
  const { settings, updateSettings, isUpdating } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('hero');
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<AdminSettings>();

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const watchedValues = watch();

  const onSubmit = async (data: AdminSettings) => {
    try {
      await updateSettings(data);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    fileType: 'image' | 'video'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = fileType === 'image' 
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm'];
    
    if (!validTypes.includes(file.type)) {
      toast.error(`Please select a valid ${fileType} file`);
      return;
    }

    // Validate file size
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 15 * 1024 * 1024; // 5MB for images, 15MB for videos
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${fileType === 'image' ? '5MB' : '15MB'}`);
      return;
    }

    setUploadingFile(fieldName);
    try {
      const formData = new FormData();
      formData.append(fileType, file);

      const response = await axios.post(`/upload/${fileType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = response.data[`${fileType}Url`];
      setValue(fieldName as any, fileUrl);
      toast.success(`${fileType} uploaded successfully`);
    } catch (error: any) {
      console.error(`${fileType} upload error:`, error);
      toast.error(`Failed to upload ${fileType}`);
    } finally {
      setUploadingFile(null);
    }
  };

  const tabs = [
    { id: 'hero', label: 'Hero Section', icon: Image },
    { id: 'advertisements', label: 'Advertisements', icon: Settings },
    { id: 'products', label: 'Products Section', icon: Settings },
    { id: 'product-management', label: 'Product Management', icon: Plus },
    { id: 'theme', label: 'Theme & Colors', icon: Palette },
    { id: 'company', label: 'Company Info', icon: Type },
    { id: 'social', label: 'Social Links', icon: Settings },
    { id: 'features', label: 'Features', icon: Settings },
  ];

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Website CMS</h1>
            <p className="text-gray-600 mt-2">
              Manage your website content, appearance, and settings
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`btn-outline flex items-center ${previewMode ? 'bg-primary-50 border-primary-300' : ''}`}
            >
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isUpdating}
              className="btn-primary flex items-center"
            >
              {isUpdating ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Product Management is separate - no form wrapper */}
            {activeTab === 'product-management' ? (
              <ProductManagementCMS />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Hero Section */}
                {activeTab === 'hero' && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Hero Section</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="label">Hero Title</label>
                      <input
                        type="text"
                        {...register('heroSection.title', { required: 'Title is required' })}
                        className="input"
                        placeholder="Your main headline"
                      />
                      {errors.heroSection?.title && (
                        <p className="text-error-600 text-sm mt-1">{errors.heroSection.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Hero Subtitle</label>
                      <textarea
                        {...register('heroSection.subtitle', { required: 'Subtitle is required' })}
                        className="input"
                        rows={3}
                        placeholder="Supporting text for your headline"
                      />
                      {errors.heroSection?.subtitle && (
                        <p className="text-error-600 text-sm mt-1">{errors.heroSection.subtitle.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Background Type</label>
                      <select
                        {...register('heroSection.backgroundType')}
                        className="input"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="color">Solid Color</option>
                      </select>
                    </div>

                    {watchedValues.heroSection?.backgroundType === 'image' && (
                      <div>
                        <label className="label">Background Image</label>
                        <div className="space-y-4">
                          {watchedValues.heroSection?.backgroundImage && (
                            <img
                              src={watchedValues.heroSection.backgroundImage}
                              alt="Background"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex items-center space-x-4">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'heroSection.backgroundImage', 'image')}
                              className="hidden"
                              id="hero-bg-image"
                            />
                            <label
                              htmlFor="hero-bg-image"
                              className="btn-outline cursor-pointer flex items-center"
                            >
                              {uploadingFile === 'heroSection.backgroundImage' ? (
                                <LoadingSpinner size="sm" className="mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Upload Image
                            </label>
                            <input
                              type="url"
                              {...register('heroSection.backgroundImage')}
                              className="input flex-1"
                              placeholder="Or enter image URL"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {watchedValues.heroSection?.backgroundType === 'color' && (
                      <div>
                        <label className="label">Background Color</label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            {...register('heroSection.backgroundColor')}
                            className="w-12 h-12 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            {...register('heroSection.backgroundColor')}
                            className="input flex-1"
                            placeholder="#1f2937"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Advertisements Section */}
              {activeTab === 'advertisements' && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Advertisement Management</h2>
                    <button
                      type="button"
                      onClick={() => {
                        const currentAds = watchedValues.advertisements || [];
                        setValue('advertisements', [
                          ...currentAds,
                          {
                            id: Date.now().toString(),
                            title: '',
                            description: '',
                            imageUrl: '',
                            linkUrl: '',
                            isActive: true,
                            position: 'banner',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: ''
                          }
                        ]);
                      }}
                      className="btn-primary flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Advertisement
                    </button>
                  </div>

                  <div className="space-y-6">
                    {(watchedValues.advertisements || []).map((ad: any, index: number) => (
                      <div key={ad.id || index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Advertisement #{index + 1}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register(`advertisements.${index}.isActive`)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Active</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const currentAds = watchedValues.advertisements || [];
                                const newAds = currentAds.filter((_: any, i: number) => i !== index);
                                setValue('advertisements', newAds);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="label">Advertisement Title</label>
                              <input
                                type="text"
                                {...register(`advertisements.${index}.title`)}
                                className="input"
                                placeholder="Enter advertisement title"
                              />
                            </div>

                            <div>
                              <label className="label">Description</label>
                              <textarea
                                {...register(`advertisements.${index}.description`)}
                                className="input"
                                rows={3}
                                placeholder="Enter advertisement description"
                              />
                            </div>

                            <div>
                              <label className="label">Link URL</label>
                              <input
                                type="url"
                                {...register(`advertisements.${index}.linkUrl`)}
                                className="input"
                                placeholder="https://example.com"
                              />
                            </div>

                            <div>
                              <label className="label">Position</label>
                              <select
                                {...register(`advertisements.${index}.position`)}
                                className="input"
                              >
                                <option value="banner">Top Banner</option>
                                <option value="sidebar">Sidebar</option>
                                <option value="footer">Footer</option>
                                <option value="popup">Popup</option>
                                <option value="inline">Inline Content</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="label">Advertisement Image</label>
                              <div className="space-y-4">
                                {ad.imageUrl && (
                                  <img
                                    src={ad.imageUrl}
                                    alt="Advertisement"
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, `advertisements.${index}.imageUrl`, 'image')}
                                    className="hidden"
                                    id={`ad-image-${index}`}
                                  />
                                  <label
                                    htmlFor={`ad-image-${index}`}
                                    className="btn-outline cursor-pointer flex items-center"
                                  >
                                    {uploadingFile === `advertisements.${index}.imageUrl` ? (
                                      <LoadingSpinner size="sm" className="mr-2" />
                                    ) : (
                                      <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Upload Image
                                  </label>
                                  <input
                                    type="url"
                                    {...register(`advertisements.${index}.imageUrl`)}
                                    className="input flex-1"
                                    placeholder="Or enter image URL"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="label">Start Date</label>
                                <input
                                  type="date"
                                  {...register(`advertisements.${index}.startDate`)}
                                  className="input"
                                />
                              </div>
                              <div>
                                <label className="label">End Date (Optional)</label>
                                <input
                                  type="date"
                                  {...register(`advertisements.${index}.endDate`)}
                                  className="input"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!watchedValues.advertisements || watchedValues.advertisements.length === 0) && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Advertisements</h3>
                        <p className="text-gray-600 mb-4">
                          Create your first advertisement to start promoting your products and services.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setValue('advertisements', [
                              {
                                id: Date.now().toString(),
                                title: '',
                                description: '',
                                imageUrl: '',
                                linkUrl: '',
                                isActive: true,
                                position: 'banner',
                                startDate: new Date().toISOString().split('T')[0],
                                endDate: ''
                              }
                            ]);
                          }}
                          className="btn-primary flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Advertisement
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {activeTab === 'products' && (
                <ProductsSectionManager 
                  register={register}
                  setValue={setValue}
                  watchedValues={watchedValues}
                />
              )}

              {/* Company Info Section */}
              {activeTab === 'company' && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="label">Company Name</label>
                      <input
                        type="text"
                        {...register('companyInfo.name')}
                        className="input"
                        placeholder="Tuma-Africa Link Cargo"
                      />
                    </div>

                    <div>
                      <label className="label">Company Logo</label>
                      <div className="space-y-4">
                        {watchedValues.companyInfo?.logo && (
                          <img
                            src={watchedValues.companyInfo.logo}
                            alt="Company Logo"
                            className="w-32 h-32 object-contain rounded-lg border border-gray-200"
                          />
                        )}
                        <div className="flex items-center space-x-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'companyInfo.logo', 'image')}
                            className="hidden"
                            id="company-logo"
                          />
                          <label
                            htmlFor="company-logo"
                            className="btn-outline cursor-pointer flex items-center"
                          >
                            {uploadingFile === 'companyInfo.logo' ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload Logo
                          </label>
                          <input
                            type="url"
                            {...register('companyInfo.logo')}
                            className="input flex-1"
                            placeholder="Or enter logo URL"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="label">Company Description</label>
                      <textarea
                        {...register('companyInfo.description')}
                        className="input"
                        rows={4}
                        placeholder="Brief description of your company"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="label">Contact Email</label>
                        <input
                          type="email"
                          {...register('companyInfo.contact.email')}
                          className="input"
                          placeholder="contact@tuma-africa.com"
                        />
                      </div>

                      <div>
                        <label className="label">Contact Phone</label>
                        <input
                          type="tel"
                          {...register('companyInfo.contact.phone')}
                          className="input"
                          placeholder="+250 123 456 789"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Address</label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          {...register('companyInfo.address.street')}
                          className="input"
                          placeholder="Street address"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            {...register('companyInfo.address.city')}
                            className="input"
                            placeholder="City"
                          />
                          <input
                            type="text"
                            {...register('companyInfo.address.state')}
                            className="input"
                            placeholder="State/Province"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            {...register('companyInfo.address.country')}
                            className="input"
                            placeholder="Country"
                          />
                          <input
                            type="text"
                            {...register('companyInfo.address.zipCode')}
                            className="input"
                            placeholder="ZIP/Postal Code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Theme & Colors Section */}
              {activeTab === 'theme' && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Theme & Colors</h2>
                  <p className="text-gray-600 mb-6">
                    Customize your website's color scheme and visual appearance
                  </p>
                  
                  <div className="space-y-8">
                    {/* Color Palette */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Color Palette</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="label">Primary Color</label>
                          <p className="text-sm text-gray-600 mb-2">
                            Main brand color used for buttons, links, and highlights
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                              type="color"
                              {...register('theme.primaryColor')}
                              className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              {...register('theme.primaryColor')}
                              className="input flex-1 font-mono"
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="label">Secondary Color</label>
                          <p className="text-sm text-gray-600 mb-2">
                            Supporting color for secondary elements
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                              type="color"
                              {...register('theme.secondaryColor')}
                              className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              {...register('theme.secondaryColor')}
                              className="input flex-1 font-mono"
                              placeholder="#64748b"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="label">Accent Color</label>
                          <p className="text-sm text-gray-600 mb-2">
                            Used for special highlights and call-to-actions
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                              type="color"
                              {...register('theme.accentColor')}
                              className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              {...register('theme.accentColor')}
                              className="input flex-1 font-mono"
                              placeholder="#f59e0b"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="label">Background Color</label>
                          <p className="text-sm text-gray-600 mb-2">
                            Main background color for the website
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                              type="color"
                              {...register('theme.backgroundColor')}
                              className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              {...register('theme.backgroundColor')}
                              className="input flex-1 font-mono"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Color Preview</h3>
                      
                      {/* Color Swatches */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="text-center">
                          <div 
                            className="w-full h-24 rounded-lg shadow-md mb-2"
                            style={{ backgroundColor: watchedValues.theme?.primaryColor || '#3b82f6' }}
                          />
                          <p className="text-sm font-medium text-gray-700">Primary</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {watchedValues.theme?.primaryColor || '#3b82f6'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-24 rounded-lg shadow-md mb-2"
                            style={{ backgroundColor: watchedValues.theme?.secondaryColor || '#64748b' }}
                          />
                          <p className="text-sm font-medium text-gray-700">Secondary</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {watchedValues.theme?.secondaryColor || '#64748b'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-24 rounded-lg shadow-md mb-2"
                            style={{ backgroundColor: watchedValues.theme?.accentColor || '#f59e0b' }}
                          />
                          <p className="text-sm font-medium text-gray-700">Accent</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {watchedValues.theme?.accentColor || '#f59e0b'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div 
                            className="w-full h-24 rounded-lg shadow-md mb-2 border border-gray-200"
                            style={{ backgroundColor: watchedValues.theme?.backgroundColor || '#ffffff' }}
                          />
                          <p className="text-sm font-medium text-gray-700">Background</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {watchedValues.theme?.backgroundColor || '#ffffff'}
                          </p>
                        </div>
                      </div>

                      {/* Live Component Preview */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Live Component Preview</h4>
                        <div className="space-y-4">
                          
                          {/* Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <button 
                              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
                              style={{ backgroundColor: watchedValues.theme?.primaryColor || '#3b82f6' }}
                            >
                              Primary Button
                            </button>
                            <button 
                              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
                              style={{ backgroundColor: watchedValues.theme?.secondaryColor || '#64748b' }}
                            >
                              Secondary Button
                            </button>
                            <button 
                              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
                              style={{ backgroundColor: watchedValues.theme?.accentColor || '#f59e0b' }}
                            >
                              Accent Button
                            </button>
                          </div>

                          {/* Navigation Example */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex space-x-6">
                              <a 
                                href="#" 
                                className="font-medium border-b-2 pb-2"
                                style={{ 
                                  color: watchedValues.theme?.primaryColor || '#3b82f6',
                                  borderColor: watchedValues.theme?.primaryColor || '#3b82f6'
                                }}
                              >
                                Active Tab
                              </a>
                              <a href="#" className="font-medium text-gray-500 pb-2">Inactive Tab</a>
                              <a href="#" className="font-medium text-gray-500 pb-2">Another Tab</a>
                            </div>
                          </div>

                          {/* Card Example */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-900">Sample Product Card</h5>
                              <span 
                                className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                style={{ backgroundColor: watchedValues.theme?.accentColor || '#f59e0b' }}
                              >
                                New
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">This is how your product cards will look with the selected theme colors.</p>
                            <div className="flex items-center justify-between">
                              <span 
                                className="text-lg font-bold"
                                style={{ color: watchedValues.theme?.primaryColor || '#3b82f6' }}
                              >
                                $29.99
                              </span>
                              <button 
                                className="px-3 py-1 text-sm font-medium text-white rounded-md"
                                style={{ backgroundColor: watchedValues.theme?.primaryColor || '#3b82f6' }}
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>

                          {/* Message Bubble Example */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Chat Interface Preview</h5>
                            <div className="space-y-2">
                              <div className="flex justify-end">
                                <div 
                                  className="px-3 py-2 rounded-lg text-sm max-w-xs"
                                  style={{ backgroundColor: `${watchedValues.theme?.primaryColor || '#3b82f6'}20` }}
                                >
                                  This is how sent messages will appear
                                </div>
                              </div>
                              <div className="flex justify-start">
                                <div className="bg-white border px-3 py-2 rounded-lg text-sm max-w-xs">
                                  And this is how received messages look
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Typography</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="label">Font Family</label>
                          <select
                            {...register('theme.fontFamily')}
                            className="input"
                          >
                            <option value="inter">Inter (Default)</option>
                            <option value="roboto">Roboto</option>
                            <option value="poppins">Poppins</option>
                            <option value="montserrat">Montserrat</option>
                          </select>
                          <p className="text-sm text-gray-600 mt-1">
                            Choose the primary font for your website
                          </p>
                        </div>

                        {/* Font Preview */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <p 
                            className="text-2xl font-bold mb-2"
                            style={{ 
                              fontFamily: watchedValues.theme?.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                                         watchedValues.theme?.fontFamily === 'poppins' ? 'Poppins, sans-serif' :
                                         watchedValues.theme?.fontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                                         'Inter, sans-serif'
                            }}
                          >
                            The quick brown fox jumps over the lazy dog
                          </p>
                          <p 
                            className="text-base text-gray-600"
                            style={{ 
                              fontFamily: watchedValues.theme?.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                                         watchedValues.theme?.fontFamily === 'poppins' ? 'Poppins, sans-serif' :
                                         watchedValues.theme?.fontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                                         'Inter, sans-serif'
                            }}
                          >
                            This is how your text will appear with the selected font family.
                            Numbers: 0123456789
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Border Radius</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="label">Corner Roundness</label>
                          <select
                            {...register('theme.borderRadius')}
                            className="input"
                          >
                            <option value="none">None (Sharp corners)</option>
                            <option value="small">Small (2px)</option>
                            <option value="medium">Medium (6px)</option>
                            <option value="large">Large (12px)</option>
                          </select>
                          <p className="text-sm text-gray-600 mt-1">
                            Controls the roundness of buttons, cards, and other elements
                          </p>
                        </div>

                        {/* Border Radius Preview */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div 
                                className="w-full h-20 bg-primary-600 mb-2"
                                style={{ 
                                  borderRadius: watchedValues.theme?.borderRadius === 'none' ? '0px' :
                                              watchedValues.theme?.borderRadius === 'small' ? '2px' :
                                              watchedValues.theme?.borderRadius === 'large' ? '12px' :
                                              '6px'
                                }}
                              />
                              <p className="text-xs text-gray-600">Button</p>
                            </div>
                            <div className="text-center">
                              <div 
                                className="w-full h-20 bg-white border-2 border-gray-300 mb-2"
                                style={{ 
                                  borderRadius: watchedValues.theme?.borderRadius === 'none' ? '0px' :
                                              watchedValues.theme?.borderRadius === 'small' ? '2px' :
                                              watchedValues.theme?.borderRadius === 'large' ? '12px' :
                                              '6px'
                                }}
                              />
                              <p className="text-xs text-gray-600">Card</p>
                            </div>
                            <div className="text-center">
                              <div 
                                className="w-full h-20 bg-gray-200 mb-2"
                                style={{ 
                                  borderRadius: watchedValues.theme?.borderRadius === 'none' ? '0px' :
                                              watchedValues.theme?.borderRadius === 'small' ? '2px' :
                                              watchedValues.theme?.borderRadius === 'large' ? '12px' :
                                              '6px'
                                }}
                              />
                              <p className="text-xs text-gray-600">Input</p>
                            </div>
                            <div className="text-center">
                              <div 
                                className="w-full h-20 bg-accent-500 mb-2"
                                style={{ 
                                  borderRadius: watchedValues.theme?.borderRadius === 'none' ? '0px' :
                                              watchedValues.theme?.borderRadius === 'small' ? '2px' :
                                              watchedValues.theme?.borderRadius === 'large' ? '12px' :
                                              '6px'
                                }}
                              />
                              <p className="text-xs text-gray-600">Badge</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Background Image */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Background Image (Optional)</h3>
                      <div className="space-y-4">
                        {watchedValues.theme?.backgroundImage && (
                          <div className="relative">
                            <img
                              src={watchedValues.theme.backgroundImage}
                              alt="Background"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setValue('theme.backgroundImage', '')}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center space-x-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'theme.backgroundImage', 'image')}
                            className="hidden"
                            id="theme-bg-image"
                          />
                          <label
                            htmlFor="theme-bg-image"
                            className="btn-outline cursor-pointer flex items-center"
                          >
                            {uploadingFile === 'theme.backgroundImage' ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload Background Image
                          </label>
                          <input
                            type="url"
                            {...register('theme.backgroundImage')}
                            className="input flex-1"
                            placeholder="Or enter image URL"
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          Optional: Add a subtle background pattern or texture to your website
                        </p>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Presets</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Apply pre-configured color schemes
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setValue('theme.primaryColor', '#3b82f6');
                            setValue('theme.secondaryColor', '#64748b');
                            setValue('theme.accentColor', '#f59e0b');
                            setValue('theme.backgroundColor', '#ffffff');
                          }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                        >
                          <div className="flex space-x-1 mb-2">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#3b82f6' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#64748b' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#f59e0b' }} />
                          </div>
                          <p className="text-sm font-medium">Default Blue</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setValue('theme.primaryColor', '#10b981');
                            setValue('theme.secondaryColor', '#6b7280');
                            setValue('theme.accentColor', '#fbbf24');
                            setValue('theme.backgroundColor', '#ffffff');
                          }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                        >
                          <div className="flex space-x-1 mb-2">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#10b981' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#6b7280' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#fbbf24' }} />
                          </div>
                          <p className="text-sm font-medium">Fresh Green</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setValue('theme.primaryColor', '#8b5cf6');
                            setValue('theme.secondaryColor', '#6b7280');
                            setValue('theme.accentColor', '#ec4899');
                            setValue('theme.backgroundColor', '#ffffff');
                          }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                        >
                          <div className="flex space-x-1 mb-2">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#8b5cf6' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#6b7280' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#ec4899' }} />
                          </div>
                          <p className="text-sm font-medium">Purple Pink</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setValue('theme.primaryColor', '#1f2937');
                            setValue('theme.secondaryColor', '#6b7280');
                            setValue('theme.accentColor', '#f59e0b');
                            setValue('theme.backgroundColor', '#f9fafb');
                          }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                        >
                          <div className="flex space-x-1 mb-2">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#1f2937' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#6b7280' }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#f59e0b' }} />
                          </div>
                          <p className="text-sm font-medium">Dark Mode</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Links Section */}
              {activeTab === 'social' && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Media Links</h2>
                  <p className="text-gray-600 mb-6">
                    Add your social media profiles to appear in the footer and contact sections
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Facebook</label>
                      <input
                        type="url"
                        {...register('socialLinks.facebook')}
                        className="input"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>

                    <div>
                      <label className="label">Twitter / X</label>
                      <input
                        type="url"
                        {...register('socialLinks.twitter')}
                        className="input"
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>

                    <div>
                      <label className="label">Instagram</label>
                      <input
                        type="url"
                        {...register('socialLinks.instagram')}
                        className="input"
                        placeholder="https://instagram.com/yourprofile"
                      />
                    </div>

                    <div>
                      <label className="label">LinkedIn</label>
                      <input
                        type="url"
                        {...register('socialLinks.linkedin')}
                        className="input"
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>

                    <div>
                      <label className="label">YouTube</label>
                      <input
                        type="url"
                        {...register('socialLinks.youtube')}
                        className="input"
                        placeholder="https://youtube.com/@yourchannel"
                      />
                    </div>

                    <div>
                      <label className="label">TikTok</label>
                      <input
                        type="url"
                        {...register('socialLinks.tiktok')}
                        className="input"
                        placeholder="https://tiktok.com/@yourhandle"
                      />
                    </div>

                    <div>
                      <label className="label">WhatsApp</label>
                      <input
                        type="tel"
                        {...register('socialLinks.whatsapp')}
                        className="input"
                        placeholder="+250 123 456 789"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Enter phone number with country code
                      </p>
                    </div>

                    <div>
                      <label className="label">Telegram</label>
                      <input
                        type="text"
                        {...register('socialLinks.telegram')}
                        className="input"
                        placeholder="@yourtelegram"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Features Section */}
              {activeTab === 'features' && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Feature Toggles</h2>
                  <p className="text-gray-600 mb-6">
                    Enable or disable specific features on your website
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Live Chat Support</p>
                        <p className="text-sm text-gray-600">Enable real-time chat with customers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('features.enableChat')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Product Reviews</p>
                        <p className="text-sm text-gray-600">Allow customers to leave reviews</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('features.enableReviews')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Wishlist</p>
                        <p className="text-sm text-gray-600">Let users save favorite products</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('features.enableWishlist')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-600">Send browser notifications to users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('features.enableNotifications')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">Maintenance Mode</p>
                        <p className="text-sm text-red-600">Show maintenance page to visitors</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('features.maintenanceMode')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">User Registration</p>
                        <p className="text-sm text-gray-600">Allow new users to register</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('features.registrationEnabled')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs content - Note: product-management is handled above */}
              {!['hero', 'advertisements', 'products', 'product-management', 'company', 'theme', 'social', 'features'].includes(activeTab) && (
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-600">
                    This section is under development. Please check back later.
                  </p>
                </div>
              )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminCMS;