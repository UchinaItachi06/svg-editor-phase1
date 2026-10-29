export interface Token {
  value: string;
  quoted: boolean;
}
export class Tokenizer {
  parse(line: string): Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let i = 0;
    while (i < line.length) {
      if (/\s/u.test(line[i])) {
        i++;
        continue;
      }
      let value = '';
      const quoted = line[i] === '"';
      if (quoted) {
        i++;
        let closed = false;
        while (i < line.length) {
          const c = line[i++];
          if (c === '"') {
            closed = true;
            break;
          }
          if (c === '\\' && (line[i] === '"' || line[i] === '\\')) value += line[i++];
          else value += c;
        }
        if (!closed) throw new Error('unterminated quoted argument');
        if (i < line.length && !/\s/u.test(line[i]))
          throw new Error('expected whitespace after quoted argument');
      } else {
        while (i < line.length && !/\s/u.test(line[i])) {
          if (line[i] === '"') throw new Error('quote must start an argument');
          value += line[i++];
        }
      }
      tokens.push({ value, quoted });
    }
    return tokens;
  }
}
