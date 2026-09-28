import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const ports = [3000, 24678];
const isWindows = process.platform === 'win32';

function getProcessIds(port) {
  if (isWindows) {
    const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
    return output
      .split(/\r?\n/)
      .filter((line) => line.includes(`:${port}`) && /LISTENING/i.test(line))
      .map((line) => line.trim().split(/\s+/).at(-1))
      .filter((pid) => pid && /^\d+$/.test(pid));
  }

  const output = spawnSync('lsof', ['-ti', `:${port}`], { encoding: 'utf8' }).stdout || '';
  return output.split(/\r?\n/).filter((pid) => /^\d+$/.test(pid));
}

const processIds = new Set(ports.flatMap(getProcessIds).filter((pid) => pid !== String(process.pid)));

for (const pid of processIds) {
  if (isWindows) {
    spawnSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' });
  } else {
    process.kill(Number(pid), 'SIGTERM');
  }
}

if (processIds.size > 0) {
  console.log(`Stopped existing development process(es): ${[...processIds].join(', ')}`);
}
