import { execSync } from 'child_process';

const PORT = 1430;
const CURRENT_PID = process.pid;

function killProcessOnPort() {
  try {
    if (process.platform !== 'win32') {
      try {
        execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      } catch (e) {}
      return;
    }
    
    const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      
      if (!pid || pid === '0' || pid === String(CURRENT_PID)) continue;
      
      try {
        const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf-8' });
        
        if (processInfo.includes('node.exe') || processInfo.includes('vite')) {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[kill-port] 已终止旧 Vite 进程 PID: ${pid}`);
        }
      } catch (e) {}
    }
  } catch (error) {}
}

killProcessOnPort();
