# 地理地貌 3D 教学展示

一个**纯前端**的交互式地理地貌可视化网站，供中学地理课堂教学使用。

**[🌍 在线演示（开启 GitHub Pages 后）](https://wjcandyzr.github.io/dili/)**

## ✨ 特色

- **13 种地貌**：山地、高原、丘陵、平原、盆地、火山、峡谷、河流三角洲、喀斯特、丹霞、沙漠、冰川、海岸
- **程序化生成**：每种地貌基于噪声函数实时生成 3D 地形，非预渲染图片
- **三视图切换**：3D 视图 / 等高线 / 剖面图
- **教学标注**：地形要素浮标（山峰、火山口、冲积平原…），点击可看详细说明
- **一键演示**：自动旋转模式，方便上课讲解
- **无需构建**：纯 HTML + CSS + JS，Three.js 通过 CDN 引入

## 🚀 快速开始

### 本地运行

双击 `start.bat`（需本机有 Python 或 Node），或在目录下运行：

```bash
python -m http.server 8000
```

然后浏览器打开 `http://localhost:8000`。

> ⚠️ 直接双击 `index.html` 可能因 `file://` 协议限制导致 ES Module 无法加载，请使用本地服务器。

### 部署到 GitHub Pages

1. 进入仓库 Settings → Pages
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main` + `/ (root)`
4. 保存，等 1–2 分钟即可通过 `https://wjcandyzr.github.io/dili/` 访问

## 🎮 使用说明

| 操作 | 效果 |
|------|------|
| 点击左侧地貌 | 切换场景 |
| 鼠标左键拖拽 | 旋转视角 |
| 滚轮 | 缩放 |
| 鼠标右键拖拽 | 平移 |
| 顶部视图按钮 | 切换 3D / 等高线 / 剖面图 |
| "自动旋转" 勾选 | 一键演示 |
| 点击 🔵 蓝点 | 查看要素说明 |

## 📁 目录结构

```
.
├── index.html             # 入口
├── css/style.css          # 样式
├── js/
│   ├── main.js            # 场景初始化 + 事件绑定
│   ├── noise.js           # 2D value noise + fBm
│   ├── terrain.js         # 程序化地形生成
│   ├── landforms.js       # 13 种地貌配置 + 介绍文本
│   ├── labels.js          # CSS2D 标注浮标
│   └── views.js           # 三视图切换
├── start.bat              # Windows 一键启动
└── README.md
```

## 🛠 技术栈

- [Three.js](https://threejs.org/) r160 （CDN 引入）
- 原生 ES Modules（importmap）
- 无需 npm、无需构建

## 📄 许可

MIT
