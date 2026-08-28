'use strict';
/*
 * Minimal block-style YAML reader + writer (maps, sequences, scalars, comments,
 * quotes). Sufficient for the agent's config, request, and run artifacts.
 * Dependency-free, Node 14+.
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

function splitFlow(inner) {
  // Split a flow collection body on top-level commas, respecting quotes/nesting.
  const parts = [];
  let depth = 0, inS = false, inD = false, cur = '';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    if (!inS && !inD) {
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
      else if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    }
    cur += c;
  }
  if (cur.trim() !== '' || parts.length) parts.push(cur);
  return parts;
}

function parseFlow(v) {
  v = v.trim();
  if (v[0] === '[' && v[v.length - 1] === ']') {
    const inner = v.slice(1, -1).trim();
    if (inner === '') return [];
    return splitFlow(inner).map((x) => scalar(x));
  }
  // flow map { k: v, ... }
  const inner = v.slice(1, -1).trim();
  const obj = {};
  if (inner === '') return obj;
  for (const part of splitFlow(inner)) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    obj[part.slice(0, idx).trim()] = scalar(part.slice(idx + 1));
  }
  return obj;
}

function scalar(v) {
  v = v.trim();
  if (v === '' || v === '~' || v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if ((v[0] === '[' && v[v.length - 1] === ']') || (v[0] === '{' && v[v.length - 1] === '}')) return parseFlow(v);
  if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) return v.slice(1, -1);
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  return v; // keep version-like / paths / globs as strings
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

// --- minimal block-style writer --------------------------------------------
function needsQuote(s) {
  return /[:#\-?{}\[\],&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s) || s === '' ||
    /^(true|false|null|~)$/i.test(s) || /^-?\d+(\.\d+)?$/.test(s);
}
function dumpScalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  const s = String(v);
  return needsQuote(s) ? JSON.stringify(s) : s;
}
function dumpNode(node, indent) {
  const pad = ' '.repeat(indent);
  let out = '';
  if (Array.isArray(node)) {
    if (node.length === 0) return pad + '[]\n';
    for (const item of node) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        // Render an object list item: first key on the dash line, rest aligned.
        const lines = dumpNode(item, indent + 2).split('\n').filter((l) => l.length);
        lines.forEach((l, i) => {
          out += (i === 0 ? pad + '- ' + l.slice(indent + 2) : l) + '\n';
        });
      } else if (Array.isArray(item)) {
        out += pad + '-\n' + dumpNode(item, indent + 2);
      } else {
        out += pad + '- ' + dumpScalar(item) + '\n';
      }
    }
    return out;
  }
  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if (keys.length === 0) return pad + '{}\n';
    for (const k of keys) {
      const v = node[k];
      if (v && typeof v === 'object' && (Array.isArray(v) ? v.length : Object.keys(v).length)) {
        out += pad + k + ':\n' + dumpNode(v, indent + 2);
      } else if (v && typeof v === 'object') {
        out += pad + k + ': ' + (Array.isArray(v) ? '[]' : '{}') + '\n';
      } else {
        out += pad + k + ': ' + dumpScalar(v) + '\n';
      }
    }
    return out;
  }
  return pad + dumpScalar(node) + '\n';
}
function stringify(obj) {
  return dumpNode(obj, 0);
}

module.exports = { parse, stringify };
