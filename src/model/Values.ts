export class Values {
  static number(value: string | number, name = 'number'): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))
      throw new Error('invalid ' + name + ': ' + value);
    const result = Number(value);
    if (!Number.isFinite(result)) throw new Error('invalid ' + name + ': ' + value);
    return result;
  }
  static nonnegative(value: string | number, name: string): number {
    const result = this.number(value, name);
    if (result < 0) throw new Error(name + ' must be nonnegative');
    return result;
  }
  static positive(value: string | number, name: string): number {
    const result = this.number(value, name);
    if (result <= 0) throw new Error(name + ' must be positive');
    return result;
  }
  static id(id: string): string {
    if (!id || /[\s\x00-\x1f]/u.test(id)) throw new Error('invalid id: ' + id);
    return id;
  }
  static xml(value: string): string {
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/u.test(value))
      throw new Error('invalid XML character');
    return value;
  }
}
