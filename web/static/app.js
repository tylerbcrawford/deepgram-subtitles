// Deepgram Subtitle Generator - Web UI Client

let selectedFiles = [];
let currentPath = '/media';
let currentBatchId = null;
let eventSource = null;
let pollInterval = null;

/* ============================================
   INITIALIZATION
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Clear keyterms field on page load
    clearKeytermField();
    
    // Load config
    fetch('/api/config')
        .then(r => r.json())
        .then(config => {
            document.getElementById('language').value = config.default_language;
        })
        .catch(err => console.error('Failed to load config:', err));
    
    // Reset all checkboxes to default (unchecked) state
    const enableTranscript = document.getElementById('enableTranscript');
    const forceRegenerate = document.getElementById('forceRegenerate');
    const saveRawJson = document.getElementById('saveRawJson');
    const profanityFilter = document.getElementById('profanityFilter');
    
    if (enableTranscript) enableTranscript.checked = false;
    if (forceRegenerate) forceRegenerate.checked = false;
    if (saveRawJson) saveRawJson.checked = false;
    
    // Reset profanity filter to default (off)
    if (profanityFilter) profanityFilter.value = 'off';
    
    // Hide transcript options
    document.getElementById('transcriptOptions').style.display = 'none';
    
    // Setup event delegation for directory items
    document.getElementById('directoryList').addEventListener('click', function(e) {
        // Prevent clicks on file checkboxes and labels from triggering directory navigation
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') {
            return;
        }
        
        // Find the directory-item
        let dirItem = null;
        if (e.target.classList && e.target.classList.contains('directory-item') && e.target.hasAttribute('data-path')) {
            dirItem = e.target;
        } else {
            dirItem = e.target.closest('.directory-item[data-path]');
        }
        
        if (dirItem) {
            const path = dirItem.getAttribute('data-path');
            if (path) {
                browseDirectories(path);
            }
        }
    });
    
    // Automatically load /media directory on page load
    browseDirectories('/media');
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Setup LLM provider change handler
    const llmProvider = document.getElementById('llmProvider');
    if (llmProvider) {
        llmProvider.addEventListener('change', (e) => {
            const provider = e.target.value;
            const modelSelect = document.getElementById('llmModel');
            
            if (provider === 'anthropic') {
                modelSelect.innerHTML = `
                    <option value="claude-sonnet-4">Claude Sonnet 4 (Best Quality)</option>
                    <option value="claude-haiku-4">Claude Haiku 4 (Faster, Cheaper)</option>
                `;
            } else {
                modelSelect.innerHTML = `
                    <option value="gpt-4">GPT-4 Turbo (Best Quality)</option>
                    <option value="gpt-4-mini">GPT-4 Mini (Faster, Cheaper)</option>
                `;
            }
        });
    }
    
    // Setup Generate Keyterms button handler
    const generateBtn = document.getElementById('generateKeytermsBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateKeyterms);
    }
    
    // Check API key status on page load
    checkApiKeyStatus();
    
    // Re-check API key status when provider changes
    if (llmProvider) {
        llmProvider.addEventListener('change', checkApiKeyStatus);
    }
});

/* ============================================
   BREADCRUMB NAVIGATION
   ============================================ */

function updateBreadcrumb(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    const parts = path.split('/').filter(p => p.length > 0);
    let html = '';
    
    // Start breadcrumb at /media (the MEDIA_ROOT)
    if (parts.length === 0 || path === '/media') {
        html = `<span class="breadcrumb-item current">media</span>`;
    } else {
        // Show "media" as clickable root
        html = `<button class="breadcrumb-item" onclick="navigateToPath('/media')" aria-label="Navigate to media root">media</button>`;
        
        // Build path starting after /media
        let currentPath = '/media';
        const mediaIndex = parts.indexOf('media');
        const relevantParts = mediaIndex >= 0 ? parts.slice(mediaIndex + 1) : parts;
        
        relevantParts.forEach((part, index) => {
            currentPath += '/' + part;
            const isLast = index === relevantParts.length - 1;
            
            html += `<span class="breadcrumb-separator">/</span>`;
            
            if (isLast) {
                html += `<span class="breadcrumb-item current">${part}</span>`;
            } else {
                const pathCopy = currentPath;
                html += `<button class="breadcrumb-item" onclick="navigateToPath('${pathCopy}')">${part}</button>`;
            }
        });
    }
    
    breadcrumb.innerHTML = html;
}

