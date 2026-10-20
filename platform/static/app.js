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
  const step1AuthBanner = document.getElementById('step1-auth-banner');
  const step1AuthBadge = document.getElementById('step1-auth-badge');
  const step1FeedUrl = document.getElementById('step1-feed-url');
  const step1FeedScope = document.getElementById('step1-feed-scope');
  const step1AccountIdentity = document.getElementById('step1-account-identity');
  const step1CredProvider = document.getElementById('step1-cred-provider');
  const step1CredStatus = document.getElementById('step1-cred-status');
  const step1AuthAlert = document.getElementById('step1-auth-alert');
  const step1AuthTestedTime = document.getElementById('step1-auth-tested-time');
  const btnTestAuthStep1 = document.getElementById('btn-test-auth-step1');
  const btnConnectAzureStep1 = document.getElementById('btn-connect-azure-step1');
  const btnRefreshAuthStep1 = document.getElementById('btn-refresh-auth-step1');
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

  // Admin Console Tab Navigation & Header Quick Strip
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminTabPanes = document.querySelectorAll('.admin-tab-pane');
  const btnAdminRefreshAll = document.getElementById('btn-admin-refresh-all');
  const qpDotWorkspace = document.getElementById('qp-dot-workspace');
  const qpValWorkspace = document.getElementById('qp-val-workspace');
  const qpDotProjects = document.getElementById('qp-dot-projects');
  const qpValProjects = document.getElementById('qp-val-projects');
  const qpDotCopilot = document.getElementById('qp-dot-copilot');
  const qpValCopilot = document.getElementById('qp-val-copilot');
  const qpDotNuget = document.getElementById('qp-dot-nuget');
  const qpValNuget = document.getElementById('qp-val-nuget');
  const qpDotTools = document.getElementById('qp-dot-tools');
  const qpValTools = document.getElementById('qp-val-tools');

  // Workspace Discovery & Boundaries elements
  const inputAddRoot = document.getElementById('input-add-root');
  const btnValidateAddRoot = document.getElementById('btn-validate-add-root');
  const addRootFeedback = document.getElementById('add-root-feedback');
  const corePathStatusBadge = document.getElementById('core-path-status-badge');
  const discoveryStatusBadge = document.getElementById('discovery-status-badge');
  const discoverySummaryText = document.getElementById('discovery-summary-text');
  const discoveryLastScanned = document.getElementById('discovery-last-scanned');
  const btnRescanDiscovery = document.getElementById('btn-rescan-discovery');
  const discoverySearchInput = document.getElementById('discovery-search-input');
  const discoveryStatusFilter = document.getElementById('discovery-status-filter');
  const discoveryProjectsTbody = document.getElementById('discovery-projects-tbody');
  const btnToggleSkipped = document.getElementById('btn-toggle-skipped');
  const skippedFoldersTitle = document.getElementById('skipped-folders-title');
  const discoverySkippedContainer = document.getElementById('discovery-skipped-container');
  const discoverySkippedTbody = document.getElementById('discovery-skipped-tbody');
  const btnToggleAdvancedPath = document.getElementById('btn-toggle-advanced-path');
  const advancedPathContainer = document.getElementById('advanced-path-container');
  const inputAdvancedClientPath = document.getElementById('input-advanced-client-path');
  const btnTestAdvancedPath = document.getElementById('btn-test-advanced-path');
  const advancedPathFeedback = document.getElementById('advanced-path-feedback');

  // Copilot CLI Console elements
  const heroStatusCircle = document.getElementById('hero-status-circle');
  const diagHeroStatusPill = document.getElementById('diag-hero-status-pill');
  const btnToggleSimulation = document.getElementById('btn-toggle-simulation');
  const diagCliAuthStatus = document.getElementById('diag-cli-auth-status');
  const settingSimulationMode = document.getElementById('setting-simulation-mode');

  // Azure DevOps Matrix elements
  const btnRefreshNugetMatrix = document.getElementById('btn-refresh-nuget-matrix');
  const authFacetsContainer = document.getElementById('auth-facets-container');
  const patStatusIndicator = document.getElementById('pat-status-indicator');

  // Toolchain Environment elements
  const envSysPlatform = document.getElementById('env-sys-platform');
  const envSysArch = document.getElementById('env-sys-arch');
  const envSysNode = document.getElementById('env-sys-node');
  const envSysMemory = document.getElementById('env-sys-memory');
  const envSysFreemem = document.getElementById('env-sys-freemem');
  const envSysUptime = document.getElementById('env-sys-uptime');
  const btnRefreshToolchain = document.getElementById('btn-refresh-toolchain');

  // Execution & Verification elements
  const settingVerifyBuild = document.getElementById('setting-verify-build');
  const settingVerifyTests = document.getElementById('setting-verify-tests');
  const settingVerifyApi = document.getElementById('setting-verify-api');
  const btnSaveSettingsBottom = document.getElementById('btn-save-settings-bottom');

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
      loadProjects(true);
    } else if (viewId === 'new-upgrade') {
      loadProjects();
      loadAvailableVersions();
      loadAccountIdentity();
    } else if (viewId === 'usage-analytics') {
      loadAnalytics();
    } else if (viewId === 'settings-diagnostics') {
      loadWorkspaceDiscovery();
      loadDiagnostics();
      loadSettings();
      loadNuGetAuthStatus();
      loadNuGetSources();
    } else if (viewId === 'results-review' && activeJobId) {
      loadResultsAndDiff(activeJobId);
    }
  }
  window.switchView = switchView;

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
      const stepNumEl = btn.querySelector('.wizard-step-num');
      btn.classList.remove('active');
      if (step === stepNum) {
        btn.classList.add('active');
      }
      if (step < stepNum) {
        btn.classList.add('completed');
        if (stepNumEl) stepNumEl.textContent = '✓';
      } else {
        btn.classList.remove('completed');
        if (stepNumEl) stepNumEl.textContent = String(step);
      }
    });

    // Update wizard step connectors
    for (let c = 1; c <= 3; c++) {
      const connEl = document.getElementById(`wizard-conn-${c}`);
      if (connEl) {
        if (stepNum > c) {
          connEl.classList.add('completed');
        } else {
          connEl.classList.remove('completed');
        }
      }
    }

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

  async function loadProjects(preserveSelection = true) {
    const prevSelected = (preserveSelection && projectSelect) ? projectSelect.value : null;
    try {
      projectSelect.innerHTML = '<option value="">Loading client workspaces...</option>';
      const data = await safeFetchJson('/api/projects', {}, 25000);
      if (data && data.ok === false) {
        projectSelect.innerHTML = `<option value="">Failed to load workspaces: ${escapeHtml(data.error || 'Network error')}</option>`;
        return;
      }
      projects = data.projects || [];

      if (!projects.length) {
        projectSelect.innerHTML = '<option value="">No approved client workspaces found</option>';
        return;
      }

      projectSelect.innerHTML = '<option value="">-- Choose an Approved Client Project --</option>';
      for (const p of projects) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id} (Current: v${p.currentVersion})`;
        projectSelect.appendChild(opt);
      }
      if (prevSelected && projects.some(p => p.id === prevSelected)) {
        projectSelect.value = prevSelected;
        selectedProject = projects.find(p => p.id === prevSelected) || null;
      }
      renderDashboardProjects();
    } catch (err) {
      projectSelect.innerHTML = `<option value="">Failed to load client projects: ${escapeHtml(err.message)}</option>`;
      renderDashboardProjects();
    }
  }

  const dashProjectsTbody = document.getElementById('dashboard-projects-tbody');
  const dashProjectSearch = document.getElementById('dashboard-project-search');
  const btnRefreshDashProjects = document.getElementById('btn-refresh-dash-projects');

  function renderDashboardProjects() {
    if (!dashProjectsTbody) return;
    const filter = (dashProjectSearch && dashProjectSearch.value.trim().toLowerCase()) || '';
    const filtered = projects.filter(p => {
      if (!filter) return true;
      return (p.id && p.id.toLowerCase().includes(filter)) ||
             (p.path && p.path.toLowerCase().includes(filter)) ||
             (p.currentVersion && p.currentVersion.toLowerCase().includes(filter));
    });

    if (!filtered.length) {
      dashProjectsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${projects.length ? 'No client projects match filter.' : 'No approved client workspaces found.'}</td></tr>`;
      return;
    }

    dashProjectsTbody.innerHTML = filtered.map(p => `
      <tr>
        <td>
          <strong>${escapeHtml(p.id)}</strong>
        </td>
        <td>
          <span class="badge badge-secondary font-mono">v${escapeHtml(p.currentVersion)}</span>
        </td>
        <td>
          <code class="text-xs text-muted" title="${escapeHtml(p.path)}">${escapeHtml(p.path)}</code>
        </td>
        <td class="text-right">
          <button type="button" class="btn btn-primary btn-xs" onclick="window.startUpgradeForProject('${escapeHtml(p.id)}')">
            Upgrade &rarr;
          </button>
        </td>
      </tr>
    `).join('');
  }

  function resetUpgradeLiveUI() {
    rawLogLines = [];
    terminalOutput.textContent = '';
    currentLogLevelFilter = 'ALL';
    currentLogSearch = '';
    if (logSearchInput) logSearchInput.value = '';
    pillFilters.forEach(p => p.classList.remove('active'));
    const allPill = document.querySelector('.pill-filter[data-level="ALL"]');
    if (allPill) allPill.classList.add('active');

    if (checksTableBody) {
      checksTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Awaiting verification execution...</td></tr>';
    }
    if (verificationSummaryBadge) {
      verificationSummaryBadge.textContent = 'Awaiting Execution';
      verificationSummaryBadge.className = 'badge badge-secondary';
    }
    if (copilotReviewText) copilotReviewText.textContent = 'Review pending completion of verification.';
    if (reviewRisksBox) reviewRisksBox.style.display = 'none';
    if (diffOutput) diffOutput.innerHTML = '<div class="p-3 text-muted">Awaiting execution...</div>';
    if (diffStatsLabel) diffStatsLabel.textContent = '0 files modified (0+, 0-)';
    if (activeJobIndicator) activeJobIndicator.style.display = 'inline-block';
  }

  window.startUpgradeForProject = async function(projectId) {
    const proj = (allProjects || []).find(p => p.id === projectId);
    if (!proj) {
      switchView('new-upgrade');
      return;
    }

    selectedProject = proj;
    if (projectSelect) projectSelect.value = projectId;

    // Pick target version: either currently chosen or latest available version
    let targetVer = targetVersionSelect ? targetVersionSelect.value : null;
    if (!targetVer && targetVersionSelect && targetVersionSelect.options.length > 1) {
      for (let i = 1; i < targetVersionSelect.options.length; i++) {
        const val = targetVersionSelect.options[i].value;
        if (val && !val.includes('Failed') && !val.includes('Loading')) {
          targetVer = val;
          targetVersionSelect.value = val;
          break;
        }
      }
    }
    if (!targetVer && Array.isArray(allVersions) && allVersions.length > 0) {
      targetVer = allVersions[0].version || allVersions[0];
    }
    if (!targetVer) {
      switchView('new-upgrade');
      goToWizardStep(1);
      return;
    }

    // Reset all previous logs and monitor state every upgrade
    resetUpgradeLiveUI();
    switchView('live-execution');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientPath: proj.path,
          targetVersion: targetVer,
          tracks: ['backend', 'frontend'],
          copilotModel: getSelectedCopilotModel(),
          upgradeMode: upgradeModeSelect ? upgradeModeSelect.value : 'AUTO',
          simulateCopilot: simulateCopilot ? simulateCopilot.checked : false,
          releaseNotes: (document.getElementById('step1-release-notes-text')?.value || '').trim() || undefined,
        })
      });

      const data = await res.json();
      if (data.ok && data.job) {
        activeJobId = data.job.id;
        startJobPolling(activeJobId);
      } else {
        alert('Failed to start upgrade: ' + (data.error || 'Unknown error'));
        switchView('dashboard');
      }
    } catch (err) {
      alert('Error launching upgrade: ' + err.message);
      switchView('dashboard');
    }
  };

  if (dashProjectSearch) {
    dashProjectSearch.addEventListener('input', renderDashboardProjects);
  }
  if (btnRefreshDashProjects) {
    btnRefreshDashProjects.addEventListener('click', () => loadProjects(true));
  }

  async function loadAvailableVersions(forceRefresh = false, preserveSelection = true) {
    const prevSelected = (preserveSelection && targetVersionSelect) ? targetVersionSelect.value : null;
    try {
      targetVersionSelect.innerHTML = '<option value="">Loading versions from Azure Artifacts & Core...</option>';
      const url = forceRefresh ? '/api/versions?refresh=true' : '/api/versions';
      const data = await safeFetchJson(url, {}, 25000);
      if (data && data.ok === false) {
        targetVersionSelect.innerHTML = `<option value="">Failed to load versions: ${escapeHtml(data.error || 'Network error')}</option>`;
        return;
      }
      availableVersions = data.versions || [];

      if (!availableVersions.length) {
        targetVersionSelect.innerHTML = '<option value="">No versions available</option>';
        return;
      }
      targetVersionSelect.innerHTML = '<option value="">-- Select Target NGO Core Version --</option>';
      for (const v of availableVersions) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = `NGO Core v${v}`;
        targetVersionSelect.appendChild(opt);
      }
      if (prevSelected && availableVersions.includes(prevSelected)) {
        targetVersionSelect.value = prevSelected;
      }
    } catch (err) {
      targetVersionSelect.innerHTML = `<option value="">Failed to load Core versions: ${escapeHtml(err.message)}</option>`;
    }
  }

  let copilotModelsList = [];

  function getSelectedCopilotModel() {
    if (!copilotModelSelect) return 'auto';
    if (copilotModelSelect.value === 'custom') {
      return (customCopilotModel && customCopilotModel.value.trim()) || 'auto';
    }
    return copilotModelSelect.value || 'auto';
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
            `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`
          ).join('') + '<option value="custom">Custom Model ID...</option>';

          const hasCurrent = data.models.some(m => m.id === currentVal);
          if (hasCurrent) {
            selectEl.value = currentVal;
          } else if (currentVal === 'custom') {
            selectEl.value = 'custom';
          } else {
            selectEl.value = defaultVal || 'auto';
          }
        };

        populateSelect(copilotModelSelect, data.defaultModel);
        populateSelect(settingCopilotModel, data.defaultModel);
        updateModelDescription();
      }
    } catch (_) {}
  }

  function updateModelDescription() {
    if (!copilotModelSelect) return;
    const val = copilotModelSelect.value;
    if (val === 'custom') {
      if (customModelContainer) customModelContainer.style.display = 'block';
      if (copilotModelDesc) copilotModelDesc.textContent = 'Enter any model identifier supported by your GitHub Copilot subscription or CLI wrapper.';
    } else {
      if (customModelContainer) customModelContainer.style.display = 'none';
      const m = copilotModelsList.find(x => x.id === val);
      if (copilotModelDesc) copilotModelDesc.textContent = m ? m.description : 'Used for semantic code analysis, configuration adjustments, and automated repair.';
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

  async function safeFetchJson(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
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
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return { ok: false, timeout: true, error: `Request timed out after ${timeoutMs / 1000}s` };
      }
      return { ok: false, error: err.message || 'Network request failed' };
    }
  }

  async function loadAccountIdentity() {
    if (step1AuthBadge) {
      step1AuthBadge.className = 'badge badge-secondary';
      step1AuthBadge.innerHTML = '<span class="loading-spinner-sm"></span> Detecting...';
    }
    if (step1AccountIdentity) {
      step1AccountIdentity.innerHTML = '<span class="loading-spinner-sm"></span> Checking active accounts...';
    }

    try {
      const data = await safeFetchJson('/api/nuget/identity', {}, 8000);
      if (data.timeout) {
        if (step1AuthBadge) {
          step1AuthBadge.className = 'badge badge-warning';
          step1AuthBadge.textContent = 'TIMEOUT';
        }
        if (step1AccountIdentity) {
          step1AccountIdentity.innerHTML = '<span class="text-warning">Identity check timed out</span>';
        }
        if (step1AuthAlert) {
          step1AuthAlert.style.display = 'block';
          step1AuthAlert.className = 'alert alert-warning mt-3';
          step1AuthAlert.innerHTML = '<strong>Connection Timeout:</strong> The background credential discovery process took longer than 8 seconds. Click <strong>Test Connection</strong> or <strong>Refresh</strong> to retry.';
        }
        if (settingsNugetAuthBadge) {
          settingsNugetAuthBadge.textContent = 'TIMEOUT';
          settingsNugetAuthBadge.className = 'badge badge-warning';
        }
        if (settingsAuthIdentityDetails) {
          settingsAuthIdentityDetails.innerHTML = '<span class="text-warning">Identity discovery timed out. Click "Retest All Facets" or "Connect via Azure CLI".</span>';
        }
        return;
      }

      if (data && data.ok) {
        activeIdentity = data;
        const azureDisplay = data.azureAccount
          ? `${data.azureAccount} (${data.azureAuthSource === 'azure_cli' ? 'Azure CLI' : 'PAT'})`
          : 'Unauthenticated (No credentials detected)';
        const gitDisplay = data.gitUser ? `${data.gitUser} <${data.gitEmail || ''}>` : 'Git author not configured';

        if (data.isAuthenticated && data.azureAccount) {
          if (step1AuthBadge) {
            step1AuthBadge.className = 'badge badge-success';
            step1AuthBadge.textContent = 'CONNECTED';
          }
          if (step1AccountIdentity) {
            const srcLabel = data.azureAuthSource === 'azure_cli' ? 'Azure CLI' : (data.azureAuthSource === 'pat' ? 'Personal Access Token' : 'Credential Provider');
            step1AccountIdentity.innerHTML = `<span class="badge badge-success mr-1">✔</span> <strong>${escapeHtml(data.azureAccount)}</strong> <span class="text-muted">(${escapeHtml(srcLabel)})</span>`;
          }
          if (step1AuthDetails) {
            step1AuthDetails.textContent = `Ready for private package restore & build. Git: ${data.gitUser || 'configured'}`;
          }
          if (step1AuthAlert) {
            step1AuthAlert.style.display = 'none';
          }
        } else {
          if (step1AuthBadge) {
            step1AuthBadge.className = 'badge badge-warning';
            step1AuthBadge.textContent = 'SIGN-IN REQUIRED';
          }
          if (step1AccountIdentity) {
            step1AccountIdentity.innerHTML = '<span class="text-warning">Unauthenticated</span> &bull; No active Azure account detected';
          }
          if (step1AuthDetails) {
            step1AuthDetails.textContent = 'Click "Connect via Azure CLI" or "Enter PAT..." to authenticate against private feed.';
          }
          if (step1AuthAlert) {
            step1AuthAlert.style.display = 'block';
            step1AuthAlert.className = 'alert alert-warning mt-3';
            step1AuthAlert.innerHTML = '<strong>Authentication Required:</strong> Private package feed (NGO_Online_feed) requires Azure credentials. Click <strong>Connect via Azure CLI</strong> (if logged in via <code>az login</code>) or <strong>Enter PAT...</strong>.';
          }
        }

        if (step1CredProvider && data.credentialProviderFound) {
          step1CredProvider.textContent = 'CredentialProvider.Microsoft.exe';
          if (step1CredStatus) step1CredStatus.textContent = 'Installed (Visual Studio / MSAL plugin)';
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
          settingsNugetAuthBadge.textContent = data.isAuthenticated ? 'Connected' : 'Sign-In Required';
          settingsNugetAuthBadge.className = data.isAuthenticated ? 'badge badge-success' : 'badge badge-warning';
        }
      } else {
        if (step1AuthBadge) {
          step1AuthBadge.className = 'badge badge-danger';
          step1AuthBadge.textContent = 'ERROR';
        }
        if (step1AccountIdentity) {
          step1AccountIdentity.innerHTML = `<span class="text-danger">Detection Failed</span>`;
        }
        if (step1AuthAlert) {
          step1AuthAlert.style.display = 'block';
          step1AuthAlert.className = 'alert alert-danger mt-3';
          step1AuthAlert.innerHTML = `<strong>Error:</strong> ${escapeHtml(data?.error || 'Failed to detect authentication status')}. Click <strong>Refresh</strong> to retry.`;
        }
        if (settingsNugetAuthBadge) {
          settingsNugetAuthBadge.textContent = 'AUTH ERROR';
          settingsNugetAuthBadge.className = 'badge badge-danger';
        }
        if (settingsAuthIdentityDetails) {
          settingsAuthIdentityDetails.innerHTML = `<span class="text-danger">Detection error: ${escapeHtml(data?.error || 'Unknown error')}</span>`;
        }
      }
    } catch (err) {
      if (step1AuthBadge) {
        step1AuthBadge.className = 'badge badge-danger';
        step1AuthBadge.textContent = 'ERROR';
      }
      if (step1AccountIdentity) {
        step1AccountIdentity.innerHTML = `<span class="text-danger">Failed to load</span>`;
      }
      if (step1AuthAlert) {
        step1AuthAlert.style.display = 'block';
        step1AuthAlert.className = 'alert alert-danger mt-3';
        step1AuthAlert.innerHTML = `<strong>Error:</strong> ${escapeHtml(err.message)}. Click <strong>Refresh</strong> to retry.`;
      }
      if (settingsNugetAuthBadge) {
        settingsNugetAuthBadge.textContent = 'NETWORK ERROR';
        settingsNugetAuthBadge.className = 'badge badge-danger';
      }
      if (settingsAuthIdentityDetails) {
        settingsAuthIdentityDetails.innerHTML = `<span class="text-danger">Failed to load: ${escapeHtml(err.message)}</span>`;
      }
    }
  }

  async function testAuthConnectionStep1() {
    if (btnTestAuthStep1) {
      btnTestAuthStep1.disabled = true;
      btnTestAuthStep1.innerHTML = '<span class="loading-spinner-sm"></span> Testing...';
    }
    if (step1AuthBadge) {
      step1AuthBadge.className = 'badge badge-secondary';
      step1AuthBadge.innerHTML = '<span class="loading-spinner-sm"></span> Probing feed...';
    }
    try {
      const res = await safeFetchJson('/api/nuget/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: 'https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json'
        }),
      }, 12000);

      const result = res.result || res;
      const now = new Date().toLocaleTimeString();
      if (step1AuthTestedTime) {
        step1AuthTestedTime.textContent = `Last test: ${now} (${result.latencyMs || 0}ms)`;
      }

      if (result.connectionStatus === 'CONNECTED' || (res.ok && result.statusCode === 200)) {
        if (step1AuthBadge) {
          step1AuthBadge.className = 'badge badge-success';
          step1AuthBadge.textContent = 'CONNECTED';
        }
        if (step1AuthAlert) {
          step1AuthAlert.style.display = 'block';
          step1AuthAlert.className = 'alert alert-success mt-3';
          step1AuthAlert.innerHTML = `<strong>Feed connection verified:</strong> HTTP ${result.statusCode || 200} OK from Azure Artifacts (${result.latencyMs || 0}ms). Authenticated as <strong>${escapeHtml(result.accountIdentity || activeIdentity?.azureAccount || 'authorized user')}</strong>.`;
        }
      } else {
        const statusText = result.connectionStatus || (result.statusCode === 401 ? 'SIGN-IN REQUIRED' : (result.statusCode === 403 ? 'FORBIDDEN' : 'ERROR'));
        if (step1AuthBadge) {
          step1AuthBadge.className = (statusText === 'SIGN-IN REQUIRED' || statusText === 'FORBIDDEN') ? 'badge badge-warning' : 'badge badge-danger';
          step1AuthBadge.textContent = statusText;
        }
        if (step1AuthAlert) {
          step1AuthAlert.style.display = 'block';
          step1AuthAlert.className = (statusText === 'SIGN-IN REQUIRED' || statusText === 'FORBIDDEN') ? 'alert alert-warning mt-3' : 'alert alert-danger mt-3';
          step1AuthAlert.innerHTML = `<strong>Feed Status (${statusText}):</strong> ${escapeHtml(result.error || `HTTP ${result.statusCode}`)}<br><small class="mt-1 d-block">${escapeHtml(result.remediation || 'Run "az login" in terminal or click Enter PAT...')}</small>`;
        }
      }
    } catch (err) {
      if (step1AuthBadge) {
        step1AuthBadge.className = 'badge badge-danger';
        step1AuthBadge.textContent = 'NETWORK ERROR';
      }
      if (step1AuthAlert) {
        step1AuthAlert.style.display = 'block';
        step1AuthAlert.className = 'alert alert-danger mt-3';
        step1AuthAlert.textContent = `Connection test failed: ${err.message}`;
      }
    } finally {
      if (btnTestAuthStep1) {
        btnTestAuthStep1.disabled = false;
        btnTestAuthStep1.textContent = 'Test Connection';
      }
    }
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
        await Promise.all([
          loadProjects(true),
          loadAvailableVersions(true, true),
          loadAccountIdentity(),
          loadNuGetAuthStatus(true),
        ]);
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
        await Promise.all([
          loadProjects(true),
          loadAvailableVersions(true, true),
          loadAccountIdentity(),
          loadNuGetAuthStatus(true),
        ]);
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
      await Promise.all([
        loadAccountIdentity(),
        loadNuGetAuthStatus(true),
        loadProjects(true),
        loadAvailableVersions(true, true),
      ]);
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

  // Step 1 Active Auth listeners
  if (btnTestAuthStep1) btnTestAuthStep1.addEventListener('click', testAuthConnectionStep1);
  if (btnConnectAzureStep1) btnConnectAzureStep1.addEventListener('click', () => handleConnectAzureCli(step1AuthAlert));
  if (btnRefreshAuthStep1) {
    btnRefreshAuthStep1.addEventListener('click', async () => {
      btnRefreshAuthStep1.disabled = true;
      btnRefreshAuthStep1.textContent = 'Refreshing...';
      try {
        await safeFetchJson('/api/nuget/refresh-metadata', { method: 'POST' });
        await Promise.all([
          loadAccountIdentity(),
          loadAvailableVersions(true, true),
          loadProjects(true),
        ]);
      } finally {
        btnRefreshAuthStep1.disabled = false;
        btnRefreshAuthStep1.textContent = 'Refresh';
      }
    });
  }

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
          upgradeModeBadge.textContent = 'Auto: Fast Patch';
          upgradeModeBadge.className = 'badge badge-success';
        }
        if (upgradeModeDesc) {
          upgradeModeDesc.textContent = `Patch version bump (v${currentVer} -> v${targetVer}): direct version replacement + deterministic restore & build. Copilot reasoning skipped unless errors occur.`;
        }
      } else {
        if (upgradeModeBadge) {
          upgradeModeBadge.textContent = 'Auto: Full Semantic';
          upgradeModeBadge.className = 'badge badge-primary';
        }
        if (upgradeModeDesc) {
          upgradeModeDesc.textContent = `Major/minor version upgrade: full Core changeset ingestion, Copilot CLI semantic migration reasoning, configuration alignment, and bounded repair loop.`;
        }
      }
    } else if (mode === 'FAST_PATCH') {
      if (upgradeModeBadge) {
        upgradeModeBadge.textContent = 'Fast Patch Mode';
        upgradeModeBadge.className = 'badge badge-success';
      }
      if (upgradeModeDesc) {
        upgradeModeDesc.textContent = 'Direct package version replacement and build/restore verification. Copilot CLI reasoning will be skipped unless compiler errors occur.';
      }
    } else {
      if (upgradeModeBadge) {
        upgradeModeBadge.textContent = 'Full Semantic';
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

  const notesTextarea = document.getElementById('step1-release-notes-text');
  const notesBadge = document.getElementById('step1-notes-badge');
  const btnSaveNotes = document.getElementById('btn-save-release-notes-step1');

  async function loadReleaseNotesForTarget(version) {
    if (!version || !notesTextarea) return;
    try {
      const res = await fetch(`/api/release-notes?version=${encodeURIComponent(version)}`);
      const data = await res.json();
      if (data && data.exists && data.content) {
        notesTextarea.value = data.content;
        if (notesBadge) {
          notesBadge.className = 'badge badge-success';
          notesBadge.textContent = 'Loaded (' + (data.source || 'Team Notes') + ')';
        }
      } else {
        if (!notesTextarea.value) {
          if (notesBadge) {
            notesBadge.className = 'badge badge-secondary';
            notesBadge.textContent = 'Optional';
          }
        }
      }
    } catch (_) {}
  }

  if (notesTextarea && btnSaveNotes) {
    notesTextarea.addEventListener('input', () => {
      btnSaveNotes.style.display = notesTextarea.value.trim() ? 'inline-block' : 'none';
    });
    btnSaveNotes.addEventListener('click', async () => {
      const ver = targetVersionSelect ? targetVersionSelect.value : null;
      if (!ver) {
        alert('Please select a target version first.');
        return;
      }
      try {
        btnSaveNotes.disabled = true;
        btnSaveNotes.textContent = 'Saving...';
        const res = await fetch('/api/release-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: ver, content: notesTextarea.value.trim() }),
        });
        const d = await res.json();
        if (d && d.ok) {
          if (notesBadge) {
            notesBadge.className = 'badge badge-success';
            notesBadge.textContent = 'Saved';
          }
          const notesStatus = document.getElementById('step1-notes-status');
          if (notesStatus) notesStatus.textContent = `Saved ${d.contentLength} chars for v${ver}. Notes will be provided to Copilot CLI.`;
        }
      } catch (err) {
        alert('Failed to save release notes: ' + err.message);
      } finally {
        btnSaveNotes.disabled = false;
        btnSaveNotes.textContent = 'Save Notes';
      }
    });
  }

  targetVersionSelect.addEventListener('change', () => {
    updateUpgradeModePreview();
    preflightResult = null;
    validateStartPrerequisites();
    loadReleaseNotesForTarget(targetVersionSelect.value);
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
          ? `<br><button type="button" class="btn btn-warning btn-xs mt-1" onclick="window.openNugetAuthModal(event)">Authenticate Feed</button>`
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
      confirmUpgradeMode.textContent = isFastPatch ? 'Fast Patch Mode' : 'Full Semantic Mode';
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
          simulateCopilot: simulateCopilot.checked,
          releaseNotes: (document.getElementById('step1-release-notes-text')?.value || '').trim() || undefined,
        })
      });

      const data = await res.json();
      if (data.ok && data.job) {
        activeJobId = data.job.id;
        resetUpgradeLiveUI();
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
        upgradeModePill.textContent = 'Mode: ' + (isFast ? 'Fast Patch' : 'Full Semantic');
        upgradeModePill.className = 'track-pill';
      }
      if (copilotModelPill && job.copilotModel) {
        copilotModelPill.textContent = `Model: ${job.copilotModel}`;
      }
      repairIterationsPill.textContent = `Repairs: ${job.repairIterations || 0}/2`;

      await fetchLogs(jobId);

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

      stepEl.classList.remove('active', 'completed', 'failed');
      if (job.status === 'COMPLETE' || job.status === 'AWAITING_APPROVAL') {
        stepEl.classList.add('completed');
      } else if (job.status === 'FAILED' && idx === currentStageIndex) {
        stepEl.classList.add('failed');
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
      const newLines = Array.isArray(data.lines) ? data.lines : (Array.isArray(data.logs) ? data.logs : (Array.isArray(data) ? data : null));
      if (Array.isArray(newLines) && newLines.length > 0) {
        rawLogLines = rawLogLines.concat(newLines);
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
  let currentRawDiff = '';

  function renderColorizedDiff(diffText) {
    if (!diffText || diffText.trim() === '' || diffText === 'No changes to display.' || diffText === 'Working tree clean. No differences.') {
      return '<div class="p-3 text-muted">Working tree clean. No differences.</div>';
    }
    const lines = diffText.split(/\r?\n/);
    let html = '<div class="diff-container">';
    lines.forEach((line, idx) => {
      let lineClass = 'diff-line';
      if (/^diff --git|^index |^--- |^\+\+\+ /.test(line)) {
        lineClass += ' diff-header';
      } else if (/^@@ /.test(line)) {
        lineClass += ' diff-hunk';
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        lineClass += ' diff-add';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        lineClass += ' diff-del';
      }
      html += `<div class="${lineClass}"><span class="diff-line-num">${idx + 1}</span><span class="diff-line-content">${escapeHtml(line)}</span></div>`;
    });
    html += '</div>';
    return html;
  }

  async function loadResultsAndDiff(jobId) {
    try {
      const res = await fetch(`/api/jobs/${jobId}/diff`);
      if (!res.ok) return;
      const data = await res.json();

      // 1. Mandatory Test Policy & Cache Performance Card
      const testCacheBadge = document.getElementById('test-cache-badge');
      const policyTestLevel = document.getElementById('policy-test-level');
      const policyFingerprint = document.getElementById('policy-fingerprint');
      const policyExecutionStrategy = document.getElementById('policy-execution-strategy');
      const policyExecutionTime = document.getElementById('policy-execution-time');
      const policyJustificationText = document.getElementById('policy-justification-text');
      const reviewerAttestationText = document.getElementById('reviewer-attestation-text');

      const isCacheHit = Boolean(data.cacheHit);
      const testLevel = data.testLevel || (data.testDecisions && data.testDecisions[0] && data.testDecisions[0].level) || 'Targeted';
      const fp = data.testFingerprint || (data.testDecisions && data.testDecisions[0] && data.testDecisions[0].fingerprint);
      const decision = data.testDecisions && data.testDecisions[0];

      if (testCacheBadge) {
        testCacheBadge.textContent = isCacheHit ? 'Cache Reused (0ms)' : 'Fresh Execution';
        testCacheBadge.className = isCacheHit ? 'badge badge-success' : 'badge badge-info';
      }
      if (policyTestLevel) policyTestLevel.textContent = testLevel;
      if (policyFingerprint) policyFingerprint.textContent = fp ? fp.slice(0, 16) + '...' : 'Recorded';
      if (policyExecutionStrategy) {
        policyExecutionStrategy.textContent = isCacheHit ? 'Deterministic Cache Hit' : 'Fresh Subprocess Run';
      }
      if (policyExecutionTime) {
        policyExecutionTime.textContent = isCacheHit ? '0 ms test subprocess overhead' : 'Completed locally';
      }
      if (policyJustificationText) {
        policyJustificationText.textContent = (decision && decision.reason) ||
          'Mandatory Test Execution Policy: Targeted test scope evaluated first; full regression suite avoided to optimize execution budget and prevent duplication.';
      }
      if (reviewerAttestationText) {
        reviewerAttestationText.textContent = 'The AI reviewer consumed pre-verified deterministic test evidence and compiler output. No test subprocesses were rerun during semantic review.';
      }

      // 2. Deterministic Checks Table
      if (Array.isArray(data.checks) && data.checks.length > 0) {
        checksTableBody.innerHTML = data.checks.map(c => {
          const isPassed = Boolean(c.ok || c.passed || c.status === 'PASSED');
          const isSkipped = c.status === 'SKIPPED';
          const statusText = isSkipped ? 'SKIPPED' : (isPassed ? 'PASSED' : 'FAILED');
          const badgeClass = isSkipped ? 'badge-secondary' : (isPassed ? 'badge-success' : 'badge-danger');
          const detailsText = c.details || c.output || c.error || (isPassed ? 'Verified OK' : 'Check failed');
          return `
            <tr>
              <td><strong>${escapeHtml(c.name)}</strong></td>
              <td><span class="badge badge-secondary">${escapeHtml(c.category)}</span></td>
              <td><code>${escapeHtml(c.command || c.assertion || '--')}</code></td>
              <td><span class="badge ${badgeClass}">${escapeHtml(statusText)}</span></td>
              <td>${c.durationMs ? c.durationMs + ' ms' : '--'}</td>
              <td><small class="text-muted">${escapeHtml(detailsText)}</small></td>
            </tr>
          `;
        }).join('');

        const allPassed = data.checks.every(c => c.ok || c.passed || c.status === 'PASSED' || c.status === 'SKIPPED');
        verificationSummaryBadge.textContent = allPassed ? 'All Checks Passed' : 'Failures Detected';
        verificationSummaryBadge.className = allPassed ? 'badge badge-success' : 'badge badge-danger';
      } else {
        checksTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No deterministic checks recorded.</td></tr>';
      }

      // 3. AI Semantic Review & Risk Findings
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

      // 4. Colorized Git Diff Explorer
      if (data.diff) {
        currentRawDiff = data.diff.diffText || '';
        diffStatsLabel.textContent = `${data.diff.changedFilesCount || 0} files modified (${data.diff.insertions || 0}+, ${data.diff.deletions || 0}-)`;
        diffOutput.innerHTML = renderColorizedDiff(currentRawDiff);
      } else {
        currentRawDiff = '';
        diffOutput.innerHTML = '<div class="p-3 text-muted">Working tree clean. No differences.</div>';
      }

      confirmCommitCheck.checked = false;
      btnApproveCommit.disabled = true;

    } catch (err) {
      console.error('Failed loading results and diff:', err);
    }
  }

  if (btnCopyDiff) {
    btnCopyDiff.addEventListener('click', () => {
      const text = currentRawDiff || diffOutput.textContent;
      if (!text || text === 'No changes to display.' || text === 'Working tree clean. No differences.') return;
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
  // 10. Platform Administration Console (Tabs, Discovery, Copilot, NuGet Matrix)
  // ---------------------------------------------------------------------------

  // Admin Console Tab Switching Controller
  function switchAdminTab(tabKey) {
    if (!tabKey) return;
    adminTabBtns.forEach(btn => {
      if (btn.getAttribute('data-admin-tab') === tabKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    adminTabPanes.forEach(pane => {
      if (pane.id === `pane-admin-${tabKey}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabKey = btn.getAttribute('data-admin-tab');
      switchAdminTab(tabKey);
    });
  });

  // ---------------------------------------------------------------------------
  // 10a. Automatic Client Project Discovery
  // ---------------------------------------------------------------------------
  let discoveredProjects = [];
  let discoveredSkipped = [];

  async function loadWorkspaceDiscovery(force = false) {
    if (discoveryStatusBadge) {
      discoveryStatusBadge.className = 'badge badge-secondary';
      discoveryStatusBadge.textContent = 'Scanning...';
    }
    if (qpValProjects) qpValProjects.textContent = 'Scanning...';
    if (qpDotProjects) qpDotProjects.className = 'quick-pill-dot info';
    if (discoveryProjectsTbody) {
      discoveryProjectsTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><span class="loading-spinner-sm mr-2"></span> Scanning approved workspace roots for candidate client projects...</td></tr>';
    }

    try {
      const res = await fetch('/api/workspace/discover');
      const data = await res.json();
      if (!data.ok) {
        if (discoveryProjectsTbody) {
          discoveryProjectsTbody.innerHTML = `<tr><td colspan="6" class="text-danger py-3">Discovery scan failed: ${escapeHtml(data.error || 'Unknown error')}</td></tr>`;
        }
        if (discoveryStatusBadge) {
          discoveryStatusBadge.className = 'badge badge-danger';
          discoveryStatusBadge.textContent = 'Scan Error';
        }
        return;
      }

      discoveredProjects = data.projects || [];
      discoveredSkipped = data.skipped || [];

      // Update Header Quick Pills
      if (qpValWorkspace && Array.isArray(data.approvedRoots)) {
        qpValWorkspace.textContent = `${data.approvedRoots.length} Root${data.approvedRoots.length === 1 ? '' : 's'}`;
        if (qpDotWorkspace) qpDotWorkspace.className = 'quick-pill-dot success';
      }
      if (qpValProjects) {
        qpValProjects.textContent = `${data.totalDiscovered} Discovered`;
        if (qpDotProjects) qpDotProjects.className = 'quick-pill-dot success';
      }

      // Update Discovery Status & Summary
      if (discoveryStatusBadge) {
        discoveryStatusBadge.className = 'badge badge-success';
        discoveryStatusBadge.textContent = `${data.totalDiscovered} Discovered`;
      }
      if (discoverySummaryText) {
        discoverySummaryText.textContent = `Found ${data.totalDiscovered} candidate projects across ${data.approvedRoots ? data.approvedRoots.length : 0} approved roots (${discoveredSkipped.length} directories skipped).`;
      }
      if (discoveryLastScanned) {
        discoveryLastScanned.textContent = `Scanned ${new Date(data.timestamp || Date.now()).toLocaleTimeString()} (${data.scanDurationMs || 0}ms)`;
      }

      // Update Core Path Status Badge
      if (corePathStatusBadge && data.corePath) {
        corePathStatusBadge.className = 'badge badge-success text-xs';
        corePathStatusBadge.textContent = 'Verified Root';
      }

      // Render Discovered Projects Table
      renderDiscoveredProjectsTable(discoveredProjects);

      // Render Skipped Folders
      renderSkippedFolders(discoveredSkipped);

    } catch (err) {
      if (discoveryProjectsTbody) {
        discoveryProjectsTbody.innerHTML = `<tr><td colspan="6" class="text-danger py-3">Network error scanning workspace: ${escapeHtml(err.message)}</td></tr>`;
      }
      if (discoveryStatusBadge) {
        discoveryStatusBadge.className = 'badge badge-danger';
        discoveryStatusBadge.textContent = 'Network Error';
      }
    }
  }

  function renderDiscoveredProjectsTable(projs) {
    if (!discoveryProjectsTbody) return;
    if (!projs || projs.length === 0) {
      discoveryProjectsTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No matching client projects found. Verify your approved workspace roots or add a root directory above.</td></tr>';
      return;
    }

    discoveryProjectsTbody.innerHTML = projs.map(p => {
      // Status badge
      let statusBadge = '<span class="badge badge-success">READY</span>';
      if (p.status === 'VERSION_MISMATCH') {
        statusBadge = '<span class="badge badge-warning" title="Backend and Frontend Core versions differ">MISMATCH</span>';
      } else if (p.status === 'DIRTY_GIT') {
        statusBadge = '<span class="badge badge-warning" title="Uncommitted Git changes detected">DIRTY GIT</span>';
      } else if (p.status === 'NON_GIT') {
        statusBadge = '<span class="badge badge-secondary" title="No .git repository initialized">NON-GIT</span>';
      } else if (p.status === 'UNIDENTIFIED') {
        statusBadge = '<span class="badge badge-danger">UNKNOWN</span>';
      }

      // Installed version display
      let versionDisplay = `<code>v${escapeHtml(p.installedCoreVersion || '--')}</code>`;
      if (p.backendCoreVersion && p.frontendCoreVersion && p.backendCoreVersion !== p.frontendCoreVersion) {
        versionDisplay = `<code>v${escapeHtml(p.installedCoreVersion)}</code> <span class="badge badge-warning text-xs">Mismatch</span><br><small class="text-muted">BE: v${escapeHtml(p.backendCoreVersion)} &bull; FE: v${escapeHtml(p.frontendCoreVersion)}</small>`;
      }

      // Git branch display
      let gitDisplay = '<span class="text-muted">Non-Git</span>';
      if (p.isGit) {
        const cleanIcon = p.isClean ? '<span class="text-success ml-1" title="Clean working tree">✔</span>' : `<span class="badge badge-warning text-xs ml-1" title="Uncommitted changes">Dirty (${p.dirtyFilesCount || 0})</span>`;
        gitDisplay = `<code>${escapeHtml(p.gitBranch || 'HEAD')}</code>${cleanIcon}`;
      }

      const escapedPath = escapeHtml(p.path).replace(/\\/g, '\\\\');

      return `
        <tr>
          <td>${statusBadge}</td>
          <td>
            <strong>${escapeHtml(p.name || p.id)}</strong><br>
            <small class="text-muted"><code>${escapeHtml(p.id)}</code></small>
          </td>
          <td>${versionDisplay}</td>
          <td>${gitDisplay}</td>
          <td><code class="text-xs text-muted" title="${escapeHtml(p.path)}">${escapeHtml(p.path)}</code></td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-primary btn-sm" onclick="window.selectDiscoveredProject('${escapedPath}')">
              Upgrade &rarr;
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderSkippedFolders(skipped) {
    if (skippedFoldersTitle) {
      skippedFoldersTitle.textContent = `Skipped Directories & Ignored Paths (${skipped.length})`;
    }
    if (!discoverySkippedTbody) return;
    if (!skipped || skipped.length === 0) {
      discoverySkippedTbody.innerHTML = '<tr><td colspan="3" class="text-muted">No directories skipped during scan.</td></tr>';
      return;
    }
    discoverySkippedTbody.innerHTML = skipped.map(s => `
      <tr>
        <td><strong>${escapeHtml(s.name)}</strong></td>
        <td><code>${escapeHtml(s.path)}</code></td>
        <td><span class="badge badge-secondary text-xs">${escapeHtml(s.reason)}</span></td>
      </tr>
    `).join('');
  }

  function applyDiscoveryFilters() {
    const query = (discoverySearchInput ? discoverySearchInput.value : '').trim().toLowerCase();
    const filter = discoveryStatusFilter ? discoveryStatusFilter.value : 'ALL';

    const filtered = discoveredProjects.filter(p => {
      const matchStatus = (filter === 'ALL') || (p.status === filter);
      if (!matchStatus) return false;

      if (!query) return true;
      const idMatch = (p.id || '').toLowerCase().includes(query);
      const nameMatch = (p.name || '').toLowerCase().includes(query);
      const pathMatch = (p.path || '').toLowerCase().includes(query);
      const verMatch = (p.installedCoreVersion || '').toLowerCase().includes(query);
      return idMatch || nameMatch || pathMatch || verMatch;
    });

    renderDiscoveredProjectsTable(filtered);
  }

  if (discoverySearchInput) {
    discoverySearchInput.addEventListener('input', applyDiscoveryFilters);
  }
  if (discoveryStatusFilter) {
    discoveryStatusFilter.addEventListener('change', applyDiscoveryFilters);
  }
  if (btnRescanDiscovery) {
    btnRescanDiscovery.addEventListener('click', () => loadWorkspaceDiscovery(true));
  }

  // Toggle Skipped Folders Drawer
  if (btnToggleSkipped && discoverySkippedContainer) {
    btnToggleSkipped.addEventListener('click', () => {
      const isHidden = discoverySkippedContainer.style.display === 'none';
      discoverySkippedContainer.style.display = isHidden ? 'block' : 'none';
    });
  }

  // Toggle Advanced Custom Path Drawer
  if (btnToggleAdvancedPath && advancedPathContainer) {
    btnToggleAdvancedPath.addEventListener('click', () => {
      const isHidden = advancedPathContainer.style.display === 'none';
      advancedPathContainer.style.display = isHidden ? 'block' : 'none';
    });
  }

  // Advanced Path Validation Button
  if (btnTestAdvancedPath && inputAdvancedClientPath) {
    btnTestAdvancedPath.addEventListener('click', async () => {
      const candidatePath = inputAdvancedClientPath.value.trim();
      if (!candidatePath) {
        if (advancedPathFeedback) {
          advancedPathFeedback.style.display = 'block';
          advancedPathFeedback.className = 'alert alert-warning mt-2';
          advancedPathFeedback.textContent = 'Please enter an absolute client repository path.';
        }
        return;
      }

      btnTestAdvancedPath.disabled = true;
      btnTestAdvancedPath.textContent = 'Validating...';
      if (advancedPathFeedback) advancedPathFeedback.style.display = 'none';

      try {
        const res = await fetch('/api/workspace/validate-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: candidatePath })
        });
        const data = await res.json();
        if (data.ok && data.validation && data.validation.valid) {
          const v = data.validation;
          const escaped = v.path.replace(/\\/g, '\\\\');
          if (advancedPathFeedback) {
            advancedPathFeedback.style.display = 'block';
            advancedPathFeedback.className = 'alert alert-success mt-2';
            advancedPathFeedback.innerHTML = `
              <strong>Valid Client Workspace:</strong> <code>${escapeHtml(v.project?.id || v.path)}</code><br>
              <div class="mt-1 text-xs">
                Installed Core: <strong>v${escapeHtml(v.project?.installedCoreVersion || '--')}</strong> &bull;
                Git: ${v.project?.isGit ? escapeHtml(v.project.gitBranch) : 'Non-Git'} &bull;
                Approved Boundary: <strong>${v.isApproved ? 'YES' : 'NO (Add root below)'}</strong>
              </div>
              <button type="button" class="btn btn-primary btn-sm mt-2" onclick="window.selectDiscoveredProject('${escapeHtml(escaped)}')">
                Select for Upgrade &rarr;
              </button>
            `;
          }
        } else {
          const err = data.validation?.reason || data.validation?.error || data.error || 'Directory failed client validation.';
          if (advancedPathFeedback) {
            advancedPathFeedback.style.display = 'block';
            advancedPathFeedback.className = 'alert alert-danger mt-2';
            advancedPathFeedback.textContent = `Path rejected: ${err}`;
          }
        }
      } catch (err) {
        if (advancedPathFeedback) {
          advancedPathFeedback.style.display = 'block';
          advancedPathFeedback.className = 'alert alert-danger mt-2';
          advancedPathFeedback.textContent = `Error: ${err.message}`;
        }
      } finally {
        btnTestAdvancedPath.disabled = false;
        btnTestAdvancedPath.textContent = 'Validate & Inspect';
      }
    });
  }

  // Add Root Button
  if (btnValidateAddRoot && inputAddRoot) {
    btnValidateAddRoot.addEventListener('click', async () => {
      const newRoot = inputAddRoot.value.trim();
      if (!newRoot) return;

      btnValidateAddRoot.disabled = true;
      btnValidateAddRoot.textContent = 'Adding...';

      try {
        const currentRoots = (settingWorkspaceRoots.value || '')
          .split('\n')
          .map(r => r.trim())
          .filter(Boolean);

        if (!currentRoots.includes(newRoot)) {
          currentRoots.push(newRoot);
          settingWorkspaceRoots.value = currentRoots.join('\n');
          await saveAdminSettings();
          inputAddRoot.value = '';
          if (addRootFeedback) {
            addRootFeedback.style.display = 'block';
            addRootFeedback.className = 'alert alert-success mt-2';
            addRootFeedback.textContent = `Approved root "${newRoot}" added and saved.`;
          }
          await loadWorkspaceDiscovery(true);
        } else {
          if (addRootFeedback) {
            addRootFeedback.style.display = 'block';
            addRootFeedback.className = 'alert alert-info mt-2';
            addRootFeedback.textContent = 'This workspace root is already in the approved list.';
          }
        }
      } catch (err) {
        if (addRootFeedback) {
          addRootFeedback.style.display = 'block';
          addRootFeedback.className = 'alert alert-danger mt-2';
          addRootFeedback.textContent = `Failed to add root: ${err.message}`;
        }
      } finally {
        btnValidateAddRoot.disabled = false;
        btnValidateAddRoot.textContent = 'Add Root';
      }
    });
  }

  // Window global function for Selecting a Discovered Project for Upgrade
  window.selectDiscoveredProject = function(projectPath) {
    const proj = discoveredProjects.find(p => p.path === projectPath) || {
      id: pathBasename(projectPath),
      name: pathBasename(projectPath),
      path: projectPath,
      installedCoreVersion: '0.0.0',
    };

    switchView('new-upgrade');

    let opt = Array.from(projectSelect.options).find(o => o.value === proj.id || o.textContent.includes(proj.id));
    if (!opt) {
      opt = document.createElement('option');
      opt.value = proj.id;
      opt.textContent = `${proj.id} (Current: v${proj.installedCoreVersion || '0.0.0'})`;
      projectSelect.appendChild(opt);
    }
    projectSelect.value = opt.value;
    selectedProject = {
      id: proj.id,
      name: proj.name || proj.id,
      path: proj.path,
      currentVersion: proj.installedCoreVersion || '0.0.0',
      status: proj.status,
    };

    clientPathHint.textContent = proj.path;
    currentVersionDisplay.textContent = `v${proj.installedCoreVersion || '0.0.0'}`;
    updateUpgradeModePreview();
    preflightResult = null;
    validateStartPrerequisites();
    goToWizardStep(1);
  };

  // ---------------------------------------------------------------------------
  // 10b. Copilot CLI & Environment Diagnostics
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

        if (diagHeroStatusPill) {
          if (c.simulatorActive) {
            diagHeroStatusPill.className = 'badge badge-info';
            diagHeroStatusPill.textContent = 'SIMULATOR ACTIVE';
            if (heroStatusCircle) heroStatusCircle.style.color = 'var(--info)';
          } else if (c.status === 'HEALTHY') {
            diagHeroStatusPill.className = 'badge badge-success';
            diagHeroStatusPill.textContent = `HEALTHY (v${c.version || '1.0+'})`;
            if (heroStatusCircle) heroStatusCircle.style.color = 'var(--success)';
          } else if (c.status === 'SIGN_IN_REQUIRED') {
            diagHeroStatusPill.className = 'badge badge-warning';
            diagHeroStatusPill.textContent = 'SIGN-IN REQUIRED';
            if (heroStatusCircle) heroStatusCircle.style.color = 'var(--warning)';
          } else {
            diagHeroStatusPill.className = 'badge badge-danger';
            diagHeroStatusPill.textContent = 'CLI OFFLINE';
            if (heroStatusCircle) heroStatusCircle.style.color = 'var(--danger)';
          }
        }

        if (qpValCopilot) {
          qpValCopilot.textContent = c.status === 'HEALTHY'
            ? `v${c.version || '1.0+'} Healthy`
            : (c.status === 'SIGN_IN_REQUIRED' ? 'Sign-In Required' : (c.available ? 'Installed' : 'Not Found'));
        }
        if (qpDotCopilot) {
          qpDotCopilot.className = `quick-pill-dot ${c.status === 'HEALTHY' ? 'success' : (c.status === 'SIGN_IN_REQUIRED' ? 'warning' : 'danger')}`;
        }

        if (diagCliStatus) {
          diagCliStatus.textContent = c.available ? 'INSTALLED & REACHABLE' : (c.status || 'OFFLINE');
          diagCliStatus.className = c.available ? 'diag-value text-success' : 'diag-value text-danger';
        }
        if (diagCliPath) diagCliPath.textContent = c.executablePath || 'Not found in PATH';
        if (diagCliVersion) diagCliVersion.textContent = c.version || 'Unavailable';

        if (diagCliAuthStatus) {
          if (c.authenticated) {
            diagCliAuthStatus.innerHTML = '<span class="badge badge-success">AUTHENTICATED</span>';
          } else if (c.status === 'SIGN_IN_REQUIRED') {
            diagCliAuthStatus.innerHTML = '<span class="badge badge-warning">SIGN-IN REQUIRED</span>';
          } else {
            diagCliAuthStatus.innerHTML = `<span class="badge badge-secondary">${escapeHtml(c.status || '--')}</span>`;
          }
        }

        if (diagCliAccount) {
          diagCliAccount.textContent = c.identity || c.accountIdentity || (c.authenticated ? 'Authenticated' : 'Not Authenticated');
        }
        if (diagCliCredSource) diagCliCredSource.textContent = c.credentialSource || 'None';
        if (diagCliModel) diagCliModel.textContent = c.model || c.configuredModel || 'CLI Default';
        if (diagCliNoninteractive) {
          diagCliNoninteractive.textContent = (c.nonInteractiveSupported || c.nonInteractiveCapable) ? 'Supported (-p flag)' : 'Not Supported';
        }
        if (diagCliTimestamp) {
          diagCliTimestamp.textContent = new Date(c.lastHealthCheck || c.checkedAt || Date.now()).toLocaleTimeString();
        }

        const errDetail = c.error || c.diagnosticDetails;
        const remed = Array.isArray(c.remediationSteps) ? c.remediationSteps.map(r => `• ${escapeHtml(r)}`).join('<br>') : c.remediation;
        if (diagCliRemediation) {
          if (errDetail || !c.available || c.status === 'SIGN_IN_REQUIRED') {
            diagCliRemediation.style.display = 'block';
            diagCliRemediation.innerHTML = `
              <div class="alert ${c.available ? 'alert-warning' : 'alert-danger'}">
                <strong>Diagnostic Notice:</strong> ${escapeHtml(errDetail || 'Copilot CLI is offline or not installed in PATH.')}<br>
                <div class="mt-2 text-sm"><strong>Remediation:</strong><br>${remed || 'Install GitHub Copilot CLI or use Simulation Mode for offline testing.'}</div>
              </div>
            `;
          } else {
            diagCliRemediation.style.display = 'none';
          }
        }
      }

      if (envData && envData.ok) {
        const sys = envData.environment?.system || envData.system || {};
        if (envSysPlatform) envSysPlatform.textContent = sys.platform === 'win32' ? 'Windows' : (sys.platform || 'OS');
        if (envSysArch) envSysArch.textContent = `${sys.arch || 'x64'} architecture`;
        if (envSysNode) envSysNode.textContent = sys.nodeVersion || 'Node.js';
        if (envSysMemory) envSysMemory.textContent = `${sys.heapUsedMb || (sys.memoryUsage ? Math.round(sys.memoryUsage.heapUsed / 1024 / 1024) : '--')} MB`;
        if (envSysFreemem) envSysFreemem.textContent = `${sys.freeMemMb || (sys.freeMemory ? Math.round(sys.freeMemory / 1024 / 1024) : '--')} MB free`;
        if (envSysUptime) envSysUptime.textContent = `${sys.uptimeSeconds || sys.uptimeSec || (sys.uptime ? Math.round(sys.uptime) : '0')}s`;

        if (Array.isArray(envData.environment?.tools)) {
          const tools = envData.environment.tools;
          const readyCount = tools.filter(t => t.available).length;

          if (qpValTools) qpValTools.textContent = `${readyCount}/${tools.length} Tools Ready`;
          if (qpDotTools) qpDotTools.className = 'quick-pill-dot success';

          if (envToolsTableBody) {
            envToolsTableBody.innerHTML = tools.map(t => {
              const isHealthy = t.status === 'HEALTHY' || t.status === 'OK';
              const statusClass = isHealthy ? 'badge-success' : (t.status === 'OPTIONAL' ? 'badge-info' : 'badge-danger');
              return `
                <tr>
                  <td><strong>${escapeHtml(t.tool)}</strong></td>
                  <td><span class="badge ${t.available ? 'badge-success' : 'badge-danger'}">${t.available ? 'YES' : 'NO'}</span></td>
                  <td><code>${escapeHtml(t.version || 'Not Found')}</code></td>
                  <td><code class="text-xs text-muted">${escapeHtml(t.path || '--')}</code></td>
                  <td><small class="text-muted">${escapeHtml(t.requirement)}</small></td>
                  <td><span class="badge ${statusClass}">${escapeHtml(t.status)}</span></td>
                </tr>
              `;
            }).join('');
          }
        }
      }

    } catch (err) {
      console.error('Failed loading diagnostics:', err);
    }
  }

  if (btnRetestCli) {
    btnRetestCli.addEventListener('click', () => {
      loadDiagnostics();
      loadSystemSummary();
    });
  }

  if (btnRefreshToolchain) {
    btnRefreshToolchain.addEventListener('click', () => {
      loadDiagnostics();
    });
  }

  // ---------------------------------------------------------------------------
  // 10c. Azure DevOps & NuGet Authentication Matrix
  // ---------------------------------------------------------------------------
  async function loadNuGetAuthStatus(force = false) {
    if (settingsNugetAuthBadge) {
      settingsNugetAuthBadge.className = 'badge badge-secondary';
      settingsNugetAuthBadge.innerHTML = '<span class="loading-spinner-sm mr-1"></span> Probing...';
    }
    if (qpValNuget) qpValNuget.textContent = 'Probing...';
    if (qpDotNuget) qpDotNuget.className = 'quick-pill-dot info';

    try {
      const url = force ? '/api/nuget/auth-status?refresh=true' : '/api/nuget/auth-status';
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to fetch auth diagnostics');

      if (settingsNugetAuthBadge) {
        if (data.overallStatus === 'AUTHENTICATED') {
          settingsNugetAuthBadge.className = 'badge badge-success';
          settingsNugetAuthBadge.textContent = 'AUTHENTICATED';
        } else if (data.overallStatus === 'SIGN_IN_REQUIRED') {
          settingsNugetAuthBadge.className = 'badge badge-warning';
          settingsNugetAuthBadge.textContent = 'SIGN-IN REQUIRED';
        } else {
          settingsNugetAuthBadge.className = 'badge badge-danger';
          settingsNugetAuthBadge.textContent = data.overallStatus || 'AUTH ERROR';
        }
      }

      if (qpValNuget) {
        qpValNuget.textContent = data.overallStatus === 'AUTHENTICATED'
          ? `Connected (${data.activeAccount || 'Ready'})`
          : (data.overallStatus === 'SIGN_IN_REQUIRED' ? 'Sign-In Required' : 'Auth Error');
      }
      if (qpDotNuget) {
        qpDotNuget.className = `quick-pill-dot ${data.overallStatus === 'AUTHENTICATED' ? 'success' : (data.overallStatus === 'SIGN_IN_REQUIRED' ? 'warning' : 'danger')}`;
      }

      if (patStatusIndicator) {
        patStatusIndicator.innerHTML = data.hasStoredPat
          ? '<span class="badge badge-success">Configured & Protected</span>'
          : '<span class="badge badge-secondary">Not Configured</span>';
      }

      if (settingsAuthIdentityDetails) {
        const actDisplay = data.activeAccount
          ? `<strong>Active Azure Account:</strong> ${escapeHtml(data.activeAccount)}`
          : '<span class="text-warning">No active Azure login detected</span>';
        const patDisplay = data.hasStoredPat ? '<span class="badge badge-success text-xs">PAT Active</span>' : '<span class="text-muted text-xs">No PAT</span>';
        settingsAuthIdentityDetails.innerHTML = `${actDisplay} &bull; Stored Credential: ${patDisplay}`;
      }

      if (authFacetsContainer && data.facets) {
        renderAuthFacets(data.facets);
      }

    } catch (err) {
      if (settingsNugetAuthBadge) {
        settingsNugetAuthBadge.className = 'badge badge-danger';
        settingsNugetAuthBadge.textContent = 'ERROR';
      }
      if (qpValNuget) qpValNuget.textContent = 'Check Failed';
      if (qpDotNuget) qpDotNuget.className = 'quick-pill-dot danger';
      if (settingsAuthIdentityDetails) {
        settingsAuthIdentityDetails.innerHTML = `<span class="text-danger">Diagnostic failure: ${escapeHtml(err.message)}</span>`;
      }
    }
  }

  function renderAuthFacets(facets) {
    if (!authFacetsContainer || !facets) return;

    const facetDefinitions = [
      { key: 'azureCli', num: 1, title: 'Azure CLI' },
      { key: 'azureCliLogin', num: 2, title: 'Azure CLI Login' },
      { key: 'azureDevOpsOrg', num: 3, title: 'Target Organization & Feed' },
      { key: 'feedReachability', num: 4, title: 'Feed Reachability' },
      { key: 'credentialProvider', num: 5, title: 'Credential Provider' },
      { key: 'feedAuthentication', num: 6, title: 'Effective Feed Auth' },
      { key: 'packageReadPermission', num: 7, title: 'Package Read Permission' }
    ];

    authFacetsContainer.innerHTML = facetDefinitions.map(def => {
      const f = facets[def.key] || {};
      const status = f.status || 'UNKNOWN';

      const isPass = ['INSTALLED', 'LOGGED_IN', 'CONFIGURED', 'REACHABLE', 'READY', 'AUTHENTICATED', 'READ_PERMITTED'].includes(status);
      const isWarn = ['OPTIONAL_MISSING', 'NOT_LOGGED_IN', 'AUTH_REQUIRED', 'SIGN_IN_REQUIRED'].includes(status);

      const cardClass = isPass ? 'facet-card success' : (isWarn ? 'facet-card warning' : 'facet-card danger');
      const badgeClass = isPass ? 'badge-success' : (isWarn ? 'badge-warning' : 'badge-danger');

      let valText = f.status || '--';
      if (def.key === 'azureCli') valText = f.installed ? (f.version || 'Installed') : 'Not Found';
      else if (def.key === 'azureCliLogin') valText = f.account || (status === 'LOGGED_IN' ? 'Logged In' : 'Not Signed In');
      else if (def.key === 'azureDevOpsOrg') valText = f.organization || 'preciofishbone';
      else if (def.key === 'feedReachability') valText = f.reachable ? `HTTP ${f.statusCode || 200} OK` : 'Unreachable';
      else if (def.key === 'credentialProvider') valText = f.installed ? 'Installed (MSAL)' : 'Not Found';
      else if (def.key === 'feedAuthentication') valText = f.authenticated ? `via ${f.authMechanism || 'Azure CLI'}` : 'Auth Required';
      else if (def.key === 'packageReadPermission') valText = f.canRead ? `${f.versionCount || 0} Versions` : 'No Access';

      return `
        <div class="${cardClass}" id="facet-${def.key}">
          <div class="facet-header">
            <span class="facet-num">${def.num}</span>
            <span class="badge ${badgeClass} text-xs">${escapeHtml(status)}</span>
          </div>
          <div class="facet-title">${escapeHtml(def.title)}</div>
          <div class="facet-value" title="${escapeHtml(valText)}">${escapeHtml(valText)}</div>
          <div class="facet-detail" title="${escapeHtml(f.detail || '')}">${escapeHtml(f.detail || '')}</div>
        </div>
      `;
    }).join('');
  }

  if (btnRefreshNugetMatrix) {
    btnRefreshNugetMatrix.addEventListener('click', () => {
      loadNuGetAuthStatus(true);
      loadNuGetSources(true);
    });
  }

  // ---------------------------------------------------------------------------
  // 10d. Settings Persistence & Runtime Limits
  // ---------------------------------------------------------------------------
  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.ok && data.settings) {
        const s = data.settings;
        if (settingWorkspaceRoots) {
          settingWorkspaceRoots.value = Array.isArray(s.approvedWorkspaceRoots) ? s.approvedWorkspaceRoots.join('\n') : '';
        }
        if (settingCorePath) settingCorePath.value = s.corePath || '';
        if (settingTimeout) settingTimeout.value = s.executionTimeoutMs || 300000;
        if (settingConcurrency) settingConcurrency.value = s.concurrencyLimit || 1;
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
        if (s.defaultUpgradeMode && settingDefaultUpgradeMode) {
          settingDefaultUpgradeMode.value = s.defaultUpgradeMode;
        }
        if (patStatusIndicator) {
          patStatusIndicator.innerHTML = s.hasAzureDevOpsPat
            ? '<span class="badge badge-success">Configured & Protected</span>'
            : '<span class="badge badge-secondary">Not Configured</span>';
        }
        if (settingVerifyBuild) {
          settingVerifyBuild.checked = s.verification?.runBuild !== false;
        }
        if (settingVerifyTests) {
          settingVerifyTests.checked = s.verification?.runTests !== false;
        }
        if (settingVerifyApi) {
          settingVerifyApi.checked = s.verification?.checkApiSurface !== false;
        }
        if (settingSimulationMode) {
          settingSimulationMode.checked = Boolean(s.simulationMode);
        }
      }
    } catch (_) {}
  }

  async function saveAdminSettings() {
    if (btnSaveSettings) {
      btnSaveSettings.disabled = true;
      btnSaveSettings.textContent = 'Saving...';
    }
    if (btnSaveSettingsBottom) {
      btnSaveSettingsBottom.disabled = true;
      btnSaveSettingsBottom.textContent = 'Saving...';
    }
    if (settingsSaveAlert) settingsSaveAlert.style.display = 'none';

    try {
      const roots = (settingWorkspaceRoots.value || '')
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const modelVal = settingCopilotModel && settingCopilotModel.value === 'custom'
        ? (settingCustomCopilotModel ? settingCustomCopilotModel.value.trim() : 'auto')
        : (settingCopilotModel ? settingCopilotModel.value : 'auto');

      const payload = {
        approvedWorkspaceRoots: roots,
        corePath: (settingCorePath ? settingCorePath.value : '').trim(),
        executionTimeoutMs: parseInt(settingTimeout.value, 10),
        concurrencyLimit: parseInt(settingConcurrency.value, 10),
        copilotModel: modelVal || 'auto',
        defaultUpgradeMode: (settingDefaultUpgradeMode && settingDefaultUpgradeMode.value) ? settingDefaultUpgradeMode.value : 'AUTO',
        verification: {
          runBuild: settingVerifyBuild ? settingVerifyBuild.checked : true,
          runTests: settingVerifyTests ? settingVerifyTests.checked : true,
          checkApiSurface: settingVerifyApi ? settingVerifyApi.checked : true,
        },
        simulationMode: settingSimulationMode ? settingSimulationMode.checked : false,
      };

      if (settingAzurePat && settingAzurePat.value.trim()) {
        payload.azureDevOpsPat = settingAzurePat.value.trim();
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok) {
        if (settingsSaveAlert) {
          settingsSaveAlert.className = 'alert alert-success';
          settingsSaveAlert.textContent = 'Settings validated and saved successfully.';
          settingsSaveAlert.style.display = 'block';
        }
        if (settingAzurePat) settingAzurePat.value = '';
        await loadSettings();
        await loadWorkspaceDiscovery(true);
      } else {
        const errors = (data.errors || [data.error]).join(', ');
        if (settingsSaveAlert) {
          settingsSaveAlert.className = 'alert alert-danger';
          settingsSaveAlert.textContent = 'Failed to save settings: ' + errors;
          settingsSaveAlert.style.display = 'block';
        }
      }
    } catch (err) {
      if (settingsSaveAlert) {
        settingsSaveAlert.className = 'alert alert-danger';
        settingsSaveAlert.textContent = 'Network error saving settings: ' + err.message;
        settingsSaveAlert.style.display = 'block';
      }
    } finally {
      if (btnSaveSettings) {
        btnSaveSettings.disabled = false;
        btnSaveSettings.textContent = 'Save & Validate Settings';
      }
      if (btnSaveSettingsBottom) {
        btnSaveSettingsBottom.disabled = false;
        btnSaveSettingsBottom.textContent = 'Save & Validate Settings';
      }
    }
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', saveAdminSettings);
  }
  if (btnSaveSettingsBottom) {
    btnSaveSettingsBottom.addEventListener('click', saveAdminSettings);
  }

  if (btnToggleSimulation && settingSimulationMode) {
    btnToggleSimulation.addEventListener('click', async () => {
      settingSimulationMode.checked = !settingSimulationMode.checked;
      await saveAdminSettings();
      await loadDiagnostics();
    });
  }

  if (btnAdminRefreshAll) {
    btnAdminRefreshAll.addEventListener('click', async () => {
      btnAdminRefreshAll.disabled = true;
      btnAdminRefreshAll.innerHTML = '<span class="loading-spinner-sm mr-1"></span> Refreshing All...';
      try {
        await Promise.all([
          loadWorkspaceDiscovery(true),
          loadDiagnostics(),
          loadNuGetAuthStatus(true),
          loadNuGetSources(true),
          loadSettings()
        ]);
      } finally {
        btnAdminRefreshAll.disabled = false;
        btnAdminRefreshAll.textContent = 'Refresh Diagnostics';
      }
    });
  }

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
            <td class="text-right">
              <button class="btn btn-secondary btn-xs" onclick="window.inspectJob('${escapeHtml(j.id)}')">View</button>
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

  // ---------------------------------------------------------------------------
  // 10d. GitHub Copilot CLI Authentication & Login Flow
  // ---------------------------------------------------------------------------
  const copilotAuthModal = document.getElementById('copilot-auth-modal');
  const btnOpenCopilotAuthModal = document.getElementById('btn-open-copilot-auth-modal');
  const topbarCopilotLabel = document.getElementById('topbar-copilot-label');
  const btnCloseCopilotModal = document.getElementById('btn-close-copilot-modal');
  const btnCloseCopilotModalFooter = document.getElementById('btn-close-copilot-modal-footer');
  const modalCopilotDot = document.getElementById('modal-copilot-dot');
  const modalCopilotStatusText = document.getElementById('modal-copilot-status-text');
  const modalCopilotAccountText = document.getElementById('modal-copilot-account-text');
  const btnCopilotRetestModal = document.getElementById('btn-copilot-retest-modal');
  const btnModalCopilotSignout = document.getElementById('btn-modal-copilot-signout');

  const tabBtnCopilotWeb = document.getElementById('tab-btn-copilot-web');
  const tabBtnCopilotDevice = document.getElementById('tab-btn-copilot-device');
  const tabBtnCopilotToken = document.getElementById('tab-btn-copilot-token');
  const paneCopilotWeb = document.getElementById('pane-copilot-web');
  const paneCopilotDevice = document.getElementById('pane-copilot-device');
  const paneCopilotToken = document.getElementById('pane-copilot-token');

  const webFlowInitial = document.getElementById('web-flow-initial');
  const webFlowActive = document.getElementById('web-flow-active');
  const btnModalCopilotWebLogin = document.getElementById('btn-modal-copilot-web-login');
  const linkOpenWebAuthUrl = document.getElementById('link-open-web-auth-url');
  const btnCancelWebFlow = document.getElementById('btn-cancel-web-flow');
  const btnCheckWebFlow = document.getElementById('btn-check-web-flow');
  const modalCopilotWebFeedback = document.getElementById('modal-copilot-web-feedback');

  const deviceFlowInitial = document.getElementById('device-flow-initial');
  const deviceFlowActive = document.getElementById('device-flow-active');
  const btnModalStartDeviceFlow = document.getElementById('btn-modal-start-device-flow');
  const deviceCodeValue = document.getElementById('device-code-value');
  const btnCopyDeviceCode = document.getElementById('btn-copy-device-code');
  const linkOpenDevicePage = document.getElementById('link-open-device-page');
  const devicePollMsg = document.getElementById('device-poll-msg');
  const btnCancelDeviceFlow = document.getElementById('btn-cancel-device-flow');
  const modalCopilotDeviceFeedback = document.getElementById('modal-copilot-device-feedback');

  const modalCopilotTokenInput = document.getElementById('modal-copilot-token-input');
  const btnToggleTokenVisibility = document.getElementById('btn-toggle-token-visibility');
  const btnModalSaveCopilotToken = document.getElementById('btn-modal-save-copilot-token');
  const btnModalClearCopilotToken = document.getElementById('btn-modal-clear-copilot-token');
  const modalCopilotTokenFeedback = document.getElementById('modal-copilot-token-feedback');

  const btnAdminCopilotLogin = document.getElementById('btn-admin-copilot-login');
  const btnAdminCopilotLogout = document.getElementById('btn-admin-copilot-logout');
  const adminCopilotAuthSummary = document.getElementById('admin-copilot-auth-summary');

  let activeWebLoginId = null;
  let copilotWebPollTimer = null;
  let activeDeviceLoginId = null;
  let copilotDevicePollTimer = null;

  function switchCopilotAuthTab(tabName) {
    [tabBtnCopilotWeb, tabBtnCopilotDevice, tabBtnCopilotToken].forEach(b => {
      if (!b) return;
      b.classList.toggle('active', b.getAttribute('data-copilot-tab') === tabName);
    });
    if (paneCopilotWeb) paneCopilotWeb.style.display = tabName === 'web' ? 'block' : 'none';
    if (paneCopilotDevice) paneCopilotDevice.style.display = tabName === 'device' ? 'block' : 'none';
    if (paneCopilotToken) paneCopilotToken.style.display = tabName === 'token' ? 'block' : 'none';
  }

  function openCopilotAuthModal() {
    if (copilotAuthModal) {
      copilotAuthModal.style.display = 'flex';
      loadCopilotAuthStatus(false);
    }
  }

  function closeCopilotAuthModal() {
    if (copilotAuthModal) {
      copilotAuthModal.style.display = 'none';
    }
    if (copilotWebPollTimer) {
      clearInterval(copilotWebPollTimer);
      copilotWebPollTimer = null;
    }
    if (copilotDevicePollTimer) {
      clearInterval(copilotDevicePollTimer);
      copilotDevicePollTimer = null;
    }
  }

  async function loadCopilotAuthStatus(force = false) {
    try {
      const res = await fetch('/api/copilot/auth-status');
      if (!res.ok) return;
      const data = await res.json();

      const isAuthed = Boolean(data.authenticated);
      const identity = data.identity || (data.credentialSource ? `Using ${data.credentialSource}` : null);

      // Topbar button & badge
      if (topbarCopilotLabel) {
        topbarCopilotLabel.textContent = isAuthed ? (identity || 'Copilot Connected') : 'Copilot Sign In';
      }
      if (btnOpenCopilotAuthModal) {
        btnOpenCopilotAuthModal.className = isAuthed
          ? 'btn btn-secondary btn-sm flex-center gap-2 border-success-subtle text-success'
          : 'btn btn-secondary btn-sm flex-center gap-2';
      }
      if (cliHealthBadge) {
        cliHealthBadge.textContent = isAuthed ? `Copilot CLI: ${identity || 'Connected'}` : (data.available ? 'Copilot CLI: Sign In Required' : 'Copilot CLI: Not in PATH');
        cliHealthBadge.className = isAuthed ? 'badge badge-success' : (data.available ? 'badge badge-warning' : 'badge badge-secondary');
      }

      // Quick strip in Admin Console
      if (qpValCopilot) {
        qpValCopilot.textContent = isAuthed ? `Active (${identity || 'Authenticated'})` : (data.available ? 'Sign In Required' : 'Not Detected');
      }
      if (qpDotCopilot) {
        qpDotCopilot.className = isAuthed ? 'quick-pill-dot success' : (data.available ? 'quick-pill-dot warning' : 'quick-pill-dot danger');
      }

      // Modal Status Banner
      if (modalCopilotDot) {
        modalCopilotDot.className = isAuthed ? 'health-dot' : (data.available ? 'health-dot warning' : 'health-dot danger');
      }
      if (modalCopilotStatusText) {
        modalCopilotStatusText.textContent = isAuthed ? 'Authenticated & Ready' : (data.available ? 'Installed • Sign In Required' : 'CLI Binary Not Found in PATH');
        modalCopilotStatusText.className = isAuthed ? 'text-success' : (data.available ? 'text-warning' : 'text-danger');
      }
      if (modalCopilotAccountText) {
        modalCopilotAccountText.textContent = identity ? `Account / Identity: ${identity}` : 'No active account detected';
      }
      if (btnModalCopilotSignout) {
        btnModalCopilotSignout.style.display = isAuthed ? 'inline-flex' : 'none';
      }

      // Admin Console Summary
      if (adminCopilotAuthSummary) {
        adminCopilotAuthSummary.textContent = isAuthed
          ? `Connected as ${identity || 'active account'}. AI reasoning is active.`
          : 'Not currently authenticated. Sign in to enable autonomous AI reasoning during refactoring and repairs.';
      }

      // Diagnostic card values
      if (diagCliAuthStatus) {
        diagCliAuthStatus.textContent = isAuthed ? 'AUTHENTICATED' : (data.available ? 'SIGN_IN_REQUIRED' : 'OFFLINE');
        diagCliAuthStatus.className = isAuthed ? 'diag-value text-success' : 'diag-value text-warning';
      }
      if (diagCliAccount) {
        diagCliAccount.textContent = identity || 'None';
      }
      if (diagCliCredSource) {
        diagCliCredSource.textContent = data.credentialSource || 'None';
      }

    } catch (err) {
      console.error('Failed to load Copilot auth status:', err);
    }
  }

  // Web Flow
  async function triggerCopilotWebLogin() {
    if (modalCopilotWebFeedback) {
      modalCopilotWebFeedback.style.display = 'none';
      modalCopilotWebFeedback.innerHTML = '';
    }
    if (btnModalCopilotWebLogin) btnModalCopilotWebLogin.disabled = true;

    try {
      const res = await fetch('/api/copilot/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login-web' }),
      });
      const data = await res.json();
      if (btnModalCopilotWebLogin) btnModalCopilotWebLogin.disabled = false;

      if (!data.ok) {
        if (modalCopilotWebFeedback) {
          modalCopilotWebFeedback.style.display = 'block';
          modalCopilotWebFeedback.innerHTML = `<span class="text-danger">${escapeHtml(data.error || 'Failed to start browser login.')}</span>`;
        }
        return;
      }

      activeWebLoginId = data.loginId;

      if (data.authUrl) {
        if (linkOpenWebAuthUrl) {
          linkOpenWebAuthUrl.href = data.authUrl;
          linkOpenWebAuthUrl.style.display = 'inline-flex';
        }
        try {
          window.open(data.authUrl, '_blank');
        } catch (_) {}
      } else {
        if (linkOpenWebAuthUrl) linkOpenWebAuthUrl.style.display = 'none';
      }

      if (webFlowInitial) webFlowInitial.style.display = 'none';
      if (webFlowActive) webFlowActive.style.display = 'block';

      // Start polling
      if (copilotWebPollTimer) clearInterval(copilotWebPollTimer);
      copilotWebPollTimer = setInterval(pollCopilotWebStatus, 2500);

    } catch (err) {
      if (btnModalCopilotWebLogin) btnModalCopilotWebLogin.disabled = false;
      if (modalCopilotWebFeedback) {
        modalCopilotWebFeedback.style.display = 'block';
        modalCopilotWebFeedback.innerHTML = `<span class="text-danger">Request failed: ${escapeHtml(err.message)}</span>`;
      }
    }
  }

  async function pollCopilotWebStatus() {
    if (!activeWebLoginId) return;
    try {
      const res = await fetch('/api/copilot/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'web-poll', loginId: activeWebLoginId }),
      });
      const data = await res.json();
      if (!data.ok) return;

      if (data.status === 'completed' || data.authenticated) {
        if (copilotWebPollTimer) {
          clearInterval(copilotWebPollTimer);
          copilotWebPollTimer = null;
        }
        if (modalCopilotWebFeedback) {
          modalCopilotWebFeedback.style.display = 'block';
          modalCopilotWebFeedback.innerHTML = `<div class="alert alert-success p-2"><strong>Successfully authenticated!</strong> Logged in as ${escapeHtml(data.identity || 'active user')}.</div>`;
        }
        await loadCopilotAuthStatus(true);
        setTimeout(() => {
          if (webFlowInitial) webFlowInitial.style.display = 'block';
          if (webFlowActive) webFlowActive.style.display = 'none';
        }, 3000);
      } else if (data.status === 'failed') {
        if (copilotWebPollTimer) {
          clearInterval(copilotWebPollTimer);
          copilotWebPollTimer = null;
        }
        if (modalCopilotWebFeedback) {
          modalCopilotWebFeedback.style.display = 'block';
          modalCopilotWebFeedback.innerHTML = `<div class="alert alert-danger p-2">${escapeHtml(data.error || 'Web authentication ended.')}</div>`;
        }
      }
    } catch (_) {}
  }

  async function cancelCopilotWebFlow() {
    if (copilotWebPollTimer) {
      clearInterval(copilotWebPollTimer);
      copilotWebPollTimer = null;
    }
    if (activeWebLoginId) {
      try {
        await fetch('/api/copilot/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'web-cancel', loginId: activeWebLoginId }),
        });
      } catch (_) {}
      activeWebLoginId = null;
    }
    if (webFlowInitial) webFlowInitial.style.display = 'block';
    if (webFlowActive) webFlowActive.style.display = 'none';
  }

  // Device Code Flow
  async function startCopilotDeviceFlow() {
    if (modalCopilotDeviceFeedback) modalCopilotDeviceFeedback.style.display = 'none';
    if (btnModalStartDeviceFlow) btnModalStartDeviceFlow.disabled = true;

    try {
      const res = await fetch('/api/copilot/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login-device' }),
      });
      const data = await res.json();
      if (btnModalStartDeviceFlow) btnModalStartDeviceFlow.disabled = false;

      if (!data.ok) {
        if (modalCopilotDeviceFeedback) {
          modalCopilotDeviceFeedback.style.display = 'block';
          modalCopilotDeviceFeedback.innerHTML = `<span class="text-danger">${escapeHtml(data.error || 'Failed to start device flow')}</span>`;
        }
        return;
      }

      activeDeviceLoginId = data.loginId;
      if (deviceCodeValue) deviceCodeValue.textContent = data.userCode || '---- ----';
      if (deviceFlowInitial) deviceFlowInitial.style.display = 'none';
      if (deviceFlowActive) deviceFlowActive.style.display = 'block';
      if (devicePollMsg) devicePollMsg.textContent = 'Waiting for authorization on GitHub...';

      // Start polling
      if (copilotDevicePollTimer) clearInterval(copilotDevicePollTimer);
      const pollInterval = (data.pollIntervalSec || 3) * 1000;
      copilotDevicePollTimer = setInterval(pollCopilotDeviceStatus, pollInterval);

    } catch (err) {
      if (btnModalStartDeviceFlow) btnModalStartDeviceFlow.disabled = false;
      if (modalCopilotDeviceFeedback) {
        modalCopilotDeviceFeedback.style.display = 'block';
        modalCopilotDeviceFeedback.innerHTML = `<span class="text-danger">Request error: ${escapeHtml(err.message)}</span>`;
      }
    }
  }

  async function pollCopilotDeviceStatus() {
    if (!activeDeviceLoginId) return;
    try {
      const res = await fetch('/api/copilot/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'device-poll', loginId: activeDeviceLoginId }),
      });
      const data = await res.json();
      if (!data.ok) return;

      if (data.status === 'completed' || data.authenticated) {
        if (copilotDevicePollTimer) {
          clearInterval(copilotDevicePollTimer);
          copilotDevicePollTimer = null;
        }
        if (devicePollMsg) {
          devicePollMsg.innerHTML = '<strong class="text-success">Authorization successful! Authenticated.</strong>';
        }
        await loadCopilotAuthStatus(true);
        setTimeout(() => {
          if (deviceFlowInitial) deviceFlowInitial.style.display = 'block';
          if (deviceFlowActive) deviceFlowActive.style.display = 'none';
        }, 3000);
      } else if (data.status === 'failed' || data.status === 'timeout') {
        if (copilotDevicePollTimer) {
          clearInterval(copilotDevicePollTimer);
          copilotDevicePollTimer = null;
        }
        if (devicePollMsg) {
          devicePollMsg.innerHTML = `<span class="text-danger">${escapeHtml(data.error || 'Device authorization ended.')}</span>`;
        }
      }
    } catch (_) {}
  }

  async function cancelCopilotDeviceFlow() {
    if (copilotDevicePollTimer) {
      clearInterval(copilotDevicePollTimer);
      copilotDevicePollTimer = null;
    }
    if (activeDeviceLoginId) {
      try {
        await fetch('/api/copilot/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'device-cancel', loginId: activeDeviceLoginId }),
        });
      } catch (_) {}
      activeDeviceLoginId = null;
    }
    if (deviceFlowInitial) deviceFlowInitial.style.display = 'block';
    if (deviceFlowActive) deviceFlowActive.style.display = 'none';
  }

  // Token Auth
  async function saveCopilotToken() {
    const token = modalCopilotTokenInput ? modalCopilotTokenInput.value.trim() : '';
    if (!token) {
      if (modalCopilotTokenFeedback) {
        modalCopilotTokenFeedback.style.display = 'block';
        modalCopilotTokenFeedback.innerHTML = '<span class="text-warning">Please enter a GitHub or Copilot token.</span>';
      }
      return;
    }
    if (modalCopilotTokenFeedback) {
      modalCopilotTokenFeedback.style.display = 'block';
      modalCopilotTokenFeedback.innerHTML = '<span class="loading-spinner-sm"></span> Verifying token...';
    }
    try {
      const res = await fetch('/api/copilot/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-token', token }),
      });
      const data = await res.json();
      if (data.ok) {
        modalCopilotTokenFeedback.innerHTML = `<span class="text-success">Token saved and verified (${escapeHtml(data.identity || 'Authenticated')}).</span>`;
        if (modalCopilotTokenInput) modalCopilotTokenInput.value = '';
        await loadCopilotAuthStatus(true);
      } else {
        modalCopilotTokenFeedback.innerHTML = `<span class="text-danger">${escapeHtml(data.error || 'Token verification failed')}</span>`;
      }
    } catch (err) {
      modalCopilotTokenFeedback.innerHTML = `<span class="text-danger">Request failed: ${escapeHtml(err.message)}</span>`;
    }
  }

  async function clearCopilotToken() {
    if (!confirm('Are you sure you want to sign out and clear the configured Copilot credentials?')) return;
    try {
      const res = await fetch('/api/copilot/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await res.json();
      if (modalCopilotTokenFeedback) {
        modalCopilotTokenFeedback.style.display = 'block';
        modalCopilotTokenFeedback.innerHTML = '<span class="text-info">Credentials cleared.</span>';
      }
      await loadCopilotAuthStatus(true);
    } catch (err) {
      alert('Failed to clear token: ' + err.message);
    }
  }

  // Event listeners for Copilot auth
  if (btnOpenCopilotAuthModal) {
    btnOpenCopilotAuthModal.addEventListener('click', openCopilotAuthModal);
  }
  if (btnCloseCopilotModal) {
    btnCloseCopilotModal.addEventListener('click', closeCopilotAuthModal);
  }
  if (btnCloseCopilotModalFooter) {
    btnCloseCopilotModalFooter.addEventListener('click', closeCopilotAuthModal);
  }
  if (btnCopilotRetestModal) {
    btnCopilotRetestModal.addEventListener('click', () => loadCopilotAuthStatus(true));
  }
  if (btnModalCopilotSignout) {
    btnModalCopilotSignout.addEventListener('click', clearCopilotToken);
  }
  if (tabBtnCopilotWeb) {
    tabBtnCopilotWeb.addEventListener('click', () => switchCopilotAuthTab('web'));
  }
  if (tabBtnCopilotDevice) {
    tabBtnCopilotDevice.addEventListener('click', () => switchCopilotAuthTab('device'));
  }
  if (tabBtnCopilotToken) {
    tabBtnCopilotToken.addEventListener('click', () => switchCopilotAuthTab('token'));
  }
  if (btnModalCopilotWebLogin) {
    btnModalCopilotWebLogin.addEventListener('click', triggerCopilotWebLogin);
  }
  if (btnCancelWebFlow) {
    btnCancelWebFlow.addEventListener('click', cancelCopilotWebFlow);
  }
  if (btnCheckWebFlow) {
    btnCheckWebFlow.addEventListener('click', async () => {
      await pollCopilotWebStatus();
      await loadCopilotAuthStatus(true);
    });
  }
  if (btnModalStartDeviceFlow) {
    btnModalStartDeviceFlow.addEventListener('click', startCopilotDeviceFlow);
  }
  if (btnCancelDeviceFlow) {
    btnCancelDeviceFlow.addEventListener('click', cancelCopilotDeviceFlow);
  }
  if (btnCopyDeviceCode) {
    btnCopyDeviceCode.addEventListener('click', () => {
      const code = deviceCodeValue ? deviceCodeValue.textContent.trim() : '';
      if (!code || code === '---- ----') return;
      navigator.clipboard.writeText(code).then(() => {
        const orig = btnCopyDeviceCode.textContent;
        btnCopyDeviceCode.textContent = 'Copied!';
        setTimeout(() => { btnCopyDeviceCode.textContent = orig; }, 1500);
      });
      // Also open device page
      if (linkOpenDevicePage && linkOpenDevicePage.href) {
        window.open(linkOpenDevicePage.href, '_blank');
      }
    });
  }
  if (btnToggleTokenVisibility && modalCopilotTokenInput) {
    btnToggleTokenVisibility.addEventListener('click', () => {
      const isPwd = modalCopilotTokenInput.type === 'password';
      modalCopilotTokenInput.type = isPwd ? 'text' : 'password';
      btnToggleTokenVisibility.textContent = isPwd ? 'Hide' : 'Show';
    });
  }
  if (btnModalSaveCopilotToken) {
    btnModalSaveCopilotToken.addEventListener('click', saveCopilotToken);
  }
  if (btnModalClearCopilotToken) {
    btnModalClearCopilotToken.addEventListener('click', clearCopilotToken);
  }
  if (btnAdminCopilotLogin) {
    btnAdminCopilotLogin.addEventListener('click', openCopilotAuthModal);
  }
  if (btnAdminCopilotLogout) {
    btnAdminCopilotLogout.addEventListener('click', clearCopilotToken);
  }

  // Initialize view
  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    const autoView = urlParams.get('view') || initialHash;

    await Promise.all([
      loadCopilotModels(),
      loadCopilotAuthStatus(),
      loadAccountIdentity(),
      loadProjects(),
      loadAvailableVersions(),
    ]);

    switchView(autoView);

    const autoAdminTab = urlParams.get('admintab') || urlParams.get('adminTab');
    if (autoAdminTab) {
      switchAdminTab(autoAdminTab);
    }

    updateUpgradeModePreview();
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

    const autoCopilotModal = urlParams.get('copilotmodal');
    if (autoCopilotModal) {
      openCopilotAuthModal();
    }

    if (autoProject) {
      const proj = projects.find(p => p.id === autoProject);
      if (proj) {
        projectSelect.value = proj.id;
        selectedProject = proj;
        clientPathHint.textContent = proj.path;
        currentVersionDisplay.textContent = `v${proj.currentVersion}`;
      }
    }
    if (autoTarget) {
      targetVersionSelect.value = autoTarget;
    }
    updateUpgradeModePreview();
    validateStartPrerequisites();

    const autoTestAuth = urlParams.get('testauth');
    if (autoTestAuth) {
      await testAuthConnectionStep1();
    }

    if (autoStep) {
      const stepNum = parseInt(autoStep, 10);
      if (stepNum > 1 && selectedProject && targetVersionSelect.value) {
        await runPreflight();
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
      } else if (stepNum === 1) {
        goToWizardStep(1);
      }
    }
  }

  init();
});
