#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT/android"

if [[ ! -d "$ANDROID_DIR/app/src/main" ]]; then
  echo "Android platform not found at $ANDROID_DIR. Run 'npx cap add android' first." >&2
  exit 1
fi

JAVA_FILE="$(find "$ANDROID_DIR/app/src/main/java" -type f -name 'MainActivity.java' -print -quit 2>/dev/null || true)"
if [[ -z "$JAVA_FILE" ]]; then
  echo "Could not find generated MainActivity.java. No files were changed." >&2
  echo "Expected a Capacitor Java MainActivity under android/app/src/main/java/." >&2
  exit 1
fi

# Derive Java package from its existing declaration, so the script remains safe if the app ID changes.
PACKAGE_NAME="$(sed -n 's/^package[[:space:]]\+\([^;]*\);.*/\1/p' "$JAVA_FILE" | head -n 1)"
if [[ -z "$PACKAGE_NAME" ]]; then
  echo "Could not determine Java package from $JAVA_FILE. No files were changed." >&2
  exit 1
fi

cat > "$JAVA_FILE" <<JAVA
package $PACKAGE_NAME;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/** Keeps the Capacitor WebView inside Android system-bar safe areas. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Use explicit insets so Android 15+ edge-to-edge cannot cover the web content.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);

        View content = findViewById(android.R.id.content);
        if (content != null) {
            ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
                Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
                view.setPadding(
                    bars.left,
                    bars.top,
                    bars.right,
                    Math.max(bars.bottom, ime.bottom)
                );
                // Insets are applied to the content root exactly once.
                return WindowInsetsCompat.CONSUMED;
            });
            ViewCompat.requestApplyInsets(content);
        }
    }
}
JAVA

STYLES="$ANDROID_DIR/app/src/main/res/values/styles.xml"
if [[ -f "$STYLES" ]]; then
  cp "$STYLES" "$STYLES.before-safe-area.bak"
  cat > "$STYLES" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:statusBarColor">@android:color/black</item>
        <item name="android:navigationBarColor">@android:color/black</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@android:color/black</item>
        <item name="android:statusBarColor">@android:color/black</item>
        <item name="android:navigationBarColor">@android:color/black</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
    </style>
</resources>
XML
fi

echo "Safe-area fix applied to: $JAVA_FILE"
echo "Original styles.xml backup: $STYLES.before-safe-area.bak (if styles.xml existed)"
echo "Next run: npx cap sync android"