function navigateToPath(path) {
    // Ensure path is at least /media
    if (!path || path === '/' || path === '') {
        path = '/media';
    }
    browseDirectories(path);
}

/* ============================================
   DIRECTORY BROWSING
   ============================================ */

async function browseDirectories(path) {
    currentPath = path;
    const directoryList = document.getElementById('directoryList');
    const showAll = true;
    
    // Clear keyterms when navigating directories
    clearKeytermField();
    
    console.log('Browsing directory:', path);
    updateBreadcrumb(path);
    
    // Show skeleton loader
    let skeleton = document.getElementById('skeleton');
    if (!skeleton) {
        skeleton = document.createElement('div');
        skeleton.id = 'skeleton';
        skeleton.className = 'skeleton-loader';
        skeleton.innerHTML = '<div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div>';
        directoryList.appendChild(skeleton);
    }
    skeleton.classList.remove('hidden');
    skeleton.style.display = 'block';
    directoryList.style.display = 'block';
    
    try {
        const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}&show_all=${showAll}`);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        // Hide skeleton loader
        skeleton = document.getElementById('skeleton');
        if (skeleton) {
            skeleton.classList.add('hidden');
            skeleton.style.display = 'none';
        }
        
        let html = '';
        
        // Add parent directory link if not at root
        if (data.parent_path) {
            html += `
                <button class="browser-item directory-item" data-path="${data.parent_path.replace(/"/g, '&quot;')}">
                    <span class="item-icon">↑</span>
                    <span class="item-name">Go to parent directory</span>
                </button>
            `;
        }
        
        // Add subdirectories
        if (data.directories.length > 0) {
            html += '<h3 class="section-header">Folders</h3>';
            html += '<div class="browser-section">';
            data.directories.forEach(dir => {
                html += `
                    <button class="browser-item directory-item" data-path="${dir.path.replace(/"/g, '&quot;')}" data-video-count="${dir.video_count}">
                        <span class="item-icon">📁</span>
                        <span class="item-name">${dir.name}</span>
                        <span class="item-meta">${dir.video_count} videos</span>
                        <span class="item-action">→</span>
                    </button>
                `;
            });
            html += '</div>';
        }
        
        // Add video files with checkboxes
        if (data.files.length > 0) {
            html += '<h3 class="section-header">Videos</h3>';
            html += '<div class="browser-section">';
            data.files.forEach((file, index) => {
                const isSelected = selectedFiles.includes(file.path);
                const statusIcon = getStatusIcon(file);
                const escapedPath = file.path.replace(/"/g, '&quot;');
                html += `
                    <label class="browser-item browser-file ${isSelected ? 'selected' : ''}">
                        <input type="checkbox" class="item-checkbox" id="file-${index}" value="${escapedPath}"
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleFileSelection(this.value)">
                        ${statusIcon}
                        <span class="item-name">${file.name}</span>
                    </label>
                `;
            });
            html += '</div>';
        }
        
        if (data.directories.length === 0 && data.files.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="empty-title">No videos found</h3>
                    <p class="empty-message">This folder doesn't contain any video files</p>
                </div>
            `;
        }
        
        console.log('Setting innerHTML with', html.length, 'characters');
        directoryList.innerHTML = html;
        console.log('Updated directory list, now has', directoryList.children.length, 'children');
        updateSelectionStatus();
        
    } catch (error) {
        console.error('Browse error:', error);
        const skeletonEl = document.getElementById('skeleton');
        if (skeletonEl) {
            skeletonEl.classList.add('hidden');
            skeletonEl.style.display = 'none';
        }
        directoryList.innerHTML = `<div style="color: var(--color-red); text-align: center; padding: var(--space-l);">Error: ${error.message}</div>`;
        showToast('error', `Failed to browse directory: ${error.message}`);
    }
}

