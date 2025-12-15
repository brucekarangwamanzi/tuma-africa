import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, Image as ImageIcon, UploadCloud, Send, Package, Inbox, UserCircle, Settings, PlusCircle, Check, ShoppingCart, Archive, Truck, Home, Menu, Briefcase, Globe, FileCheck, Car, Upload, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdvertisementBanner from '../components/ui/AdvertisementBanner';
import FeaturedProducts from '../components/home/FeaturedProducts';
import { useAuthStore } from '../store/authStore';

// --- Global Styles Component ---
// This component injects all the custom CSS from the original <style> tag.
// I'VE ADDED SEVERAL NEW ANIMATIONS AND STYLES HERE.
const GlobalStyles = () => (
  <style>{`
    body {
      font-family: 'Inter', sans-serif;
    }
    .nav-link-active {
      color: #f97316; /* orange-500 */
      font-weight: 600;
    }
    /* --- NEW: Advanced Page Transition --- */
    .page {
      animation: pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    @keyframes pageSlideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* --- NEW: Staggered Card Animation --- */
    /* We'll apply this to card children */
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-anim {
      animation: cardFadeIn 0.5s ease-out backwards;
    }
    /* Simple staggered delay */
    .card-anim:nth-child(1) { animation-delay: 0.1s; }
    .card-anim:nth-child(2) { animation-delay: 0.2s; }
    .card-anim:nth-child(3) { animation-delay: 0.3s; }
    .card-anim:nth-child(4) { animation-delay: 0.4s; }
    /* --- NEW: Button Shine Effect --- */
    .btn-shine {
      position: relative;
      overflow: hidden;
    }
    .btn-shine::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.6s ease;
    }
    .btn-shine:hover::before {
      left: 100%;
    }
    .dropzone {
      border: 2px dashed #d1d5db; /* gray-300 */
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .dropzone.dragover {
      background-color: #fef3c7; /* amber-100 */
      border-color: #f97316; /* orange-500 */
    }
  `}</style>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [productLink, setProductLink] = useState('');
  const [productImage, setProductImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inputType, setInputType] = useState<'link' | 'image'>('link');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined
        }
      });

      const imageUrl = response.data.imageUrl || response.data.url;
      setProductImage(imageUrl);
      setImagePreview(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProductImage('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartOrder = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const params = new URLSearchParams();
    
    if (inputType === 'link' && productLink.trim()) {
      params.set('link', productLink.trim());
      navigate(`/orders/new?${params.toString()}`);
    } else if (inputType === 'image' && productImage) {
      // Store image in sessionStorage to pass to order page
      sessionStorage.setItem('orderProductImage', productImage);
      navigate('/orders/new');
    } else {
      // No input provided, just navigate to order page
      navigate('/orders/new');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStartOrder();
    }
  };

  // Focus input on mount for better UX
  useEffect(() => {
    if (inputType === 'link') {
      inputRef.current?.focus();
    }
  }, [inputType]);

  return (
    <>
      <GlobalStyles />
      
      {/* Top Banner Advertisement */}
      <AdvertisementBanner position="banner" />
      
      <section id="homePage" className="page container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 overflow-hidden">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            From China, To Your Doorstep.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Simply paste a product link or upload a product image from any Chinese e-commerce site, and let us handle the rest. Shopping globally has never been this easy.
          </p>
        </div>

        {/* --- Enhanced Order Input Box with Link/Image Toggle --- */}
        <div className="mt-12 max-w-2xl mx-auto">
          {/* Input Type Toggle */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setInputType('link');
                setProductImage('');
                setImagePreview('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                inputType === 'link'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Link2 size={18} />
              <span>Product Link</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputType('image');
                setProductLink('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                inputType === 'image'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ImageIcon size={18} />
              <span>Upload Image</span>
            </button>
          </div>

          <form onSubmit={handleStartOrder}>
            {inputType === 'link' ? (
              <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-400 focus-within:shadow-xl">
                <Link2 className="text-slate-400 h-6 w-6 hidden sm:block flex-shrink-0" />
                <input 
                  ref={inputRef}
                  type="url" 
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Paste your product link here..." 
                  className="w-full text-lg p-2 bg-transparent focus:outline-none flex-1" 
                />
                <button
                  type="submit"
                  className="btn-shine w-full sm:w-auto btn-primary font-semibold px-6 py-3 rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 touch-manipulation"
                >
                  <ArrowRight size={20} />
                  <span>Start Order</span>
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 transition-all duration-300">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-64 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="btn-shine w-full btn-primary font-semibold px-6 py-3 rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ArrowRight size={20} />
                      <span>Start Order</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <span className="text-slate-600 font-medium">Uploading image...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                            <UploadCloud size={32} className="text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Upload Product Image
                          </h3>
                          <p className="text-sm text-slate-600 mb-1">
                            Click to browse or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">
                            PNG, JPG, WEBP up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      <span>Choose Image</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Inline Advertisement */}
        <div className="mt-16">
          <AdvertisementBanner position="inline" />
        </div>

        {/* --- Shop Popular Products Section --- */}
        <FeaturedProducts />

        {/* --- Partners Section --- */}
        <div className="mt-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Partners</h2>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Fast Lane Clearing - Clickable Partner Card */}
            <a
              href="https://www.africalinkcargo.com/fast-lane-clearing"
              target="_blank"
              rel="noopener noreferrer"
              className="card-anim bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
              style={{animationDelay: '0.1s'}}
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 text-white w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                    Fast Lane Clearing
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Your expert partner for navigating Rwanda's tax & import landscape with unmatched speed and efficiency. Seamless clearance, swift delivery.
                </p>
              </div>
            </a>

            {/* Africa Link Cargo - Clickable Partner Card */}
            <a
              href="https://www.africalinkcargo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="card-anim bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
              style={{animationDelay: '0.2s'}}
            >
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                    Africa Link Cargo
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Your trusted partner for seamless logistics solutions across Africa and China. We connect continents, empower businesses, and deliver promises with speed and reliability.
                </p>
              </div>
            </a>

            {/* Green Road Motors - Partner Card */}
            <div className="card-anim bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1" style={{animationDelay: '0.3s'}}>
              <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white w-12 h-12 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800">Green Road Motors</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your trusted automotive partner providing quality vehicles and reliable transportation solutions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Advertisement */}
        <AdvertisementBanner position="popup" />
      </section>
    </>
  );
};

export default HomePage;