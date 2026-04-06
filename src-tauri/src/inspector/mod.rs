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

/// 通过 login shell 解析命令的完整路径。
/// macOS GUI 应用不继承终端 PATH，通过 login shell 执行 `which` 即可获取。
pub fn resolve_command_path(cmd: &str) -> Option<String> {
    // macOS / Linux：通过 login shell 获取 PATH 下的完整路径
    #[cfg(unix)]
    {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        if let Ok(output) = std::process::Command::new(&shell)
            .args(["-l", "-c", &format!("which {}", cmd)])
            .output()
        {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Some(path);
                }
            }
        }
    }

    // Windows 或 fallback：直接尝试执行
    if std::process::Command::new(cmd)
        .arg("--version")
        .output()
        .is_ok_and(|o| o.status.success())
    {
        Some(cmd.to_string())
    } else {
        None
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