function getStatusIcon(file) {
    if (file.has_subtitles) {
        return '<span class="item-status" data-status="complete" title="Has subtitles" aria-label="Has subtitles"></span>';
    } else {
        return '<span class="item-status" data-status="missing" title="Missing subtitles" aria-label="Missing subtitles"></span>';
    }
}

/* ============================================
   FILE SELECTION
   ============================================ */

function toggleFileSelection(filePath) {
    const index = selectedFiles.indexOf(filePath);
    if (index > -1) {
        selectedFiles.splice(index, 1);
    } else {
        selectedFiles.push(filePath);
    }
    updateSelectionStatus();
    
    // Update visual selection
    document.querySelectorAll('.browser-file').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.value === filePath) {
            if (index === -1) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
    });
    
    // Calculate estimates and handle keyterms
    if (selectedFiles.length > 0) {
        calculateEstimatesAuto();
        // Auto-load keyterms for the first selected file
        loadKeytermsForSelection();
    } else {
        // Clear keyterms when no files are selected
        clearKeytermField();
        const costPrimary = document.getElementById('costPrimary');
        const costSecondary = document.getElementById('costSecondary');
        costPrimary.textContent = '0 files selected';
        costSecondary.textContent = 'Select videos to see estimates';
    }
}

/* ============================================
   KEYTERMS AUTO-LOADING
   ============================================ */

function clearKeytermField() {
    const keytermsInput = document.getElementById('keyTerms');
    if (keytermsInput) {
        keytermsInput.value = '';
    }
}

async function loadKeytermsForSelection() {
    // Only load if we have selected files
    if (selectedFiles.length === 0) {
        return;
    }
    
    // Clear existing keyterms first
    clearKeytermField();
    
    // Use the first selected file to determine which keyterms to load
    const firstFile = selectedFiles[0];
    
    try {
        const response = await fetch(`/api/keyterms/load?video_path=${encodeURIComponent(firstFile)}`);
        
        if (!response.ok) {
            console.log('No keyterms found for this video');
            return;
        }
        
        const data = await response.json();
        
        if (data.keyterms && data.keyterms.length > 0) {
            // Populate the keyterms text box
            const keyTermsInput = document.getElementById('keyTerms');
            if (keyTermsInput) {
                // Join keyterms with commas
                keyTermsInput.value = data.keyterms.join(', ');
                
                // Show a subtle notification
                console.log(`Auto-loaded ${data.count} keyterms from CSV`);
                
                // Optional: Show a small toast or indicator
                const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
                if (keyTermsLabel) {
                    const originalText = keyTermsLabel.textContent;
                    keyTermsLabel.textContent = `Key Terms (${data.count} auto-loaded)`;
                    keyTermsLabel.style.color = 'var(--color-green)';
                    
                    setTimeout(() => {
                        keyTermsLabel.textContent = originalText;
                        keyTermsLabel.style.color = '';
                    }, 3000);
                }
            }
        }
    } catch (error) {
        console.error('Failed to load keyterms:', error);
        // Silently fail - not critical
    }
}

/* ============================================
   THEME MANAGEMENT
   ============================================ */

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.style.display = icon.classList.contains(`theme-icon-${savedTheme}`) ? 'block' : 'none';
    });
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon visibility
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.style.display = icon.classList.contains(`theme-icon-${newTheme}`) ? 'block' : 'none';
    });
    
    // Announce to screen readers
    const message = `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`;
    announceToScreenReader(message);
    
    showToast('info', `Switched to ${newTheme} mode`);
}

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + A: Select All
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            selectAll();
        }
        
        // Escape: Clear selection
        if (e.key === 'Escape') {
            selectNone();
        }
        
        // Enter: Start transcription if files selected
        if (e.key === 'Enter' && selectedFiles.length > 0 && !e.target.matches('input, textarea, select')) {
            submitBatch();
        }
        
        // Ctrl/Cmd + T: Toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */

