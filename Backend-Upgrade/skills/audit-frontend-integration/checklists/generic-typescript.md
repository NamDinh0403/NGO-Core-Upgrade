# Checklist — generic TypeScript project

For non-Angular or UNKNOWN front-ends, verify the TypeScript configuration graph.

- [ ] `package.json` + lockfile compatibility for the target
- [ ] Root `tsconfig.json` and inherited `tsconfig.*.json` resolved (extends chain)
- [ ] Compiler options compatible with the target toolchain
- [ ] Path mappings / project references resolve
- [ ] `tsc --noEmit` type-check passes (or errors captured with file/line/code)
- [ ] Build (dev + prod where applicable) succeeds
- [ ] Tests run
- [ ] Assets / global styles / scripts referenced still resolve

Do not report success solely because dependency installation succeeded.
