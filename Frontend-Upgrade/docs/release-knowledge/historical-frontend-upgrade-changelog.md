# Frontend Upgrade Changelog (v5.14 to v8.3)

This document summarizes the changes made to the `ngo-client` repository during the migration from `ngo-core` version 5.14 to version 8.3. These changes include dependency updates, structural configurations, state management adjustments, and custom module factory implementations, performed via human and agent collaboration.

## 1. Project Configuration & Dependencies
- **`package.json` & `package-lock.json`**: Upgraded core Angular dependencies, `ngo-core` (to v8.3), and associated libraries.
- **`.npmrc`**: Updated NPM registry or package configurations.
- **`angular.json`**: Updated build architect configurations and asset definitions.
- **`tsconfig.json`**: Modified TypeScript compiler settings for compatibility with the newer Angular/Core versions.
- **`src/polyfills.ts`**: Updated polyfills structure to meet modern Angular build requirements.

## 2. Environment Configuration
- **`src/environments/environment.ts` & `src/environments/environment.prod.ts`**: Upgraded environment definitions for local and production deployment pipelines.

## 3. Application Module & Global Styles
- **`src/app/app.module.ts`**: Added/Removed module imports, routing, and factory extensions based on v8 APIs.
- **`src/styles.scss`**: Fixed global styles to align with the newer frontend component markup and layout rules.

## 4. Feature Modules: State Management (NgRx Effects)
The NgRx effects were comprehensively refactored across custom modules. In version 8.3, `core` state management required adjustments to actions or payload handling:
- `src/app/budget-ext/state/budget-ext.effects.ts`
- `src/app/logframe-ext/state/logframe-ext.effects.ts`
- `src/app/monitoring/state/monitoring.effects.ts`
- `src/app/orgUnit-finance-ext/state/orgUnit-finance-ext.effects.ts`
- `src/app/partner-assessment/state/partner-assessment.effects.ts`
- `src/app/payment-ext/state/payment-ext.effects.ts`
- `src/app/request-funding/state/request-funding.effects.ts`
- `src/app/revised-budget/state/revised-budget.effects.ts`
- `src/app/task-ext/state/task-ext.effects.ts`

## 5. Feature Modules: Forms, Routing, and Logic
Component logic and factory services were updated or created to use the V2 form architecture and respect new routing rules:
- **Budget**:
  - `src/app/budget-ext/budget-ext-form/budget-ext-form.component.ts`
  - `src/app/budget-ext/budget-ext-validator.service.ts`
- **Organizational Unit Finance**:
  - `src/app/orgUnit-finance-ext/org-allocation-form/org-allocation-form.component.ts`
  - `src/app/orgUnit-finance-ext/orgUnit-allocation-ext-list/orgUnit-allocation-ext-list.component.ts`
  - `src/app/orgUnit-finance-ext/orgUnit-finance-route-ext.service.ts`
- **Payment & Project Finance**:
  - `src/app/payment-ext/payment-ext-factory.service.ts`
  - `src/app/project-finance-ext/project-finance-route-ext.service.ts`

## 6. Logframe V2 Migration (New Files)
The logframe forms were fully upgraded to the core V2 logframe architecture. Custom factories were newly created to implement client-specific form configurations and option metadata filtering (themes):
- **`(New)`** `src/app/logframe-ext/logframe2-objective-form-factory-ext.service.ts`
- **`(New)`** `src/app/logframe-ext/logframe2-inditcator-form-factory-ext.service.ts`
- **`(New)`** `src/app/logframe-ext/logframe2-indicator-view-form-factory-ext.service.ts`

## 7. Shared Services
- `src/app/shared/forms/form-field-factory-ext.service.ts`: Adjusted form generation logic to adhere to v8.3 field schemas.
- `src/app/shared/services/utilities.service.ts`: Upgraded shared logical helpers.

## 8. Development & Tooling Resources (New Files)
- **`(New)`** `upgrade-install.ps1`: Added a script to automate environment upgrades and clean installations.
- **`(New)`** `Frontend-Upgrade/`: A dedicated workspace directory featuring configuration agents, instructions, and rules sets created to orchestrate this exact upgrade process.

---
*Note: This log represents the local uncommitted changes and un-tracked workspace files actively worked out during the v8.3 upgrade branch lifecycle.*