function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    if (type !== 'error') {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || 'ℹ';
}

/* ============================================
   SCREEN READER SUPPORT
   ============================================ */

function announceToScreenReader(message) {
    const announcer = document.getElementById('status-announcer');
    announcer.textContent = message;
    
    setTimeout(() => {
        announcer.textContent = '';
    }, 1000);
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

function showStatus(elementId, message, type = 'info') {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `status ${type}`;
    el.style.display = 'block';
}

function toggleTranscriptOptions() {
    const checkbox = document.getElementById('enableTranscript');
    const options = document.getElementById('transcriptOptions');
    options.style.display = checkbox.checked ? 'block' : 'none';
}

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advancedOptions');
    const toggleBtn = document.getElementById('advancedToggle');
    
    if (advancedOptions.classList.contains('hidden')) {
        advancedOptions.classList.remove('hidden');
        toggleBtn.textContent = 'Hide Advanced Options ▲';
    } else {
        advancedOptions.classList.add('hidden');
        toggleBtn.textContent = 'Show Advanced Options ▼';
    }
}

/* ============================================
   FILE SELECTION
   ============================================ */

function updateSelectionStatus() {
    const count = selectedFiles.length;
    const submitBtn = document.getElementById('submitBtn');
    const scanStatus = document.getElementById('scanStatus');
    
    if (count > 0) {
        if (scanStatus) scanStatus.textContent = `${count} file${count > 1 ? 's' : ''} selected`;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = `Transcribe ${count} File${count > 1 ? 's' : ''}`;
        }
        announceToScreenReader(`${count} file${count > 1 ? 's' : ''} selected`);
        calculateEstimatesAuto();
    } else {
        if (scanStatus) scanStatus.textContent = '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Select Files to Continue';
        }
        const costPrimary = document.getElementById('costPrimary');
        const costSecondary = document.getElementById('costSecondary');
        costPrimary.textContent = '0 files selected';
        costSecondary.textContent = 'Select videos to see estimates';
    }
}

function selectAll() {
    selectedFiles = [];
    document.querySelectorAll('.browser-file input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        const filePath = cb.value;
        if (!selectedFiles.includes(filePath)) {
            selectedFiles.push(filePath);
        }
        cb.closest('.browser-file').classList.add('selected');
    });
    updateSelectionStatus();
    if (selectedFiles.length > 0) {
        showToast('success', `Selected all ${selectedFiles.length} files`);
        // Auto-load keyterms for the first selected file
        loadKeytermsForSelection();
    }
}

function selectNone() {
    selectedFiles = [];
    document.querySelectorAll('.browser-file input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.browser-file').classList.remove('selected');
    });
    // Clear keyterms when clearing selection
    clearKeytermField();
    updateSelectionStatus();
    showToast('info', 'Selection cleared');
}

function clearSelection() {
    selectNone();
}

/* ============================================
   COST ESTIMATION
   ============================================ */

