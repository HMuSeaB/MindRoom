# Android 构建指南

## 前置条件

### 1. 安装 Android Studio
下载：https://developer.android.com/studio

### 2. 设置环境变量（Windows）
```powershell
# 添加到用户环境变量
ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr

# 添加到 Path
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\cmdline-tools\latest\bin
%JAVA_HOME%\bin
```

### 3. 安装必要的 SDK 组件
在 Android Studio 中：
- SDK Platforms → Android 7.0 (API 24) 或更高
- SDK Tools → Android SDK Build-Tools
- SDK Tools → NDK (Side by side)

---

## 构建步骤

### 首次初始化
```bash
cd src-tauri
npx tauri android init

# 选择:
# - Package name: com.mindroom.app
# - App name: Mind Room
```

### 调试构建（连接手机/模拟器）
```bash
# 启动开发服务器
npx tauri android dev
```

### 发布构建
```bash
# 生成 debug APK（未签名）
npx tauri android build

# 生成 release APK（需要签名）
npx tauri android build --release
```

APK 输出位置：
```
src-tauri/gen/android/app/build/outputs/apk/
├── debug/
│   └── app-debug.apk
└── release/
    └── app-release-unsigned.apk
```

---

## 签名 APK (可选)

### 1. 生成密钥库
```bash
keytool -genkey -v -keystore mindroom.keystore -alias mindroom -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置签名
编辑 `src-tauri/gen/android/key.properties`:
```properties
storePassword=你的密码
keyPassword=你的密码
keyAlias=mindroom
storeFile=../../mindroom.keystore
```

### 3. 重新构建
```bash
npx tauri android build --release
```

---

## 常见问题

### 错误: SDK not found
```bash
# 确认环境变量正确
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME% # Windows
```

### 错误: No connected devices
```bash
# 检查设备连接
adb devices

# 启用 USB 调试（手机设置 → 开发者选项 → USB 调试）
```

### 错误: Gradle build failed
```bash
# 清理构建缓存
cd src-tauri/gen/android
./gradlew clean

# 重新构建
npx tauri android build
```

---

## 测试全屏和防休眠

1. 安装 APK 到手机
2. 打开应用
3. 点击 Focus 标签
4. 点击计时器圆圈启动
5. 验证：
   - ✅ 状态栏/导航栏自动隐藏
   - ✅ 屏幕保持常亮不休眠
   - ✅ 导航栏淡出进入沉浸模式

---

## 性能优化建议

### 减小 APK 体积
编辑 `src-tauri/Cargo.toml`:
```toml
[profile.release]
opt-level = "z"  # 优化体积
lto = true       # 链接时优化
strip = true     # 移除调试符号
```

### 启用混淆（可选）
编辑 `src-tauri/gen/android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
    }
}
```

---

**祝构建顺利！** 🎉
