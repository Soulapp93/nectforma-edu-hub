// =====================================================
// Excel++ Formula Engine — 150+ formulas
// =====================================================

export type SheetData = Record<string, CellData>;

export interface DataValidation {
  type: 'list' | 'number' | 'text' | 'date' | 'custom';
  values?: string[]; // for list type
  min?: number;
  max?: number;
  customFormula?: string;
  allowBlank?: boolean;
  errorMessage?: string;
}

export interface ConditionalFormatRule {
  id: string;
  type: 'greaterThan' | 'lessThan' | 'equal' | 'between' | 'text' | 'blank' | 'notBlank' | 'duplicate' | 'colorScale';
  value?: string;
  value2?: string; // for 'between'
  bgColor?: string;
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface CellData {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  numberFormat?: string;
  merged?: { rows: number; cols: number };
  mergedParent?: string;
  border?: { top?: string; right?: string; bottom?: string; left?: string };
  wrap?: boolean;
  comment?: string;
  validation?: DataValidation;
  conditionalFormats?: ConditionalFormatRule[];
  indent?: number;
  rotation?: number;
}

export const colLetter = (i: number): string => {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

export const colIndex = (letters: string): number => {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
};

export const cellKey = (row: number, col: number) => `${colLetter(col)}${row + 1}`;

export const parseCellRef = (ref: string): [number, number] | null => {
  const match = ref.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
  if (!match) return null;
  return [parseInt(match[4]) - 1, colIndex(match[2])];
};

const getRangeValues = (startRef: string, endRef: string, data: SheetData, visited: Set<string>): string[] => {
  const start = parseCellRef(startRef);
  const end = parseCellRef(endRef);
  if (!start || !end) return [];
  const values: string[] = [];
  for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
    for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
      values.push(getCellValue(cellKey(r, c), data, new Set(visited)));
    }
  }
  return values;
};

const getRangeNums = (startRef: string, endRef: string, data: SheetData, visited: Set<string>): number[] => {
  return getRangeValues(startRef, endRef, data, visited)
    .map(v => parseFloat(v))
    .filter(n => !isNaN(n));
};

