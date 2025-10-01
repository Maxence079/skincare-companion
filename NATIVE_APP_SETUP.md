# 📱 Native Mobile App Setup with Capacitor

## Why Capacitor?
- ✅ Wraps your existing Next.js app (no rewrite needed!)
- ✅ Full native device access (vibration, camera, notifications)
- ✅ True native performance
- ✅ Deploy to App Store & Google Play
- ✅ 100% of your web code works

---

## 🚀 Quick Setup (20 minutes)

### Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

When prompted:
- **App name:** SkinCare Companion
- **App package ID:** com.skincare.companion
- **Web asset directory:** out

### Step 2: Configure Next.js for Static Export

Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export
  images: {
    unoptimized: true,  // Required for static export
  },
  trailingSlash: true,  // Better for mobile routing
};

export default nextConfig;
```

### Step 3: Build Your App

```bash
npm run build
```

### Step 4: Add Mobile Platforms

```bash
# Add iOS (requires macOS)
npm install @capacitor/ios
npx cap add ios

# Add Android
npm install @capacitor/android
npx cap add android
```

### Step 5: Install Native Plugins

```bash
# Haptics (vibration)
npm install @capacitor/haptics

# Camera
npm install @capacitor/camera

# Geolocation
npm install @capacitor/geolocation

# Push Notifications
npm install @capacitor/push-notifications

# Status Bar
npm install @capacitor/status-bar

# Splash Screen
npm install @capacitor/splash-screen
```

### Step 6: Sync to Native Projects

```bash
npx cap sync
```

### Step 7: Open in Native IDEs

```bash
# For Android (opens Android Studio)
npx cap open android

# For iOS (opens Xcode - macOS only)
npx cap open ios
```

Then click "Run" in Android Studio or Xcode!

---

## 🎯 Add Native Features to Your App

### 1. Add Vibration/Haptics

Create `lib/native/haptics.ts`:

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const haptics = {
  // Light tap
  light: async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
  },

  // Medium tap (button press)
  medium: async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
  },

  // Heavy tap (important action)
  heavy: async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  },

  // Success vibration
  success: async () => {
    await Haptics.notification({ type: 'SUCCESS' });
  },

  // Error vibration
  error: async () => {
    await Haptics.notification({ type: 'ERROR' });
  },

  // Selection change (picker, slider)
  selection: async () => {
    await Haptics.selectionStart();
  },
};
```

**Use in your components:**

```typescript
import { haptics } from '@/lib/native/haptics';

// Button press
<button onClick={async () => {
  await haptics.medium();
  // your action
}}>
  Send Message
</button>

// Success action
await haptics.success();

// Error
await haptics.error();
```

### 2. Native Camera Access

Update `components/onboarding/PhotoUpload.tsx`:

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    // image.base64String contains the photo
    // Upload to Supabase
  } catch (error) {
    console.error('Camera error:', error);
  }
};
```

### 3. Native Geolocation

```typescript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();
  return {
    latitude: coordinates.coords.latitude,
    longitude: coordinates.coords.longitude,
  };
};
```

### 4. Push Notifications

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Register for push
await PushNotifications.requestPermissions();
await PushNotifications.register();

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received:', notification);
});
```

### 5. Native Status Bar

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Set status bar color to match your app
await StatusBar.setStyle({ style: Style.Light });
await StatusBar.setBackgroundColor({ color: '#6B7F6E' });
```

---

## 📱 Testing on Real Device

### Android Testing:

1. **Enable USB Debugging** on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect phone via USB**

3. **Run from Android Studio**:
   ```bash
   npx cap open android
   ```
   - Click "Run" button
   - Select your device
   - App installs and runs!

### iOS Testing (requires macOS):

1. **Connect iPhone via USB**

2. **Run from Xcode**:
   ```bash
   npx cap open ios
   ```
   - Sign with your Apple ID (free for testing)
   - Click "Run" button
   - App installs on your iPhone!

---

## 🏗️ Build for Production

### Android APK:

1. Open Android Studio:
   ```bash
   npx cap open android
   ```

2. Build → Generate Signed Bundle/APK
3. Follow wizard to create signing key
4. Get APK file to install on any Android device

### iOS App:

1. Open Xcode (macOS):
   ```bash
   npx cap open ios
   ```

2. Product → Archive
3. Upload to TestFlight or App Store

---

## 🎨 Native App Improvements

### Add Splash Screen

Create `public/splash.png` (2732x2732px)

Update `capacitor.config.ts`:
```typescript
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6B7F6E",
      showSpinner: false,
    }
  }
}
```

### Add App Icons

Create icons:
- Android: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Or use: https://icon.kitchen to generate all sizes

---

## 🔄 Development Workflow

```bash
# 1. Make changes to your Next.js code
# 2. Build
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Open native IDE and run
npx cap open android  # or ios
```

---

## ⚡ Live Reload on Device

For faster development, use Capacitor Live Reload:

```bash
# Get your local IP (from ipconfig)
# e.g., 192.168.11.198

# Start dev server
npm run dev

# In capacitor.config.ts, add:
{
  server: {
    url: 'http://192.168.11.198:3000',
    cleartext: true
  }
}

# Sync and run
npx cap sync
npx cap open android
```

Now changes appear instantly on your phone!

---

## 📦 Alternative: Expo (React Native)

If you want to rewrite with React Native for even better performance:

```bash
npx create-expo-app@latest skincare-native
cd skincare-native
npm install
npx expo start
```

Then scan QR code with Expo Go app on your phone!

But this requires rewriting your entire app in React Native.

---

## 🎯 Recommended Approach

**For you:**
1. ✅ Use Capacitor (keeps all your Next.js code)
2. ✅ Add haptics to buttons
3. ✅ Test on your real phone via USB
4. ✅ Get true native experience
5. ✅ Deploy to Play Store/App Store when ready

**Want me to set up Capacitor now?** I can:
1. Install all dependencies
2. Configure Next.js for static export
3. Set up Android project
4. Add haptics/camera/geolocation
5. Create build instructions
