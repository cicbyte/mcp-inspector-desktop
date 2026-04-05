[根目录](../CLAUDE.md) > **src**

# 前端模块 (src/)

React 18 前端，提供启动器界面和 Inspector iframe 视图，通过 Tauri API 与后端通信。

## 核心文件

| 文件 | 职责 |
|------|------|
| `App.tsx` | 根组件，管理 Inspector 运行状态和日志，在 Launcher 和 InspectorView 之间切换 |
| `components/Launcher.tsx` | 启动页，启动按钮 + 日志面板 |
| `components/InspectorView.tsx` | 运行时视图，iframe 加载 Inspector + 可收起日志面板 |
| `lib/utils.ts` | `cn()` 工具函数（clsx + tailwind-merge） |
| `styles/globals.css` | Tailwind 指令 + CSS 变量主题（暗色默认，shadcn/ui 风格） |

## Tauri 通信

### Commands (invoke)
- `start_inspector` / `stop_inspector` / `get_inspector_status` — 进程控制

### Events (listen)
- `inspector-log` — `{ type: "stdout"|"stderr"|"system", text: string }` 实时日志
- `inspector-url-ready` — `string` 带 token 的完整 URL（收到后才切换到 InspectorView）
- `inspector-exited` — `string` 进程退出通知

## 关键类型

```typescript
interface InspectorStatus { running: boolean; url?: string; }
interface LogEntry { type: "stdout" | "stderr" | "system"; text: string; timestamp: Date; }
```

## 技术栈

React 18 + TypeScript (strict) + Vite 6 (端口 1420) + Tailwind CSS 3 + @tauri-apps/api v2
