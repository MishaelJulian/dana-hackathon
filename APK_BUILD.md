# Building the Dana Android APK (Capacitor)

Dana ships as an offline PWA; this wraps it into a normal `.apk` via **Capacitor**
(wrap-only — assets bundled, fully offline WebView, no native plugins yet). NFC/BLE/
background-tasks come later as native plugins; QR transfer stays as the universal path.

## What's already set up (this repo)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` installed
- `capacitor.config.json` → appId `com.dana.app`, appName `Dana`, webDir `dist`
- `android/` native project created, `dist/` bundled into `android/app/src/main/assets/public`

## Prerequisites (one-time, on your machine)
- **JDK 17** and **Android Studio** (bundles the Android SDK), or the command-line SDK.
- Set `ANDROID_HOME` (e.g. `~/Android/Sdk`) and accept SDK licenses:
  `sdkmanager --licenses`
- This environment has **no Android SDK**, so the APK can't be built here — do it locally.

## Build the APK
```bash
cd dana-hackathon/dana
npm run build            # produce dist/
npx cap sync android     # copy dist + plugins into android/
cd android
./gradlew assembleDebug  # or: open the android/ folder in Android Studio and Run
```
Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Install on a phone
- `adb install app-debug.apk` (USB debugging on), **or**
- copy the APK to the phone and tap it — Android shows a one-time "install from unknown
  sources" prompt (unavoidable for sideload; only Play Store / MDM removes it).

## Notes
- Fully offline: the WebView loads bundled assets; no network needed.
- The app's Service Worker still registers inside the WebView (harmless; assets are local).
- To change app name/icon: edit `android/app/src/main/res/` + `AndroidManifest.xml`.
- Release build (signed): `./gradlew assembleRelease` after configuring a keystore.
