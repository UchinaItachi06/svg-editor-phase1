import { createInterface } from 'node:readline';
import { CommandRouter } from './CommandRouter.ts';
export class Cli {
  private readonly router: CommandRouter;
  constructor(router: CommandRouter) { this.router = router; }
  async run(): Promise<void> {
    const interactive = Boolean(process.stdin.isTTY); let failed = false;
    if (interactive) console.log("svg-editor 0.1 — type 'help' for commands; Ctrl+C / Ctrl+D to exit");
    const input = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
    if (interactive) process.stdout.write('svg> ');
    for await (const line of input) { const result = this.router.execute(line); if (result) console.log(result); if (result.startsWith('error:')) failed = true; if (interactive) process.stdout.write('svg> '); }
    if (!interactive && failed) process.exitCode = 1;
  }
}
