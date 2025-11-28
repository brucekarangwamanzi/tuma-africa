# Theme System - Complete Guide

## Overview
The theme system allows admins to customize website colors through the Settings page. Changes apply instantly across all pages.

## How It Works

### 1. Settings Store
Theme colors are stored in the settings store:
```typescript
theme: {
  primaryColor: '#3b82f6',    // Main brand color
  secondaryColor: '#64748b',  // Supporting color
  accentColor: '#f59e0b',     // Highlight color
  backgroundColor: '#ffffff'   // Background color
}
```

### 2. CSS Variables
The `useTheme` hook applies colors as CSS custom properties:
```css
:root {
  --color-primary: #3b82f6;
  --color-primary-light: #3b82f620;
  --color-primary-dark: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
}
```

### 3. Utility Classes
Use these classes in your components:

#### Background Colors
```html
<div className="bg-primary">Primary background</div>
<div className="bg-primary-600">Primary background (Tailwind style)</div>
<div className="bg-secondary">Secondary background</div>
<div className="bg-accent">Accent background</div>
```

#### Text Colors
```html
<span className="text-primary">Primary text</span>
<span className="text-primary-600">Primary text (Tailwind style)</span>
<span className="text-secondary">Secondary text</span>
<span className="text-accent">Accent text</span>
```

#### Border Colors
```html
<div className="border-2 border-primary">Primary border</div>
<div className="border-primary-600">Primary border (Tailwind style)</div>
```

#### Hover States
```html
<button className="hover:bg-primary-600">Hover effect</button>
<a className="hover:text-primary-600">Hover text</a>
```

## Pre-built Components

### Buttons
```html
<!-- Primary Button -->
<button className="btn-primary px-4 py-2 rounded-lg">
  Click Me
</button>

<!-- Secondary Button -->
<button className="btn-secondary px-4 py-2 rounded-lg">
  Secondary
</button>

<!-- Accent Button -->
<button className="btn-accent px-4 py-2 rounded-lg">
  Accent
</button>

<!-- Outline Button -->
<button className="btn-outline-primary px-4 py-2 rounded-lg">
  Outline
</button>
```

### Links
```html
<a href="#" className="link-primary">Themed Link</a>
```

### Badges
```html
<span className="badge-primary">New</span>
<span className="badge-accent">Hot</span>
```

### Cards
```html
<div className="card-primary bg-white p-6 rounded-lg shadow">
  Card with primary accent border
</div>
```

## Pages Using Theme Colors

### ✅ Already Themed:
1. **Messages Page**
   - Header background
   - Active tabs
   - Online indicators
   - Send button
   - Message bubbles
   - Reply borders

2. **Navbar**
   - Active link colors
   - Hover states
   - Logo background

3. **All Pages with Buttons**
   - Primary buttons use theme color
   - Links use theme color
   - Hover states use theme color

### 🎨 How to Add Theme to New Components:

#### Example 1: Button
```tsx
// Before (hardcoded)
<button className="bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>

// After (themed)
<button className="bg-primary text-white px-4 py-2 rounded">
  Click Me
</button>
```

#### Example 2: Link
```tsx
// Before (hardcoded)
<a href="#" className="text-blue-600 hover:text-blue-700">
  Link
</a>

// After (themed)
<a href="#" className="text-primary hover:text-primary-700">
  Link
</a>
```

#### Example 3: Using Inline Styles
```tsx
import { useSettingsStore } from '../store/settingsStore';

const MyComponent = () => {
  const { settings } = useSettingsStore();
  const primaryColor = settings?.theme?.primaryColor || '#3b82f6';

  return (
    <div style={{ backgroundColor: primaryColor }}>
      Themed content
    </div>
  );
};
```

## Admin Configuration

### Accessing Theme Settings:
1. Login as Super Admin
2. Navigate to **Admin → CMS**
3. Click **Theme & Colors** tab
4. Adjust colors using color pickers
5. Click **Save Changes**

### Color Picker Features:
- Visual color picker
- Hex code input
- Live preview
- Color swatches

## Color Recommendations

### Professional Blue (Default)
- Primary: `#3b82f6`
- Secondary: `#64748b`
- Accent: `#f59e0b`

### Modern Purple
- Primary: `#8b5cf6`
- Secondary: `#64748b`
- Accent: `#ec4899`

### Fresh Green
- Primary: `#10b981`
- Secondary: `#64748b`
- Accent: `#f59e0b`

### Bold Red
- Primary: `#ef4444`
- Secondary: `#64748b`
- Accent: `#f59e0b`

### Elegant Dark
- Primary: `#1f2937`
- Secondary: `#6b7280`
- Accent: `#f59e0b`

## Best Practices

### 1. Contrast
- Ensure text is readable on colored backgrounds
- Use white text on dark primary colors
- Use dark text on light backgrounds

### 2. Consistency
- Use primary color for main actions
- Use secondary for supporting elements
- Use accent sparingly for highlights

### 3. Accessibility
- Maintain WCAG AA contrast ratios (4.5:1 for text)
- Test colors with accessibility tools
- Provide alternative indicators beyond color

### 4. Brand Alignment
- Match company brand colors
- Use consistent colors across all pages
- Update logo to match theme

## Troubleshooting

### Colors Not Updating?
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check if settings are saved
4. Verify you're logged in as admin

### Colors Look Wrong?
1. Check hex code format (#RRGGBB)
2. Ensure contrast is sufficient
3. Test on different screens
4. Verify CSS is loaded

### Some Elements Not Themed?
1. Check if component uses hardcoded colors
2. Update to use theme classes
3. Use CSS variables for inline styles
4. Report to development team

## Technical Details

### File Structure
```
frontend/src/
├── styles/
│   └── theme.css          # Theme utility classes
├── hooks/
│   └── useTheme.ts        # Theme hook
├── store/
│   └── settingsStore.ts   # Settings management
└── pages/
    └── admin/
        └── SuperAdminCMS.tsx  # Theme settings UI
```

### Performance
- CSS variables update instantly
- No page reload required
- Minimal performance impact
- Cached in browser

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties required
- Fallback to default colors if not supported

## Future Enhancements

### Planned Features:
- [ ] Dark mode support
- [ ] Multiple theme presets
- [ ] Color palette generator
- [ ] Export/import themes
- [ ] Theme preview mode
- [ ] Gradient support
- [ ] Custom font colors
- [ ] Animation customization

## Support

For issues or questions:
1. Check this documentation
2. Review console for errors
3. Test in incognito mode
4. Contact development team