const parseArgs = (argsStr: string): string[] => {
  const args: string[] = [];
  let depth = 0, current = '';
  for (const ch of argsStr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { args.push(current.trim()); current = ''; }
    else current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return args;
};

const resolveArg = (arg: string, data: SheetData, visited: Set<string>): string => {
  if (arg.startsWith('"') && arg.endsWith('"')) return arg.slice(1, -1);
  if (arg.match(/^\$?[A-Z]+\$?\d+$/)) return getCellValue(arg.replace(/\$/g, ''), data, new Set(visited));
  if (arg.startsWith('=')) return evaluateFormula(arg, data, new Set(visited));
  return arg;
};

const resolveNum = (arg: string, data: SheetData, visited: Set<string>): number => {
  const val = resolveArg(arg, data, visited);
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const RANGE_RE = /^(\$?[A-Z]+\$?\d+):(\$?[A-Z]+\$?\d+)$/;

const getAllNums = (args: string[], data: SheetData, visited: Set<string>): number[] => {
  const nums: number[] = [];
  for (const arg of args) {
    const rm = arg.match(RANGE_RE);
    if (rm) nums.push(...getRangeNums(rm[1], rm[2], data, visited));
    else nums.push(resolveNum(arg, data, visited));
  }
  return nums;
};

const getAllValues = (args: string[], data: SheetData, visited: Set<string>): string[] => {
  const vals: string[] = [];
  for (const arg of args) {
    const rm = arg.match(RANGE_RE);
    if (rm) vals.push(...getRangeValues(rm[1], rm[2], data, visited));
    else vals.push(resolveArg(arg, data, visited));
  }
  return vals;
};

// Helper: evaluate a criteria string like ">10", "<=5", "<>abc", "abc"
const matchesCriteria = (value: string, criteria: string): boolean => {
  const num = parseFloat(value);
  // Comparison operators
  for (const op of ['>=', '<=', '<>', '!=', '>', '<', '=']) {
    if (criteria.startsWith(op)) {
      const cVal = criteria.substring(op.length).trim().replace(/^"|"$/g, '');
      const cNum = parseFloat(cVal);
      const isNum = !isNaN(num) && !isNaN(cNum);
      switch (op) {
        case '>=': return isNum ? num >= cNum : value >= cVal;
        case '<=': return isNum ? num <= cNum : value <= cVal;
        case '<>': case '!=': return value !== cVal;
        case '>': return isNum ? num > cNum : value > cVal;
        case '<': return isNum ? num < cNum : value < cVal;
        case '=': return value === cVal || (isNum && num === cNum);
      }
    }
  }
  // Wildcard support
  if (criteria.includes('*') || criteria.includes('?')) {
    const regex = new RegExp('^' + criteria.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    return regex.test(value);
  }
  return value === criteria || (parseFloat(value) === parseFloat(criteria) && !isNaN(parseFloat(criteria)));
};

// =====================================================
// FORMULA IMPLEMENTATIONS
// =====================================================

const formulas: Record<string, (args: string[], data: SheetData, visited: Set<string>) => string> = {
  // --- MATH ---
  SUM: (args, d, v) => getAllNums(args, d, v).reduce((a, b) => a + b, 0).toString(),
  AVERAGE: (args, d, v) => { const n = getAllNums(args, d, v); return n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(2) : '0'; },
  COUNT: (args, d, v) => getAllNums(args, d, v).length.toString(),
  COUNTA: (args, d, v) => getAllValues(args, d, v).filter(x => x.trim() !== '').length.toString(),
  COUNTBLANK: (args, d, v) => getAllValues(args, d, v).filter(x => x.trim() === '').length.toString(),
  MAX: (args, d, v) => { const n = getAllNums(args, d, v); return n.length ? Math.max(...n).toString() : '0'; },
  MIN: (args, d, v) => { const n = getAllNums(args, d, v); return n.length ? Math.min(...n).toString() : '0'; },
  ABS: (args, d, v) => Math.abs(resolveNum(args[0], d, v)).toString(),
  ROUND: (args, d, v) => { const n = resolveNum(args[0], d, v); const p = args[1] ? resolveNum(args[1], d, v) : 0; return n.toFixed(p); },
  ROUNDUP: (args, d, v) => { const n = resolveNum(args[0], d, v); const p = args[1] ? resolveNum(args[1], d, v) : 0; const f = Math.pow(10, p); return (Math.ceil(n * f) / f).toFixed(p); },
  ROUNDDOWN: (args, d, v) => { const n = resolveNum(args[0], d, v); const p = args[1] ? resolveNum(args[1], d, v) : 0; const f = Math.pow(10, p); return (Math.floor(n * f) / f).toFixed(p); },
  CEILING: (args, d, v) => { const n = resolveNum(args[0], d, v); const s = args[1] ? resolveNum(args[1], d, v) : 1; return (Math.ceil(n / s) * s).toString(); },
  FLOOR: (args, d, v) => { const n = resolveNum(args[0], d, v); const s = args[1] ? resolveNum(args[1], d, v) : 1; return (Math.floor(n / s) * s).toString(); },
  INT: (args, d, v) => Math.floor(resolveNum(args[0], d, v)).toString(),
  MOD: (args, d, v) => (resolveNum(args[0], d, v) % resolveNum(args[1], d, v)).toString(),
  POWER: (args, d, v) => Math.pow(resolveNum(args[0], d, v), resolveNum(args[1], d, v)).toString(),
  SQRT: (args, d, v) => Math.sqrt(resolveNum(args[0], d, v)).toString(),
  LOG: (args, d, v) => { const n = resolveNum(args[0], d, v); const b = args[1] ? resolveNum(args[1], d, v) : 10; return (Math.log(n) / Math.log(b)).toFixed(4); },
  LOG10: (args, d, v) => Math.log10(resolveNum(args[0], d, v)).toFixed(4),
  LN: (args, d, v) => Math.log(resolveNum(args[0], d, v)).toFixed(4),
  EXP: (args, d, v) => Math.exp(resolveNum(args[0], d, v)).toString(),
  PI: () => Math.PI.toString(),
  RAND: () => Math.random().toFixed(4),
  RANDBETWEEN: (args, d, v) => { const lo = resolveNum(args[0], d, v); const hi = resolveNum(args[1], d, v); return (Math.floor(Math.random() * (hi - lo + 1)) + lo).toString(); },
  SIGN: (args, d, v) => Math.sign(resolveNum(args[0], d, v)).toString(),
  PRODUCT: (args, d, v) => getAllNums(args, d, v).reduce((a, b) => a * b, 1).toString(),
  SUMPRODUCT: (args, d, v) => {
    if (args.length < 2) return '#ERROR';
    const r1 = args[0].match(RANGE_RE); const r2 = args[1].match(RANGE_RE);
    if (!r1 || !r2) return '#ERROR';
    const n1 = getRangeNums(r1[1], r1[2], d, v); const n2 = getRangeNums(r2[1], r2[2], d, v);
    let s = 0; for (let i = 0; i < Math.min(n1.length, n2.length); i++) s += n1[i] * n2[i];
    return s.toString();
  },
  SUMSQ: (args, d, v) => getAllNums(args, d, v).reduce((a, b) => a + b * b, 0).toString(),
  TRUNC: (args, d, v) => { const n = resolveNum(args[0], d, v); const p = args[1] ? resolveNum(args[1], d, v) : 0; const f = Math.pow(10, p); return (Math.trunc(n * f) / f).toString(); },
  GCD: (args, d, v) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const nums = getAllNums(args, d, v).map(Math.abs).map(Math.round);
    return nums.reduce((a, b) => gcd(a, b)).toString();
  },
  LCM: (args, d, v) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
    const nums = getAllNums(args, d, v).map(Math.abs).map(Math.round);
    return nums.reduce((a, b) => lcm(a, b)).toString();
  },
  FACT: (args, d, v) => {
    const n = Math.round(resolveNum(args[0], d, v));
    if (n < 0 || n > 170) return '#ERROR';
    let r = 1; for (let i = 2; i <= n; i++) r *= i;
    return r.toString();
  },
  COMBIN: (args, d, v) => {
    const n = Math.round(resolveNum(args[0], d, v));
    const k = Math.round(resolveNum(args[1], d, v));
    if (k > n || k < 0) return '#ERROR';
    let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return Math.round(r).toString();
  },
  PERMUT: (args, d, v) => {
    const n = Math.round(resolveNum(args[0], d, v));
    const k = Math.round(resolveNum(args[1], d, v));
    if (k > n || k < 0) return '#ERROR';
    let r = 1; for (let i = 0; i < k; i++) r *= (n - i);
    return r.toString();
  },
  QUOTIENT: (args, d, v) => Math.trunc(resolveNum(args[0], d, v) / resolveNum(args[1], d, v)).toString(),
  MROUND: (args, d, v) => {
    const n = resolveNum(args[0], d, v); const m = resolveNum(args[1], d, v);
    return (Math.round(n / m) * m).toString();
  },
  EVEN: (args, d, v) => { const n = resolveNum(args[0], d, v); const c = Math.ceil(Math.abs(n)); return (c % 2 === 0 ? c : c + 1).toString(); },
  ODD: (args, d, v) => { const n = resolveNum(args[0], d, v); const c = Math.ceil(Math.abs(n)); return (c % 2 === 1 ? c : c + 1).toString(); },
  ROMAN: (args, d, v) => {
    let n = Math.round(resolveNum(args[0], d, v));
    if (n <= 0 || n > 3999) return '#ERROR';
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let r = '';
    for (let i = 0; i < vals.length; i++) { while (n >= vals[i]) { r += syms[i]; n -= vals[i]; } }
    return r;
  },

  // --- STATISTICS ---
  MEDIAN: (args, d, v) => {
    const n = getAllNums(args, d, v).sort((a, b) => a - b);
    if (!n.length) return '0';
    const m = Math.floor(n.length / 2);
    return (n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2).toString();
  },
  MODE: (args, d, v) => {
    const n = getAllNums(args, d, v); const freq: Record<number, number> = {};
    n.forEach(x => freq[x] = (freq[x] || 0) + 1);
    let max = 0, mode = 0;
    Object.entries(freq).forEach(([k, v2]) => { if (v2 > max) { max = v2; mode = parseFloat(k); } });
    return mode.toString();
  },
  STDEV: (args, d, v) => {
    const n = getAllNums(args, d, v); if (n.length < 2) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return Math.sqrt(n.reduce((s, x) => s + (x - avg) ** 2, 0) / (n.length - 1)).toFixed(4);
  },
  STDEVP: (args, d, v) => {
    const n = getAllNums(args, d, v); if (!n.length) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return Math.sqrt(n.reduce((s, x) => s + (x - avg) ** 2, 0) / n.length).toFixed(4);
  },
  VAR: (args, d, v) => {
    const n = getAllNums(args, d, v); if (n.length < 2) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return (n.reduce((s, x) => s + (x - avg) ** 2, 0) / (n.length - 1)).toFixed(4);
  },
  VARP: (args, d, v) => {
    const n = getAllNums(args, d, v); if (!n.length) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return (n.reduce((s, x) => s + (x - avg) ** 2, 0) / n.length).toFixed(4);
  },
  LARGE: (args, d, v) => {
    const rm = args[0].match(RANGE_RE); if (!rm) return '#ERROR';
    const n = getRangeNums(rm[1], rm[2], d, v).sort((a, b) => b - a);
    const k = resolveNum(args[1], d, v);
    return k > 0 && k <= n.length ? n[k - 1].toString() : '#ERROR';
  },
  SMALL: (args, d, v) => {
    const rm = args[0].match(RANGE_RE); if (!rm) return '#ERROR';
    const n = getRangeNums(rm[1], rm[2], d, v).sort((a, b) => a - b);
    const k = resolveNum(args[1], d, v);
    return k > 0 && k <= n.length ? n[k - 1].toString() : '#ERROR';
  },
  PERCENTILE: (args, d, v) => {
    const rm = args[0].match(RANGE_RE); if (!rm) return '#ERROR';
    const n = getRangeNums(rm[1], rm[2], d, v).sort((a, b) => a - b);
    const p = resolveNum(args[1], d, v);
    const idx = p * (n.length - 1);
    const lo = Math.floor(idx); const hi = Math.ceil(idx);
    return lo === hi ? n[lo].toString() : (n[lo] + (n[hi] - n[lo]) * (idx - lo)).toFixed(2);
  },
  RANK: (args, d, v) => {
    const val = resolveNum(args[0], d, v);
    const rm = args[1].match(RANGE_RE); if (!rm) return '#ERROR';
    const nums = getRangeNums(rm[1], rm[2], d, v);
    const order = args[2] ? resolveNum(args[2], d, v) : 0; // 0=desc, 1=asc
    const sorted = [...nums].sort((a, b) => order ? a - b : b - a);
    const rank = sorted.indexOf(val);
    return rank >= 0 ? (rank + 1).toString() : '#N/A';
  },
  FREQUENCY: (args, d, v) => {
    const rm1 = args[0].match(RANGE_RE); if (!rm1) return '#ERROR';
    const data_arr = getRangeNums(rm1[1], rm1[2], d, v);
    const rm2 = args[1].match(RANGE_RE);
    const bins = rm2 ? getRangeNums(rm2[1], rm2[2], d, v).sort((a, b) => a - b) : [resolveNum(args[1], d, v)];
    const freq = new Array(bins.length + 1).fill(0);
    data_arr.forEach(x => {
      let placed = false;
      for (let i = 0; i < bins.length; i++) {
        if (x <= bins[i]) { freq[i]++; placed = true; break; }
      }
      if (!placed) freq[bins.length]++;
    });
    return freq.join(',');
  },
  CORREL: (args, d, v) => {
    const r1 = args[0].match(RANGE_RE); const r2 = args[1].match(RANGE_RE);
    if (!r1 || !r2) return '#ERROR';
    const x = getRangeNums(r1[1], r1[2], d, v);
    const y = getRangeNums(r2[1], r2[2], d, v);
    const n = Math.min(x.length, y.length);
    if (n < 2) return '#ERROR';
    const mx = x.slice(0, n).reduce((a, b) => a + b) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b) / n;
    let sxy = 0, sx2 = 0, sy2 = 0;
    for (let i = 0; i < n; i++) {
      sxy += (x[i] - mx) * (y[i] - my);
      sx2 += (x[i] - mx) ** 2;
      sy2 += (y[i] - my) ** 2;
    }
    return (sxy / Math.sqrt(sx2 * sy2)).toFixed(4);
  },
  SLOPE: (args, d, v) => {
    const r1 = args[0].match(RANGE_RE); const r2 = args[1].match(RANGE_RE);
    if (!r1 || !r2) return '#ERROR';
    const y = getRangeNums(r1[1], r1[2], d, v);
    const x = getRangeNums(r2[1], r2[2], d, v);
    const n = Math.min(x.length, y.length);
    if (n < 2) return '#ERROR';
    const mx = x.slice(0, n).reduce((a, b) => a + b) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b) / n;
    let sxy = 0, sx2 = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx2 += (x[i] - mx) ** 2; }
    return (sxy / sx2).toFixed(4);
  },
  INTERCEPT: (args, d, v) => {
    const r1 = args[0].match(RANGE_RE); const r2 = args[1].match(RANGE_RE);
    if (!r1 || !r2) return '#ERROR';
    const y = getRangeNums(r1[1], r1[2], d, v);
    const x = getRangeNums(r2[1], r2[2], d, v);
    const n = Math.min(x.length, y.length);
    if (n < 2) return '#ERROR';
    const mx = x.slice(0, n).reduce((a, b) => a + b) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b) / n;
    let sxy = 0, sx2 = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx2 += (x[i] - mx) ** 2; }
    const slope = sxy / sx2;
    return (my - slope * mx).toFixed(4);
  },
  FORECAST: (args, d, v) => {
    const xVal = resolveNum(args[0], d, v);
    const r1 = args[1].match(RANGE_RE); const r2 = args[2].match(RANGE_RE);
    if (!r1 || !r2) return '#ERROR';
    const y = getRangeNums(r1[1], r1[2], d, v);
    const x = getRangeNums(r2[1], r2[2], d, v);
    const n = Math.min(x.length, y.length);
    if (n < 2) return '#ERROR';
    const mx = x.slice(0, n).reduce((a, b) => a + b) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b) / n;
    let sxy = 0, sx2 = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx2 += (x[i] - mx) ** 2; }
    const slope = sxy / sx2;
    const intercept = my - slope * mx;
    return (intercept + slope * xVal).toFixed(4);
  },
  GEOMEAN: (args, d, v) => {
    const n = getAllNums(args, d, v).filter(x => x > 0);
    if (!n.length) return '#ERROR';
    return Math.pow(n.reduce((a, b) => a * b, 1), 1 / n.length).toFixed(4);
  },
  HARMEAN: (args, d, v) => {
    const n = getAllNums(args, d, v).filter(x => x > 0);
    if (!n.length) return '#ERROR';
    return (n.length / n.reduce((a, b) => a + 1 / b, 0)).toFixed(4);
  },
  DEVSQ: (args, d, v) => {
    const n = getAllNums(args, d, v);
    if (!n.length) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return n.reduce((s, x) => s + (x - avg) ** 2, 0).toFixed(4);
  },
  AVEDEV: (args, d, v) => {
    const n = getAllNums(args, d, v);
    if (!n.length) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return (n.reduce((s, x) => s + Math.abs(x - avg), 0) / n.length).toFixed(4);
  },
  KURT: (args, d, v) => {
    const n = getAllNums(args, d, v); if (n.length < 4) return '#ERROR';
    const avg = n.reduce((a, b) => a + b) / n.length;
    const s = Math.sqrt(n.reduce((a, b) => a + (b - avg) ** 2, 0) / (n.length - 1));
    const k = n.reduce((a, b) => a + ((b - avg) / s) ** 4, 0);
    const nn = n.length;
    return (((nn * (nn + 1)) / ((nn - 1) * (nn - 2) * (nn - 3))) * k - (3 * (nn - 1) ** 2) / ((nn - 2) * (nn - 3))).toFixed(4);
  },
  SKEW: (args, d, v) => {
    const n = getAllNums(args, d, v); if (n.length < 3) return '#ERROR';
    const avg = n.reduce((a, b) => a + b) / n.length;
    const s = Math.sqrt(n.reduce((a, b) => a + (b - avg) ** 2, 0) / (n.length - 1));
    const nn = n.length;
    return ((nn / ((nn - 1) * (nn - 2))) * n.reduce((a, b) => a + ((b - avg) / s) ** 3, 0)).toFixed(4);
  },

  // --- LOGIC ---
  IF: (args, d, v) => {
    const cond = resolveArg(args[0], d, v);
    let boolVal = false;
    for (const op of ['>=', '<=', '<>', '!=', '=', '>', '<']) {
      const parts = args[0].split(op);
      if (parts.length === 2) {
        const l = resolveArg(parts[0].trim(), d, v);
        const r = resolveArg(parts[1].trim(), d, v);
        const ln = parseFloat(l), rn = parseFloat(r);
        const isNum = !isNaN(ln) && !isNaN(rn);
        switch (op) {
          case '>=': boolVal = isNum ? ln >= rn : l >= r; break;
          case '<=': boolVal = isNum ? ln <= rn : l <= r; break;
          case '<>': case '!=': boolVal = l !== r; break;
          case '=': boolVal = l === r; break;
          case '>': boolVal = isNum ? ln > rn : l > r; break;
          case '<': boolVal = isNum ? ln < rn : l < r; break;
        }
        return boolVal ? resolveArg(args[1], d, v) : resolveArg(args[2] || '""', d, v);
      }
    }
    boolVal = cond !== '0' && cond !== '' && cond.toUpperCase() !== 'FALSE';
    return boolVal ? resolveArg(args[1], d, v) : resolveArg(args[2] || '', d, v);
  },
  IFS: (args, d, v) => {
    for (let i = 0; i < args.length - 1; i += 2) {
      const condStr = args[i];
      let boolVal = false;
      for (const op of ['>=', '<=', '<>', '!=', '=', '>', '<']) {
        const parts = condStr.split(op);
        if (parts.length === 2) {
          const l = resolveArg(parts[0].trim(), d, v);
          const r = resolveArg(parts[1].trim(), d, v);
          const ln = parseFloat(l), rn = parseFloat(r);
          const isNum = !isNaN(ln) && !isNaN(rn);
          switch (op) {
            case '>=': boolVal = isNum ? ln >= rn : l >= r; break;
            case '<=': boolVal = isNum ? ln <= rn : l <= r; break;
            case '<>': case '!=': boolVal = l !== r; break;
            case '=': boolVal = l === r; break;
            case '>': boolVal = isNum ? ln > rn : l > r; break;
            case '<': boolVal = isNum ? ln < rn : l < r; break;
          }
          break;
        }
      }
      if (!boolVal) {
        const val = resolveArg(condStr, d, v);
        boolVal = val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE' && val.toUpperCase() !== 'TRUE' ? false : val.toUpperCase() === 'TRUE';
        if (val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE') boolVal = true;
      }
      if (boolVal) return resolveArg(args[i + 1], d, v);
    }
    return '#N/A';
  },
  AND: (args, d, v) => {
    const all = args.every(a => { const val = resolveArg(a, d, v); return val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE'; });
    return all ? 'TRUE' : 'FALSE';
  },
  OR: (args, d, v) => {
    const any = args.some(a => { const val = resolveArg(a, d, v); return val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE'; });
    return any ? 'TRUE' : 'FALSE';
  },
  XOR: (args, d, v) => {
    let count = 0;
    args.forEach(a => { const val = resolveArg(a, d, v); if (val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE') count++; });
    return count % 2 === 1 ? 'TRUE' : 'FALSE';
  },
  NOT: (args, d, v) => {
    const val = resolveArg(args[0], d, v);
    return (val === '0' || val === '' || val.toUpperCase() === 'FALSE') ? 'TRUE' : 'FALSE';
  },
  IFERROR: (args, d, v) => {
    try {
      const result = resolveArg(args[0], d, v);
      return result.startsWith('#') ? resolveArg(args[1], d, v) : result;
    } catch { return resolveArg(args[1], d, v); }
  },
  IFNA: (args, d, v) => {
    try {
      const result = resolveArg(args[0], d, v);
      return result === '#N/A' ? resolveArg(args[1], d, v) : result;
    } catch { return resolveArg(args[1], d, v); }
  },
  SWITCH: (args, d, v) => {
    const expr = resolveArg(args[0], d, v);
    for (let i = 1; i < args.length - 1; i += 2) {
      if (resolveArg(args[i], d, v) === expr) return resolveArg(args[i + 1], d, v);
    }
    return args.length % 2 === 0 ? resolveArg(args[args.length - 1], d, v) : '';
  },
  CHOOSE: (args, d, v) => {
    const idx = Math.round(resolveNum(args[0], d, v));
    if (idx < 1 || idx >= args.length) return '#ERROR';
    return resolveArg(args[idx], d, v);
  },
  TRUE: () => 'TRUE',
  FALSE: () => 'FALSE',

  // --- TEXT ---
  CONCATENATE: (args, d, v) => args.map(a => resolveArg(a, d, v)).join(''),
  CONCAT: (args, d, v) => args.map(a => resolveArg(a, d, v)).join(''),
  TEXTJOIN: (args, d, v) => {
    const delim = resolveArg(args[0], d, v);
    const ignoreEmpty = resolveArg(args[1], d, v).toUpperCase() === 'TRUE';
    const values = args.slice(2).map(a => {
      const rm = a.match(RANGE_RE);
      if (rm) return getRangeValues(rm[1], rm[2], d, v);
      return [resolveArg(a, d, v)];
    }).flat();
    return (ignoreEmpty ? values.filter(x => x !== '') : values).join(delim);
  },
  LEFT: (args, d, v) => resolveArg(args[0], d, v).substring(0, resolveNum(args[1] || '1', d, v)),
  RIGHT: (args, d, v) => { const s = resolveArg(args[0], d, v); const n = resolveNum(args[1] || '1', d, v); return s.substring(s.length - n); },
  MID: (args, d, v) => resolveArg(args[0], d, v).substring(resolveNum(args[1], d, v) - 1, resolveNum(args[1], d, v) - 1 + resolveNum(args[2], d, v)),
  LEN: (args, d, v) => resolveArg(args[0], d, v).length.toString(),
  UPPER: (args, d, v) => resolveArg(args[0], d, v).toUpperCase(),
  LOWER: (args, d, v) => resolveArg(args[0], d, v).toLowerCase(),
  PROPER: (args, d, v) => resolveArg(args[0], d, v).replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase()),
  TRIM: (args, d, v) => resolveArg(args[0], d, v).trim(),
  CLEAN: (args, d, v) => resolveArg(args[0], d, v).replace(/[\x00-\x1F\x7F]/g, ''),
  SUBSTITUTE: (args, d, v) => {
    const text = resolveArg(args[0], d, v);
    const old = resolveArg(args[1], d, v);
    const rep = resolveArg(args[2], d, v);
    if (args[3]) {
      const instance = resolveNum(args[3], d, v);
      let count = 0;
      return text.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
        count++;
        return count === instance ? rep : match;
      });
    }
    return text.split(old).join(rep);
  },
  REPLACE: (args, d, v) => {
    const text = resolveArg(args[0], d, v);
    const start = resolveNum(args[1], d, v) - 1;
    const num = resolveNum(args[2], d, v);
    const rep = resolveArg(args[3], d, v);
    return text.substring(0, start) + rep + text.substring(start + num);
  },
  FIND: (args, d, v) => {
    const needle = resolveArg(args[0], d, v);
    const haystack = resolveArg(args[1], d, v);
    const start = args[2] ? resolveNum(args[2], d, v) - 1 : 0;
    const idx = haystack.indexOf(needle, start);
    return idx >= 0 ? (idx + 1).toString() : '#VALUE!';
  },
  SEARCH: (args, d, v) => {
    const needle = resolveArg(args[0], d, v).toLowerCase();
    const haystack = resolveArg(args[1], d, v).toLowerCase();
    const start = args[2] ? resolveNum(args[2], d, v) - 1 : 0;
    const idx = haystack.indexOf(needle, start);
    return idx >= 0 ? (idx + 1).toString() : '#VALUE!';
  },
  REPT: (args, d, v) => resolveArg(args[0], d, v).repeat(resolveNum(args[1], d, v)),
  TEXT: (args, d, v) => {
    const n = resolveNum(args[0], d, v);
    const fmt = resolveArg(args[1], d, v);
    if (fmt.includes('%')) return (n * 100).toFixed(fmt.split('.')[1]?.length || 0) + '%';
    if (fmt.includes('.')) { const dec = fmt.split('.')[1]?.length || 2; return n.toFixed(dec); }
    return n.toString();
  },
  FIXED: (args, d, v) => {
    const n = resolveNum(args[0], d, v);
    const dec = args[1] ? resolveNum(args[1], d, v) : 2;
    const noComma = args[2] ? resolveArg(args[2], d, v).toUpperCase() === 'TRUE' : false;
    const fixed = n.toFixed(dec);
    if (noComma) return fixed;
    return parseFloat(fixed).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  },
  VALUE: (args, d, v) => { const n = parseFloat(resolveArg(args[0], d, v).replace(/[^\d.-]/g, '')); return isNaN(n) ? '#VALUE!' : n.toString(); },
  EXACT: (args, d, v) => (resolveArg(args[0], d, v) === resolveArg(args[1], d, v) ? 'TRUE' : 'FALSE'),
  CHAR: (args, d, v) => String.fromCharCode(resolveNum(args[0], d, v)),
  CODE: (args, d, v) => resolveArg(args[0], d, v).charCodeAt(0).toString(),
  NUMBERVALUE: (args, d, v) => {
    let text = resolveArg(args[0], d, v);
    const decSep = args[1] ? resolveArg(args[1], d, v) : '.';
    text = text.replace(new RegExp(`[^\\d${decSep}-]`, 'g'), '').replace(decSep, '.');
    const n = parseFloat(text);
    return isNaN(n) ? '#VALUE!' : n.toString();
  },
  DOLLAR: (args, d, v) => {
    const n = resolveNum(args[0], d, v);
    const dec = args[1] ? resolveNum(args[1], d, v) : 2;
    return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec });
  },
  T: (args, d, v) => { const val = resolveArg(args[0], d, v); return isNaN(parseFloat(val)) ? val : ''; },
  N: (args, d, v) => { const val = resolveArg(args[0], d, v); const n = parseFloat(val); return isNaN(n) ? '0' : n.toString(); },

  // --- LOOKUP ---
  VLOOKUP: (args, d, v) => {
    const searchVal = resolveArg(args[0], d, v);
    const rm = args[1].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const colIdx = resolveNum(args[2], d, v) - 1;
    const exact = args[3] ? resolveArg(args[3], d, v).toUpperCase() === 'FALSE' || resolveArg(args[3], d, v) === '0' : false;
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    let lastMatch: string | null = null;
    for (let r = start[0]; r <= end[0]; r++) {
      const key = cellKey(r, start[1]);
      const val = getCellValue(key, d, new Set(v));
      if (val === searchVal || (parseFloat(val) === parseFloat(searchVal) && !isNaN(parseFloat(searchVal)))) {
        return getCellValue(cellKey(r, start[1] + colIdx), d, new Set(v));
      }
      if (!exact && parseFloat(val) <= parseFloat(searchVal)) {
        lastMatch = getCellValue(cellKey(r, start[1] + colIdx), d, new Set(v));
      }
    }
    return exact ? '#N/A' : (lastMatch || '#N/A');
  },
  HLOOKUP: (args, d, v) => {
    const searchVal = resolveArg(args[0], d, v);
    const rm = args[1].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const rowIdx = resolveNum(args[2], d, v) - 1;
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    for (let c = start[1]; c <= end[1]; c++) {
      const key = cellKey(start[0], c);
      const val = getCellValue(key, d, new Set(v));
      if (val === searchVal) return getCellValue(cellKey(start[0] + rowIdx, c), d, new Set(v));
    }
    return '#N/A';
  },
  XLOOKUP: (args, d, v) => {
    const searchVal = resolveArg(args[0], d, v);
    const rm1 = args[1].match(RANGE_RE); const rm2 = args[2].match(RANGE_RE);
    if (!rm1 || !rm2) return '#ERROR';
    const lookupVals = getRangeValues(rm1[1], rm1[2], d, v);
    const returnVals = getRangeValues(rm2[1], rm2[2], d, v);
    const notFound = args[3] ? resolveArg(args[3], d, v) : '#N/A';
    const matchMode = args[4] ? resolveNum(args[4], d, v) : 0;
    for (let i = 0; i < lookupVals.length; i++) {
      if (matchMode === 0 && lookupVals[i] === searchVal) return returnVals[i] || '';
      if (matchMode === 2 && lookupVals[i].toLowerCase().includes(searchVal.toLowerCase())) return returnVals[i] || '';
      if (matchMode === 0 && parseFloat(lookupVals[i]) === parseFloat(searchVal) && !isNaN(parseFloat(searchVal))) return returnVals[i] || '';
    }
    return notFound;
  },
  INDEX: (args, d, v) => {
    const rm = args[0].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const start = parseCellRef(rm[1]);
    if (!start) return '#ERROR';
    const row = resolveNum(args[1], d, v) - 1;
    const col = args[2] ? resolveNum(args[2], d, v) - 1 : 0;
    return getCellValue(cellKey(start[0] + row, start[1] + col), d, new Set(v));
  },
  MATCH: (args, d, v) => {
    const searchVal = resolveArg(args[0], d, v);
    const rm = args[1].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    const matchType = args[2] ? resolveNum(args[2], d, v) : 1;
    const isRow = start[0] === end[0];
    if (isRow) {
      for (let c = start[1]; c <= end[1]; c++) {
        const val = getCellValue(cellKey(start[0], c), d, new Set(v));
        if (matchType === 0 && (val === searchVal || val.toLowerCase() === searchVal.toLowerCase())) return (c - start[1] + 1).toString();
        if (matchType === 0 && parseFloat(val) === parseFloat(searchVal) && !isNaN(parseFloat(searchVal))) return (c - start[1] + 1).toString();
      }
    } else {
      for (let r = start[0]; r <= end[0]; r++) {
        const val = getCellValue(cellKey(r, start[1]), d, new Set(v));
        if (matchType === 0 && (val === searchVal || val.toLowerCase() === searchVal.toLowerCase())) return (r - start[0] + 1).toString();
        if (matchType === 0 && parseFloat(val) === parseFloat(searchVal) && !isNaN(parseFloat(searchVal))) return (r - start[0] + 1).toString();
      }
    }
    return '#N/A';
  },
  LOOKUP: (args, d, v) => formulas.VLOOKUP(args, d, v),
  INDIRECT: (args, d, v) => {
    const ref = resolveArg(args[0], d, v).replace(/\$/g, '');
    return getCellValue(ref, d, new Set(v));
  },
  OFFSET: (args, d, v) => {
    const rm = args[0].match(/^(\$?[A-Z]+\$?\d+)$/);
    if (!rm) return '#ERROR';
    const base = parseCellRef(rm[1].replace(/\$/g, ''));
    if (!base) return '#ERROR';
    const rowOff = resolveNum(args[1], d, v);
    const colOff = resolveNum(args[2], d, v);
    return getCellValue(cellKey(base[0] + rowOff, base[1] + colOff), d, new Set(v));
  },
  ROW: (args, d, v) => {
    if (!args.length) return '1';
    const ref = parseCellRef(args[0].replace(/\$/g, ''));
    return ref ? (ref[0] + 1).toString() : '#ERROR';
  },
  COLUMN: (args, d, v) => {
    if (!args.length) return '1';
    const ref = parseCellRef(args[0].replace(/\$/g, ''));
    return ref ? (ref[1] + 1).toString() : '#ERROR';
  },
  ROWS: (args, d, v) => {
    const rm = args[0].match(RANGE_RE); if (!rm) return '1';
    const s = parseCellRef(rm[1]); const e = parseCellRef(rm[2]);
    if (!s || !e) return '#ERROR';
    return (Math.abs(e[0] - s[0]) + 1).toString();
  },
  COLUMNS: (args, d, v) => {
    const rm = args[0].match(RANGE_RE); if (!rm) return '1';
    const s = parseCellRef(rm[1]); const e = parseCellRef(rm[2]);
    if (!s || !e) return '#ERROR';
    return (Math.abs(e[1] - s[1]) + 1).toString();
  },
  ADDRESS: (args, d, v) => {
    const row = resolveNum(args[0], d, v);
    const col = resolveNum(args[1], d, v);
    const absType = args[2] ? resolveNum(args[2], d, v) : 1;
    const c = colLetter(col - 1);
    switch (absType) {
      case 1: return `$${c}$${row}`;
      case 2: return `${c}$${row}`;
      case 3: return `$${c}${row}`;
      default: return `${c}${row}`;
    }
  },

  // --- CONDITIONAL ---
  COUNTIF: (args, d, v) => {
    const rm = args[0].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const criteria = resolveArg(args[1], d, v);
    const vals = getRangeValues(rm[1], rm[2], d, v);
    return vals.filter(x => matchesCriteria(x, criteria)).length.toString();
  },
  COUNTIFS: (args, d, v) => {
    if (args.length < 2 || args.length % 2 !== 0) return '#ERROR';
    const rm0 = args[0].match(RANGE_RE); if (!rm0) return '#ERROR';
    const s = parseCellRef(rm0[1]); const e = parseCellRef(rm0[2]);
    if (!s || !e) return '#ERROR';
    const numRows = e[0] - s[0] + 1;
    let count = 0;
    for (let idx = 0; idx < numRows; idx++) {
      let allMatch = true;
      for (let p = 0; p < args.length; p += 2) {
        const rm = args[p].match(RANGE_RE); if (!rm) { allMatch = false; break; }
        const ps = parseCellRef(rm[1]); if (!ps) { allMatch = false; break; }
        const criteria = resolveArg(args[p + 1], d, v);
        const val = getCellValue(cellKey(ps[0] + idx, ps[1]), d, new Set(v));
        if (!matchesCriteria(val, criteria)) { allMatch = false; break; }
      }
      if (allMatch) count++;
    }
    return count.toString();
  },
  SUMIF: (args, d, v) => {
    const rm = args[0].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const criteria = resolveArg(args[1], d, v);
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    const sumRm = args[2]?.match(RANGE_RE);
    const sumStart = sumRm ? parseCellRef(sumRm[1]) : start;
    if (!sumStart) return '#ERROR';
    let sum = 0, idx = 0;
    for (let r = start[0]; r <= end[0]; r++) {
      for (let c = start[1]; c <= end[1]; c++) {
        const val = getCellValue(cellKey(r, c), d, new Set(v));
        if (matchesCriteria(val, criteria)) {
          if (sumRm) {
            const sKey = cellKey(sumStart[0] + idx, sumStart[1]);
            const sVal = parseFloat(getCellValue(sKey, d, new Set(v)));
            if (!isNaN(sVal)) sum += sVal;
          } else {
            const n = parseFloat(val);
            if (!isNaN(n)) sum += n;
          }
        }
        idx++;
      }
    }
    return sum.toString();
  },
  SUMIFS: (args, d, v) => {
    if (args.length < 3 || args.length % 2 !== 1) return '#ERROR';
    const sumRm = args[0].match(RANGE_RE); if (!sumRm) return '#ERROR';
    const sumStart = parseCellRef(sumRm[1]); const sumEnd = parseCellRef(sumRm[2]);
    if (!sumStart || !sumEnd) return '#ERROR';
    const numRows = sumEnd[0] - sumStart[0] + 1;
    let sum = 0;
    for (let idx = 0; idx < numRows; idx++) {
      let allMatch = true;
      for (let p = 1; p < args.length; p += 2) {
        const rm = args[p].match(RANGE_RE); if (!rm) { allMatch = false; break; }
        const ps = parseCellRef(rm[1]); if (!ps) { allMatch = false; break; }
        const criteria = resolveArg(args[p + 1], d, v);
        const val = getCellValue(cellKey(ps[0] + idx, ps[1]), d, new Set(v));
        if (!matchesCriteria(val, criteria)) { allMatch = false; break; }
      }
      if (allMatch) {
        const n = parseFloat(getCellValue(cellKey(sumStart[0] + idx, sumStart[1]), d, new Set(v)));
        if (!isNaN(n)) sum += n;
      }
    }
    return sum.toString();
  },
  AVERAGEIF: (args, d, v) => {
    const rm = args[0].match(RANGE_RE); if (!rm) return '#ERROR';
    const criteria = resolveArg(args[1], d, v);
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    const avgRm = args[2]?.match(RANGE_RE);
    const avgStart = avgRm ? parseCellRef(avgRm[1]) : start;
    if (!avgStart) return '#ERROR';
    let sum = 0, count = 0, idx = 0;
    for (let r = start[0]; r <= end[0]; r++) {
      const val = getCellValue(cellKey(r, start[1]), d, new Set(v));
      if (matchesCriteria(val, criteria)) {
        const n = avgRm
          ? parseFloat(getCellValue(cellKey(avgStart[0] + idx, avgStart[1]), d, new Set(v)))
          : parseFloat(val);
        if (!isNaN(n)) { sum += n; count++; }
      }
      idx++;
    }
    return count ? (sum / count).toFixed(2) : '0';
  },
  AVERAGEIFS: (args, d, v) => {
    if (args.length < 3 || args.length % 2 !== 1) return '#ERROR';
    const avgRm = args[0].match(RANGE_RE); if (!avgRm) return '#ERROR';
    const avgStart = parseCellRef(avgRm[1]); const avgEnd = parseCellRef(avgRm[2]);
    if (!avgStart || !avgEnd) return '#ERROR';
    const numRows = avgEnd[0] - avgStart[0] + 1;
    let sum = 0, count = 0;
    for (let idx = 0; idx < numRows; idx++) {
      let allMatch = true;
      for (let p = 1; p < args.length; p += 2) {
        const rm = args[p].match(RANGE_RE); if (!rm) { allMatch = false; break; }
        const ps = parseCellRef(rm[1]); if (!ps) { allMatch = false; break; }
        const criteria = resolveArg(args[p + 1], d, v);
        const val = getCellValue(cellKey(ps[0] + idx, ps[1]), d, new Set(v));
        if (!matchesCriteria(val, criteria)) { allMatch = false; break; }
      }
      if (allMatch) {
        const n = parseFloat(getCellValue(cellKey(avgStart[0] + idx, avgStart[1]), d, new Set(v)));
        if (!isNaN(n)) { sum += n; count++; }
      }
    }
    return count ? (sum / count).toFixed(2) : '0';
  },
  MAXIFS: (args, d, v) => {
    if (args.length < 3 || args.length % 2 !== 1) return '#ERROR';
    const maxRm = args[0].match(RANGE_RE); if (!maxRm) return '#ERROR';
    const maxStart = parseCellRef(maxRm[1]); const maxEnd = parseCellRef(maxRm[2]);
    if (!maxStart || !maxEnd) return '#ERROR';
    const numRows = maxEnd[0] - maxStart[0] + 1;
    let result = -Infinity;
    for (let idx = 0; idx < numRows; idx++) {
      let allMatch = true;
      for (let p = 1; p < args.length; p += 2) {
        const rm = args[p].match(RANGE_RE); if (!rm) { allMatch = false; break; }
        const ps = parseCellRef(rm[1]); if (!ps) { allMatch = false; break; }
        const criteria = resolveArg(args[p + 1], d, v);
        const val = getCellValue(cellKey(ps[0] + idx, ps[1]), d, new Set(v));
        if (!matchesCriteria(val, criteria)) { allMatch = false; break; }
      }
      if (allMatch) {
        const n = parseFloat(getCellValue(cellKey(maxStart[0] + idx, maxStart[1]), d, new Set(v)));
        if (!isNaN(n) && n > result) result = n;
      }
    }
    return result === -Infinity ? '0' : result.toString();
  },
  MINIFS: (args, d, v) => {
    if (args.length < 3 || args.length % 2 !== 1) return '#ERROR';
    const minRm = args[0].match(RANGE_RE); if (!minRm) return '#ERROR';
    const minStart = parseCellRef(minRm[1]); const minEnd = parseCellRef(minRm[2]);
    if (!minStart || !minEnd) return '#ERROR';
    const numRows = minEnd[0] - minStart[0] + 1;
    let result = Infinity;
    for (let idx = 0; idx < numRows; idx++) {
      let allMatch = true;
      for (let p = 1; p < args.length; p += 2) {
        const rm = args[p].match(RANGE_RE); if (!rm) { allMatch = false; break; }
        const ps = parseCellRef(rm[1]); if (!ps) { allMatch = false; break; }
        const criteria = resolveArg(args[p + 1], d, v);
        const val = getCellValue(cellKey(ps[0] + idx, ps[1]), d, new Set(v));
        if (!matchesCriteria(val, criteria)) { allMatch = false; break; }
      }
      if (allMatch) {
        const n = parseFloat(getCellValue(cellKey(minStart[0] + idx, minStart[1]), d, new Set(v)));
        if (!isNaN(n) && n < result) result = n;
      }
    }
    return result === Infinity ? '0' : result.toString();
  },

  // --- UNIQUE / FILTER / SORT (array-like, returns comma-separated) ---
  UNIQUE: (args, d, v) => {
    const vals = getAllValues(args, d, v);
    return [...new Set(vals)].filter(x => x !== '').join(', ');
  },

  // --- DATE ---
  TODAY: () => new Date().toISOString().split('T')[0],
  NOW: () => new Date().toLocaleString('fr-FR'),
  YEAR: (args, d, v) => new Date(resolveArg(args[0], d, v)).getFullYear().toString(),
  MONTH: (args, d, v) => (new Date(resolveArg(args[0], d, v)).getMonth() + 1).toString(),
  DAY: (args, d, v) => new Date(resolveArg(args[0], d, v)).getDate().toString(),
  HOUR: (args, d, v) => new Date(resolveArg(args[0], d, v)).getHours().toString(),
  MINUTE: (args, d, v) => new Date(resolveArg(args[0], d, v)).getMinutes().toString(),
  SECOND: (args, d, v) => new Date(resolveArg(args[0], d, v)).getSeconds().toString(),
  DATE: (args, d, v) => new Date(resolveNum(args[0], d, v), resolveNum(args[1], d, v) - 1, resolveNum(args[2], d, v)).toISOString().split('T')[0],
  DATEDIF: (args, d, v) => {
    const d1 = new Date(resolveArg(args[0], d, v)); const d2 = new Date(resolveArg(args[1], d, v));
    const diff = Math.abs(d2.getTime() - d1.getTime());
    const unit = resolveArg(args[2], d, v).toUpperCase();
    if (unit === 'D') return Math.floor(diff / 86400000).toString();
    if (unit === 'M') return Math.floor(diff / (86400000 * 30)).toString();
    if (unit === 'Y') return Math.floor(diff / (86400000 * 365)).toString();
    return '#ERROR';
  },
  WEEKDAY: (args, d, v) => (new Date(resolveArg(args[0], d, v)).getDay() + 1).toString(),
  WEEKNUM: (args, d, v) => {
    const dt = new Date(resolveArg(args[0], d, v));
    const start = new Date(dt.getFullYear(), 0, 1);
    return Math.ceil(((dt.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7).toString();
  },
  EDATE: (args, d, v) => {
    const dt = new Date(resolveArg(args[0], d, v));
    dt.setMonth(dt.getMonth() + resolveNum(args[1], d, v));
    return dt.toISOString().split('T')[0];
  },
  EOMONTH: (args, d, v) => {
    const dt = new Date(resolveArg(args[0], d, v));
    dt.setMonth(dt.getMonth() + resolveNum(args[1], d, v) + 1, 0);
    return dt.toISOString().split('T')[0];
  },
  DAYS: (args, d, v) => {
    const d1 = new Date(resolveArg(args[0], d, v));
    const d2 = new Date(resolveArg(args[1], d, v));
    return Math.round((d1.getTime() - d2.getTime()) / 86400000).toString();
  },
  DAYS360: (args, d, v) => {
    const d1 = new Date(resolveArg(args[0], d, v));
    const d2 = new Date(resolveArg(args[1], d, v));
    const y1 = d1.getFullYear(), m1 = d1.getMonth(), day1 = Math.min(d1.getDate(), 30);
    const y2 = d2.getFullYear(), m2 = d2.getMonth(), day2 = Math.min(d2.getDate(), 30);
    return ((y2 - y1) * 360 + (m2 - m1) * 30 + (day2 - day1)).toString();
  },
  NETWORKDAYS: (args, d, v) => {
    const start = new Date(resolveArg(args[0], d, v));
    const end = new Date(resolveArg(args[1], d, v));
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count.toString();
  },
  WORKDAY: (args, d, v) => {
    const start = new Date(resolveArg(args[0], d, v));
    let days = resolveNum(args[1], d, v);
    const cur = new Date(start);
    while (days > 0) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) days--;
    }
    return cur.toISOString().split('T')[0];
  },
  DATEVALUE: (args, d, v) => {
    const dt = new Date(resolveArg(args[0], d, v));
    return isNaN(dt.getTime()) ? '#VALUE!' : Math.floor(dt.getTime() / 86400000 + 25569).toString();
  },
  TIMEVALUE: (args, d, v) => {
    const parts = resolveArg(args[0], d, v).split(':');
    if (parts.length < 2) return '#VALUE!';
    const h = parseInt(parts[0]); const m = parseInt(parts[1]); const s = parts[2] ? parseInt(parts[2]) : 0;
    return ((h * 3600 + m * 60 + s) / 86400).toFixed(6);
  },
  ISOWEEKNUM: (args, d, v) => {
    const dt = new Date(resolveArg(args[0], d, v));
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
    const week1 = new Date(dt.getFullYear(), 0, 4);
    return (1 + Math.round(((dt.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)).toString();
  },

  // --- FINANCIAL ---
  PMT: (args, d, v) => {
    const rate = resolveNum(args[0], d, v); const nper = resolveNum(args[1], d, v); const pv = resolveNum(args[2], d, v);
    if (rate === 0) return (-(pv / nper)).toFixed(2);
    return (-(pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1)).toFixed(2);
  },
  FV: (args, d, v) => {
    const rate = resolveNum(args[0], d, v); const nper = resolveNum(args[1], d, v); const pmt = resolveNum(args[2], d, v); const pv = args[3] ? resolveNum(args[3], d, v) : 0;
    if (rate === 0) return (-(pv + pmt * nper)).toFixed(2);
    return (-(pv * Math.pow(1 + rate, nper) + pmt * ((Math.pow(1 + rate, nper) - 1) / rate))).toFixed(2);
  },
  PV: (args, d, v) => {
    const rate = resolveNum(args[0], d, v); const nper = resolveNum(args[1], d, v); const pmt = resolveNum(args[2], d, v);
    if (rate === 0) return (-(pmt * nper)).toFixed(2);
    return (-(pmt * ((1 - Math.pow(1 + rate, -nper)) / rate))).toFixed(2);
  },
  NPV: (args, d, v) => {
    const rate = resolveNum(args[0], d, v);
    const cashflows = args.slice(1).map(a => {
      const rm = a.match(RANGE_RE);
      if (rm) return getRangeNums(rm[1], rm[2], d, v);
      return [resolveNum(a, d, v)];
    }).flat();
    let npv = 0;
    cashflows.forEach((cf, i) => npv += cf / Math.pow(1 + rate, i + 1));
    return npv.toFixed(2);
  },
  IPMT: (args, d, v) => {
    const rate = resolveNum(args[0], d, v); const per = resolveNum(args[1], d, v);
    const nper = resolveNum(args[2], d, v); const pv = resolveNum(args[3], d, v);
    const pmt = rate === 0 ? -(pv / nper) : -(pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
    let balance = pv;
    for (let i = 1; i < per; i++) { balance = balance * (1 + rate) + pmt; }
    return (-(balance * rate)).toFixed(2);
  },
  PPMT: (args, d, v) => {
    const rate = resolveNum(args[0], d, v); const per = resolveNum(args[1], d, v);
    const nper = resolveNum(args[2], d, v); const pv = resolveNum(args[3], d, v);
    const pmt = rate === 0 ? -(pv / nper) : -(pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
    let balance = pv;
    for (let i = 1; i < per; i++) { balance = balance * (1 + rate) + pmt; }
    const ipmt = balance * rate;
    return (-(pmt + ipmt)).toFixed(2);
  },
  NPER: (args, d, v) => {
    const rate = resolveNum(args[0], d, v); const pmt = resolveNum(args[1], d, v); const pv = resolveNum(args[2], d, v);
    if (rate === 0) return (-(pv / pmt)).toFixed(2);
    return (Math.log(pmt / (pmt + pv * rate)) / Math.log(1 + rate)).toFixed(2);
  },
  RATE: (args, d, v) => {
    const nper = resolveNum(args[0], d, v); const pmt = resolveNum(args[1], d, v); const pv = resolveNum(args[2], d, v);
    // Newton's method approximation
    let rate = 0.1;
    for (let i = 0; i < 100; i++) {
      const f = pv * Math.pow(1 + rate, nper) + pmt * ((Math.pow(1 + rate, nper) - 1) / rate);
      const df = pv * nper * Math.pow(1 + rate, nper - 1) + pmt * ((nper * Math.pow(1 + rate, nper - 1) * rate - Math.pow(1 + rate, nper) + 1) / (rate * rate));
      rate = rate - f / df;
      if (Math.abs(f) < 1e-8) break;
    }
    return (rate * 100).toFixed(4) + '%';
  },
  SLN: (args, d, v) => {
    const cost = resolveNum(args[0], d, v); const salvage = resolveNum(args[1], d, v); const life = resolveNum(args[2], d, v);
    return ((cost - salvage) / life).toFixed(2);
  },
  DB: (args, d, v) => {
    const cost = resolveNum(args[0], d, v); const salvage = resolveNum(args[1], d, v);
    const life = resolveNum(args[2], d, v); const period = resolveNum(args[3], d, v);
    const rate = 1 - Math.pow(salvage / cost, 1 / life);
    let totalDepreciation = 0;
    for (let i = 1; i <= period; i++) {
      const dep = (cost - totalDepreciation) * rate;
      totalDepreciation += dep;
      if (i === period) return dep.toFixed(2);
    }
    return '0';
  },
  DDB: (args, d, v) => {
    const cost = resolveNum(args[0], d, v); const salvage = resolveNum(args[1], d, v);
    const life = resolveNum(args[2], d, v); const period = resolveNum(args[3], d, v);
    const factor = args[4] ? resolveNum(args[4], d, v) : 2;
    let bookValue = cost;
    for (let i = 1; i <= period; i++) {
      const dep = Math.min(bookValue * (factor / life), bookValue - salvage);
      bookValue -= dep;
      if (i === period) return dep.toFixed(2);
    }
    return '0';
  },

  // --- INFO ---
  ISBLANK: (args, d, v) => (resolveArg(args[0], d, v) === '' ? 'TRUE' : 'FALSE'),
  ISNUMBER: (args, d, v) => (!isNaN(parseFloat(resolveArg(args[0], d, v))) ? 'TRUE' : 'FALSE'),
  ISTEXT: (args, d, v) => (isNaN(parseFloat(resolveArg(args[0], d, v))) && resolveArg(args[0], d, v) !== '' ? 'TRUE' : 'FALSE'),
  ISERROR: (args, d, v) => (resolveArg(args[0], d, v).startsWith('#') ? 'TRUE' : 'FALSE'),
  ISLOGICAL: (args, d, v) => { const val = resolveArg(args[0], d, v).toUpperCase(); return (val === 'TRUE' || val === 'FALSE') ? 'TRUE' : 'FALSE'; },
  ISEVEN: (args, d, v) => (resolveNum(args[0], d, v) % 2 === 0 ? 'TRUE' : 'FALSE'),
  ISODD: (args, d, v) => (resolveNum(args[0], d, v) % 2 !== 0 ? 'TRUE' : 'FALSE'),
  ISNA: (args, d, v) => (resolveArg(args[0], d, v) === '#N/A' ? 'TRUE' : 'FALSE'),
  ISREF: () => 'TRUE', // simplified
  TYPE: (args, d, v) => {
    const val = resolveArg(args[0], d, v);
    if (val === '') return '0';
    if (!isNaN(parseFloat(val))) return '1';
    if (val === 'TRUE' || val === 'FALSE') return '4';
    if (val.startsWith('#')) return '16';
    return '2';
  },
  CELL: (args, d, v) => {
    const infoType = resolveArg(args[0], d, v).toLowerCase();
    const ref = args[1] ? args[1].replace(/\$/g, '') : '';
    if (infoType === 'address') return ref;
    if (infoType === 'col') { const p = parseCellRef(ref); return p ? (p[1] + 1).toString() : ''; }
    if (infoType === 'row') { const p = parseCellRef(ref); return p ? (p[0] + 1).toString() : ''; }
    if (infoType === 'contents') return ref ? getCellValue(ref, d, new Set(v)) : '';
    return '';
  },
  SHEET: () => '1',
  SHEETS: () => '1',
  INFO: (args, d, v) => {
    const type = resolveArg(args[0], d, v).toLowerCase();
    if (type === 'osversion') return navigator.platform;
    if (type === 'directory') return window.location.href;
    return '';
  },

  // --- TRIG ---
  SIN: (args, d, v) => Math.sin(resolveNum(args[0], d, v)).toFixed(6),
  COS: (args, d, v) => Math.cos(resolveNum(args[0], d, v)).toFixed(6),
  TAN: (args, d, v) => Math.tan(resolveNum(args[0], d, v)).toFixed(6),
  ASIN: (args, d, v) => Math.asin(resolveNum(args[0], d, v)).toFixed(6),
  ACOS: (args, d, v) => Math.acos(resolveNum(args[0], d, v)).toFixed(6),
  ATAN: (args, d, v) => Math.atan(resolveNum(args[0], d, v)).toFixed(6),
  ATAN2: (args, d, v) => Math.atan2(resolveNum(args[0], d, v), resolveNum(args[1], d, v)).toFixed(6),
  SINH: (args, d, v) => Math.sinh(resolveNum(args[0], d, v)).toFixed(6),
  COSH: (args, d, v) => Math.cosh(resolveNum(args[0], d, v)).toFixed(6),
  TANH: (args, d, v) => Math.tanh(resolveNum(args[0], d, v)).toFixed(6),
  DEGREES: (args, d, v) => (resolveNum(args[0], d, v) * 180 / Math.PI).toFixed(4),
  RADIANS: (args, d, v) => (resolveNum(args[0], d, v) * Math.PI / 180).toFixed(6),

  // --- ENGINEERING ---
  BIN2DEC: (args, d, v) => parseInt(resolveArg(args[0], d, v), 2).toString(),
  DEC2BIN: (args, d, v) => (resolveNum(args[0], d, v) >>> 0).toString(2),
  HEX2DEC: (args, d, v) => parseInt(resolveArg(args[0], d, v), 16).toString(),
  DEC2HEX: (args, d, v) => resolveNum(args[0], d, v).toString(16).toUpperCase(),
  OCT2DEC: (args, d, v) => parseInt(resolveArg(args[0], d, v), 8).toString(),
  DEC2OCT: (args, d, v) => resolveNum(args[0], d, v).toString(8),
};

export const evaluateFormula = (formula: string, data: SheetData, visited: Set<string> = new Set()): string => {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.substring(1).trim();
  const upper = expr.toUpperCase();

  // Match function call: FUNC(...)
  const funcMatch = upper.match(/^([A-Z_0-9]+)\((.*)\)$/s);
  if (funcMatch) {
    const funcName = funcMatch[1];
    const fn = formulas[funcName];
    if (fn) {
      const args = parseArgs(funcMatch[2]);
      try {
        return fn(args.map(a => a.toUpperCase()), data, visited);
      } catch { return '#ERROR'; }
    }
  }

  // No-arg functions
  if (formulas[upper]) {
    try { return formulas[upper]([], data, visited); } catch { return '#ERROR'; }
  }

  // Simple cell reference =A1
  const refMatch = upper.match(/^\$?([A-Z]+)\$?(\d+)$/);
  if (refMatch) return getCellValue(`${refMatch[1]}${refMatch[2]}`, data, visited);

  // Arithmetic with cell refs
  try {
    const replaced = upper.replace(/\$?[A-Z]+\$?\d+/g, (ref) => {
      const cleanRef = ref.replace(/\$/g, '');
      const val = getCellValue(cleanRef, data, new Set(visited));
      const num = parseFloat(val);
      return isNaN(num) ? '0' : num.toString();
    });
    const result = new Function(`return ${replaced}`)();
    return typeof result === 'number' ? (Number.isInteger(result) ? result.toString() : result.toFixed(2)) : String(result);
  } catch { return '#ERROR'; }
};

export const getCellValue = (key: string, data: SheetData, visited: Set<string> = new Set()): string => {
  const cleanKey = key.replace(/\$/g, '');
  if (visited.has(cleanKey)) return '#CIRC';
  visited.add(cleanKey);
  const cell = data[cleanKey];
  if (!cell) return '';
  if (cell.formula) return evaluateFormula(cell.formula, data, visited);
  return cell.value || '';
};

// Evaluate conditional format rules against a cell value
export const evaluateConditionalFormat = (value: string, rules: ConditionalFormatRule[]): { bgColor?: string; textColor?: string; bold?: boolean; italic?: boolean } | null => {
  const num = parseFloat(value);
  for (const rule of rules) {
    let matches = false;
    switch (rule.type) {
      case 'greaterThan': matches = !isNaN(num) && num > parseFloat(rule.value || '0'); break;
      case 'lessThan': matches = !isNaN(num) && num < parseFloat(rule.value || '0'); break;
      case 'equal': matches = value === rule.value || (!isNaN(num) && num === parseFloat(rule.value || '')); break;
      case 'between': matches = !isNaN(num) && num >= parseFloat(rule.value || '0') && num <= parseFloat(rule.value2 || '0'); break;
      case 'text': matches = value.toLowerCase().includes((rule.value || '').toLowerCase()); break;
      case 'blank': matches = value.trim() === ''; break;
      case 'notBlank': matches = value.trim() !== ''; break;
      case 'duplicate': matches = false; break; // handled at sheet level
    }
    if (matches) {
      return {
        bgColor: rule.bgColor,
        textColor: rule.textColor,
        bold: rule.bold,
        italic: rule.italic,
      };
    }
  }
  return null;
};

// Available formulas list for autocomplete
export const FORMULA_LIST = Object.keys(formulas).sort();

export const FORMULA_CATEGORIES: Record<string, string[]> = {
  'Mathématiques': ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'ABS', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'CEILING', 'FLOOR', 'INT', 'MOD', 'POWER', 'SQRT', 'LOG', 'LOG10', 'LN', 'EXP', 'PI', 'RAND', 'RANDBETWEEN', 'SIGN', 'PRODUCT', 'SUMPRODUCT', 'SUMSQ', 'TRUNC', 'GCD', 'LCM', 'FACT', 'COMBIN', 'PERMUT', 'QUOTIENT', 'MROUND', 'EVEN', 'ODD', 'ROMAN'],
  'Statistiques': ['MEDIAN', 'MODE', 'STDEV', 'STDEVP', 'VAR', 'VARP', 'LARGE', 'SMALL', 'PERCENTILE', 'RANK', 'FREQUENCY', 'CORREL', 'SLOPE', 'INTERCEPT', 'FORECAST', 'GEOMEAN', 'HARMEAN', 'DEVSQ', 'AVEDEV', 'KURT', 'SKEW', 'COUNTA', 'COUNTBLANK'],
  'Logique': ['IF', 'IFS', 'AND', 'OR', 'XOR', 'NOT', 'IFERROR', 'IFNA', 'SWITCH', 'CHOOSE', 'TRUE', 'FALSE'],
  'Texte': ['CONCATENATE', 'CONCAT', 'TEXTJOIN', 'LEFT', 'RIGHT', 'MID', 'LEN', 'UPPER', 'LOWER', 'PROPER', 'TRIM', 'CLEAN', 'SUBSTITUTE', 'REPLACE', 'FIND', 'SEARCH', 'REPT', 'TEXT', 'FIXED', 'VALUE', 'NUMBERVALUE', 'DOLLAR', 'EXACT', 'CHAR', 'CODE', 'T', 'N'],
  'Recherche': ['VLOOKUP', 'HLOOKUP', 'XLOOKUP', 'INDEX', 'MATCH', 'LOOKUP', 'INDIRECT', 'OFFSET', 'ROW', 'COLUMN', 'ROWS', 'COLUMNS', 'ADDRESS'],
  'Conditionnel': ['COUNTIF', 'COUNTIFS', 'SUMIF', 'SUMIFS', 'AVERAGEIF', 'AVERAGEIFS', 'MAXIFS', 'MINIFS', 'UNIQUE'],
  'Date': ['TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'DATE', 'DATEDIF', 'WEEKDAY', 'WEEKNUM', 'EDATE', 'EOMONTH', 'DAYS', 'DAYS360', 'NETWORKDAYS', 'WORKDAY', 'DATEVALUE', 'TIMEVALUE', 'ISOWEEKNUM'],
  'Financier': ['PMT', 'FV', 'PV', 'NPV', 'IPMT', 'PPMT', 'NPER', 'RATE', 'SLN', 'DB', 'DDB'],
  'Information': ['ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISERROR', 'ISLOGICAL', 'ISEVEN', 'ISODD', 'ISNA', 'TYPE', 'CELL', 'SHEET', 'SHEETS', 'INFO'],
  'Trigonométrie': ['SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN', 'ATAN2', 'SINH', 'COSH', 'TANH', 'DEGREES', 'RADIANS'],
  'Ingénierie': ['BIN2DEC', 'DEC2BIN', 'HEX2DEC', 'DEC2HEX', 'OCT2DEC', 'DEC2OCT'],
};
