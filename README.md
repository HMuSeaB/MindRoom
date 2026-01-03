# 🧘 Mind Room

> 极简禅意专注应用 | Minimalist Focus App
> 基于 **Tauri v2** + **Vanilla JS** + **Open Props** + **Tauri Store** 构建

---

## 💎 核心理念：思想结晶 (Crystallization of Thought)

Mind Room 不仅仅是一个工具，它是一场对抗虚无的仪式。我们将抽象的思维过程具象化为物理世界的互动：

- **🌌 熵 (Entropy)**: 默认状态下，背景是混乱无序的粒子，象征着大脑中的噪音与焦虑。
- **❄️ 结晶 (Crystal)**: 当你开始专注（启动计时器），混沌的粒子被引力捕获，螺旋吸入核心，转化为有序的能量。
- **🩸 金缮 (Kintsugi)**: 每一个想法（节点）都是不完美的碎片，用发光的液态金线将它们缝合，拥抱破碎之美。
- **🔥 灰烬 (Ash)**: 在 Stream 模式中，在这个数字祭坛上，你可以选择将执念“释放”，化作飞升的灰烬归于虚空。

## ✨ 特性 (New)

- **🖥️ 高保真物理引擎**: 
  - 帧率独立 (DeltaTime) 的粒子模拟
  - **Retina Ready**: 完美适配高分屏
  - **Wavefront Physics**: 键盘输入会产生真实的物理冲击波，推开混沌
- **🔊 数字敲击乐 (Audio Engine)**: 
  - **Generative Sound**: 不使用预制音频，根据打字速度实时合成音效
  - **Deep Reflection**: 慢速输入时，发出深沉的钟声与长混响
  - **Flow State**: 快速输入时 (>300 CPM)，音色转变为清脆的冰裂声
- **🍂 仪式化交互**:
  - **Ash Ritual**: 点击 Stream 的火焰按钮，目送文字化为灰烬
  - **Organic Canvas**: 贝塞尔曲线金线 + 程序化生成的碎瓷片节点

## ✨ 基础功能

- **🎯 番茄计时器**: 25分钟专注模式，沉浸式界面 + 状态自动保存
- **🔊 专注音效**: 计时器运行时播放柔和棕噪音 (Brown Noise)
- **📝 意识流写作**: 自动保存的自由书写空间，重启不丢失
- **🔮 禅意 Canvas**: 
  - 极简节点创建与自动连线
  - 🎨 节点颜色自定义
  - 📤 画布一键导出为图片
  - 撤销/重做支持
  - 本地持久化保存
- **📱 移动端适配**: 支持 Android，全屏沉浸 + Wake Lock 防休眠
- **🎨 Open Props**: 开箱即用的现代设计系统
- **⚡ 轻量原生**: 使用 Tauri 构建，体积小速度快


---

## 🚀 快速开始

### 前置要求

- **Node.js** (v18+)
- **Rust** (最新稳定版)
- **pnpm/npm** 包管理器
- **(可选) Android Studio** - 用于 Android 构建

### 安装依赖

```bash
npm install
npm run tauri add store
cd src-tauri && cargo build
```

### 开发模式

```bash
npm run tauri dev
```

### 桌面打包

```bash
# Windows/macOS/Linux
npm run tauri build
```

### Android 打包

```bash
# 初始化 Android 项目（仅首次）
cd src-tauri
npx tauri android init

# 构建 APK
npx tauri android build

# 或直接运行到设备
npx tauri android dev
```

---

## 📂 项目结构

```
MindRoom/
├── src/                    # 前端源码
│   ├── index.html         # 主入口
│   ├── main.js            # 核心逻辑 (Canvas, Store, Audio)
│   ├── styles.css         # 样式 (含移动端适配)
│   └── assets/            # 静态资源
├── src-tauri/             # Rust 后端
│   ├── src/lib.rs         # Tauri 主程序
│   ├── Cargo.toml         # Rust 依赖
│   ├── tauri.conf.json    # Tauri 配置
│   └── capabilities/      # 权限配置 (Store, Opener)
│       └── default.json
└── README.md
```

---

## 📱 移动端适配说明

### 已实现功能

- ✅ **全屏沉浸**: 隐藏系统状态栏/导航栏
- ✅ **防止休眠**: 使用 Web Wake Lock API
- ✅ **安全区域适配**: 支持刘海屏/药丸屏
- ✅ **响应式设计**: 竖屏/横屏/超小屏自适应
- ✅ **触摸优化**: 支持多指操作 Canvas

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| **框架** | Tauri v2 | Rust 驱动的跨平台框架 |
| **前端** | Vanilla JS | 无框架依赖，原生体验 |
| **样式** | Open Props | CSS 变量设计系统 |
| **存储** | `tauri-plugin-store` | 本地数据持久化 |
| **音频** | Web Audio API | 生成实时棕噪音 |

---

## 🎨 设计理念

**禅意极简主义 (Zen Minimalism)**

- 深色主题 (#1a1a1a) + 抹茶绿点缀
- 微妙噪点纹理增加质感
- 呼吸式动画 (Open Props `ease-elastic`)
- 沉浸模式：专注时自动淡出导航

---

## 📖 使用指南

### Focus 模式
- 点击计时器圆圈开始 25 分钟专注
- **新特性**: 混乱粒子开始结晶，棕噪音伴随深沉的钟声
- **新特性**: 计时器状态自动保存，即便关闭应用也不会重置

### Stream 模式
- 无限制自由书写空间，伴随生成的数字敲击音效
- **Release (🔥)**: 点击右下角火焰按钮，将当前思绪化为灰烬（释放并清空）
- **新特性**: 内容实时自动保存 (1秒防抖)，无需担心丢失

### Canvas 模式 (Kintsugi)
- **创建碎片**: 点击空白处，生成独一无二的碎瓷片节点
- **金缮连线**: 拖拽连接，自动生成流动的贝塞尔金线
- **移动节点**: 拖拽任意节点
- **删除节点**: 双击节点
- **自定义颜色**: 使用右下角调色盘
- **导出**: 点击 ⤓ 按钮保存为图片
- **清空**: 点击 ○ 按钮或按 Delete 键

---

## 📄 开源协议

MIT License - 自由使用和修改

---

## 🙏 致谢

- [Tauri](https://tauri.app) - 现代化跨平台框架
- [Open Props](https://open-props.style) - 优雅的设计系统

---

**Made with 🍵 by [Your Name]**