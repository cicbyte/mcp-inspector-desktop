[根目录](../CLAUDE.md) > **src-tauri**

# Tauri 后端模块 (src-tauri/)

Rust 后端，管理 mcp-inspector 子进程生命周期、配置持久化，通过 Tauri Command/Event 与前端通信。

## 核心文件

| 文件 | 职责 |
|------|------|
| `src/main.rs` | Tauri Builder 配置，插件注册（shell, dialog），全局状态注入 |
| `src/commands.rs` | 6 个 Tauri Command：start/stop/status + profile CRUD |
| `src/state.rs` | `AppState`（Mutex<InspectorHandle> + Mutex<AppConfig>） |
| `src/inspector/process.rs` | `InspectorHandle` — 子进程 spawn/kill/is_running，stdout 解析 token |
| `src/inspector/mod.rs` | `InspectorError` 错误类型 |
| `src/config/storage.rs` | `AppConfig`/`ServerProfile` 数据结构 + JSON 持久化（原子写入） |

## 进程管理流程

1. `portpicker` 分配 client_port 和 server_port
2. 启动 `mcp-inspector.cmd` 子进程（Windows: `CREATE_NO_WINDOW` 隐藏控制台）
3. 后台线程逐行读取 stdout，检测 `Session token:` 提取认证令牌
4. 组装 URL: `http://localhost:{client_port}?MCP_PROXY_PORT={server_port}&MCP_PROXY_AUTH_TOKEN={token}`
5. 通过 Tauri Event 发送 `inspector-url-ready` / `inspector-log` / `inspector-exited`

## Tauri Commands

| Command | 用途 |
|---------|------|
| `start_inspector` | 启动子进程（自动分配端口） |
| `stop_inspector` | 终止子进程 |
| `get_inspector_status` | 查询运行状态和 URL |
| `get_recent_profiles` | 获取最近使用的 Profile 列表 |
| `save_profile` | 保存/更新 Profile |
| `delete_profile` | 删除 Profile |

## 配置文件

- 目录：`{系统配置目录}/mcp-inspector-desktop/config.json`
- `AppConfig` 包含 recent_profiles（最多 10 个）、default_env_vars、settings（theme/auto_start）

## 关键依赖

`tauri` v2 | `tokio` v1 (process, sync, rt-multi-thread) | `portpicker` | `serde` + `serde_json` | `thiserror` + `anyhow` | `dirs` | `uuid` | `chrono`
