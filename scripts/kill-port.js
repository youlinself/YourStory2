import { execSync } from 'child_process';

const PORT = 1430;

function killProcessOnPort() {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`[kill-port] 已终止进程 PID: ${pid}`);
          } catch (e) {
          }
        }
      }
    } else {
      try {
        execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      } catch (e) {
      }
    }
  } catch (error) {
  }
}

killProcessOnPort();
