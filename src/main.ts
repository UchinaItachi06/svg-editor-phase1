import { Cli } from './cli/Cli.ts';
import { CommandRouter } from './cli/CommandRouter.ts';
import { FileDocumentStore } from './infrastructure/FileDocumentStore.ts';
await new Cli(new CommandRouter(new FileDocumentStore())).run();
