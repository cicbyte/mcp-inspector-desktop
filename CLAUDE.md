# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MCP Inspector Desktop — 基于 Tauri v2 的桌面应用，为 `@modelcontextprotocol/inspector` CLI 提供原生 GUI 封装。Rust 后端自动管理 Inspector 子进程的启动、端口分配和认证令牌捕获，前端通过 iframe 加载 Inspector Web 界面。

## 常用命令

```bash
npm install                    # 安装前端依赖
npm run tauri dev              # 开发模式（同时启动 Vite dev server + Rust 后端）
npm run tauri build            # 生产构建
npm run dev                    # 仅前端 dev server（端口 1420）
npm run build                  # 仅前端构建（tsc && vite build）
```

前置条件：Node.js、Rust toolchain、全局安装 `@modelcontextprotocol/inspector`。

## 架构

```
Tauri v2 双层架构
├── src/              前端 React 18 + TypeScript + Vite + Tailwind CSS
│   ├── App.tsx       根组件，状态管理，Launcher/InspectorView 视图切换
│   ├── components/
│   │   ├── Launcher.tsx          启动页（启动按钮 + 日志面板）
│   │   └── InspectorView.tsx     运行时视图（iframe + 可收起日志面板）
│   ├── lib/utils.ts              cn() 工具函数（clsx + tailwind-merge）
│   └── styles/globals.css        Tailwind + CSS 变量主题（暗色，shadcn/ui 风格）
│
└── src-tauri/        Rust 后端
    ├── src/
    │   ├── main.rs                Tauri Builder 配置，插件注册
    │   ├── commands.rs            6 个 Tauri Command（start/stop/status/profile CRUD）
    │   ├── state.rs               AppState（Mutex 包装 Inspector 句柄 + 配置）
    │   ├── inspector/
    │   │   ├── mod.rs             InspectorError 错误类型
    │   │   └── process.rs         InspectorHandle 进程管理核心（spawn/kill/is_running）
    │   └── config/
    │       ├── mod.rs             模块导出
    │       └── storage.rs         AppConfig/ServerProfile 数据结构 + 持久化
    ├── Cargo.toml
    ├── tauri.conf.json            应用配置（标识、窗口、CSP、构建命令）
    └── capabilities/default.json  权限定义
```

## 通信模式

- **前端 → 后端**：`invoke("command_name")` 调用 Tauri Command
- **后端 → 前端**：`window.emit("event_name", payload)` 发送事件
- 关键事件：`inspector-log`（日志）、`inspector-url-ready`（带认证令牌的完整 URL）、`inspector-exited`（进程退出）

## 添加新 Tauri Command

1. `src-tauri/src/commands.rs` 定义 `#[tauri::command]` 函数
2. `src-tauri/src/main.rs` 的 `generate_handler![]` 中注册
3. 前端通过 `invoke("command_name")` 调用

## 编码规范

- TypeScript strict 模式 + `noUnusedLocals` + `noUnusedParameters`
- ESM 模块系统（`"type": "module"`）
- Rust Edition 2021，`thiserror` 自定义错误 + `anyhow` 通用错误
- Mutex 保护共享状态（进程句柄、应用配置）
- Windows 平台条件编译：`#[cfg(target_os = "windows")]`

## 注意事项

- 子进程命令当前硬编码为 `mcp-inspector.cmd`（Windows 特定），跨平台需适配
- stdout 解析依赖 `Session token:` 关键字，若 inspector CLI 输出格式变化需同步更新
- CSP 设为 `null` 以允许 iframe 加载 localhost，生产环境需评估安全性
- 配置持久化使用原子写入（先写 `.tmp` 再 `rename`）
- 当前无测试框架、无 lint 工具、无 CI/CD
