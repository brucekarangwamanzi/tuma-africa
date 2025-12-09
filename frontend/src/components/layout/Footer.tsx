import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

const Footer: React.FC = () => {
  const { settings } = useSettingsStore();
  
  const companyInfo = settings?.companyInfo;
  const socialLinks = settings?.socialLinks;
  const currentYear = new Date().getFullYear();

  const socialIcons = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {companyInfo?.logo ? (
                <img
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="text-xl font-bold">
                {companyInfo?.name || 'Tuma-Africa Link Cargo'}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              {companyInfo?.description || 
                'Connecting African customers with Asian suppliers through reliable cargo and product ordering services.'
              }
            </p>

            {/* Social Links */}
            {socialLinks && (
              <div className="flex space-x-4">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url || !socialIcons[platform as keyof typeof socialIcons]) return null;
                  
                  const Icon = socialIcons[platform as keyof typeof socialIcons];
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/orders/new" className="text-gray-300 hover:text-white transition-colors">
                  Place Order
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-300">Alibaba Sourcing</span>
              </li>
              <li>
                <span className="text-gray-300">1688 Orders</span>
              </li>
              <li>
                <span className="text-gray-300">Taobao Shopping</span>
              </li>
              <li>
                <span className="text-gray-300">Cargo Shipping</span>
              </li>
              <li>
                <span className="text-gray-300">Quality Inspection</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              {companyInfo?.contact?.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-primary-400 flex-shrink-0" />
                  <a 
                    href={`mailto:${companyInfo.contact.email}`}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {companyInfo.contact.email}
                  </a>
                </div>
              )}
              
              {companyInfo?.contact?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-primary-400 flex-shrink-0" />
                  <a 
                    href={`tel:${companyInfo.contact.phone}`}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {companyInfo.contact.phone}
                  </a>
                </div>
              )}
              
              {companyInfo?.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-300 text-sm">
                    {companyInfo.address.street && (
                      <div>{companyInfo.address.street}</div>
                    )}
                    <div>
                      {[
                        companyInfo.address.city,
                        companyInfo.address.state,
                        companyInfo.address.zipCode
                      ].filter(Boolean).join(', ')}
                    </div>
                    {companyInfo.address.country && (
                      <div>{companyInfo.address.country}</div>
                    )}
                  </div>
                </div>
              )}
              
              {companyInfo?.contact?.supportHours && (
                <div className="text-gray-300 text-sm">
                  <strong>Support Hours:</strong><br />
                  {companyInfo.contact.supportHours}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} {companyInfo?.name || 'Tuma-Africa Link Cargo'}. All rights reserved.
            </div>
            
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/shipping" className="text-gray-400 hover:text-white transition-colors">
                Shipping Policy
              </Link>
            </div>
          </div>
          
          <div className="mt-4 text-center text-gray-500 text-xs">
            {companyInfo?.tagline || 'Bridging Africa and Asia through seamless cargo solutions'}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;