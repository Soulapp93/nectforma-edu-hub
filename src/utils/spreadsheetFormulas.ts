// =====================================================
// Excel++ Formula Engine — 100+ formulas
// =====================================================

export type SheetData = Record<string, CellData>;

export interface CellData {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  numberFormat?: string;
  merged?: { rows: number; cols: number };
  mergedParent?: string;
  border?: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };
  wrap?: boolean;
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
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return [parseInt(match[2]) - 1, colIndex(match[1])];
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
  if (arg.match(/^[A-Z]+\d+$/)) return getCellValue(arg, data, new Set(visited));
  if (arg.startsWith('=')) return evaluateFormula(arg, data, new Set(visited));
  return arg;
};

const resolveNum = (arg: string, data: SheetData, visited: Set<string>): number => {
  const val = resolveArg(arg, data, visited);
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

// Check for range pattern like A1:B5
const RANGE_RE = /^([A-Z]+\d+):([A-Z]+\d+)$/;

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

// =====================================================
// FORMULA IMPLEMENTATIONS
// =====================================================

const formulas: Record<string, (args: string[], data: SheetData, visited: Set<string>) => string> = {
  // --- MATH ---
  SUM: (args, d, v) => getAllNums(args, d, v).reduce((a, b) => a + b, 0).toString(),
  AVERAGE: (args, d, v) => { const n = getAllNums(args, d, v); return n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(2) : '0'; },
  COUNT: (args, d, v) => getAllValues(args, d, v).filter(x => x.trim() !== '').length.toString(),
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
  VAR: (args, d, v) => {
    const n = getAllNums(args, d, v); if (n.length < 2) return '0';
    const avg = n.reduce((a, b) => a + b) / n.length;
    return (n.reduce((s, x) => s + (x - avg) ** 2, 0) / (n.length - 1)).toFixed(4);
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

  // --- LOGIC ---
  IF: (args, d, v) => {
    const cond = resolveArg(args[0], d, v);
    let boolVal = false;
    // Handle comparison operators
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
  AND: (args, d, v) => {
    const all = args.every(a => { const val = resolveArg(a, d, v); return val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE'; });
    return all ? 'TRUE' : 'FALSE';
  },
  OR: (args, d, v) => {
    const any = args.some(a => { const val = resolveArg(a, d, v); return val !== '0' && val !== '' && val.toUpperCase() !== 'FALSE'; });
    return any ? 'TRUE' : 'FALSE';
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
  SWITCH: (args, d, v) => {
    const expr = resolveArg(args[0], d, v);
    for (let i = 1; i < args.length - 1; i += 2) {
      if (resolveArg(args[i], d, v) === expr) return resolveArg(args[i + 1], d, v);
    }
    return args.length % 2 === 0 ? resolveArg(args[args.length - 1], d, v) : '';
  },

  // --- TEXT ---
  CONCATENATE: (args, d, v) => args.map(a => resolveArg(a, d, v)).join(''),
  CONCAT: (args, d, v) => args.map(a => resolveArg(a, d, v)).join(''),
  TEXTJOIN: (args, d, v) => {
    const delim = resolveArg(args[0], d, v);
    const ignoreEmpty = resolveArg(args[1], d, v).toUpperCase() === 'TRUE';
    const values = args.slice(2).map(a => resolveArg(a, d, v));
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
  SUBSTITUTE: (args, d, v) => {
    const text = resolveArg(args[0], d, v);
    const old = resolveArg(args[1], d, v);
    const rep = resolveArg(args[2], d, v);
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
    const idx = haystack.indexOf(needle);
    return idx >= 0 ? (idx + 1).toString() : '#VALUE!';
  },
  SEARCH: (args, d, v) => {
    const needle = resolveArg(args[0], d, v).toLowerCase();
    const haystack = resolveArg(args[1], d, v).toLowerCase();
    const idx = haystack.indexOf(needle);
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
  VALUE: (args, d, v) => { const n = parseFloat(resolveArg(args[0], d, v)); return isNaN(n) ? '#VALUE!' : n.toString(); },
  EXACT: (args, d, v) => (resolveArg(args[0], d, v) === resolveArg(args[1], d, v) ? 'TRUE' : 'FALSE'),
  CHAR: (args, d, v) => String.fromCharCode(resolveNum(args[0], d, v)),
  CODE: (args, d, v) => resolveArg(args[0], d, v).charCodeAt(0).toString(),

  // --- LOOKUP ---
  VLOOKUP: (args, d, v) => {
    const searchVal = resolveArg(args[0], d, v);
    const rm = args[1].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const colIdx = resolveNum(args[2], d, v) - 1;
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    for (let r = start[0]; r <= end[0]; r++) {
      const key = cellKey(r, start[1]);
      const val = getCellValue(key, d, new Set(v));
      if (val === searchVal || (parseFloat(val) === parseFloat(searchVal) && !isNaN(parseFloat(searchVal)))) {
        return getCellValue(cellKey(r, start[1] + colIdx), d, new Set(v));
      }
    }
    return '#N/A';
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
    const isRow = start[0] === end[0];
    if (isRow) {
      for (let c = start[1]; c <= end[1]; c++) {
        if (getCellValue(cellKey(start[0], c), d, new Set(v)) === searchVal) return (c - start[1] + 1).toString();
      }
    } else {
      for (let r = start[0]; r <= end[0]; r++) {
        if (getCellValue(cellKey(r, start[1]), d, new Set(v)) === searchVal) return (r - start[0] + 1).toString();
      }
    }
    return '#N/A';
  },
  LOOKUP: (args, d, v) => formulas.VLOOKUP(args, d, v),

  // --- CONDITIONAL ---
  COUNTIF: (args, d, v) => {
    const rm = args[0].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const criteria = resolveArg(args[1], d, v);
    const vals = getRangeValues(rm[1], rm[2], d, v);
    return vals.filter(x => x === criteria).length.toString();
  },
  COUNTIFS: (args, d, v) => formulas.COUNTIF(args, d, v),
  SUMIF: (args, d, v) => {
    const rm = args[0].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const criteria = resolveArg(args[1], d, v);
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return '#ERROR';
    const sumRm = args[2]?.match(RANGE_RE);
    const sumStart = sumRm ? parseCellRef(sumRm[1]) : start;
    if (!sumStart) return '#ERROR';
    let sum = 0;
    let idx = 0;
    for (let r = start[0]; r <= end[0]; r++) {
      for (let c = start[1]; c <= end[1]; c++) {
        const val = getCellValue(cellKey(r, c), d, new Set(v));
        if (val === criteria) {
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
  AVERAGEIF: (args, d, v) => {
    const rm = args[0].match(RANGE_RE);
    if (!rm) return '#ERROR';
    const criteria = resolveArg(args[1], d, v);
    const vals = getRangeValues(rm[1], rm[2], d, v);
    const matching = vals.filter(x => x === criteria).map(x => parseFloat(x)).filter(n => !isNaN(n));
    return matching.length ? (matching.reduce((a, b) => a + b) / matching.length).toFixed(2) : '0';
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
    const cashflows = args.slice(1).map(a => resolveNum(a, d, v));
    let npv = 0;
    cashflows.forEach((cf, i) => npv += cf / Math.pow(1 + rate, i + 1));
    return npv.toFixed(2);
  },

  // --- INFO ---
  ISBLANK: (args, d, v) => (resolveArg(args[0], d, v) === '' ? 'TRUE' : 'FALSE'),
  ISNUMBER: (args, d, v) => (!isNaN(parseFloat(resolveArg(args[0], d, v))) ? 'TRUE' : 'FALSE'),
  ISTEXT: (args, d, v) => (isNaN(parseFloat(resolveArg(args[0], d, v))) && resolveArg(args[0], d, v) !== '' ? 'TRUE' : 'FALSE'),
  ISERROR: (args, d, v) => (resolveArg(args[0], d, v).startsWith('#') ? 'TRUE' : 'FALSE'),
  TYPE: (args, d, v) => {
    const val = resolveArg(args[0], d, v);
    if (val === '') return '0';
    if (!isNaN(parseFloat(val))) return '1';
    return '2';
  },

  // --- TRIG ---
  SIN: (args, d, v) => Math.sin(resolveNum(args[0], d, v)).toFixed(6),
  COS: (args, d, v) => Math.cos(resolveNum(args[0], d, v)).toFixed(6),
  TAN: (args, d, v) => Math.tan(resolveNum(args[0], d, v)).toFixed(6),
  ASIN: (args, d, v) => Math.asin(resolveNum(args[0], d, v)).toFixed(6),
  ACOS: (args, d, v) => Math.acos(resolveNum(args[0], d, v)).toFixed(6),
  ATAN: (args, d, v) => Math.atan(resolveNum(args[0], d, v)).toFixed(6),
  ATAN2: (args, d, v) => Math.atan2(resolveNum(args[0], d, v), resolveNum(args[1], d, v)).toFixed(6),
  DEGREES: (args, d, v) => (resolveNum(args[0], d, v) * 180 / Math.PI).toFixed(4),
  RADIANS: (args, d, v) => (resolveNum(args[0], d, v) * Math.PI / 180).toFixed(6),
};

export const evaluateFormula = (formula: string, data: SheetData, visited: Set<string> = new Set()): string => {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.substring(1).trim();
  const upper = expr.toUpperCase();

  // Match function call: FUNC(...)
  const funcMatch = upper.match(/^([A-Z_]+)\((.*)\)$/s);
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
  const refMatch = upper.match(/^([A-Z]+\d+)$/);
  if (refMatch) return getCellValue(refMatch[1], data, visited);

  // Arithmetic with cell refs
  try {
    const replaced = upper.replace(/[A-Z]+\d+/g, (ref) => {
      const val = getCellValue(ref, data, new Set(visited));
      const num = parseFloat(val);
      return isNaN(num) ? '0' : num.toString();
    });
    const result = new Function(`return ${replaced}`)();
    return typeof result === 'number' ? (Number.isInteger(result) ? result.toString() : result.toFixed(2)) : String(result);
  } catch { return '#ERROR'; }
};

export const getCellValue = (key: string, data: SheetData, visited: Set<string> = new Set()): string => {
  if (visited.has(key)) return '#CIRC';
  visited.add(key);
  const cell = data[key];
  if (!cell) return '';
  if (cell.formula) return evaluateFormula(cell.formula, data, visited);
  return cell.value || '';
};

// Available formulas list for autocomplete
export const FORMULA_LIST = Object.keys(formulas).sort();

export const FORMULA_CATEGORIES: Record<string, string[]> = {
  'Mathématiques': ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'ABS', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'CEILING', 'FLOOR', 'INT', 'MOD', 'POWER', 'SQRT', 'LOG', 'LN', 'EXP', 'PI', 'RAND', 'RANDBETWEEN', 'SIGN', 'PRODUCT', 'SUMPRODUCT'],
  'Statistiques': ['MEDIAN', 'MODE', 'STDEV', 'VAR', 'LARGE', 'SMALL', 'PERCENTILE', 'COUNTA', 'COUNTBLANK'],
  'Logique': ['IF', 'AND', 'OR', 'NOT', 'IFERROR', 'SWITCH'],
  'Texte': ['CONCATENATE', 'CONCAT', 'TEXTJOIN', 'LEFT', 'RIGHT', 'MID', 'LEN', 'UPPER', 'LOWER', 'PROPER', 'TRIM', 'SUBSTITUTE', 'REPLACE', 'FIND', 'SEARCH', 'REPT', 'TEXT', 'VALUE', 'EXACT', 'CHAR', 'CODE'],
  'Recherche': ['VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH', 'LOOKUP'],
  'Conditionnel': ['COUNTIF', 'COUNTIFS', 'SUMIF', 'AVERAGEIF'],
  'Date': ['TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'DATE', 'DATEDIF', 'WEEKDAY', 'WEEKNUM', 'EDATE', 'EOMONTH'],
  'Financier': ['PMT', 'FV', 'PV', 'NPV'],
  'Information': ['ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISERROR', 'TYPE'],
  'Trigonométrie': ['SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN', 'ATAN2', 'DEGREES', 'RADIANS'],
};
