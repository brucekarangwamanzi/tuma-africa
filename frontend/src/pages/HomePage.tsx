import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Link2, ArrowRight, Image, UploadCloud, Send, Package, Inbox, UserCircle, Settings, PlusCircle, Check, ShoppingCart, Archive, Truck, Home, Menu, Briefcase, Globe, FileCheck } from 'lucide-react';
import AdvertisementBanner from '../components/ui/AdvertisementBanner';

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

        {/* --- NEW: Enhanced "Magic Link" Box --- */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-400 focus-within:shadow-xl">
            <Link2 className="text-slate-400 h-6 w-6 hidden sm:block" />
            <input 
              type="text" 
              placeholder="Paste your product link here..." 
              className="w-full text-lg p-2 bg-transparent focus:outline-none" 
            />
            <Link
              to="/orders/new"
              className="btn-shine w-full sm:w-auto bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <ArrowRight size={20} />
              <span>Start Order</span>
            </Link>
          </div>
        </div>

        {/* Inline Advertisement */}
        <div className="mt-16">
          <AdvertisementBanner position="inline" />
        </div>

        {/* --- Shop Popular Products Section --- */}
        <div className="mt-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Shop Popular Products</h2>
            <p className="mt-4 text-lg text-slate-600">
              Order from a selection of our most popular and frequently purchased items. Added by our team for your convenience.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* --- NEW: Enhanced Card with transition and hover --- */}
            <div className="card-anim bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                <Image className="w-16 h-16 text-slate-400" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-slate-800">Wireless Bluetooth Earbuds</h3>
                <p className="text-sm text-slate-500 mt-1">High-fidelity sound, 24-hour battery.</p>
                <p className="text-lg font-semibold text-orange-600 mt-2">15,000 RWF</p>
                <Link
                  to="/orders/new"
                  className="btn-shine w-full mt-4 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Quick Order
                </Link>
              </div>
            </div>

            <div className="card-anim bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                <Image className="w-16 h-16 text-slate-400" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-slate-800">Smart Fitness Watch</h3>
                <p className="text-sm text-slate-500 mt-1">Track your health and workouts.</p>
                <p className="text-lg font-semibold text-orange-600 mt-2">30,000 RWF</p>
                <Link
                  to="/orders/new"
                  className="btn-shine w-full mt-4 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Quick Order
                </Link>
              </div>
            </div>

            <div className="card-anim bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                <Image className="w-16 h-16 text-slate-400" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-slate-800">Portable Power Bank</h3>
                <p className="text-sm text-slate-500 mt-1">20,000mAh capacity, fast charging.</p>
                <p className="text-lg font-semibold text-orange-600 mt-2">25,000 RWF</p>
                <Link
                  to="/orders/new"
                  className="btn-shine w-full mt-4 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Quick Order
                </Link>
              </div>
            </div>

            <div className="card-anim bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                <Image className="w-16 h-16 text-slate-400" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-slate-800">LED Ring Light</h3>
                <p className="text-sm text-slate-500 mt-1">Perfect for streaming and video calls.</p>
                <p className="text-lg font-semibold text-orange-600 mt-2">22,000 RWF</p>
                <Link
                  to="/orders/new"
                  className="btn-shine w-full mt-4 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Quick Order
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- Partners Section --- */}
        <div className="mt-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Partners</h2>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* --- NEW: Enhanced Card with transition and hover --- */}
            <div className="card-anim bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1" style={{animationDelay: '0.1s'}}>
              <div className="flex-shrink-0 bg-orange-100 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Tuma Logistics</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Fast, reliable logistics and customs clearing across East Africa. We handle the heavy lifting so you don't have to.
                </p>
              </div>
            </div>

            <div className="card-anim bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1" style={{animationDelay: '0.2s'}}>
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
          </div>
        </div>

        {/* Popup Advertisement */}
        <AdvertisementBanner position="popup" />
      </section>
    </>
  );
};

export default HomePage;