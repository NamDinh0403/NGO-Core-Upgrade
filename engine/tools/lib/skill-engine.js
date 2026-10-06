'use strict';
const fs = require('fs');
const path = require('path');
const schema = require('./schema');
const policy = require('./policy');
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');

function create(options) {
  const ROOT = options.root;
  const P = (...parts) => options.resolve ? options.resolve(ROOT, ...parts) : path.join(ROOT, ...parts);
  const CAPABILITY_LEVEL = options.capabilities;
  const levelOf = (capability) => Object.prototype.hasOwnProperty.call(CAPABILITY_LEVEL, capability) ? CAPABILITY_LEVEL[capability] : 2;
  let registry = null;
  function loadRegistry() {
    if (!registry) registry = options.yaml.parse(fs.readFileSync(P('skills/registry.yaml'), 'utf8'));
    return registry;
  }
  const skills = () => loadRegistry().skills || [];
  const getSkill = (id) => skills().find((skill) => skill.id === id) || null;
  function validateSkillIO(id, io, instance) {
    const skill = getSkill(id);
    if (!skill) return [`unknown skill ${id}`];
    const relative = io === 'input' ? skill.inputSchema : skill.outputSchema;
    if (!relative || !fs.existsSync(P(relative))) return [`missing ${io} schema for ${id}`];
    return schema.validate(instance, JSON.parse(fs.readFileSync(P(relative), 'utf8')), `${id}.${io}`);
  }
  function isValidTransition(from, to) {
    if (to === 'developer-escalation') return true;
    const skill = getSkill(from);
    return !!skill && Array.isArray(skill.allowedNextSkills) && skill.allowedNextSkills.includes(to);
  }
  function capabilityActivation(required, available) {
    const have = new Set(available || []);
    const activateNow = [], missingBlocking = [];
    for (const capability of required || []) {
      if (!have.has(capability)) (levelOf(capability) <= 1 ? missingBlocking : activateNow).push(capability);
    }
    return { activateNow, missingBlocking, planningBlocked: false };
  }
  function recordInvocation(dir, invocation) {
    dir = path.isAbsolute(dir) ? dir : P(dir);
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'skill-invocations.jsonl'), JSON.stringify(Object.assign({ recordedAt: nowIso() }, invocation)) + '\n');
  }
  const mutationGate = (context) => policy.mutationGate(context, options.domainReasons);
  return Object.assign({}, policy, {
    ROOT, P, nowIso, CAPABILITY_LEVEL, levelOf, loadRegistry, skills, getSkill,
    validate: schema.validate, validateSkillIO, isValidTransition,
    mutationGate, capabilityActivation, recordInvocation,
    selectSkill: (context) => options.select(context || {}, mutationGate),
  });
}

module.exports = { create, nowIso };