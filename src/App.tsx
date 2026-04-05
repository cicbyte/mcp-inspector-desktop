import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ask } from "@tauri-apps/plugin-dialog";
import Launcher from "./components/Launcher";
import InspectorView from "./components/InspectorView";

interface InspectorStatus {
  running: boolean;
  url?: string;
}

interface LogEntry {
  type: "stdout" | "stderr" | "system";
  text: string;
  timestamp: Date;
}

function App() {
  const [inspectorStatus, setInspectorStatus] = useState<InspectorStatus>({
    running: false,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [wasRunning, setWasRunning] = useState(false);

  // 监听日志事件
  useEffect(() => {
    const unlistenLog = listen<{ type: string; text: string }>(
      "inspector-log",
      (event) => {
        setLogs((prev) => [
          ...prev,
          {
            type: event.payload.type as "stdout" | "stderr",
            text: event.payload.text,
            timestamp: new Date(),
          },
        ]);
      }
    );

    const unlistenExited = listen<string>("inspector-exited", () => {
      setLogs((prev) => [
        ...prev,
        {
          type: "system",
          text: "Inspector 进程已退出",
          timestamp: new Date(),
        },
      ]);
      setInspectorStatus({ running: false });
      setWasRunning(false); // 标记为已停止
    });

    return () => {
      unlistenLog.then((fn) => fn());
      unlistenExited.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    // 监听 Inspector 就绪事件（端口）- 不再使用，等待完整 URL
    // const unlistenReady = listen<number>("inspector-ready", (event) => {
    //   setInspectorStatus({
    //     running: true,
    //     url: `http://localhost:${event.payload}`,
    //   });
    // });

    // 监听 Inspector URL 就绪事件（完整 URL 包含认证令牌）
    const unlistenUrlReady = listen<string>("inspector-url-ready", (event) => {
      console.log("收到 inspector-url-ready 事件:", event.payload);
      setInspectorStatus({
        running: true,
        url: event.payload,
      });
      setWasRunning(true); // 标记为已运行过
    });

    // 检查当前状态
    invoke<string>("get_inspector_status")
      .then((url) => {
        if (url) {
          setInspectorStatus({ running: true, url });
        }
      })
      .catch(() => {
        // 忽略错误
      });

    return () => {
      // unlistenReady.then((fn) => fn());
      unlistenUrlReady.then((fn) => fn());
    };
  }, []);

  const handleStart = async () => {
    try {
      // 清空之前的日志
      setLogs([{
        type: "system",
        text: "正在启动 Inspector...",
        timestamp: new Date(),
      }]);

      await invoke("start_inspector");
      // 不要立即切换视图，等待收到完整 URL
    } catch (error) {
      console.error("Failed to start inspector:", error);

      if (String(error) === "mcp-inspector not found") {
        const yes = await ask("未检测到 @modelcontextprotocol/inspector，是否立即安装？", {
          title: "安装确认",
          okLabel: "是",
          cancelLabel: "否",
        });
        if (yes) {
          try {
            await invoke("install_inspector");
            // 安装成功后自动重新启动
            await invoke("start_inspector");
          } catch (installError) {
            setLogs((prev) => [
              ...prev,
              {
                type: "system",
                text: `安装或启动失败: ${installError}`,
                timestamp: new Date(),
              },
            ]);
          }
        } else {
          setLogs((prev) => [
            ...prev,
            {
              type: "system",
              text: "已取消安装",
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        setLogs((prev) => [
          ...prev,
          {
            type: "system",
            text: `启动失败: ${error}`,
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const handleStop = async () => {
    try {
      await invoke("stop_inspector");
      setInspectorStatus({ running: false });
    } catch (error) {
      console.error("Failed to stop inspector:", error);
      throw error;
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      {!inspectorStatus.running ? (
        <Launcher
          onStart={handleStart}
          logs={logs}
          onClearLogs={handleClearLogs}
          wasRunning={wasRunning}
        />
      ) : inspectorStatus.url ? (
        <InspectorView
          url={inspectorStatus.url}
          onStop={handleStop}
          logs={logs}
          onClearLogs={handleClearLogs}
        />
      ) : null}
    </div>
  );
}

export default App;
