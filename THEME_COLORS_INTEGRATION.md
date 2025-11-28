# Theme Colors Integration - Messages Page

## Overview
The Messages page now dynamically uses theme colors from the Settings store, allowing admins to customize the appearance through the Theme & Colors settings.

## Theme Colors Used

### Primary Color
Used for main UI elements:
- **Header background** - Top navigation bar
- **Active tab indicator** - "All" tab underline
- **Online status dots** - Green dots showing online users
- **Unread message badges** - Count badges on conversations
- **Typing indicator** - "typing..." text color
- **Reply indicators** - Reply icon and text
- **Border accents** - Reply preview left border
- **Send button** - Message send button background
- **Loading spinner** - Loading animation color
- **Sent message bubbles** - Background with 20% opacity

### Secondary Color
Reserved for future use (currently using default gray tones)

### Accent Color
Reserved for future use (currently using default gray tones)

## How It Works

### 1. Settings Store Integration
```typescript
import { useSettingsStore } from '../store/settingsStore';

const { settings } = useSettingsStore();
const primaryColor = settings?.theme?.primaryColor || '#3b82f6';
```

### 2. Dynamic Styling
Colors are applied using inline styles:
```typescript
style={{ backgroundColor: primaryColor }}
style={{ color: primaryColor }}
style={{ borderColor: primaryColor }}
```

### 3. Fallback Colors
If settings are not loaded, default colors are used:
- Primary: `#3b82f6` (blue)
- Secondary: `#64748b` (gray)
- Accent: `#f59e0b` (amber)

## Customizable Elements

### Header
- Background color changes with primary color
- Text remains white for contrast

### Conversations List
- Active tab uses primary color
- Online status indicators use primary color
- Unread badges use primary color background
- Typing indicator uses primary color text

### Chat Area
- Sent message bubbles use primary color with 20% opacity
- Reply borders use primary color
- Loading spinner uses primary color

### Message Input
- Send button uses primary color background
- Hover effect maintains color with opacity change

## Admin Configuration

Admins can change these colors in:
**Settings → Theme & Colors → Primary Color**

Changes apply immediately to:
- Messages page
- All other pages using theme colors
- Real-time without page refresh

## Color Contrast

The system ensures good contrast by:
- Using white text on colored backgrounds
- Using 20% opacity for message bubbles (readable text)
- Maintaining gray tones for secondary elements

## Example Color Schemes

### Default (Blue)
- Primary: `#3b82f6`
- Clean, professional look

### Green (WhatsApp-style)
- Primary: `#00a884`
- Familiar messaging app feel

### Purple (Modern)
- Primary: `#8b5cf6`
- Trendy, modern appearance

### Red (Bold)
- Primary: `#ef4444`
- Attention-grabbing, energetic

## Benefits

✅ **Brand Consistency** - Match company colors
✅ **User Preference** - Customize to user taste
✅ **Accessibility** - Choose high-contrast colors
✅ **Flexibility** - Change anytime without code
✅ **Professional** - Maintain cohesive design
