// Android WebView Project Generator
// Creates a complete Android project structure for wrapping a URL or local HTML in WebView

export type AndroidProjectConfig = {
  appName: string
  packageName: string
  url: string // URL to load in WebView, or 'local' for local HTML content
  localHtml?: string // HTML content if url is 'local'
  iconColor?: string // Background color for the generated icon
  version?: string
  minSdk?: number
  targetSdk?: number
  orientation?: 'unspecified' | 'portrait' | 'landscape'
  fullscreen?: boolean
  allowNavigation?: boolean // Allow navigation within the WebView
  cacheMode?: 'default' | 'no_cache' | 'cache_only'
}

const DEFAULT_CONFIG: Partial<AndroidProjectConfig> = {
  version: '1.0.0',
  minSdk: 24,
  targetSdk: 34,
  orientation: 'unspecified',
  fullscreen: false,
  allowNavigation: true,
  cacheMode: 'default',
  iconColor: '#4285F4',
}

export function generateAndroidProject(config: AndroidProjectConfig): Record<string, string> {
  const c = { ...DEFAULT_CONFIG, ...config }
  const files: Record<string, string> = {}

  // Sanitize package name
  const pkg = c.packageName!.replace(/[^a-zA-Z0-9._]/g, '.').toLowerCase()
  const pkgPath = pkg.replace(/\./g, '/')

  // 1. build.gradle (project level)
  files['build.gradle'] = `// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}`

  // 2. settings.gradle
  files['settings.gradle'] = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${c.appName}"
include ':app'`

  // 3. gradle.properties
  files['gradle.properties'] = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true`

  // 4. gradle-wrapper.properties
  files['gradle/wrapper/gradle-wrapper.properties'] = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`

  // 5. app/build.gradle
  files['app/build.gradle'] = `plugins {
    id 'com.android.application'
}

android {
    namespace '${pkg}'
    compileSdk ${c.targetSdk}

    defaultConfig {
        applicationId "${pkg}"
        minSdk ${c.minSdk}
        targetSdk ${c.targetSdk}
        versionCode 1
        versionName "${c.version}"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.webkit:webkit:1.9.0'
}`

  // 6. app/src/main/AndroidManifest.xml
  const internetPermission = c.url !== 'local' ? `\n    <uses-permission android:name="android.permission.INTERNET" />` : ''
  const orientationAttr = c.orientation === 'portrait' ? 'android:screenOrientation="portrait"' : 
    c.orientation === 'landscape' ? 'android:screenOrientation="landscape"' : ''
  const themeAttr = c.fullscreen ? '@style/Theme.AppCompat.NoActionBar' : '@style/Theme.MaterialComponents.DayNight.DarkActionBar'

  files['app/src/main/AndroidManifest.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">${internetPermission}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${c.appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="${themeAttr}"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            ${orientationAttr}
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`

  // 7. MainActivity.java
  const webViewUrl = c.url === 'local' ? 'file:///android_asset/index.html' : c.url
  const cacheModeInt = c.cacheMode === 'no_cache' ? 'LOAD_NO_CACHE' : 
    c.cacheMode === 'cache_only' ? 'LOAD_CACHE_ONLY' : 'LOAD_DEFAULT'

  files[`app/src/main/java/${pkgPath}/MainActivity.java`] = `package ${pkg};

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;

public class MainActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Fullscreen mode
        ${c.fullscreen ? `getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);` : '// Normal mode'}

        // Create WebView
        webView = new WebView(this);
        setContentView(webView);

        // Configure WebView settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.${cacheModeInt});
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Enable responsive design
        settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);

        // Set WebView clients
        webView.setWebViewClient(new MyAppWebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load URL
        webView.loadUrl("${webViewUrl}");
    }

    private class MyAppWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            
            // Allow navigation within the WebView for web URLs
            ${c.allowNavigation ? `
            if (url.startsWith("http://") || url.startsWith("https://")) {
                view.loadUrl(url);
                return false;
            }` : `
            if (url.equals("${c.url}")) {
                return false;
            }`}
            
            // Open external links (tel, email, maps, etc.) in system browser
            if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("geo:") || url.startsWith("sms:")) {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }
            
            return true;
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Enable back button navigation in WebView
        if ((keyCode == KeyEvent.KEYCODE_BACK) && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}`

  // 8. strings.xml
  files['app/src/main/res/values/strings.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${c.appName}</string>
</resources>`

  // 9. styles.xml
  files['app/src/main/res/values/styles.xml'] = c.fullscreen ? 
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>` :
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">${c.iconColor}</item>
        <item name="colorPrimaryDark">${c.iconColor}</item>
        <item name="colorAccent">${c.iconColor}</item>
    </style>
</resources>`

  // 10. colors.xml
  files['app/src/main/res/values/colors.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${c.iconColor}</color>
    <color name="colorPrimaryDark">${c.iconColor}</color>
    <color name="colorAccent">#FFFFFF</color>
</resources>`

  // 11. proguard-rules.pro
  files['app/proguard-rules.pro'] = `# Add project specific ProGuard rules here.
-keepclassmembers class * {
    public <methods>;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-dontwarn android.webkit.**`

  // 12. local HTML content (if applicable)
  if (c.url === 'local' && c.localHtml) {
    files['app/src/main/assets/index.html'] = c.localHtml
  }

  // 13. README with build instructions
  files['README.md'] = `# ${c.appName} - Android WebView App

## Quick Build Instructions

### Prerequisites
- Android Studio (latest version)
- JDK 8 or higher

### Steps
1. Open Android Studio
2. Select "Open an existing Android Studio project"
3. Navigate to this project folder and click "OK"
4. Wait for Gradle sync to complete
5. Click the "Run" button (green play icon) or press Shift+F10
6. Select your device/emulator to install the app

### Build APK for Distribution
1. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. The APK will be generated at: app/build/outputs/apk/debug/app-debug.apk
3. For release APK: Build → Generate Signed Bundle / APK

### Configuration
- **URL**: ${c.url === 'local' ? 'Local HTML (assets/index.html)' : c.url}
- **Package**: ${pkg}
- **Min SDK**: ${c.minSdk} (Android 7.0+)
- **Target SDK**: ${c.targetSdk}
- **Orientation**: ${c.orientation}
- **Fullscreen**: ${c.fullscreen ? 'Yes' : 'No'}

### Customization
- Edit \`app/src/main/res/values/strings.xml\` to change the app name
- Edit \`app/src/main/res/values/colors.xml\` to change the theme colors  
- Edit \`app/src/main/java/${pkgPath}/MainActivity.java\` to modify WebView behavior
- Replace \`app/src/main/res/mipmap-\` icons with your custom app icon

Generated by Z.ai Android WebView Builder
`

  return files
}

// Generate app name from URL
export function generateAppName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const name = hostname.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1) + ' App'
  } catch {
    return 'WebViewApp'
  }
}

// Generate package name from URL
export function generatePackageName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const parts = hostname.split('.')
    return 'com.' + parts.join('.')
  } catch {
    return 'com.webview.app'
  }
}
