# FinTech Android Packaging (Capacitor)

This project packages the React/Vite FinTech app as an Android app. The Android safe-area fix is included in `scripts/fix-android-safe-area.sh`; it applies system-bar insets natively so Android's status bar cannot cover the app header.

## Requirements

- Node.js/npm compatible with the Vite version in `package.json`
- Android Studio and Android SDK
- Java 17 for the Android build

## Build or repair the Android app

Run each command from this folder (the folder containing `package.json`).

```bash
npm install
npm run build
```

If this is the first Android build:

```bash
npx cap add android
```

Then apply the native safe-area fix and sync the built web app:

```bash
bash scripts/fix-android-safe-area.sh
npx cap sync android
npx cap open android
```

In Android Studio, wait for Gradle sync to finish, then choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The debug APK is normally at:

`android/app/build/outputs/apk/debug/app-debug.apk`

If `android/` already exists, do not run `npx cap add android` again. Run the safe-area script and `npx cap sync android` instead.

## What the fix does

- Uses Android WindowInsets to apply top, side, bottom, display-cutout, and keyboard insets to the native content container.
- Avoids relying only on CSS `env(safe-area-inset-top)`, which can be zero in some Android WebViews.
- Keeps the existing React features and local browser storage implementation.
- Keeps the status and navigation bars dark to match the app theme.

## Data and feature notes

- The React app's local data is stored in the app WebView's browser storage. It is not automatically shared with the older Kotlin app's Room database.
- Test backup/restore, file attachments, exports, reminders, and all currency-specific flows on the actual phone before using the app for important records.
- Do not put API secrets in frontend code or commit `.env` files.
