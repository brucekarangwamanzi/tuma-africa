# 🎨 SuperAdmin CMS Features Guide

## Overview
The SuperAdmin CMS allows you to customize your website's appearance, content, and features without touching code.

**Access:** http://localhost:3000/admin/cms

---

## 📋 Available Sections

### 1. 🖼️ Hero Section
Customize the main banner on your homepage:
- **Hero Title** - Main headline
- **Hero Subtitle** - Supporting text
- **Background Type** - Choose between:
  - Image
  - Video
  - Solid Color
- **Background Image/Video** - Upload or enter URL
- **Background Color** - Color picker for solid backgrounds

---

### 2. 📢 Advertisements
Manage promotional banners and ads:
- **Add Multiple Ads** - Create unlimited advertisements
- **Ad Details:**
  - Title and description
  - Image upload
  - Link URL
  - Position (Banner, Sidebar, Footer, Popup, Inline)
  - Start and end dates
  - Active/Inactive toggle
- **Delete Ads** - Remove unwanted advertisements

---

### 3. 🛍️ Products Section
Configure how products appear on homepage:
- **Section Title** - Heading for products section
- **Section Subtitle** - Description text
- **Display Count** - Number of products to show (4-20)
- **Show Prices** - Toggle price display
- **Show Ratings** - Toggle rating display

---

### 4. 🎨 Theme & Colors
**Complete visual customization:**

#### Color Palette
- **Primary Color** - Main brand color (buttons, links, highlights)
- **Secondary Color** - Supporting elements
- **Accent Color** - Special highlights and CTAs
- **Background Color** - Main website background

#### Color Preview
- Live preview of all colors
- Hex code display
- Visual swatches

#### Typography
- **Font Family Options:**
  - Inter (Default)
  - Roboto
  - Poppins
  - Montserrat
- **Font Preview** - See how text will look

#### Border Radius
- **Corner Roundness:**
  - None (Sharp corners)
  - Small (2px)
  - Medium (6px)
  - Large (12px)
- **Live Preview** - See buttons, cards, inputs, badges

#### Background Image
- Optional background pattern/texture
- Upload or enter URL
- Remove option

#### Quick Presets
Pre-configured color schemes:
- **Default Blue** - #3b82f6, #64748b, #f59e0b
- **Fresh Green** - #10b981, #6b7280, #fbbf24
- **Purple Pink** - #8b5cf6, #6b7280, #ec4899
- **Dark Mode** - #1f2937, #6b7280, #f59e0b

---

### 5. 🏢 Company Info
Manage company details:
- **Company Name**
- **Company Logo** - Upload or URL
- **Company Description**
- **Contact Information:**
  - Email
  - Phone
- **Address:**
  - Street
  - City
  - State/Province
  - Country
  - ZIP/Postal Code

---

### 6. 🌐 Social Links
Add social media profiles:
- Facebook
- Twitter / X
- Instagram
- LinkedIn
- YouTube
- TikTok
- WhatsApp (with country code)
- Telegram

These appear in footer and contact sections.

---

### 7. ⚙️ Features
Toggle website features on/off:

#### Available Features:
- **Live Chat Support** ✅
  - Enable real-time chat with customers
  
- **Product Reviews** ✅
  - Allow customers to leave reviews
  
- **Wishlist** ✅
  - Let users save favorite products
  
- **Push Notifications** ✅
  - Send browser notifications to users
  
- **Maintenance Mode** ⚠️
  - Show maintenance page to visitors
  - (Red warning - use carefully!)
  
- **User Registration** ✅
  - Allow new users to register

---

## 🚀 How to Use

### Step 1: Access CMS
1. Log in as super admin
2. Go to Admin Dashboard
3. Click "CMS Settings" or navigate to `/admin/cms`

### Step 2: Select Section
- Click on any section in the left sidebar
- Each section has its own settings

### Step 3: Make Changes
- Edit text fields
- Upload images
- Choose colors
- Toggle features
- Apply presets

### Step 4: Preview (Optional)
- Click "Preview Mode" to see changes
- Click "Edit Mode" to continue editing

### Step 5: Save
- Click "Save Changes" button
- Wait for success message
- Changes apply immediately to homepage

---

## 💡 Tips & Best Practices

### Colors
- Use color picker for accuracy
- Test contrast for readability
- Try quick presets first
- Keep brand consistency

### Images
- Use high-quality images
- Optimize file sizes (< 5MB for images)
- Use consistent aspect ratios
- Test on mobile devices

### Typography
- Choose readable fonts
- Test with actual content
- Consider brand guidelines

### Features
- Enable only needed features
- Test after toggling
- Use maintenance mode carefully
- Disable registration if needed

### Advertisements
- Set clear start/end dates
- Use compelling images
- Test all positions
- Monitor click rates
- Remove expired ads

---

## 🎯 Common Use Cases

### Seasonal Campaigns
1. Go to Advertisements
2. Create new ad with seasonal offer
3. Set start/end dates
4. Choose banner position
5. Save changes

### Rebranding
1. Go to Theme & Colors
2. Update primary/secondary colors
3. Upload new logo in Company Info
4. Change font if needed
5. Save changes

### Feature Launch
1. Go to Features
2. Enable new feature (e.g., Reviews)
3. Save changes
4. Announce to users

### Maintenance
1. Go to Features
2. Enable Maintenance Mode
3. Perform updates
4. Disable Maintenance Mode
5. Save changes

---

## 🔧 Technical Details

### File Upload Limits
- Images: 5MB max
- Videos: 15MB max
- Formats: JPEG, PNG, WebP (images), MP4, WebM (videos)

### Color Format
- Hex codes (e.g., #3b82f6)
- RGB values supported
- Color picker for easy selection

### URL Fields
- Must be valid URLs
- Include https:// for external links
- Relative paths for internal links

### Toggle Switches
- Green = Enabled
- Gray = Disabled
- Changes save on form submit

---

## ✅ What's Already Implemented

All sections are fully functional:
- ✅ Hero Section - Complete
- ✅ Advertisements - Complete
- ✅ Products Section - Complete
- ✅ Theme & Colors - Complete with presets
- ✅ Company Info - Complete
- ✅ Social Links - Complete
- ✅ Features - Complete with toggles

---

## 🆘 Troubleshooting

### Changes Not Appearing?
1. Make sure you clicked "Save Changes"
2. Refresh the homepage
3. Clear browser cache
4. Check if feature is enabled

### Upload Failed?
1. Check file size (< 5MB for images)
2. Verify file format
3. Try different image
4. Check internet connection

### Colors Not Updating?
1. Use hex format (#xxxxxx)
2. Save changes after editing
3. Refresh page
4. Try quick preset first

---

## 📞 Need Help?

The CMS is intuitive and user-friendly. All changes are saved to the database and apply immediately to your website.

**Remember:** Always save changes before leaving a section!

---

**Last Updated:** November 7, 2025  
**Status:** All features operational ✅
