'use strict';

function typeOk(value, type) {
  if (Array.isArray(type)) return type.some((entry) => typeOk(value, entry));
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'integer': return Number.isInteger(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'boolean': return typeof value === 'boolean';
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'null': return value === null;
    default: return true;
  }
}

function validate(instance, schema, where) {
  const errors = [];
  where = where || 'value';
  if (schema.type && !typeOk(instance, schema.type)) return [`${where}: wrong type`];
  if (schema.enum && !schema.enum.includes(instance)) errors.push(`${where}: '${instance}' not in enum`);
  if (schema.const !== undefined && instance !== schema.const) errors.push(`${where}: must equal '${schema.const}'`);
  if (typeof instance === 'string' && schema.pattern && !new RegExp(schema.pattern).test(instance)) errors.push(`${where}: fails pattern`);
  if (typeof instance === 'string' && schema.minLength !== undefined && instance.length < schema.minLength) errors.push(`${where}: too short`);
  if (Array.isArray(instance) && schema.minItems !== undefined && instance.length < schema.minItems) errors.push(`${where}: too few items`);
  for (const required of schema.required || []) if (!instance || !Object.prototype.hasOwnProperty.call(instance, required)) errors.push(`${where}: missing '${required}'`);
  for (const [key, spec] of Object.entries(schema.properties || {})) {
    if (instance && Object.prototype.hasOwnProperty.call(instance, key)) errors.push(...validate(instance[key], spec, `${where}.${key}`));
  }
  if (schema.additionalProperties === false && typeOk(instance, 'object')) {
    for (const key of Object.keys(instance)) if (!Object.prototype.hasOwnProperty.call(schema.properties || {}, key)) errors.push(`${where}: unexpected '${key}'`);
  }
  if (schema.items && Array.isArray(instance)) instance.forEach((item, index) => errors.push(...validate(item, schema.items, `${where}[${index}]`)));
  return errors;
}

module.exports = { typeOk, validate };