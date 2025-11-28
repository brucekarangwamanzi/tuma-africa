import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, Image, UploadCloud, Send, Package, Inbox, UserCircle, Settings, PlusCircle, Check, ShoppingCart, Archive, Truck, Home, Menu, Briefcase, Globe, FileCheck } from 'lucide-react';
import AdvertisementBanner from '../components/ui/AdvertisementBanner';
import FeaturedProducts from '../components/home/FeaturedProducts';

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
  const [productLink, setProductLink] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartOrder = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!productLink.trim()) {
      // If no link provided, just navigate to order page
      navigate('/orders/new');
      return;
    }

    // Navigate to order page with the product link
    const params = new URLSearchParams({
      link: productLink.trim()
    });
    
    navigate(`/orders/new?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStartOrder();
    }
  };

  // Focus input on mount for better UX
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
            Simply paste a product link from any Chinese e-commerce site, and let us handle the rest. Shopping globally has never been this easy.
          </p>
        </div>

        {/* --- Enhanced "Magic Link" Box with Functional Input --- */}
        <div className="mt-12 max-w-2xl mx-auto">
          <form onSubmit={handleStartOrder}>
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

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-anim bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1" style={{animationDelay: '0.1s'}}>
              <div className="flex-shrink-0 bg-slate-100 text-slate-600 w-12 h-12 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">TumaPay</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Secure, low-fee cross-border payments. Making it easier to pay suppliers and manage your finances.
                </p>
              </div>
            </div>

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
          </div>
        </div>

        {/* Popup Advertisement */}
        <AdvertisementBanner position="popup" />
      </section>
    </>
  );
};

export default HomePage;