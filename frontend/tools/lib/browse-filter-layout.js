'use strict';
const fs = require('fs');
const path = require('path');
const core = require('./core');

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const classes = (node) => ((node.open.match(/\bclass\s*=\s*["']([^"']*)["']/) || [])[1] || '').split(/\s+/);
const within = (node, parent) => {
  for (let current = node.parent; current; current = current.parent) if (current === parent) return true;
  return false;
};

function parseTemplateNodes(text) {
  const root = { tag: 'root', open: '', parent: null, children: [], start: 0, openEnd: 0, end: text.length };
  const stack = [root], nodes = [];
  const tokenRe = /<!--[\s\S]*?-->|<\/?[A-Za-z][\w:-]*\b(?:[^>"']|"[^"]*"|'[^']*')*>/g;
  let m;
  while ((m = tokenRe.exec(text)) !== null) {
    const raw = m[0];
    if (raw.startsWith('<!--')) continue;
    const tag = raw.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (raw.startsWith('</')) {
      const closing = stack.map((node) => node.tag).lastIndexOf(tag);
      if (closing < 1) throw new Error(`Cannot inspect browse-filter layout: unmatched closing ${tag}`);
      for (let i = stack.length - 1; i >= closing; i--) {
        stack[i].end = (i === closing) ? m.index + raw.length : m.index;
      }
      stack.length = closing;
    } else {
      const parent = stack[stack.length - 1];
      const selfClosing = VOID_TAGS.has(tag) || /\/>$/.test(raw);
      const node = {
        tag,
        open: raw,
        parent,
        children: [],
        start: m.index,
        openEnd: m.index + raw.length,
        end: selfClosing ? m.index + raw.length : text.length,
      };
      parent.children.push(node);
      nodes.push(node);
      if (!selfClosing) stack.push(node);
    }
  }
  if (stack.length !== 1) throw new Error('Cannot inspect browse-filter layout: unclosed template element');
  return { root, nodes };
}

function inspectTemplate(text) {
  const { root, nodes } = parseTemplateNodes(text);
  const issues = [];
  let applicable = false;
  for (const filter of nodes.filter((node) => node.tag === 'ngo-list-filter')) {
    let column = filter.parent;
    for (let parent = filter.parent; parent !== root; parent = parent.parent) {
      if (classes(parent).some((name) => /^col(?:-|$)/.test(name))) { column = parent; break; }
    }
    const fields = nodes.filter((node) => node !== filter && within(node, column) && !within(node, filter) && !within(filter, node)
      && (/^(input|select|textarea|button)$/.test(node.tag) || (node.tag.includes('-') && !/^ng-(container|template|content)$/.test(node.tag))));
    if (!fields.length) continue;
    applicable = true;
    let layout = filter.parent;
    while (layout && layout !== column.parent && !classes(layout).includes('browse-filter-layout')) layout = layout.parent;
    if (!layout || layout === column.parent || !fields.every((node) => within(node, layout))) {
      issues.push('wrap the filter and sibling fields together in browse-filter-layout');
    }
    if (!/\[flattenIntoParentFlow\]\s*=\s*["']true["']/.test(filter.open)) issues.push('set [flattenIntoParentFlow]="true" on ngo-list-filter');
    if (nodes.some((node) => within(node, column) && !within(node, filter) && classes(node).some((name) => /^pull-(left|right)$/.test(name)))) {
      issues.push('remove legacy pull-left/pull-right from sibling fields and preserve their intended order/alignment');
    }
  }
  return { applicable, issues: [...new Set(issues)] };
}

function stripPullClasses(fragment) {
  let hadPullLeft = false;
  let hadPullRight = false;
  const cleaned = fragment.replace(/\bclass\s*=\s*(["'])([^"']*)\1/g, (full, quote, clsStr) => {
    const parts = clsStr.split(/\s+/).filter(Boolean);
    const kept = [];
    for (const part of parts) {
      if (part === 'pull-left') { hadPullLeft = true; continue; }
      if (part === 'pull-right') { hadPullRight = true; continue; }
      kept.push(part);
    }
    return `class=${quote}${kept.join(' ')}${quote}`;
  });
  return { cleaned, hadPullLeft, hadPullRight };
}

function migrateTemplate(text) {
  const initial = inspectTemplate(text);
  if (!initial.applicable || initial.issues.length === 0) {
    return { changed: false, content: text };
  }

  let updated = text;
  // Re-parse iteratively in case there are multiple columns in one template
  for (let pass = 0; pass < 10; pass++) {
    const check = inspectTemplate(updated);
    if (!check.applicable || check.issues.length === 0) break;

    const { root, nodes } = parseTemplateNodes(updated);
    let mutatedThisPass = false;

    for (const filter of nodes.filter((node) => node.tag === 'ngo-list-filter')) {
      let column = filter.parent;
      for (let parent = filter.parent; parent !== root; parent = parent.parent) {
        if (classes(parent).some((name) => /^col(?:-|$)/.test(name))) { column = parent; break; }
      }
      const fields = nodes.filter((node) => node !== filter && within(node, column) && !within(node, filter) && !within(filter, node)
        && (/^(input|select|textarea|button)$/.test(node.tag) || (node.tag.includes('-') && !/^ng-(container|template|content)$/.test(node.tag))));
      if (!fields.length) continue;

      let layout = filter.parent;
      while (layout && layout !== column.parent && !classes(layout).includes('browse-filter-layout')) layout = layout.parent;
      const hasLayout = Boolean(layout && layout !== column.parent && fields.every((node) => within(node, layout)));
      const hasFlatten = /\[flattenIntoParentFlow\]\s*=\s*["']true["']/.test(filter.open);
      const hasPull = nodes.some((node) => within(node, column) && !within(node, filter) && classes(node).some((name) => /^pull-(left|right)$/.test(name)));
      if (hasLayout && hasFlatten && !hasPull) continue;

      const innerStart = column.openEnd;
      const closeTagMatch = updated.slice(column.openEnd, column.end).match(/<\/[\w:-]+\s*>$/);
      const innerEnd = closeTagMatch ? column.end - closeTagMatch[0].length : column.end;
      const innerRaw = updated.slice(innerStart, innerEnd);

      // 1. Add [flattenIntoParentFlow]="true" to ngo-list-filter if missing
      let newInner = innerRaw.replace(/<ngo-list-filter\b([^>]*)>/g, (m, attrs) => {
        if (/\[flattenIntoParentFlow\]\s*=/.test(attrs)) return m;
        return `<ngo-list-filter${attrs} [flattenIntoParentFlow]="true">`;
      });

      // 2. Strip pull-left / pull-right inside column (except inside ngo-list-filter itself)
      const { cleaned, hadPullLeft } = stripPullClasses(newInner);
      newInner = cleaned;

      // 3. Wrap direct contents of column in <div class="browse-filter-layout"> if missing
      if (!hasLayout) {
        const wrapperClass = hadPullLeft ? 'browse-filter-layout filter-align-left' : 'browse-filter-layout';
        newInner = `<div class="${wrapperClass}">${newInner}</div>`;
      }

      const candidate = updated.slice(0, innerStart) + newInner + updated.slice(innerEnd);
      // Verify result parses cleanly and reduces issues
      const afterCheck = inspectTemplate(candidate);
      if (afterCheck.issues.length < check.issues.length || afterCheck.issues.length === 0) {
        updated = candidate;
        mutatedThisPass = true;
        break;
      }
    }

    if (!mutatedThisPass) break;
  }

  return { changed: updated !== text, content: updated };
}

function migrate(clientPath, files) {
  const candidates = files || core.walk(clientPath, {}).map((file) => path.relative(clientPath, file));
  const migratedFiles = [];
  for (const file of candidates.filter((f) => /\.(html|ts)$/.test(f) && !/\.spec\.ts$/.test(f))) {
    const absPath = path.join(clientPath, file);
    const text = fs.readFileSync(absPath, 'utf8');
    if (!/<ngo-list-filter\b/.test(text)) continue;

    if (/\.html$/.test(file)) {
      try {
        const res = migrateTemplate(text);
        if (res.changed) {
          fs.writeFileSync(absPath, res.content, 'utf8');
          migratedFiles.push(file.split(path.sep).join('/'));
        }
      } catch (_) {}
    } else {
      let modifiedTs = false;
      const updatedTs = text.replace(/\b(template\s*:\s*)(`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, (full, prefix, quoted) => {
        const quote = quoted[0];
        if (quote !== '`') return full; // Only safely rewrite backtick inline templates
        const inner = quoted.slice(1, -1);
        if (!/<ngo-list-filter\b/.test(inner)) return full;
        try {
          const res = migrateTemplate(inner);
          if (res.changed) {
            modifiedTs = true;
            return `${prefix}\`${res.content}\``;
          }
        } catch (_) {}
        return full;
      });
      if (modifiedTs) {
        fs.writeFileSync(absPath, updatedTs, 'utf8');
        migratedFiles.push(file.split(path.sep).join('/'));
      }
    }
  }
  return { requirementId: 'REQ-9.3.0-FRONTEND-01', migratedFiles };
}

function inspect(clientPath, files) {
  const candidates = files || core.walk(clientPath, {}).map((file) => path.relative(clientPath, file));
  const consumers = [];
  for (const file of candidates.filter((file) => /\.(html|ts)$/.test(file) && !/\.spec\.ts$/.test(file))) {
    const text = fs.readFileSync(path.join(clientPath, file), 'utf8');
    const templates = /\.html$/.test(file) ? [text] : [...text.matchAll(/\btemplate\s*:\s*(`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g)]
      .map((match) => match[1].slice(1, -1).replace(/\\([\\`'"])/g, '$1').replace(/\\[rn]/g, ' '));
    const relevant = templates.filter((template) => /<ngo-list-filter\b/.test(template));
    if (!relevant.length) continue;
    const results = relevant.map(inspectTemplate);
    if (results.some((result) => result.applicable)) consumers.push({ file: file.split(path.sep).join('/'), issues: [...new Set(results.flatMap((result) => result.issues))] });
  }
  return { requirementId: 'REQ-9.3.0-FRONTEND-01', consumers,
    issues: consumers.flatMap((consumer) => consumer.issues.map((issue) => `${consumer.file}: ${issue}`)) };
}

function forPacket(packet) {
  return core.compareVersions(packet.upgrade.target.targetVersion, '9.3.0') >= 0
    ? inspect(packet.client.path) : { requirementId: 'REQ-9.3.0-FRONTEND-01', consumers: [], issues: [] };
}

module.exports = { inspect, inspectTemplate, migrateTemplate, migrate, forPacket };
