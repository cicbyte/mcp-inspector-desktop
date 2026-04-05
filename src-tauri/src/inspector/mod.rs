mod process;

pub use process::InspectorHandle;

/// 返回当前平台上 mcp-inspector CLI 的命令名
pub fn inspector_command() -> &'static str {
    if cfg!(target_os = "windows") {
        "mcp-inspector.cmd"
    } else {
        "mcp-inspector"
    }
}

/// Inspector 进程相关错误
#[derive(thiserror::Error, Debug)]
pub enum InspectorError {
    #[error("No available port in range {0}-{1}")]
    NoAvailablePort(u16, u16),

    #[error("Process spawn failed: {0}")]
    SpawnError(#[from] std::io::Error),
}

/// Inspector 进程结果类型
pub type Result<T> = std::result::Result<T, InspectorError>;