async function calculateEstimatesAuto() {
    const costPrimary = document.getElementById('costPrimary');
    const costSecondary = document.getElementById('costSecondary');
    
    if (selectedFiles.length === 0) {
        costPrimary.textContent = '0 files selected';
        costSecondary.textContent = 'Select videos to see estimates';
        return;
    }
    
    try {
        const response = await fetch('/api/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: selectedFiles })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        displayEstimates(data);
        
    } catch (error) {
        console.error('Estimate error:', error);
        costPrimary.textContent = '0 files selected';
        costSecondary.textContent = 'Select videos to see estimates';
    }
}

function displayEstimates(data) {
    const costPrimary = document.getElementById('costPrimary');
    const costSecondary = document.getElementById('costSecondary');
    
    function formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    
    const fileText = data.total_files === 1 ? 'file' : 'files';
    costPrimary.textContent = `${data.total_files} ${fileText} • ${formatDuration(data.total_duration_seconds)}`;
    costSecondary.textContent = `$${data.estimated_cost_usd.toFixed(2)} cost • ~${formatDuration(data.estimated_processing_time_seconds)} processing`;
}

/* ============================================
   BATCH SUBMISSION
   ============================================ */

async function submitBatch() {
    const selectedFilesList = Array.from(
        document.querySelectorAll('.browser-file input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (selectedFilesList.length === 0) {
        showStatus('submitStatus', '⚠️ Please select at least one file', 'error');
        showToast('warning', 'Please select at least one file');
        return;
    }
    
    const model = 'nova-3';
    const language = document.getElementById('language').value;
    const profanityFilter = document.getElementById('profanityFilter').value;
    const enableTranscript = document.getElementById('enableTranscript').checked;
    const forceRegenerate = document.getElementById('forceRegenerate').checked;
    const saveRawJson = document.getElementById('saveRawJson').checked;
    
    const requestBody = {
        files: selectedFilesList,
        model: model,
        language: language,
        profanity_filter: profanityFilter,
        force_regenerate: forceRegenerate,
        save_raw_json: saveRawJson
    };
    
    const keyTerms = document.getElementById('keyTerms').value.trim();
    if (keyTerms) {
        requestBody.keyterms = keyTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
        // Auto-save keyterms whenever they are provided
        requestBody.auto_save_keyterms = true;
    }
    
    if (enableTranscript) {
        requestBody.enable_transcript = true;
    }
    
    document.getElementById('submitBtn').disabled = true;
    showToast('info', 'Submitting batch...');
    
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        currentBatchId = data.batch_id;
        
        showToast('info', `Processing ${data.enqueued} files...`);
        announceToScreenReader(`Processing ${data.enqueued} files`);
        
        // Show compact job status in action bar
        const costSummary = document.querySelector('.cost-summary');
        if (costSummary) costSummary.style.display = 'none';
        document.getElementById('jobStatusCompact').style.display = 'flex';
        
        startJobMonitoring(currentBatchId);
        
    } catch (error) {
        console.error('Submit error:', error);
        showToast('error', `Failed to submit batch: ${error.message}`);
        document.getElementById('submitBtn').disabled = false;
    }
}

/* ============================================
   JOB MONITORING
   ============================================ */

function startJobMonitoring(batchId) {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    if (eventSource) {
        eventSource.close();
    }
    
    eventSource = new EventSource('/api/progress');
    eventSource.addEventListener('ping', function(e) {
        // Connection is alive
    });
    
    pollInterval = setInterval(() => checkJobStatus(batchId), 3000);
    checkJobStatus(batchId);
}

async function checkJobStatus(batchId) {
    try {
        const response = await fetch(`/api/job/${batchId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        updateJobDisplay(data);
        
        if (data.state === 'SUCCESS' || data.state === 'FAILURE' || data.state === 'REVOKED') {
            clearInterval(pollInterval);
            if (eventSource) {
                eventSource.close();
            }
            document.getElementById('submitBtn').disabled = false;
            
            // Hide job status and show cost summary again
            document.getElementById('jobStatusCompact').style.display = 'none';
            const costSummary = document.querySelector('.cost-summary');
            if (costSummary) costSummary.style.display = 'flex';
            
            if (data.state === 'SUCCESS') {
                const results = data.data?.results || [];
                const successful = results.filter(r => r.status === 'ok').length;
                const skipped = results.filter(r => r.status === 'skipped').length;
                const failed = results.filter(r => r.status === 'error').length;
                
                showToast('success', `Batch complete! ${successful} processed, ${skipped} skipped, ${failed} failed`);
                announceToScreenReader('Batch processing completed');
            } else if (data.state === 'FAILURE') {
                showToast('error', 'Batch processing failed');
                announceToScreenReader('Batch processing failed');
            } else if (data.state === 'REVOKED') {
                showToast('info', 'Job cancelled');
                announceToScreenReader('Job cancelled');
            }
        }
        
    } catch (error) {
        console.error('Status check error:', error);
    }
}

async function cancelJob() {
    if (!currentBatchId) return;
    
    if (!confirm('Are you sure you want to cancel this job?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/job/${currentBatchId}/cancel`, {
            method: 'POST'
        });
        
        if (response.ok) {
            document.getElementById('cancelBtn').style.display = 'none';
            showToast('info', 'Job cancelled');
            announceToScreenReader('Job cancelled');
        }
    } catch (error) {
        console.error('Cancel error:', error);
        showToast('error', 'Failed to cancel job');
    }
}

function updateJobDisplay(data) {
    const jobStatusText = document.getElementById('jobStatusText');
    const jobStatusDetails = document.getElementById('jobStatusDetails');
    
    if (!jobStatusText || !jobStatusDetails) return;
    
    if (data.state === 'PENDING') {
        jobStatusText.textContent = 'Job queued...';
        jobStatusDetails.textContent = 'Waiting to start';
    } else if (data.state === 'STARTED') {
        jobStatusText.textContent = 'Processing';
        
        if (data.children && data.children.length > 0) {
            const completed = data.children.filter(c => c.state === 'SUCCESS').length;
            const total = data.children.length;
            jobStatusDetails.textContent = `${completed} / ${total} files`;
        } else {
            jobStatusDetails.textContent = 'In progress...';
        }
    } else if (data.state === 'SUCCESS') {
        jobStatusText.textContent = '✓ Complete';
        
        if (data.data && data.data.results) {
            const results = data.data.results;
            const successful = results.filter(r => r.status === 'ok').length;
            jobStatusDetails.textContent = `${successful} processed`;
        }
    } else if (data.state === 'FAILURE') {
        jobStatusText.textContent = '✕ Failed';
        jobStatusDetails.textContent = 'Check console for errors';
    } else if (data.state === 'REVOKED') {
        jobStatusText.textContent = '⊘ Cancelled';
        jobStatusDetails.textContent = 'Job stopped';
    }
}

/* ============================================
   LLM KEYTERM GENERATION
   ============================================ */

/**
 * Get the path of the currently selected video file
 */
function getCurrentVideoPath() {
    // Find the first checked file input
    const checkedFile = document.querySelector('.browser-file input[type="checkbox"]:checked');
    if (checkedFile) {
        return checkedFile.value;
    }
    return null;
}

/**
 * Update spinner text with custom message
 */
function updateSpinnerText(message) {
    // Since showSpinner doesn't exist yet, we'll use toast for now
    // In a real implementation, you'd modify the actual spinner element
    console.log('Spinner update:', message);
}

/**
 * Show a message to the user (uses existing showToast)
 */
function showMessage(message, type = 'info') {
    showToast(type, message);
}

/**
 * Show spinner with message
 */
function showSpinner(message) {
    // Disable the generate button
    const generateBtn = document.getElementById('generateKeytermsBtn');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = message;
    }
    showMessage(message, 'info');
}

