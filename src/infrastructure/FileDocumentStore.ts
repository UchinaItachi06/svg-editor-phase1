import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SvgCodec } from './SvgCodec.ts';
import type { Document } from '../model/Document.ts';
import type { DocumentStore } from '../application/DocumentStore.ts';
export class FileDocumentStore implements DocumentStore {
  private readonly codec = new SvgCodec();
  read(file: string): { document: Document; warnings: string[] } {
    let source: string; try { source = fs.readFileSync(file, 'utf8'); } catch { throw new Error('cannot read file: ' + file); }
    return this.codec.decode(source);
  }
  write(file: string, document: Document): void {
    const data = this.codec.encode(document); const temp = path.join(path.dirname(file), '.' + path.basename(file) + '.' + randomUUID() + '.tmp');
    try { fs.writeFileSync(temp, data, { encoding: 'utf8', flag: 'wx' }); fs.renameSync(temp, file); }
    catch { throw new Error('cannot write file: ' + file); }
    finally { try { fs.unlinkSync(temp); } catch { /* Renamed or never created. */ } }
  }
}
