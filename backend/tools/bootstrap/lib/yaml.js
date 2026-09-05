'use strict';
/*
 * Minimal block-style YAML reader (maps, sequences, scalars, comments, quotes).
 * Sufficient for the tool-*.yaml config files. Dependency-free.
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

module.exports = { parse };