/**
 * Hide spinner
 */
function hideSpinner() {
    // Re-enable the generate button
    const generateBtn = document.getElementById('generateKeytermsBtn');
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="icon">🤖</span> Generate Keyterms with AI';
    }
}

/**
 * Fetch cost estimate for keyterm generation
 */
async function fetchCostEstimate(videoPath, provider, model) {
    const response = await fetch('/api/keyterms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            video_path: videoPath,
            provider: provider,
            model: model,
            estimate_only: true
        })
    });
    
    if (!response.ok) {
        throw new Error('Cost estimation failed');
    }
    
    return await response.json();
}

/**
 * Poll generation status
 */
async function pollGenerationStatus(taskId) {
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/api/keyterms/generate/status/${taskId}`);
            const data = await response.json();
            
            if (data.state === 'SUCCESS') {
                clearInterval(interval);
                hideSpinner();
                
                // Populate keyterms field
                const keytermsInput = document.getElementById('keyTerms');
                keytermsInput.value = data.keyterms.join(', ');
                
                // Show success message with cost
                showMessage(
                    `✅ Generated ${data.keyterm_count} keyterms • Cost: $${data.actual_cost.toFixed(3)} • Tokens: ${data.token_count}`,
                    'success'
                );
            } else if (data.state === 'FAILURE') {
                clearInterval(interval);
                hideSpinner();
                showMessage(`❌ Generation failed: ${data.error}`, 'error');
            } else if (data.state === 'PROGRESS') {
                // Update spinner text with progress
                updateSpinnerText(`Generating keyterms: ${data.stage}...`);
            }
            // Continue polling if PENDING
        } catch (error) {
            clearInterval(interval);
            hideSpinner();
            showMessage(`❌ Error: ${error.message}`, 'error');
        }
    }, 2000); // Poll every 2 seconds
}

/**
 * Check if API keys are configured for LLM providers
 */
async function checkApiKeyStatus() {
    const statusIndicator = document.getElementById('apiKeyStatus');
    const provider = document.getElementById('llmProvider').value;
    const generateBtn = document.getElementById('generateKeytermsBtn');
    
    if (!statusIndicator) return;
    
    // Show checking state
    statusIndicator.className = 'api-key-status checking';
    statusIndicator.setAttribute('data-status', 'Checking API key...');
    
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        // Check if the selected provider has an API key
        let hasKey = false;
        let statusMessage = '';
        
        if (provider === 'anthropic') {
            hasKey = config.anthropic_api_key_configured || false;
            statusMessage = hasKey ? 'Anthropic API key configured' : 'Anthropic API key missing';
        } else if (provider === 'openai') {
            hasKey = config.openai_api_key_configured || false;
            statusMessage = hasKey ? 'OpenAI API key configured' : 'OpenAI API key missing';
        }
        
        // Update indicator
        if (hasKey) {
            statusIndicator.className = 'api-key-status configured';
            statusIndicator.setAttribute('data-status', statusMessage);
            if (generateBtn) generateBtn.disabled = false;
        } else {
            statusIndicator.className = 'api-key-status missing';
            statusIndicator.setAttribute('data-status', statusMessage);
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.title = `${statusMessage}. Configure in .env file.`;
            }
        }
    } catch (error) {
        console.error('Failed to check API key status:', error);
        statusIndicator.className = 'api-key-status missing';
        statusIndicator.setAttribute('data-status', 'Unable to check API key status');
        if (generateBtn) generateBtn.disabled = true;
    }
}

/**
 * Handle Generate Keyterms button click
 */
async function handleGenerateKeyterms() {
    const videoPath = getCurrentVideoPath();
    if (!videoPath) {
        showMessage('❌ Please select a video first', 'error');
        return;
    }
    
    const provider = document.getElementById('llmProvider').value;
    const model = document.getElementById('llmModel').value;
    const preserveExisting = document.getElementById('preserveExisting').checked;
    
    try {
        // Show cost estimate first
        const estimate = await fetchCostEstimate(videoPath, provider, model);
        
        if (!confirm(`Estimated cost: $${estimate.estimated_cost.toFixed(3)}\nContinue?`)) {
            return;
        }
        
        // Start generation
        showSpinner('🤖 Generating keyterms with AI...');
        
        const response = await fetch('/api/keyterms/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_path: videoPath,
                provider: provider,
                model: model,
                preserve_existing: preserveExisting
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
        }
        
        // Poll for completion
        pollGenerationStatus(data.task_id);
        
    } catch (error) {
        hideSpinner();
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}