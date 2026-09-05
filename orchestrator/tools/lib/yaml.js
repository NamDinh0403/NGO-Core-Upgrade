'use strict';
/*
 * Minimal block-style YAML reader/writer — maps, sequences of scalars/maps,
 * scalars, comments, quotes. Sufficient for this module's own schemas.
 * Dependency-free, matching the convention already used elsewhere in this
 * repository (e.g. backend/tools/bootstrap/lib/yaml.js).
 */

function stripComment(s) {
  let inS = false, inD = false, res = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    if (c === '#' && !inS && !inD && (i === 0 || s[i - 1] === ' ' || s[i - 1] === '\t')) break;
    res += c;
  }
  return res.replace(/\s+$/, '');
}

function tokenize(text) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = stripComment(raw);
    if (line.trim() === '') continue;
    const indent = line.length - line.replace(/^\s+/, '').length;
    out.push({ indent, content: line.trim() });
  }
  return out;
}

function scalar(v) {
  v = v.trim();
  if (v === '' || v === '~' || v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === '[]') return [];
  if (v === '{}') return {};
  if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) return v.slice(1, -1);
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  return v;
}

const isMapItem = (c) => /^[^\s:]+:(\s|$)/.test(c);

function parseNode(toks, ctx, indent) {
  if (ctx.i >= toks.length) return null;
  if (toks[ctx.i].content[0] === '-') return parseSeq(toks, ctx, indent);
  return parseMap(toks, ctx, indent);
}

function parseMap(toks, ctx, indent) {
  const obj = {};
  while (ctx.i < toks.length && toks[ctx.i].indent === indent && toks[ctx.i].content[0] !== '-') {
    const c = toks[ctx.i].content;
    const idx = c.indexOf(':');
    const key = c.slice(0, idx).trim();
    const rest = c.slice(idx + 1).trim();
    ctx.i++;
    if (rest === '') {
      if (ctx.i < toks.length && toks[ctx.i].indent > indent) obj[key] = parseNode(toks, ctx, toks[ctx.i].indent);
      else obj[key] = null;
    } else {
      obj[key] = scalar(rest);
    }
  }
  return obj;
}

function parseSeq(toks, ctx, indent) {
  const arr = [];
  while (ctx.i < toks.length && toks[ctx.i].indent === indent && toks[ctx.i].content[0] === '-') {
    const c = toks[ctx.i].content.slice(1).trim();
    const itemIndent = indent + 2;
    if (c === '') {
      ctx.i++;
      if (ctx.i < toks.length && toks[ctx.i].indent > indent) arr.push(parseNode(toks, ctx, toks[ctx.i].indent));
      else arr.push(null);
    } else if (isMapItem(c)) {
      toks[ctx.i] = { indent: itemIndent, content: c };
      arr.push(parseMap(toks, ctx, itemIndent));
    } else {
      arr.push(scalar(c));
      ctx.i++;
    }
  }
  return arr;
}

function parse(text) {
  const toks = tokenize(text);
  if (toks.length === 0) return {};
  return parseNode(toks, { i: 0 }, toks[0].indent);
}

// --- writer -------------------------------------------------------------
function scalarOut(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (s === '' || /^[\s]|[\s]$/.test(s) || /[:#\[\]{}'"]/.test(s) || /^(true|false|null|~|-?\d+(\.\d+)?)$/.test(s)) {
    return JSON.stringify(s);
  }
  return s;
}

function stringify(value, indent) {
  indent = indent || 0;
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]\n`;
    let out = '';
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const inner = stringify(item, indent + 2).replace(new RegExp(`^ {${indent + 2}}`), '');
        out += `${pad}- ${inner}`;
      } else {
        out += `${pad}- ${scalarOut(item)}\n`;
      }
    }
    return out;
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return `${pad}{}\n`;
    let out = '';
    for (const key of keys) {
      const v = value[key];
      if (Array.isArray(v)) {
        out += v.length === 0 ? `${pad}${key}: []\n` : `${pad}${key}:\n${stringify(v, indent + 2)}`;
      } else if (v !== null && typeof v === 'object') {
        out += `${pad}${key}:\n${stringify(v, indent + 2)}`;
      } else {
        out += `${pad}${key}: ${scalarOut(v)}\n`;
      }
    }
    return out;
  }
  return `${pad}${scalarOut(value)}\n`;
}

module.exports = { parse, stringify };
