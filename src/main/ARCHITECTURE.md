# 主进程目录说明

## 目录结构

```
src/main/
├── index.ts                   # 应用入口，窗口创建，调用各 IPC 注册函数
├── ipc/                       # IPC 处理器（按业务领域拆分）
│   ├── auth.ts               # 认证：hasAuth、login、logout
│   ├── task.ts               # 任务：task:start、task:stop
│   ├── feed-ac-setting.ts    # Feed AC 配置管理
│   ├── ai-setting.ts         # AI 配置管理
│   ├── browser-exec.ts       # 浏览器路径管理
│   ├── file-picker.ts        # 文件选择器
│   └── debug.ts              # 调试功能
├── workflows/                 # 业务逻辑
│   └── feed-ac/              # Feed AC 自动化任务相关
├── elements/                  # 页面元素选择器
│   └── douyin.ts             # 抖音平台元素定位
├── service/                   # 外部服务封装
│   └── ark.ts
└── utils/                     # 工具函数
    └── storage.ts            # electron-store 封装
```

## 各目录说明

### index.ts

应用入口文件，只负责：

- 创建窗口
- 应用生命周期管理
- 调用各 IPC 模块的注册函数

### ipc/

IPC 处理器模块，每个文件对应一个业务领域：

- 导出 `registerXxxIPC()` 函数
- 通过 `ipcMain.handle/on` 注册频道
- 调用 workflows/utils 中的业务逻辑

### workflows/

核心业务逻辑，不依赖 Electron API，可独立测试

### elements/

页面元素选择器封装，供 workflows 使用

### service/

外部服务接口封装

### utils/

通用工具函数
