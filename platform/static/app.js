'use strict';
/**
 * NGO Core Upgrade Platform — Developer Control Center Client
 *
 * Implements:
 * - 4-step guided New Upgrade flow (Workspace -> Preflight -> Safety Gates -> Confirm & Launch)
 * - Subtabs for Evidence Inspector, Working Tree Conflicts, and Traceable Plan
 * - Expandable Evidence Inspector rows with command, duration, and remediation details
 * - IDE-style split execution monitor with severity-filtered logs, copy/download, and search
 * - Split results review with verification matrix, risk assessment, and colorized git diff
 * - Honest observed telemetry ledger
 * - Copilot CLI and environment diagnostics
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const viewTitle = document.getElementById('view-title');
  const activeJobIndicator = document.getElementById('active-job-indicator');

  // Topbar & Health elements
  const cliHealthBadge = document.getElementById('cli-health-badge');
  const connectionBadge = document.getElementById('connection-badge');
  const systemHealthDot = document.getElementById('system-health-dot');
  const systemHealthText = document.getElementById('system-health-text');

  // Dashboard elements
  const dashPlatformStatus = document.getElementById('dash-platform-status');
  const dashPlatformUptime = document.getElementById('dash-platform-uptime');
  const dashCliStatus = document.getElementById('dash-cli-status');
  const dashCliAccount = document.getElementById('dash-cli-account');
  const dashTotalJobs = document.getElementById('dash-total-jobs');
  const dashSuccessJobs = document.getElementById('dash-success-jobs');
  const dashTotalChecks = document.getElementById('dash-total-checks');
  const activeUpgradeBanner = document.getElementById('active-upgrade-banner');
  const activeBannerClient = document.getElementById('active-banner-client');
  const btnViewActive = document.getElementById('btn-view-active');
  const btnRefreshHistory = document.getElementById('btn-refresh-history');
  const historyTableBody = document.getElementById('history-table-body');

  // Wizard Stepper elements (New Upgrade)
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const wizardPanes = document.querySelectorAll('.wizard-pane');
  const btnStep2Back = document.getElementById('btn-step2-back');
  const btnStep2Next = document.getElementById('btn-step2-next');
  const btnStep3Back = document.getElementById('btn-step3-back');
  const btnStep3Next = document.getElementById('btn-step3-next');
  const btnStep4Back = document.getElementById('btn-step4-back');
  const btnRerunPreflight = document.getElementById('btn-rerun-preflight');

  // Step 1: Workspace Selection elements
  const projectSelect = document.getElementById('project-select');
  const clientPathHint = document.getElementById('client-path-hint');
  const currentVersionDisplay = document.getElementById('current-version-display');
  const targetVersionSelect = document.getElementById('target-version-select');
  const trackBackend = document.getElementById('track-backend');
  const trackFrontend = document.getElementById('track-frontend');
  const simulateCopilot = document.getElementById('simulate-copilot');
  const copilotModelSelect = document.getElementById('copilot-model-select');
  const customModelContainer = document.getElementById('custom-model-container');
  const customCopilotModel = document.getElementById('custom-copilot-model');
  const copilotModelDesc = document.getElementById('copilot-model-desc');
  const upgradeModeSelect = document.getElementById('upgrade-mode-select');
  const upgradeModeBadge = document.getElementById('upgrade-mode-badge');
  const upgradeModeDesc = document.getElementById('upgrade-mode-desc');
  const step1AuthDetails = document.getElementById('step1-auth-details');
  const btnOpenNugetAuthStep1 = document.getElementById('btn-open-nuget-auth-step1');
  const btnPreflight = document.getElementById('btn-preflight');

  // Step 2: Preflight & Evidence Inspector elements
  const resolutionModeBadge = document.getElementById('resolution-mode-badge');
  const upgradeModeStep2Badge = document.getElementById('upgrade-mode-step2-badge');
  const selectedModelPillStep2 = document.getElementById('selected-model-pill-step2');
  const preflightAuthAlert = document.getElementById('preflight-auth-alert');
  const preflightAuthMsg = document.getElementById('preflight-auth-msg');
  const preflightAuthIdentity = document.getElementById('preflight-auth-identity');
  const btnQuickConnectAzure = document.getElementById('btn-quick-connect-azure');
  const btnOpenNugetModalStep2 = document.getElementById('btn-open-nuget-modal-step2');
  const evPackage = document.getElementById('ev-package');
  const evDiff = document.getElementById('ev-diff');
  const evCompat = document.getElementById('ev-compat');
  const evGit = document.getElementById('ev-git');
  const evidenceInspectorCount = document.getElementById('evidence-inspector-count');
  const evidenceInspectorCountTab = document.getElementById('evidence-inspector-count-tab');
  const evidenceInspectorTbody = document.getElementById('evidence-inspector-tbody');
  const subTabBtns = document.querySelectorAll('.sub-tab-btn');
  const subTabContents = document.querySelectorAll('.sub-tab-content');
  const evidenceBreakdownBox = document.getElementById('evidence-breakdown-box');
  const workingTreeDetailsBox = document.getElementById('working-tree-details-box');
  const planDerivationBadge = document.getElementById('plan-derivation-badge');
  const planTasksTbody = document.getElementById('plan-tasks-tbody');

  // Step 3: Safety Gates elements
  const preflightAlerts = document.getElementById('preflight-alerts');
  const safetyDecisionBadge = document.getElementById('safety-decision-badge');
  const gateLayerExecution = document.getElementById('gate-layer-execution');
  const gateLayerEvidence = document.getElementById('gate-layer-evidence');
  const gateLayerValidation = document.getElementById('gate-layer-validation');
  const gateLayerDecision = document.getElementById('gate-layer-decision');
  const safetyBlockersContainer = document.getElementById('safety-blockers-container');
  const safetyWarningsContainer = document.getElementById('safety-warnings-container');

  // Step 4: Confirm & Launch elements
  const confirmClientName = document.getElementById('confirm-client-name');
  const confirmClientPath = document.getElementById('confirm-client-path');
  const confirmVersionPath = document.getElementById('confirm-version-path');
  const confirmResolutionMode = document.getElementById('confirm-resolution-mode');
  const confirmTracks = document.getElementById('confirm-tracks');
  const confirmCopilotModel = document.getElementById('confirm-copilot-model');
  const confirmUpgradeMode = document.getElementById('confirm-upgrade-mode');
  const confirmUpgradeDesc = document.getElementById('confirm-upgrade-desc');
  const confirmEngineMode = document.getElementById('confirm-engine-mode');
  const confirmSafetyStatus = document.getElementById('confirm-safety-status');
  const confirmBlockersCount = document.getElementById('confirm-blockers-count');
  const launchReadyBadge = document.getElementById('launch-ready-badge');
  const startDisabledReason = document.getElementById('start-disabled-reason');
  const btnStart = document.getElementById('btn-start');

  // Live Execution elements
  const execJobTitle = document.getElementById('exec-job-title');
  const execJobId = document.getElementById('exec-job-id');
  const jobStatusBadge = document.getElementById('job-status-badge');
  const btnCancel = document.getElementById('btn-cancel');
  const btnResume = document.getElementById('btn-resume');
  const btnRefreshJob = document.getElementById('btn-refresh-job');
  const btnViewResultsShortcut = document.getElementById('btn-view-results-shortcut');
  const stageStepper = document.getElementById('stage-stepper');
  const trackBackendPill = document.getElementById('track-backend-pill');
  const trackFrontendPill = document.getElementById('track-frontend-pill');
  const upgradeModePill = document.getElementById('upgrade-mode-pill');
  const copilotModelPill = document.getElementById('copilot-model-pill');
  const repairIterationsPill = document.getElementById('repair-iterations-pill');
  const terminalOutput = document.getElementById('terminal-output');
  const autoscrollCheck = document.getElementById('autoscroll-check');
  const btnClearLog = document.getElementById('btn-clear-log');
  const btnCopyLog = document.getElementById('btn-copy-log');
  const btnDownloadLog = document.getElementById('btn-download-log');
  const logSearchInput = document.getElementById('log-search-input');
  const pillFilters = document.querySelectorAll('.pill-filter');

  // Results & Review elements
  const verificationSummaryBadge = document.getElementById('verification-summary-badge');
  const checksTableBody = document.getElementById('checks-table-body');
  const copilotReviewText = document.getElementById('copilot-review-text');
  const reviewRisksBox = document.getElementById('review-risks-box');
  const diffStatsLabel = document.getElementById('diff-stats-label');
  const diffOutput = document.getElementById('diff-output');
  const btnCopyDiff = document.getElementById('btn-copy-diff');
  const commitMessageInput = document.getElementById('commit-message');
  const confirmCommitCheck = document.getElementById('confirm-commit-check');
  const btnApproveCommit = document.getElementById('btn-approve-commit');

  // Usage & Analytics elements
  const telemCopilotCalls = document.getElementById('telem-copilot-calls');
  const telemCopilotTime = document.getElementById('telem-copilot-time');
  const telemDeterministicChecks = document.getElementById('telem-deterministic-checks');
  const telemFilesUpdated = document.getElementById('telem-files-updated');
  const telemetryTableBody = document.getElementById('telemetry-table-body');

  // Settings & Diagnostics elements
  const btnRetestCli = document.getElementById('btn-retest-cli');
  const diagCliStatus = document.getElementById('diag-cli-status');
  const diagCliPath = document.getElementById('diag-cli-path');
  const diagCliVersion = document.getElementById('diag-cli-version');
  const diagCliAccount = document.getElementById('diag-cli-account');
  const diagCliCredSource = document.getElementById('diag-cli-cred-source');
  const diagCliModel = document.getElementById('diag-cli-model');
  const diagCliNoninteractive = document.getElementById('diag-cli-noninteractive');
  const diagCliTimestamp = document.getElementById('diag-cli-timestamp');
  const diagCliRemediation = document.getElementById('diag-cli-remediation');
  const envToolsTableBody = document.getElementById('env-tools-table-body');
  const settingWorkspaceRoots = document.getElementById('setting-workspace-roots');
  const settingCorePath = document.getElementById('setting-core-path');
  const settingTimeout = document.getElementById('setting-timeout');
  const settingConcurrency = document.getElementById('setting-concurrency');
  const settingCopilotModel = document.getElementById('setting-copilot-model');
  const settingCustomModelContainer = document.getElementById('setting-custom-model-container');
  const settingCustomCopilotModel = document.getElementById('setting-custom-copilot-model');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const settingsSaveAlert = document.getElementById('settings-save-alert');
  const nugetSourcesTbody = document.getElementById('nuget-sources-tbody');
  const btnTestAllFeeds = document.getElementById('btn-test-all-feeds');
  const btnRefreshFeedCache = document.getElementById('btn-refresh-feed-cache');
  const nugetAlertBox = document.getElementById('nuget-alert-box');
  const nugetDiagDrawer = document.getElementById('nuget-diag-drawer');
  const nugetDrawerTitle = document.getElementById('nuget-drawer-title');
  const nugetDrawerContent = document.getElementById('nuget-drawer-content');
  const btnCloseNugetDrawer = document.getElementById('btn-close-nuget-drawer');

  // NuGet Auth Modal elements
  const nugetAuthModal = document.getElementById('nuget-auth-modal');
  const btnCloseNugetModal = document.getElementById('btn-close-nuget-modal');
  const btnCancelNugetModal = document.getElementById('btn-cancel-nuget-modal');
  const modalAzureCliUser = document.getElementById('modal-azure-cli-user');
  const modalGitUser = document.getElementById('modal-git-user');
  const modalAuthStatusPill = document.getElementById('modal-auth-status-pill');
  const btnModalConnectAzure = document.getElementById('btn-modal-connect-azure');
  const modalPatInput = document.getElementById('modal-pat-input');
  const btnModalSavePat = document.getElementById('btn-modal-save-pat');
  const btnModalClearPat = document.getElementById('btn-modal-clear-pat');
  const modalAuthFeedback = document.getElementById('modal-auth-feedback');

  // Settings NuGet Auth elements
  const settingsNugetAuthBadge = document.getElementById('settings-nuget-auth-badge');
  const settingsAuthIdentityDetails = document.getElementById('settings-auth-identity-details');
  const btnSettingsConnectAzure = document.getElementById('btn-settings-connect-azure');
  const settingAzurePat = document.getElementById('setting-azure-pat');
  const btnSaveAzurePat = document.getElementById('btn-save-azure-pat');
  const btnClearAzurePat = document.getElementById('btn-clear-azure-pat');
  const btnTestNugetFeeds = document.getElementById('btn-test-nuget-feeds');
  const settingsNugetFeedback = document.getElementById('settings-nuget-feedback');
  const settingDefaultUpgradeMode = document.getElementById('setting-default-upgrade-mode');

  // State variables
  let projects = [];
  let availableVersions = [];
  let selectedProject = null;
  let activeJobId = null;
  let activeJob = null;
  let jobPollTimer = null;
  let rawLogLines = [];
  let currentLogLevelFilter = 'ALL';
  let currentLogSearch = '';
  let preflightResult = null;
  let currentWizardStep = 1;

  // View titles map
  const viewTitles = {
    'dashboard': 'Dashboard & System Health',
    'new-upgrade': 'New Upgrade Planning & Execution',
    'live-execution': 'Live Upgrade Execution Monitor',
    'results-review': 'Verification Results & Git Diff Review',
    'usage-analytics': 'Usage & Telemetry Ledger',
    'settings-diagnostics': 'Settings & System Diagnostics'
  };

  // ---------------------------------------------------------------------------
  // 1. Navigation Controller
  // ---------------------------------------------------------------------------
  function switchView(viewId) {
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    viewPanels.forEach(panel => {
      if (panel.id === `view-${viewId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (viewTitles[viewId]) {
      viewTitle.textContent = viewTitles[viewId];
    }

    if (window.location.hash !== `#${viewId}`) {
      window.location.hash = viewId;
    }

    if (viewId === 'dashboard') {
      loadSystemSummary();
      loadJobsList();
    } else if (viewId === 'usage-analytics') {
      loadAnalytics();
    } else if (viewId === 'settings-diagnostics') {
      loadDiagnostics();
      loadSettings();
      loadAccountIdentity();
      loadNuGetSources();
    } else if (viewId === 'results-review' && activeJobId) {
      loadResultsAndDiff(activeJobId);
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view');
      switchView(viewId);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    switchView(hash);
  });

  if (btnViewActive) {
    btnViewActive.addEventListener('click', () => switchView('live-execution'));
  }

  if (btnViewResultsShortcut) {
    btnViewResultsShortcut.addEventListener('click', () => {
      switchView('results-review');
      if (activeJobId) loadResultsAndDiff(activeJobId);
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Wizard Stepper Controller (New Upgrade 4-Step Flow)
  // ---------------------------------------------------------------------------
  function goToWizardStep(stepNum) {
    // If attempting to go to steps 2, 3, or 4 without selecting project and target, warn
    if (stepNum > 1 && (!selectedProject || !targetVersionSelect.value)) {
      alert('Please select both a client repository and target Core version in Step 1 first.');
      return;
    }

    // If attempting to go to steps 3 or 4 without running preflight, run it first
    if (stepNum > 2 && !preflightResult) {
      alert('Preflight has not been evaluated yet. Running preflight checks...');
      runPreflight().then(() => {
        if (preflightResult) goToWizardStep(stepNum);
      });
      return;
    }

    currentWizardStep = stepNum;

    // Update wizard steps header
    wizardSteps.forEach(btn => {
      const step = parseInt(btn.getAttribute('data-step'), 10);
      btn.classList.remove('active');
      if (step === stepNum) {
        btn.classList.add('active');
      }
      if (step < stepNum && preflightResult) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }
    });

    // Toggle panes
    wizardPanes.forEach(pane => {
      if (pane.id === `wizard-pane-${stepNum}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Populate confirmation step if arriving at step 4
    if (stepNum === 4) {
      populateConfirmationStep();
    }
  }

  wizardSteps.forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.getAttribute('data-step'), 10);
      goToWizardStep(step);
    });
  });

  if (btnStep2Back) btnStep2Back.addEventListener('click', () => goToWizardStep(1));
  if (btnStep2Next) btnStep2Next.addEventListener('click', () => goToWizardStep(3));
  if (btnStep3Back) btnStep3Back.addEventListener('click', () => goToWizardStep(2));
  if (btnStep3Next) btnStep3Next.addEventListener('click', () => goToWizardStep(4));
  if (btnStep4Back) btnStep4Back.addEventListener('click', () => goToWizardStep(3));
  if (btnRerunPreflight) btnRerunPreflight.addEventListener('click', () => runPreflight());

  // Subtabs switching in Step 2
  subTabBtns.forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      subTabBtns.forEach(b => b.classList.remove('active'));
      subTabContents.forEach(c => c.classList.remove('active'));

      tabBtn.classList.add('active');
      const subtabId = tabBtn.getAttribute('data-subtab');
      const targetContent = document.getElementById(`subtab-${subtabId}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. System Summary & Initial Data Loading
  // ---------------------------------------------------------------------------
  async function loadSystemSummary() {
    try {
      const res = await fetch('/api/diagnostics/summary');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (data.ok && data.summary) {
        const s = data.summary;
        dashPlatformStatus.textContent = s.status;
        dashPlatformStatus.className = s.status === 'HEALTHY' ? 'stat-value text-success' : 'stat-value text-warning';
        dashPlatformUptime.textContent = `Uptime: ${s.uptimeSec}s • Mem: ${s.memoryUsageMb} MB`;

        systemHealthDot.className = s.status === 'HEALTHY' ? 'health-dot' : 'health-dot warning';
        systemHealthText.textContent = `System ${s.status}`;

        if (s.copilotCli) {
          dashCliStatus.textContent = s.copilotCli.authenticated ? 'AUTHENTICATED' : (s.copilotCli.available ? 'AVAILABLE' : 'OFFLINE');
          dashCliStatus.className = s.copilotCli.authenticated ? 'stat-value text-success' : 'stat-value text-info';
          dashCliAccount.textContent = s.copilotCli.identity ? `Account: ${s.copilotCli.identity}` : (s.copilotCli.credentialSource || 'No account');

          if (cliHealthBadge) {
            cliHealthBadge.textContent = s.copilotCli.authenticated ? `Copilot CLI: ${s.copilotCli.identity || 'Ready'}` : 'Copilot CLI: Local Fallback';
            cliHealthBadge.className = s.copilotCli.authenticated ? 'badge badge-success' : 'badge badge-warning';
          }
        }
      }
    } catch (_) {
      systemHealthDot.className = 'health-dot danger';
      systemHealthText.textContent = 'Server Offline';
      connectionBadge.textContent = 'Disconnected';
      connectionBadge.className = 'badge badge-danger';
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      projects = data.projects || [];

      projectSelect.innerHTML = '<option value="">-- Choose an Approved Client Project --</option>';
      for (const p of projects) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id} (Current: v${p.currentVersion})`;
        projectSelect.appendChild(opt);
      }
    } catch (_) {
      projectSelect.innerHTML = '<option value="">Failed to load client projects</option>';
    }
  }

  async function loadAvailableVersions() {
    try {
      const res = await fetch('/api/versions');
      const data = await res.json();
      availableVersions = data.versions || [];

      targetVersionSelect.innerHTML = '<option value="">-- Select Target NGO Core Version --</option>';
      for (const v of availableVersions) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = `NGO Core v${v}`;
        targetVersionSelect.appendChild(opt);
      }
    } catch (_) {
      targetVersionSelect.innerHTML = '<option value="">Failed to load Core versions</option>';
    }
  }

  let copilotModelsList = [];

  function getSelectedCopilotModel() {
    if (!copilotModelSelect) return 'gpt-4o';
    if (copilotModelSelect.value === 'custom') {
      return (customCopilotModel && customCopilotModel.value.trim()) || 'gpt-4o';
    }
    return copilotModelSelect.value || 'gpt-4o';
  }

  async function loadCopilotModels() {
    try {
      const res = await fetch('/api/copilot/models');
      const data = await res.json();
      if (data.ok && Array.isArray(data.models)) {
        copilotModelsList = data.models;

        const populateSelect = (selectEl, defaultVal) => {
          if (!selectEl) return;
          const currentVal = selectEl.value || defaultVal;
          selectEl.innerHTML = data.models.map(m =>
            `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} &bull; ${escapeHtml(m.description)}</option>`
          ).join('') + '<option value="custom">Custom Model ID...</option>';

          const hasCurrent = data.models.some(m => m.id === currentVal);
          if (hasCurrent) {
            selectEl.value = currentVal;
          } else if (currentVal === 'custom') {
            selectEl.value = 'custom';
          } else {
            selectEl.value = defaultVal || 'gpt-4o';
          }
        };

        populateSelect(copilotModelSelect, data.defaultModel);
        populateSelect(settingCopilotModel, data.defaultModel);
        updateModelDescription();
      }
    } catch (_) {}
  }

  function updateModelDescription() {
    if (!copilotModelSelect || !copilotModelDesc) return;
    const val = copilotModelSelect.value;
    if (val === 'custom') {
      if (customModelContainer) customModelContainer.style.display = 'block';
      copilotModelDesc.textContent = 'Enter any model identifier supported by your GitHub Copilot subscription or CLI wrapper.';
    } else {
      if (customModelContainer) customModelContainer.style.display = 'none';
      const m = copilotModelsList.find(x => x.id === val);
      copilotModelDesc.textContent = m ? m.description : 'Used for semantic code analysis, configuration adjustments, and automated repair.';
    }
  }

  if (copilotModelSelect) {
    copilotModelSelect.addEventListener('change', updateModelDescription);
  }

  if (settingCopilotModel) {
    settingCopilotModel.addEventListener('change', () => {
      if (settingCustomModelContainer) {
        settingCustomModelContainer.style.display = settingCopilotModel.value === 'custom' ? 'block' : 'none';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Account Identity & Authentication Management
  // ---------------------------------------------------------------------------
  let activeIdentity = null;

  async function safeFetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Server returned HTTP ${res.status}: ${text || res.statusText}` };
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
  }

  async function loadAccountIdentity() {
    try {
      const data = await safeFetchJson('/api/nuget/identity');
      if (data && data.ok) {
        activeIdentity = data;
        const azureDisplay = data.azureAccount
          ? `${data.azureAccount} (${data.azureAuthSource === 'azure_cli' ? 'Azure CLI' : 'PAT'})`
          : 'Unauthenticated (No credentials detected)';
        const gitDisplay = data.gitUser ? `${data.gitUser} <${data.gitEmail || ''}>` : 'Git author not configured';

        if (step1AuthDetails) {
          step1AuthDetails.innerHTML = `<strong>Azure / NuGet:</strong> ${escapeHtml(azureDisplay)} &bull; <strong>Git Identity:</strong> ${escapeHtml(gitDisplay)}`;
        }
        if (preflightAuthIdentity) {
          preflightAuthIdentity.textContent = `Detected Azure Account: ${azureDisplay}`;
        }
        if (modalAzureCliUser) {
          modalAzureCliUser.textContent = data.azureAccount || 'Not detected (run "az login" in terminal)';
        }
        if (modalGitUser) {
          modalGitUser.textContent = gitDisplay;
        }
        if (modalAuthStatusPill) {
          modalAuthStatusPill.textContent = data.isAuthenticated ? 'Authenticated' : 'Unauthenticated';
          modalAuthStatusPill.className = data.isAuthenticated ? 'badge badge-success' : 'badge badge-warning';
        }
        if (settingsAuthIdentityDetails) {
          settingsAuthIdentityDetails.innerHTML = `<strong>Azure Account:</strong> ${escapeHtml(azureDisplay)}<br><strong>Git Author:</strong> ${escapeHtml(gitDisplay)}`;
        }
        if (settingsNugetAuthBadge) {
          settingsNugetAuthBadge.textContent = data.isAuthenticated ? 'Connected' : 'Unauthenticated';
          settingsNugetAuthBadge.className = data.isAuthenticated ? 'badge badge-success' : 'badge badge-warning';
        }
      }
    } catch (_) {}
  }

  function openNugetAuthModal() {
    if (nugetAuthModal) {
      nugetAuthModal.style.display = 'flex';
      loadAccountIdentity();
    }
  }

  function closeNugetAuthModal() {
    if (nugetAuthModal) nugetAuthModal.style.display = 'none';
    if (modalAuthFeedback) modalAuthFeedback.style.display = 'none';
  }

  window.openNugetAuthModal = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    openNugetAuthModal();
  };

  async function handleConnectAzureCli(feedbackEl) {
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      feedbackEl.className = 'alert alert-info mt-2';
      feedbackEl.textContent = 'Connecting via Azure CLI and verifying token...';
    }
    try {
      const data = await safeFetchJson('/api/nuget/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use-azure-cli' }),
      });
      if (data && data.ok) {
        if (feedbackEl) {
          feedbackEl.className = 'alert alert-success mt-2';
          feedbackEl.textContent = `Connected! Active identity: ${data.identity}. Re-running package checks...`;
        }
        await loadAccountIdentity();
        if (selectedProject && targetVersionSelect.value) {
          await runPreflight();
        }
        setTimeout(() => {
          closeNugetAuthModal();
        }, 1200);
      } else {
        if (feedbackEl) {
          feedbackEl.className = 'alert alert-danger mt-2';
          feedbackEl.textContent = `Connection failed: ${data?.error || 'Unknown error'}`;
        }
      }
    } catch (err) {
      if (feedbackEl) {
        feedbackEl.className = 'alert alert-danger mt-2';
        feedbackEl.textContent = `Error: ${err.message}`;
      }
    }
  }

  async function handleSavePat(pat, feedbackEl) {
    if (!pat) {
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'alert alert-warning mt-2';
        feedbackEl.textContent = 'Please enter a valid Personal Access Token.';
      }
      return;
    }
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      feedbackEl.className = 'alert alert-info mt-2';
      feedbackEl.textContent = 'Validating PAT against private feed...';
    }
    try {
      const data = await safeFetchJson('/api/nuget/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat }),
      });
      if (data && data.ok) {
        if (feedbackEl) {
          feedbackEl.className = 'alert alert-success mt-2';
          feedbackEl.textContent = `PAT verified & saved! Identity: ${data.identity}. Re-running package checks...`;
        }
        await loadAccountIdentity();
        if (selectedProject && targetVersionSelect.value) {
          await runPreflight();
        }
        setTimeout(() => {
          closeNugetAuthModal();
        }, 1200);
      } else {
        if (feedbackEl) {
          feedbackEl.className = 'alert alert-danger mt-2';
          feedbackEl.textContent = `PAT verification failed: ${data?.error || 'Unknown error'}`;
        }
      }
    } catch (err) {
      if (feedbackEl) {
        feedbackEl.className = 'alert alert-danger mt-2';
        feedbackEl.textContent = `Error: ${err.message}`;
      }
    }
  }

  async function handleClearPat(feedbackEl) {
    try {
      await fetch('/api/nuget/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      if (modalPatInput) modalPatInput.value = '';
      if (settingAzurePat) settingAzurePat.value = '';
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'alert alert-info mt-2';
        feedbackEl.textContent = 'Saved PAT cleared. Defaulting to Azure CLI or credential provider.';
      }
      await loadAccountIdentity();
    } catch (_) {}
  }

  // Modal event listeners
  if (btnOpenNugetAuthStep1) btnOpenNugetAuthStep1.addEventListener('click', openNugetAuthModal);
  if (btnOpenNugetModalStep2) btnOpenNugetModalStep2.addEventListener('click', openNugetAuthModal);
  if (btnCloseNugetModal) btnCloseNugetModal.addEventListener('click', closeNugetAuthModal);
  if (btnCancelNugetModal) btnCancelNugetModal.addEventListener('click', closeNugetAuthModal);
  if (btnQuickConnectAzure) btnQuickConnectAzure.addEventListener('click', () => handleConnectAzureCli(null));
  if (btnModalConnectAzure) btnModalConnectAzure.addEventListener('click', () => handleConnectAzureCli(modalAuthFeedback));
  if (btnModalSavePat) btnModalSavePat.addEventListener('click', () => handleSavePat(modalPatInput ? modalPatInput.value.trim() : '', modalAuthFeedback));
  if (btnModalClearPat) btnModalClearPat.addEventListener('click', () => handleClearPat(modalAuthFeedback));

  // Settings NuGet Auth listeners
  if (btnSettingsConnectAzure) btnSettingsConnectAzure.addEventListener('click', () => handleConnectAzureCli(settingsNugetFeedback));
  if (btnSaveAzurePat) btnSaveAzurePat.addEventListener('click', () => handleSavePat(settingAzurePat ? settingAzurePat.value.trim() : '', settingsNugetFeedback));
  if (btnClearAzurePat) btnClearAzurePat.addEventListener('click', () => handleClearPat(settingsNugetFeedback));
  if (btnTestNugetFeeds) {
    btnTestNugetFeeds.addEventListener('click', async () => {
      settingsNugetFeedback.style.display = 'block';
      settingsNugetFeedback.className = 'alert alert-info mt-2';
      settingsNugetFeedback.textContent = 'Testing feed connectivity and authentication...';
      try {
        const res = await fetch('/api/nuget/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true })
        });
        const data = await res.json();
        if (data.ok) {
          const passCount = (data.results || []).filter(r => r.connectionStatus === 'CONNECTED').length;
          settingsNugetFeedback.className = 'alert alert-success mt-2';
          settingsNugetFeedback.textContent = `Feed test complete: ${passCount}/${(data.results || []).length} connected.`;
        }
      } catch (err) {
        settingsNugetFeedback.className = 'alert alert-danger mt-2';
        settingsNugetFeedback.textContent = `Feed test failed: ${err.message}`;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Upgrade Mode Classification & Preview
  // ---------------------------------------------------------------------------
  function updateUpgradeModePreview() {
    if (!upgradeModeSelect) return;
    const mode = upgradeModeSelect.value;
    const currentVer = selectedProject ? selectedProject.currentVersion : null;
    const targetVer = targetVersionSelect ? targetVersionSelect.value : null;

    let isPatch = false;
    if (currentVer && targetVer) {
      const partsC = currentVer.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
      const partsT = targetVer.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
      isPatch = partsC[0] === partsT[0] && partsC[1] === partsT[1] && partsT[2] > partsC[2];
    }

    if (mode === 'AUTO') {
      if (isPatch) {
        if (upgradeModeBadge) {
          upgradeModeBadge.textContent = '⚡ Auto: Fast Patch';
          upgradeModeBadge.className = 'badge badge-success';
        }
        if (upgradeModeDesc) {
          upgradeModeDesc.textContent = `Patch version bump (v${currentVer} -> v${targetVer}): direct version replacement + deterministic restore & build. Copilot reasoning skipped unless errors occur.`;
        }
      } else {
        if (upgradeModeBadge) {
          upgradeModeBadge.textContent = '🔍 Auto: Full Semantic';
          upgradeModeBadge.className = 'badge badge-primary';
        }
        if (upgradeModeDesc) {
          upgradeModeDesc.textContent = `Major/minor version upgrade: full Core changeset ingestion, Copilot CLI semantic migration reasoning, configuration alignment, and bounded repair loop.`;
        }
      }
    } else if (mode === 'FAST_PATCH') {
      if (upgradeModeBadge) {
        upgradeModeBadge.textContent = '⚡ Fast Patch Mode';
        upgradeModeBadge.className = 'badge badge-success';
      }
      if (upgradeModeDesc) {
        upgradeModeDesc.textContent = 'Direct package version replacement and build/restore verification. Copilot CLI reasoning will be skipped unless compiler errors occur.';
      }
    } else {
      if (upgradeModeBadge) {
        upgradeModeBadge.textContent = '🔍 Full Semantic';
        upgradeModeBadge.className = 'badge badge-primary';
      }
      if (upgradeModeDesc) {
        upgradeModeDesc.textContent = 'Always runs complete Core analysis, Copilot semantic reasoning, and automated repair loop.';
      }
    }
  }

  if (upgradeModeSelect) {
    upgradeModeSelect.addEventListener('change', updateUpgradeModePreview);
  }

  projectSelect.addEventListener('change', () => {
    const projId = projectSelect.value;
    selectedProject = projects.find(p => p.id === projId) || null;
    if (selectedProject) {
      clientPathHint.textContent = selectedProject.path;
      currentVersionDisplay.textContent = `v${selectedProject.currentVersion}`;
    } else {
      clientPathHint.textContent = '';
      currentVersionDisplay.textContent = 'Select a project';
    }
    updateUpgradeModePreview();
    preflightResult = null;
    validateStartPrerequisites();
  });

  targetVersionSelect.addEventListener('change', () => {
    updateUpgradeModePreview();
    preflightResult = null;
    validateStartPrerequisites();
  });
  trackBackend.addEventListener('change', validateStartPrerequisites);
  trackFrontend.addEventListener('change', validateStartPrerequisites);

  // ---------------------------------------------------------------------------
  // 4. Preflight & Evidence Inspection Execution
  // ---------------------------------------------------------------------------
  async function runPreflight() {
    if (!selectedProject || !targetVersionSelect.value) {
      alert('Please select both a client project and a target Core version.');
      return;
    }

    btnPreflight.disabled = true;
    btnPreflight.textContent = 'Running Preflight...';
    if (btnRerunPreflight) {
      btnRerunPreflight.disabled = true;
      btnRerunPreflight.textContent = 'Running...';
    }

    try {
      const tracks = [];
      if (trackBackend.checked) tracks.push('backend');
      if (trackFrontend.checked) tracks.push('frontend');

      const res = await fetch('/api/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientPath: selectedProject.path,
          targetVersion: targetVersionSelect.value,
          tracks,
        }),
      });

      const data = await res.json();
      const p = data.preflight || data;
      preflightResult = p;

      renderPreflightResults(p);
      goToWizardStep(2);
    } catch (err) {
      preflightAlerts.innerHTML = `<div class="alert alert-danger">Preflight check execution failed: ${escapeHtml(err.message)}</div>`;
      preflightResult = null;
    } finally {
      btnPreflight.disabled = false;
      btnPreflight.textContent = 'Run Preflight & Continue →';
      if (btnRerunPreflight) {
        btnRerunPreflight.disabled = false;
        btnRerunPreflight.textContent = 'Re-run Preflight';
      }
      validateStartPrerequisites();
    }
  }

  btnPreflight.addEventListener('click', runPreflight);

  function renderPreflightResults(p) {
    // 1. Badges: Resolution Mode, Upgrade Mode, Selected Model
    resolutionModeBadge.textContent = p.resolutionMode || 'RESOLVED';
    resolutionModeBadge.className = (p.resolutionMode === 'PACKAGE_FIRST' || p.resolutionMode === 'PACKAGE_FIRST_REDUCED_EVIDENCE')
      ? 'badge badge-warning'
      : (p.canProceed ? 'badge badge-success' : 'badge badge-danger');

    if (upgradeModeStep2Badge) {
      upgradeModeStep2Badge.textContent = p.upgradeMode?.name || 'Upgrade';
      upgradeModeStep2Badge.className = 'badge ' + (p.upgradeMode?.badgeClass || 'badge-success');
    }
    if (selectedModelPillStep2) {
      selectedModelPillStep2.textContent = 'Model: ' + getSelectedCopilotModel();
    }

    // Check for NuGet Feed Auth Failure (e.g. 401 Unauthorized as in user screenshot)
    const authFailedCheck = Array.isArray(p.checks) && p.checks.find(c =>
      c.id === 'CHK-PACKAGE-AVAILABILITY' && c.status === 'BLOCKED' &&
      (String(c.failureReason || '').includes('authentication') || String(c.sanitizedOutput || '').includes('401') || String(c.sanitizedOutput || '').includes('UNAUTHENTICATED'))
    );

    if (preflightAuthAlert) {
      if (authFailedCheck) {
        preflightAuthAlert.style.display = 'block';
        if (preflightAuthMsg) {
          preflightAuthMsg.textContent = authFailedCheck.sanitizedOutput || authFailedCheck.failureReason || 'Private NuGet feed requires valid credentials.';
        }
      } else {
        preflightAuthAlert.style.display = 'none';
      }
    }

    // 2. Metrics Grid
    const ev = p.evidence || {};
    if (ev.packageAvailable) {
      evPackage.textContent = `Verified (${ev.packageSource || 'Feed'})`;
      evPackage.className = 'evidence-val text-success';
    } else {
      evPackage.textContent = 'Unverified / Missing';
      evPackage.className = 'evidence-val text-danger';
    }

    if (ev.sourceDiffAvailable) {
      evDiff.textContent = 'Available (Git Diff)';
      evDiff.className = 'evidence-val text-success';
    } else {
      evDiff.textContent = 'Unavailable (Package Mode)';
      evDiff.className = 'evidence-val text-warning';
    }

    if (p.completeness) {
      evCompat.textContent = `${p.completeness.numerator}/${p.completeness.denominator} (${p.completeness.percentage}%)`;
      evCompat.className = p.completeness.percentage >= 80 ? 'evidence-val text-success' : (p.completeness.percentage >= 50 ? 'evidence-val text-warning' : 'evidence-val text-danger');
    } else {
      evCompat.textContent = `${ev.completenessPercent || 0}%`;
    }

    const wt = p.workingTree || {};
    if (wt.isClean) {
      evGit.textContent = 'Clean (Ready)';
      evGit.className = 'evidence-val text-success';
    } else {
      const riskLabel = wt.conflictRisk ? `[${wt.conflictRisk} RISK]` : '';
      evGit.textContent = `Dirty (${(wt.modifiedFiles || []).length} modified ${riskLabel})`;
      evGit.className = wt.conflictRisk === 'HIGH' ? 'evidence-val text-danger' : 'evidence-val text-warning';
    }

    // 3. Evidence Inspector Table with Expandable Row Detail
    if (Array.isArray(p.checks)) {
      if (evidenceInspectorCount) evidenceInspectorCount.textContent = `${p.checks.length} Checks Evaluated`;
      if (evidenceInspectorCountTab) evidenceInspectorCountTab.textContent = `${p.checks.length}`;

      evidenceInspectorTbody.innerHTML = p.checks.map((c, index) => {
        const isAuthBlocked = c.id === 'CHK-PACKAGE-AVAILABILITY' && c.status === 'BLOCKED' &&
          (String(c.failureReason || '').includes('authentication') || String(c.sanitizedOutput || '').includes('401') || String(c.sanitizedOutput || '').includes('UNAUTHENTICATED'));
        const authActionBtn = isAuthBlocked
          ? `<br><button type="button" class="btn btn-warning btn-xs mt-1" onclick="window.openNugetAuthModal(event)">🔑 Authenticate Feed...</button>`
          : '';

        return `
          <tr class="expandable-row" onclick="window.toggleCheckRowDetail(${index})">
            <td>
              <code>${escapeHtml(c.id)}</code><br>
              <strong>${escapeHtml(c.name)}</strong>
            </td>
            <td><span class="badge ${c.status === 'PASS' ? 'badge-success' : (c.status === 'WARNING' ? 'badge-warning' : 'badge-danger')}">${escapeHtml(c.status)}</span></td>
            <td><small><code>${escapeHtml(c.sourceOrCommand || '--')}</code></small></td>
            <td><small>${escapeHtml(c.sanitizedOutput || c.failureReason || '--')}</small></td>
            <td>
              <small class="text-muted">${escapeHtml(c.remediation || 'None required')}</small>
              ${authActionBtn}
            </td>
          </tr>
          <tr id="check-detail-row-${index}" class="detail-drawer-row" style="display:none;">
            <td colspan="5">
              <div class="detail-drawer-box">
                <div><strong>Full Check Command / Operation:</strong> <code>${escapeHtml(c.sourceOrCommand || 'N/A')}</code></div>
                <div><strong>Observed Output:</strong> <pre class="diff-body mt-1" style="max-height:120px;">${escapeHtml(c.sanitizedOutput || c.failureReason || 'No detailed output recorded')}</pre></div>
                <div><strong>Remediation Guidance:</strong> ${escapeHtml(c.remediation || 'Safe to proceed.')}</div>
                <div><strong>Execution Duration:</strong> ${c.durationMs ? c.durationMs + ' ms' : '< 1 ms'}</div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 4. Working Tree & Conflicts Explorer Tab
    if (evidenceBreakdownBox) {
      let breakdownHtml = '';
      if (p.completeness && (p.completeness.missingRequired.length > 0 || p.completeness.missingOptional.length > 0)) {
        breakdownHtml += `
          <div class="alert alert-info text-sm mb-2">
            <strong>Evidence Boundary Breakdown:</strong><br>
            ${p.completeness.missingRequired.length > 0 ? `<span class="text-danger">Missing Required Evidence: ${p.completeness.missingRequired.join(', ')}</span><br>` : ''}
            ${p.completeness.missingOptional.length > 0 ? `<span class="text-muted">Missing Optional Evidence: ${p.completeness.missingOptional.join(', ')}</span>` : ''}
          </div>
        `;
      }
      evidenceBreakdownBox.innerHTML = breakdownHtml;
      evidenceBreakdownBox.style.display = breakdownHtml ? 'block' : 'none';
    }

    if (workingTreeDetailsBox) {
      if (wt.isClean) {
        workingTreeDetailsBox.innerHTML = `
          <div class="alert alert-success">
            <strong>Working Tree is Clean:</strong> No uncommitted modifications or untracked target files detected. Workspace is in an approved clean state.
          </div>
        `;
      } else {
        const files = wt.modifiedFiles || [];
        const conflictFiles = wt.conflictingFiles || [];
        workingTreeDetailsBox.innerHTML = `
          <div class="alert ${wt.conflictRisk === 'HIGH' ? 'alert-danger' : 'alert-warning'} mb-2">
            <strong>Working Tree has ${files.length} Uncommitted Changes (${wt.conflictRisk || 'LOW'} CONFLICT RISK):</strong><br>
            ${wt.conflictRisk === 'HIGH' ? '<span class="text-danger">Files matching target upgrade patterns (.csproj, package.json, appsettings) are dirty! Proceeding would risk clobbering uncommitted work.</span>' : '<span class="text-warning">Non-conflicting dirty files detected.</span>'}
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>File Path</th>
                  <th>Classification</th>
                  <th>Risk Level</th>
                  <th>Safety Action</th>
                </tr>
              </thead>
              <tbody>
                ${files.map(f => {
                  const isConflict = conflictFiles.includes(f);
                  return `
                    <tr>
                      <td><code>${escapeHtml(f)}</code></td>
                      <td>${isConflict ? 'Target Upgrade File' : 'Peripheral File'}</td>
                      <td><span class="badge ${isConflict ? 'badge-danger' : 'badge-warning'}">${isConflict ? 'HIGH CONFLICT RISK' : 'LOW RISK'}</span></td>
                      <td>${isConflict ? 'Must stash or commit before upgrade' : 'Will be preserved'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    // 5. Traceable Plan Preview Tab
    if (planTasksTbody && Array.isArray(p.tasks) && p.tasks.length > 0) {
      if (planDerivationBadge) {
        planDerivationBadge.textContent = 'DERIVED FROM INSPECTED CLIENT FILES';
        planDerivationBadge.className = 'badge badge-success';
      }
      planTasksTbody.innerHTML = p.tasks.map(t => `
        <tr>
          <td>
            <span class="badge badge-secondary">${escapeHtml(t.track)}</span>
            <strong>${escapeHtml(t.title)}</strong><br>
            <small class="text-muted">${escapeHtml(t.reason)}</small>
          </td>
          <td><code>${escapeHtml(pathBasename(t.file))}</code></td>
          <td><code>${escapeHtml(t.currentValue)}</code> &rarr; <strong class="text-accent">${escapeHtml(t.targetValue)}</strong></td>
          <td><small>${escapeHtml(t.verification)}</small></td>
        </tr>
      `).join('');
    } else if (planTasksTbody) {
      planTasksTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No upgrade tasks derived from client inspection.</td></tr>';
    }

    // 6. Step 3 Safety Decision Breakdown
    const hasBlockers = !p.canProceed || (p.blockers && p.blockers.length > 0);
    const hasWarnings = p.warnings && p.warnings.length > 0;

    safetyDecisionBadge.textContent = hasBlockers ? 'MUTATION BLOCKED' : (hasWarnings ? 'MUTATION PERMITTED WITH WARNINGS' : 'MUTATION PERMITTED');
    safetyDecisionBadge.className = hasBlockers ? 'badge badge-danger' : (hasWarnings ? 'badge badge-warning' : 'badge badge-success');

    gateLayerExecution.textContent = p.checks?.every(c => c.status !== 'FAIL') ? 'PASS' : 'FAIL';
    gateLayerExecution.className = gateLayerExecution.textContent === 'PASS' ? 'stat-value text-success' : 'stat-value text-danger';

    gateLayerEvidence.textContent = p.completeness?.isComplete ? 'COMPLETE' : (p.resolutionMode?.includes('REDUCED') ? 'REDUCED' : 'VERIFIED');
    gateLayerEvidence.className = 'stat-value text-info';

    gateLayerValidation.textContent = hasBlockers ? 'VIOLATED' : 'SATISFIED';
    gateLayerValidation.className = hasBlockers ? 'stat-value text-danger' : 'stat-value text-success';

    gateLayerDecision.textContent = p.safetyDecision || (hasBlockers ? 'BLOCKED' : 'PASS');
    gateLayerDecision.className = hasBlockers ? 'stat-value text-danger' : 'stat-value text-success';

    // Alerts in Step 3
    if (hasBlockers) {
      const blockerList = (p.blockers || []).map(b => `<li>${escapeHtml(b)}</li>`).join('');
      preflightAlerts.innerHTML = `
        <div class="alert alert-danger">
          <strong>Mutation Blocked by Safety Gates (${escapeHtml(p.safetyDecision || 'BLOCKED')}):</strong>
          <ul class="mt-1">${blockerList}</ul>
        </div>
      `;
      safetyBlockersContainer.innerHTML = `
        <div class="card p-3 mb-2" style="border-left: 3px solid var(--danger);">
          <strong class="text-danger">Active Blockers Requiring Developer Resolution:</strong>
          <ul class="mt-2 text-sm">${(p.blockers || []).map(b => `<li>${escapeHtml(b)} &bull; <em>Remediation: clean working tree or publish matching package.</em></li>`).join('')}</ul>
        </div>
      `;
    } else {
      preflightAlerts.innerHTML = `
        <div class="alert alert-success">
          <strong>All Safety Gates Passed:</strong> Client workspace verified and safe to mutate according to configured upgrade policy.
        </div>
      `;
      safetyBlockersContainer.innerHTML = '';
    }

    if (hasWarnings) {
      safetyWarningsContainer.innerHTML = `
        <div class="card p-3 mb-2" style="border-left: 3px solid var(--warning);">
          <strong class="text-warning">Safety Warnings (Non-Blocking):</strong>
          <ul class="mt-2 text-sm">${(p.warnings || []).map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
        </div>
      `;
    } else {
      safetyWarningsContainer.innerHTML = '';
    }

    if (btnStep3Next) {
      btnStep3Next.disabled = hasBlockers;
      if (hasBlockers) {
        btnStep3Next.title = 'Resolve blockers before proceeding to launch confirmation.';
      } else {
        btnStep3Next.title = '';
      }
    }
  }

  window.toggleCheckRowDetail = function(index) {
    const detailRow = document.getElementById(`check-detail-row-${index}`);
    if (detailRow) {
      detailRow.style.display = detailRow.style.display === 'none' ? 'table-row' : 'none';
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Confirmation Step Population & Start Prerequisite Validation
  // ---------------------------------------------------------------------------
  function populateConfirmationStep() {
    if (!selectedProject || !targetVersionSelect.value || !preflightResult) return;

    confirmClientName.textContent = selectedProject.id;
    confirmClientPath.textContent = selectedProject.path;
    confirmVersionPath.textContent = `v${selectedProject.currentVersion} → v${targetVersionSelect.value}`;
    confirmResolutionMode.textContent = preflightResult.resolutionMode || 'Package-First Discovery';

    const tracks = [];
    if (trackBackend.checked) tracks.push('Backend (.NET)');
    if (trackFrontend.checked) tracks.push('Frontend (Angular)');
    confirmTracks.textContent = tracks.join(', ') || 'None';

    confirmEngineMode.textContent = simulateCopilot.checked ? 'Simulation Mode (Deterministic Mock)' : 'GitHub Copilot CLI Child Process';

    if (confirmCopilotModel) {
      confirmCopilotModel.textContent = getSelectedCopilotModel();
    }

    const mode = upgradeModeSelect ? upgradeModeSelect.value : 'AUTO';
    const isFastPatch = mode === 'FAST_PATCH' || (mode === 'AUTO' && preflightResult.upgradeMode?.isPatch);
    if (confirmUpgradeMode) {
      confirmUpgradeMode.textContent = isFastPatch ? '⚡ Fast Patch Mode' : '🔍 Full Semantic Mode';
      confirmUpgradeMode.className = isFastPatch ? 'summary-value text-success' : 'summary-value text-primary';
    }
    if (confirmUpgradeDesc) {
      confirmUpgradeDesc.textContent = isFastPatch
        ? 'Direct package bump & restore (Copilot skipped unless build fails)'
        : 'Full semantic Core analysis, Copilot migration reasoning & repair';
    }

    const hasBlockers = !preflightResult.canProceed || (preflightResult.blockers && preflightResult.blockers.length > 0);
    confirmSafetyStatus.textContent = hasBlockers ? 'BLOCKED' : 'PERMITTED';
    confirmSafetyStatus.className = hasBlockers ? 'summary-value text-danger' : 'summary-value text-success';
    confirmBlockersCount.textContent = `${(preflightResult.blockers || []).length} Blockers Detected`;

    launchReadyBadge.textContent = hasBlockers ? 'BLOCKED' : 'READY TO LAUNCH';
    launchReadyBadge.className = hasBlockers ? 'badge badge-danger' : 'badge badge-success';
  }

  function validateStartPrerequisites() {
    let disabledReason = null;
    if (!projectSelect.value) {
      disabledReason = 'Select a client repository in Step 1 before continuing.';
    } else if (!targetVersionSelect.value) {
      disabledReason = 'Select a target NGO Core version in Step 1.';
    } else if (!trackBackend.checked && !trackFrontend.checked) {
      disabledReason = 'Select at least one execution track (Backend or Frontend).';
    } else if (!preflightResult) {
      disabledReason = 'Run preflight checks to verify workspace safety before starting.';
    } else if (!preflightResult.canProceed || (preflightResult.blockers && preflightResult.blockers.length > 0)) {
      disabledReason = preflightResult.decisionReason || 'Upgrade is blocked by safety gates: ' + (preflightResult.blockers || []).join('; ');
    }

    if (disabledReason) {
      btnStart.disabled = true;
      startDisabledReason.textContent = disabledReason;
      startDisabledReason.style.display = 'block';
    } else {
      btnStart.disabled = false;
      startDisabledReason.style.display = 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Start Upgrade Job Launch
  // ---------------------------------------------------------------------------
  btnStart.addEventListener('click', async () => {
    if (!selectedProject || !targetVersionSelect.value) return;

    const tracks = [];
    if (trackBackend.checked) tracks.push('backend');
    if (trackFrontend.checked) tracks.push('frontend');

    btnStart.disabled = true;
    btnStart.textContent = 'Dispatching Job...';

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientPath: selectedProject.path,
          targetVersion: targetVersionSelect.value,
          tracks,
          copilotModel: getSelectedCopilotModel(),
          upgradeMode: upgradeModeSelect ? upgradeModeSelect.value : 'AUTO',
          simulateCopilot: simulateCopilot.checked
        })
      });

      const data = await res.json();
      if (data.ok && data.job) {
        activeJobId = data.job.id;
        rawLogLines = [];
        terminalOutput.textContent = '';
        switchView('live-execution');
        startJobPolling(activeJobId);
      } else {
        alert('Failed to start upgrade: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error launching upgrade: ' + err.message);
    } finally {
      btnStart.textContent = 'Start Upgrade';
      validateStartPrerequisites();
    }
  });

  // ---------------------------------------------------------------------------
  // 7. Live Execution Monitoring & Terminal Filtering
  // ---------------------------------------------------------------------------
  function startJobPolling(jobId) {
    if (jobPollTimer) clearInterval(jobPollTimer);
    activeJobId = jobId;

    activeJobIndicator.style.display = 'inline-block';
    pollJob(jobId);
    jobPollTimer = setInterval(() => pollJob(jobId), 1200);
  }

  async function pollJob(jobId) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;
      const data = await res.json();
      const job = data.job;
      activeJob = job;

      execJobTitle.textContent = `Upgrade: ${pathBasename(job.clientPath)} → v${job.targetVersion}`;
      execJobId.textContent = `Job ID: ${job.id} • Created: ${new Date(job.createdAt).toLocaleTimeString()}`;

      jobStatusBadge.textContent = job.status;
      jobStatusBadge.className = 'badge ' + getStatusBadgeClass(job.status);

      if (['RUNNING', 'QUEUED'].includes(job.status)) {
        btnCancel.style.display = 'inline-block';
        btnResume.style.display = 'none';
        btnViewResultsShortcut.style.display = 'none';
        activeUpgradeBanner.style.display = 'flex';
        activeBannerClient.textContent = `${pathBasename(job.clientPath)} (v${job.targetVersion})`;
        activeJobIndicator.style.display = 'inline-block';
      } else if (['CANCELLED', 'FAILED'].includes(job.status)) {
        btnCancel.style.display = 'none';
        btnResume.style.display = 'inline-block';
        btnViewResultsShortcut.style.display = 'none';
        activeUpgradeBanner.style.display = 'none';
        activeJobIndicator.style.display = 'none';
      } else if (['COMPLETE', 'AWAITING_APPROVAL'].includes(job.status)) {
        btnCancel.style.display = 'none';
        btnResume.style.display = 'none';
        btnViewResultsShortcut.style.display = 'block';
        activeUpgradeBanner.style.display = 'none';
        activeJobIndicator.style.display = 'none';
      }

      updateStepper(job);

      if (job.tracks) {
        const beStatus = job.trackStates?.backend || (job.tracks.includes('backend') ? job.status : 'SKIPPED');
        const feStatus = job.trackStates?.frontend || (job.tracks.includes('frontend') ? job.status : 'SKIPPED');
        trackBackendPill.textContent = `Backend: ${beStatus}`;
        trackFrontendPill.textContent = `Frontend: ${feStatus}`;
      }
      if (upgradeModePill) {
        const isFast = job.implementation?.fastPatchMode || job.upgradeMode === 'FAST_PATCH' || (job.upgradeMode === 'AUTO' && job.implementation?.fastPatchMode);
        upgradeModePill.textContent = 'Mode: ' + (isFast ? '⚡ Fast Patch' : '🔍 Full Semantic');
        upgradeModePill.className = 'pill ' + (isFast ? 'badge-success' : 'badge-primary');
      }
      if (copilotModelPill && job.copilotModel) {
        copilotModelPill.textContent = `Model: ${job.copilotModel}`;
      }
      repairIterationsPill.textContent = `Repairs: ${job.repairIterations || 0}/2`;

      fetchLogs(jobId);

      if (['COMPLETE', 'AWAITING_APPROVAL', 'FAILED', 'CANCELLED'].includes(job.status)) {
        if (jobPollTimer) {
          clearInterval(jobPollTimer);
          jobPollTimer = null;
        }
        if (job.status === 'AWAITING_APPROVAL') {
          loadResultsAndDiff(jobId);
        }
      }
    } catch (_) {}
  }

  function updateStepper(job) {
    const stages = ['PREFLIGHT', 'CORE_INGEST', 'PLAN', 'IMPLEMENT', 'VERIFY', 'REVIEW'];
    const currentStageIndex = stages.indexOf(job.currentStage);

    stages.forEach((stage, idx) => {
      const stepEl = stageStepper.querySelector(`.step[data-stage="${stage}"]`);
      if (!stepEl) return;

      const timeEl = document.getElementById(`time-${stage}`);
      if (job.stageMetrics && job.stageMetrics[stage]) {
        const ms = job.stageMetrics[stage].durationMs || 0;
        timeEl.textContent = `${ms}ms`;
      }

      stepEl.classList.remove('active', 'completed');
      if (job.status === 'COMPLETE' || job.status === 'AWAITING_APPROVAL') {
        stepEl.classList.add('completed');
      } else if (idx < currentStageIndex) {
        stepEl.classList.add('completed');
      } else if (idx === currentStageIndex) {
        stepEl.classList.add('active');
      }
    });
  }

  async function fetchLogs(jobId) {
    try {
      const since = rawLogLines.length;
      const res = await fetch(`/api/jobs/${jobId}/logs?since=${since}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.lines) && data.lines.length > 0) {
        rawLogLines = rawLogLines.concat(data.lines);
        renderFilteredLogs();
      }
    } catch (_) {}
  }

  function renderFilteredLogs() {
    let filtered = rawLogLines;

    if (currentLogLevelFilter !== 'ALL') {
      const tag = `[${currentLogLevelFilter}]`;
      filtered = filtered.filter(line => line.includes(tag));
    }

    if (currentLogSearch) {
      const q = currentLogSearch.toLowerCase();
      filtered = filtered.filter(line => line.toLowerCase().includes(q));
    }

    terminalOutput.textContent = filtered.join('\n');

    if (autoscrollCheck.checked) {
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }

  pillFilters.forEach(pill => {
    pill.addEventListener('click', () => {
      pillFilters.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentLogLevelFilter = pill.getAttribute('data-level');
      renderFilteredLogs();
    });
  });

  logSearchInput.addEventListener('input', () => {
    currentLogSearch = logSearchInput.value.trim();
    renderFilteredLogs();
  });

  btnClearLog.addEventListener('click', () => {
    rawLogLines = [];
    terminalOutput.textContent = '';
  });

  if (btnCopyLog) {
    btnCopyLog.addEventListener('click', () => {
      if (!rawLogLines.length) return;
      navigator.clipboard.writeText(rawLogLines.join('\n')).then(() => {
        const orig = btnCopyLog.textContent;
        btnCopyLog.textContent = 'Copied!';
        setTimeout(() => { btnCopyLog.textContent = orig; }, 1500);
      });
    });
  }

  if (btnDownloadLog) {
    btnDownloadLog.addEventListener('click', () => {
      if (!rawLogLines.length) return;
      const blob = new Blob([rawLogLines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `upgrade-job-${activeJobId || 'log'}.log`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  btnRefreshJob.addEventListener('click', () => {
    if (activeJobId) {
      rawLogLines = [];
      pollJob(activeJobId);
      fetchLogs(activeJobId);
    }
  });

  btnCancel.addEventListener('click', async () => {
    if (!activeJobId) return;
    if (!confirm('Are you sure you want to cancel the current upgrade job?')) return;
    try {
      await fetch(`/api/jobs/${activeJobId}/cancel`, { method: 'POST' });
      pollJob(activeJobId);
    } catch (err) {
      alert('Cancel failed: ' + err.message);
    }
  });

  btnResume.addEventListener('click', async () => {
    if (!activeJobId) return;
    try {
      await fetch(`/api/jobs/${activeJobId}/resume`, { method: 'POST' });
      startJobPolling(activeJobId);
    } catch (err) {
      alert('Resume failed: ' + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // 8. Results, Verification Matrix & Git Diff Review
  // ---------------------------------------------------------------------------
  async function loadResultsAndDiff(jobId) {
    try {
      const res = await fetch(`/api/jobs/${jobId}/diff`);
      if (!res.ok) return;
      const data = await res.json();

      if (Array.isArray(data.checks) && data.checks.length > 0) {
        checksTableBody.innerHTML = data.checks.map(c => `
          <tr>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td><span class="badge badge-secondary">${escapeHtml(c.category)}</span></td>
            <td><code>${escapeHtml(c.command || c.assertion || '--')}</code></td>
            <td><span class="badge ${c.passed ? 'badge-success' : 'badge-danger'}">${c.passed ? 'PASSED' : 'FAILED'}</span></td>
            <td>${c.durationMs ? c.durationMs + ' ms' : '--'}</td>
            <td><small class="text-muted">${escapeHtml(c.output || c.error || 'Verified OK')}</small></td>
          </tr>
        `).join('');

        const allPassed = data.checks.every(c => c.passed);
        verificationSummaryBadge.textContent = allPassed ? 'All Checks Passed' : 'Failures Detected';
        verificationSummaryBadge.className = allPassed ? 'badge badge-success' : 'badge badge-danger';
      } else {
        checksTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No deterministic checks recorded.</td></tr>';
      }

      if (data.review) {
        copilotReviewText.textContent = data.review.analysis || 'Deterministic checks passed with zero regressions.';
        if (Array.isArray(data.review.risks) && data.review.risks.length > 0) {
          reviewRisksBox.style.display = 'block';
          reviewRisksBox.innerHTML = `<strong>Risk Findings:</strong><ul class="mt-1">${data.review.risks.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`;
        } else {
          reviewRisksBox.style.display = 'none';
        }

        if (data.review.defaultCommitMessage) {
          commitMessageInput.value = data.review.defaultCommitMessage;
        }
      }

      if (data.diff) {
        diffStatsLabel.textContent = `${data.diff.changedFilesCount || 0} files modified (${data.diff.insertions || 0}+, ${data.diff.deletions || 0}-)`;
        diffOutput.textContent = data.diff.diffText || 'Working tree clean. No differences.';
      }

      confirmCommitCheck.checked = false;
      btnApproveCommit.disabled = true;

    } catch (err) {
      console.error('Failed loading results and diff:', err);
    }
  }

  if (btnCopyDiff) {
    btnCopyDiff.addEventListener('click', () => {
      const text = diffOutput.textContent;
      if (!text || text === 'No changes to display.') return;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btnCopyDiff.textContent;
        btnCopyDiff.textContent = 'Copied!';
        setTimeout(() => { btnCopyDiff.textContent = orig; }, 1500);
      });
    });
  }

  confirmCommitCheck.addEventListener('change', () => {
    btnApproveCommit.disabled = !confirmCommitCheck.checked || !commitMessageInput.value.trim();
  });

  commitMessageInput.addEventListener('input', () => {
    btnApproveCommit.disabled = !confirmCommitCheck.checked || !commitMessageInput.value.trim();
  });

  btnApproveCommit.addEventListener('click', async () => {
    if (!activeJobId) {
      alert('No active upgrade job selected to commit.');
      return;
    }

    const message = commitMessageInput.value.trim();
    if (!message) {
      alert('Please provide a commit message.');
      return;
    }

    btnApproveCommit.disabled = true;
    btnApproveCommit.textContent = 'Committing Locally...';

    try {
      const res = await fetch(`/api/jobs/${activeJobId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: message })
      });

      const data = await res.json();
      if (data.ok) {
        alert(`Commit successful locally!\nHash: ${data.commitHash}\nAuthor: local developer`);
        pollJob(activeJobId);
        loadResultsAndDiff(activeJobId);
      } else {
        alert('Commit failed: ' + (data.error || 'Unknown error'));
        btnApproveCommit.disabled = false;
      }
    } catch (err) {
      alert('Commit error: ' + err.message);
      btnApproveCommit.disabled = false;
    } finally {
      btnApproveCommit.textContent = 'Approve & Commit Locally';
    }
  });

  // ---------------------------------------------------------------------------
  // 9. Usage & Analytics View
  // ---------------------------------------------------------------------------
  async function loadAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) return;
      const data = await res.json();
      const s = data.summary || {};

      telemCopilotCalls.textContent = s.totalCopilotInvocations || 0;
      telemCopilotTime.textContent = `${s.totalCopilotDurationMs || 0} ms total execution`;
      telemDeterministicChecks.textContent = s.totalChecksRun || 0;
      telemFilesUpdated.textContent = s.totalFilesUpdated || 0;

      if (Array.isArray(data.entries) && data.entries.length > 0) {
        telemetryTableBody.innerHTML = data.entries.map(e => `
          <tr>
            <td><code>${escapeHtml(e.jobId)}</code></td>
            <td><strong>${escapeHtml(e.client || '--')}</strong></td>
            <td>v${escapeHtml(e.targetVersion || '--')}</td>
            <td>${e.observed?.copilotInvocations || 0}</td>
            <td>${e.observed?.deterministicChecksRun || 0}</td>
            <td>${e.observed?.repairAttempts || 0}</td>
            <td><span class="text-muted">UNAVAILABLE</span></td>
            <td><small>${new Date(e.timestamp).toLocaleString()}</small></td>
          </tr>
        `).join('');
      } else {
        telemetryTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No telemetry entries recorded yet.</td></tr>';
      }
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // 10. Settings & Diagnostics View
  // ---------------------------------------------------------------------------
  async function loadDiagnostics() {
    try {
      const [cliRes, envRes] = await Promise.all([
        fetch('/api/diagnostics/copilot'),
        fetch('/api/diagnostics/environment')
      ]);

      const cliData = await cliRes.json();
      const envData = await envRes.json();

      if (cliData.ok && (cliData.diagnostics || cliData.status)) {
        const c = cliData.diagnostics || cliData.status || {};
        diagCliStatus.textContent = c.available ? 'INSTALLED & REACHABLE' : (c.status || 'OFFLINE');
        diagCliStatus.className = c.available ? 'diag-value text-success' : 'diag-value text-danger';
        diagCliPath.textContent = c.executablePath || 'Not found in PATH';
        diagCliVersion.textContent = c.version || 'Unavailable';
        diagCliAccount.textContent = c.identity || c.accountIdentity || (c.authenticated ? 'Authenticated' : 'Not Authenticated');
        diagCliCredSource.textContent = c.credentialSource || 'None';
        diagCliModel.textContent = c.model || c.configuredModel || 'CLI Default';
        diagCliNoninteractive.textContent = (c.nonInteractiveSupported || c.nonInteractiveCapable) ? 'Supported (-p flag)' : 'Not Supported';
        diagCliTimestamp.textContent = new Date(c.lastHealthCheck || c.checkedAt || Date.now()).toLocaleTimeString();

        const errDetail = c.error || c.diagnosticDetails;
        const remed = Array.isArray(c.remediationSteps) ? c.remediationSteps.map(r => `• ${escapeHtml(r)}`).join('<br>') : c.remediation;
        if (errDetail || !c.available) {
          diagCliRemediation.style.display = 'block';
          diagCliRemediation.innerHTML = `
            <div class="alert alert-warning">
              <strong>Diagnostic Notice:</strong> ${escapeHtml(errDetail || 'Copilot CLI is offline or not installed in PATH.')}<br>
              <div class="mt-2 text-sm"><strong>Remediation:</strong><br>${remed || 'Install GitHub Copilot CLI or use Simulation Mode for offline testing.'}</div>
            </div>
          `;
        } else {
          diagCliRemediation.style.display = 'none';
        }
      }

      if (envData.ok && Array.isArray(envData.environment?.tools)) {
        envToolsTableBody.innerHTML = envData.environment.tools.map(t => `
          <tr>
            <td><strong>${escapeHtml(t.tool)}</strong></td>
            <td><span class="badge ${t.available ? 'badge-success' : 'badge-danger'}">${t.available ? 'YES' : 'NO'}</span></td>
            <td><code>${escapeHtml(t.version || 'Not Found')}</code></td>
            <td><small class="text-muted">${escapeHtml(t.requirement)}</small></td>
            <td><span class="badge ${t.status === 'OK' ? 'badge-success' : (t.status === 'OPTIONAL' ? 'badge-info' : 'badge-danger')}">${escapeHtml(t.status)}</span></td>
          </tr>
        `).join('');
      }

    } catch (err) {
      console.error('Failed loading diagnostics:', err);
    }
  }

  btnRetestCli.addEventListener('click', () => {
    loadDiagnostics();
    loadSystemSummary();
  });

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.ok && data.settings) {
        const s = data.settings;
        settingWorkspaceRoots.value = Array.isArray(s.approvedWorkspaceRoots) ? s.approvedWorkspaceRoots.join('\n') : '';
        settingCorePath.value = s.corePath || '';
        settingTimeout.value = s.executionTimeoutMs || 300000;
        settingConcurrency.value = s.concurrencyLimit || 1;
        if (s.copilotModel && settingCopilotModel) {
          const known = Array.from(settingCopilotModel.options).some(o => o.value === s.copilotModel);
          if (known) {
            settingCopilotModel.value = s.copilotModel;
            if (settingCustomModelContainer) settingCustomModelContainer.style.display = 'none';
          } else {
            settingCopilotModel.value = 'custom';
            if (settingCustomCopilotModel) settingCustomCopilotModel.value = s.copilotModel;
            if (settingCustomModelContainer) settingCustomModelContainer.style.display = 'block';
          }
        }
        if (s.azureDevOpsPat && settingAzurePat) {
          settingAzurePat.value = s.azureDevOpsPat;
        }
        if (s.defaultUpgradeMode && settingDefaultUpgradeMode) {
          settingDefaultUpgradeMode.value = s.defaultUpgradeMode;
        }
      }
    } catch (_) {}
  }

  btnSaveSettings.addEventListener('click', async () => {
    btnSaveSettings.disabled = true;
    btnSaveSettings.textContent = 'Saving...';
    settingsSaveAlert.style.display = 'none';

    try {
      const roots = settingWorkspaceRoots.value
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const modelVal = settingCopilotModel && settingCopilotModel.value === 'custom'
        ? (settingCustomCopilotModel ? settingCustomCopilotModel.value.trim() : 'gpt-4o')
        : (settingCopilotModel ? settingCopilotModel.value : 'gpt-4o');

      const payload = {
        approvedWorkspaceRoots: roots,
        corePath: settingCorePath.value.trim(),
        executionTimeoutMs: parseInt(settingTimeout.value, 10),
        concurrencyLimit: parseInt(settingConcurrency.value, 10),
        copilotModel: modelVal || 'gpt-4o',
        azureDevOpsPat: (settingAzurePat && settingAzurePat.value.trim()) ? settingAzurePat.value.trim() : null,
        defaultUpgradeMode: (settingDefaultUpgradeMode && settingDefaultUpgradeMode.value) ? settingDefaultUpgradeMode.value : 'AUTO'
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok) {
        settingsSaveAlert.className = 'alert alert-success';
        settingsSaveAlert.textContent = 'Settings validated and saved successfully.';
        settingsSaveAlert.style.display = 'block';
      } else {
        const errors = (data.errors || [data.error]).join(', ');
        settingsSaveAlert.className = 'alert alert-danger';
        settingsSaveAlert.textContent = 'Failed to save settings: ' + errors;
        settingsSaveAlert.style.display = 'block';
      }
    } catch (err) {
      settingsSaveAlert.className = 'alert alert-danger';
      settingsSaveAlert.textContent = 'Network error saving settings: ' + err.message;
      settingsSaveAlert.style.display = 'block';
    } finally {
      btnSaveSettings.disabled = false;
      btnSaveSettings.textContent = 'Save & Validate Settings';
    }
  });

  // ---------------------------------------------------------------------------
  // 10b. NuGet Package Sources & Authentication
  // ---------------------------------------------------------------------------
  let nugetSourcesList = [];

  async function loadNuGetSources(triggerTest = false) {
    if (!nugetSourcesTbody) return;
    nugetSourcesTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Checking configured NuGet package sources...</td></tr>';
    if (nugetAlertBox) nugetAlertBox.style.display = 'none';

    try {
      const url = triggerTest ? '/api/nuget/sources?test=true' : '/api/nuget/sources';
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) {
        nugetSourcesTbody.innerHTML = `<tr><td colspan="7" class="text-danger">Failed to load package sources: ${escapeHtml(data.error || 'Unknown error')}</td></tr>`;
        return;
      }

      nugetSourcesList = data.sources || [];
      renderNuGetSourcesTable(nugetSourcesList);
    } catch (err) {
      nugetSourcesTbody.innerHTML = `<tr><td colspan="7" class="text-danger">Network error loading package sources: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function renderNuGetSourcesTable(sources) {
    if (!sources || sources.length === 0) {
      nugetSourcesTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No package sources discovered in NuGet.Config or environment.</td></tr>';
      return;
    }

    let hasAuthIssue = false;
    let authIssueMsg = '';

    nugetSourcesTbody.innerHTML = sources.map((src, idx) => {
      // Determine badges
      let connBadge = '<span class="badge badge-secondary">UNTESTED</span>';
      if (src.connectionStatus === 'CONNECTED') connBadge = '<span class="badge badge-success">CONNECTED</span>';
      else if (src.connectionStatus === 'UNAUTHENTICATED') connBadge = '<span class="badge badge-warning">AUTH REQUIRED</span>';
      else if (src.connectionStatus === 'FORBIDDEN') connBadge = '<span class="badge badge-danger">FORBIDDEN (403)</span>';
      else if (src.connectionStatus === 'NETWORK_ERROR') connBadge = '<span class="badge badge-danger">NETWORK ERROR</span>';
      else if (src.connectionStatus === 'ERROR') connBadge = '<span class="badge badge-danger">ERROR</span>';

      let authBadge = '<span class="badge badge-secondary">--</span>';
      if (src.authStatus === 'AUTHENTICATED') authBadge = '<span class="badge badge-success">AUTHENTICATED</span>';
      else if (src.authStatus === 'PUBLIC_ANONYMOUS' || src.authStatus === 'NOT_REQUIRED') authBadge = '<span class="badge badge-info">PUBLIC</span>';
      else if (src.authStatus === 'AUTH_REQUIRED') authBadge = '<span class="badge badge-warning">LOGIN REQUIRED</span>';
      else if (src.authStatus === 'FORBIDDEN') authBadge = '<span class="badge badge-danger">NO PERMISSION</span>';

      if (src.connectionStatus === 'UNAUTHENTICATED' || src.connectionStatus === 'FORBIDDEN') {
        hasAuthIssue = true;
        authIssueMsg = src.lastError || 'Authentication required for private feed.';
      }

      const testedTime = src.lastTested ? new Date(src.lastTested).toLocaleTimeString() : 'Not yet tested';
      const identityText = src.accountIdentity || (src.isPrivate ? '<span class="text-muted">Not authenticated</span>' : '<span class="text-muted">Public / Anonymous</span>');

      return `
        <tr>
          <td>
            <strong>${escapeHtml(src.name)}</strong><br>
            <small class="text-muted"><code>${escapeHtml(src.url)}</code></small>
          </td>
          <td><span class="badge badge-secondary">${escapeHtml(src.type || 'UNKNOWN')}</span></td>
          <td>${connBadge}</td>
          <td>${authBadge}</td>
          <td><small>${identityText}</small></td>
          <td><small class="text-muted">${testedTime}</small></td>
          <td>
            <div class="flex-center gap-1">
              <button class="btn btn-secondary btn-sm" onclick="window.testSingleFeed('${encodeURIComponent(src.url)}')">Test</button>
              ${src.canReauthenticate ? `<button class="btn btn-primary btn-sm" onclick="window.reauthSingleFeed('${encodeURIComponent(src.url)}')">Reauth</button>` : ''}
              ${(src.diagnosticOutput || src.lastError || src.remediation) ? `<button class="btn btn-ghost btn-sm" onclick="window.showFeedDiag(${idx})">Diag</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (hasAuthIssue && nugetAlertBox) {
      nugetAlertBox.className = 'alert alert-warning';
      nugetAlertBox.innerHTML = `<strong>Feed Authentication Notice:</strong> ${escapeHtml(authIssueMsg)}<br><small>Click <strong>Test</strong> or <strong>Reauth</strong> to acquire Microsoft credentials or check local VS Credential Provider.</small>`;
      nugetAlertBox.style.display = 'block';
    }
  }

  window.showFeedDiag = function(idx) {
    const src = nugetSourcesList[idx];
    if (!src || !nugetDiagDrawer) return;
    nugetDrawerTitle.textContent = `Feed Diagnostics: ${src.name}`;
    nugetDrawerContent.innerHTML = `
      <div><strong>Status:</strong> ${escapeHtml(src.connectionStatus || 'UNKNOWN')} (HTTP ${src.statusCode || '--'})</div>
      <div><strong>Auth Status:</strong> ${escapeHtml(src.authStatus || 'UNKNOWN')}</div>
      <div><strong>Identity:</strong> <code>${escapeHtml(src.accountIdentity || 'None')}</code></div>
      <div><strong>Mechanism:</strong> ${escapeHtml(src.authMechanism || 'Standard')}</div>
      ${src.lastError ? `<div class="mt-1 text-danger"><strong>Error:</strong> ${escapeHtml(src.lastError)}</div>` : ''}
      ${src.diagnosticOutput ? `<div class="mt-1"><strong>Output / Probe:</strong> <pre class="diff-body mt-1" style="max-height:100px;">${escapeHtml(src.diagnosticOutput)}</pre></div>` : ''}
      ${src.remediation ? `<div class="mt-1 text-warning"><strong>Remediation:</strong> ${escapeHtml(src.remediation)}</div>` : ''}
    `;
    nugetDiagDrawer.style.display = 'block';
  };

  if (btnCloseNugetDrawer) {
    btnCloseNugetDrawer.addEventListener('click', () => {
      if (nugetDiagDrawer) nugetDiagDrawer.style.display = 'none';
    });
  }

  window.testSingleFeed = async function(encodedUrl) {
    const sourceUrl = decodeURIComponent(encodedUrl);
    try {
      const res = await fetch('/api/nuget/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl })
      });
      const data = await res.json();
      if (data.ok && data.result) {
        const idx = nugetSourcesList.findIndex(s => s.url === sourceUrl);
        if (idx !== -1) {
          nugetSourcesList[idx] = Object.assign({}, nugetSourcesList[idx], data.result);
          renderNuGetSourcesTable(nugetSourcesList);
        }
      } else {
        alert('Feed test failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error testing feed: ' + err.message);
    }
  };

  window.reauthSingleFeed = async function(encodedUrl) {
    const sourceUrl = decodeURIComponent(encodedUrl);
    try {
      const res = await fetch('/api/nuget/reauthenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl })
      });
      const data = await res.json();
      if (data.ok && data.testResult) {
        const idx = nugetSourcesList.findIndex(s => s.url === sourceUrl);
        if (idx !== -1) {
          nugetSourcesList[idx] = Object.assign({}, nugetSourcesList[idx], data.testResult);
          renderNuGetSourcesTable(nugetSourcesList);
        }
        alert('Reauthentication successful!\nStatus: Connected');
      } else {
        alert('Reauthentication notice: ' + (data.error || (data.testResult && data.testResult.lastError) || 'Could not refresh credentials'));
        if (data.testResult) {
          const idx = nugetSourcesList.findIndex(s => s.url === sourceUrl);
          if (idx !== -1) {
            nugetSourcesList[idx] = Object.assign({}, nugetSourcesList[idx], data.testResult);
            renderNuGetSourcesTable(nugetSourcesList);
          }
        }
      }
    } catch (err) {
      alert('Error reauthenticating feed: ' + err.message);
    }
  };

  if (btnTestAllFeeds) {
    btnTestAllFeeds.addEventListener('click', async () => {
      btnTestAllFeeds.disabled = true;
      btnTestAllFeeds.textContent = 'Testing Feeds...';
      try {
        const res = await fetch('/api/nuget/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true })
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.results)) {
          nugetSourcesList = data.results;
          renderNuGetSourcesTable(nugetSourcesList);
        }
      } catch (err) {
        alert('Error testing all feeds: ' + err.message);
      } finally {
        btnTestAllFeeds.disabled = false;
        btnTestAllFeeds.textContent = 'Test All Feeds';
      }
    });
  }

  if (btnRefreshFeedCache) {
    btnRefreshFeedCache.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/nuget/refresh-metadata', { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
          alert('Metadata and token cache cleared successfully.');
          loadNuGetSources(true);
        }
      } catch (err) {
        alert('Error refreshing cache: ' + err.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 11. Jobs List & History
  // ---------------------------------------------------------------------------
  async function loadJobsList() {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobs = data.jobs || [];

      dashTotalJobs.textContent = jobs.length;
      const succeeded = jobs.filter(j => j.status === 'COMPLETE').length;
      dashSuccessJobs.textContent = `${succeeded} succeeded`;

      if (jobs.length > 0) {
        historyTableBody.innerHTML = jobs.map(j => `
          <tr>
            <td>
              <strong>${escapeHtml(pathBasename(j.clientPath))}</strong><br>
              <small class="text-muted"><code>${escapeHtml(j.id)}</code></small>
            </td>
            <td>v${escapeHtml(j.targetVersion)}</td>
            <td><small>${(j.tracks || []).join(', ')}</small></td>
            <td><span class="badge ${getStatusBadgeClass(j.status)}">${escapeHtml(j.status)}</span></td>
            <td><small>${new Date(j.createdAt).toLocaleTimeString()}</small></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="window.inspectJob('${escapeHtml(j.id)}')">View</button>
            </td>
          </tr>
        `).join('');
      } else {
        historyTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No upgrade runs recorded yet.</td></tr>';
      }
    } catch (_) {}
  }

  btnRefreshHistory.addEventListener('click', loadJobsList);

  window.inspectJob = function(jobId) {
    activeJobId = jobId;
    rawLogLines = [];
    terminalOutput.textContent = '';
    switchView('live-execution');
    startJobPolling(jobId);
    loadResultsAndDiff(jobId);
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'COMPLETE': return 'badge-success';
      case 'AWAITING_APPROVAL': return 'badge-info';
      case 'RUNNING': return 'badge-primary';
      case 'QUEUED': return 'badge-warning';
      case 'FAILED': return 'badge-danger';
      case 'CANCELLED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  function pathBasename(p) {
    if (!p) return '--';
    const normalized = p.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    return parts[parts.length - 1] || p;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize view
  async function init() {
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    switchView(initialHash);
    await Promise.all([
      loadProjects(),
      loadAvailableVersions(),
      loadCopilotModels(),
      loadAccountIdentity(),
      loadSystemSummary(),
      loadJobsList()
    ]);
    updateUpgradeModePreview();

    // Query parameter support for automated test flow and direct step navigation
    const urlParams = new URLSearchParams(window.location.search);
    const autoStep = urlParams.get('step');
    const autoTab = urlParams.get('tab');
    const autoProject = urlParams.get('project');
    const autoTarget = urlParams.get('target');
    const autoModel = urlParams.get('model');

    if (autoModel && copilotModelSelect) {
      const known = Array.from(copilotModelSelect.options).some(o => o.value === autoModel);
      if (known) {
        copilotModelSelect.value = autoModel;
      } else {
        copilotModelSelect.value = 'custom';
        if (customCopilotModel) customCopilotModel.value = autoModel;
      }
      updateModelDescription();
    }

    const autoAuthModal = urlParams.get('authmodal');
    if (autoAuthModal) {
      openNugetAuthModal();
    }

    if (autoStep) {
      const proj = autoProject ? projects.find(p => p.id === autoProject) : projects[0];
      if (proj) {
        projectSelect.value = proj.id;
        selectedProject = proj;
        clientPathHint.textContent = proj.path;
        currentVersionDisplay.textContent = `v${proj.currentVersion}`;
      }
      const target = autoTarget || (availableVersions.length > 0 ? availableVersions[0] : null);
      if (target) {
        targetVersionSelect.value = target;
      }
      if (selectedProject && targetVersionSelect.value) {
        await runPreflight();
        const stepNum = parseInt(autoStep, 10);
        if (stepNum >= 1 && stepNum <= 4) {
          goToWizardStep(stepNum);
        }
        if (autoTab) {
          const tabBtn = document.querySelector(`.sub-tab-btn[data-subtab="${autoTab}"]`);
          if (tabBtn) tabBtn.click();
        }
        if (urlParams.get('expand') === '0') {
          window.toggleCheckRowDetail(0);
        }
      }
    }
  }

  init();
});
