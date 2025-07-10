# Chat Icon Customization

## How to Customize the Chat Icon

To customize the chat icon that appears in the floating chat button, follow these steps:

### 1. Prepare Your Icon Image
- **File Format**: PNG, JPG, or SVG
- **Recommended Size**: 64x64 pixels (or any square size)
- **Background**: Transparent background recommended for best appearance
- **Style**: Should work well on both light and dark backgrounds

### 2. Add Your Icon
1. Save your icon image as `chat-icon.jpeg` in the `/public` folder
2. The file path should be: `/public/chat-icon.jpeg`

### 3. Alternative File Names
If you prefer a different filename, you can update the image source in the component:
- Edit `components/chat-window.tsx`
- Change the `src="/chat-icon.jpeg"` to your preferred filename
- Example: `src="/my-custom-chat-icon.svg"`

### 4. Fallback
If no custom icon is found, the system will automatically fall back to the default MessageCircle icon.

### Examples of Good Chat Icons:
- AI assistant avatar
- Company logo
- Chat bubble with company branding
- Robot or AI-themed icon
- Professional assistant icon

### Current Setup:
- The chat icon appears in the floating button (bottom-right corner)
- It also appears in the empty chat state
- The icon automatically scales to fit the button size
- Error handling ensures the app doesn't break if the image is missing

### File Location:
```
/public/chat-icon.jpeg  ← Place your custom icon here
``` 