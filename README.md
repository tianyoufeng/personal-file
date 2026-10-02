# 个人家庭档案登记 App

登记和管理家庭成员及个人的各类信息。每个人拥有独立档案（目录 + 条目），支持搜索与回收站。
**纯本地离线 · 不联网不上传 · 无头像功能。**

当前版本：**v1.0.0**（更新日志见 [CHANGELOG.md](CHANGELOG.md)）

## 安装

### 安卓
1. 把 `dist/家庭档案-v1.0.0.apk` 传到手机（微信文件传输助手 / 数据线均可）
2. 安装时允许「安装未知应用」，Play Protect 提示选「仍然安装」
3. 数据存储在应用私有空间，卸载前请先在 **设置 → 导出备份**

### iPhone / iPad
1. 用 Safari 打开 `app/index.html`（可用爱思助手 / 本地文件方式投放，或自建局域网静态服务）
2. 分享 → **添加到主屏幕**，之后从桌面图标打开即为全屏 App
3. 首次打开需联网状态一次（加载 Service Worker 缓存），之后完全离线

> 注意：iOS 的 PWA 与安卓 APK 数据互不相通。换手机迁移：旧机导出备份 JSON →（第二版支持导入）。

## 功能一览（MVP）

| 模块 | 能力 |
|---|---|
| 人员 | 新增 / 编辑 / 置顶 / 软删除 / 按姓名关系搜索 |
| 档案 | 独立空间，默认 9 个目录（教育经历含两层子目录），目录可增删改排置顶 |
| 条目 | 标题 / 时间 / 地点 / 相关人 / 内容 / 附件 / 备注，自动保存 |
| 附件 | 图片 / PDF / Word / Excel 等，可预览可另存 |
| 搜索 | 全局（按人）+ 档案内（按目录），标题正文备注命中并高亮 |
| 回收站 | 恢复 / 彻底删除（二次确认），保留期默认 30 天可调，自动清理 |
| 设置 | 保留期调整、导出备份、深色模式 |

## 目录结构

```
v1.0/
├── app/                 # 网页应用本体（PWA + APK 共用）
│   ├── index.html
│   ├── style.css        # 含深色模式
│   ├── app.js           # 全部逻辑（IndexedDB / 路由 / 六个页面）
│   ├── manifest.json    # PWA 清单
│   ├── sw.js            # Service Worker（浏览器离线缓存）
│   └── icons/           # 应用图标（含生成脚本）
├── _android/            # 安卓工程（无 Gradle 手工构建）
│   ├── AndroidManifest.xml
│   ├── java/com/local/familyarchive/MainActivity.java
│   ├── res/             # 字符串 / 主题 / 各密度图标
│   ├── build.sh         # 一键构建（aapt2 → javac → d8 → zipalign → apksigner）
│   ├── verify_apk.py    # 包内容逐字节校验
│   ├── smoke.js         # 浏览器冒烟测试（Playwright / Edge）
│   └── smoke_native.js  # 原生桥导出模拟测试
├── dist/                # 家庭档案-v1.0.0.apk
├── CHANGELOG.md
└── README.md
```

## 重新构建 APK

```bash
cd _android && bash build.sh      # 产物输出到 dist/
python verify_apk.py              # 逐字节校验
node smoke.js                     # 浏览器冒烟测试
```

## 数据安全说明

- 所有数据存于设备本地（浏览器 IndexedDB / 应用私有存储），无任何网络上传
- APK 的 `allowBackup=false`，系统云备份不会带走数据；备份靠应用内「导出」
- 签名密钥库在 `~/.workbuddy/binaries/android-build/keys/familyarchive.keystore`，
  **请自行备份**：丢失后新版本将无法覆盖安装（需卸载，数据会清空）
