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
    
    // Load config
    fetch('/api/config')
        .then(r => r.json())
        .then(config => {
            document.getElementById('language').value = config.default_language;
        })
        .catch(err => console.error('Failed to load config:', err));
    
    // Reset all checkboxes to default (unchecked) state
    document.getElementById('enableTranscript').checked = false;
    document.getElementById('forceRegenerate').checked = false;
    document.getElementById('saveRawJson').checked = false;
    document.getElementById('autoSaveKeyterms').checked = false;
    document.getElementById('hide-empty').checked = false;
    
    // Reset profanity filter to default (off)
    document.getElementById('profanityFilter').value = 'off';
    
    // Hide transcript options
    document.getElementById('transcriptOptions').style.display = 'none';
    
    // Setup event delegation for directory items
    document.getElementById('directoryList').addEventListener('click', function(e) {
        // Prevent clicks on file checkboxes and labels from triggering directory navigation
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') {
            return;
        }
        
        // Find the directory-item, checking both the target itself and its ancestors
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
});

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

/* ============================================
   BREADCRUMB NAVIGATION
   ============================================ */

function updateBreadcrumb(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    const parts = path.split('/').filter(p => p.length > 0);
    let html = `
        <button class="breadcrumb-item" onclick="navigateToPath('/')" aria-label="Navigate to root">
            🏠
        </button>
    `;
    
    let currentPath = '';
    parts.forEach((part, index) => {
        currentPath += '/' + part;
        const isLast = index === parts.length - 1;
        
        html += `<span class="breadcrumb-separator">/</span>`;
        
        if (isLast) {
            html += `<span class="breadcrumb-item current">${part}</span>`;
        } else {
            const pathCopy = currentPath;
            html += `<button class="breadcrumb-item" onclick="navigateToPath('${pathCopy}')">${part}</button>`;
        }
    });
    
    breadcrumb.innerHTML = html;
}

function navigateToPath(path) {
    browseDirectories(path || '/');
}

/* ============================================
   DIRECTORY BROWSING
   ============================================ */

async function browseDirectories(path) {
    currentPath = path;
    const directoryList = document.getElementById('directoryList');
    const scanPath = document.getElementById('scanPath');
    const showAll = true;
    
    scanPath.value = path;
    updateBreadcrumb(path);
    
    // Show skeleton loader - create if it doesn't exist
    let skeleton = document.getElementById('skeleton');
    if (!skeleton) {
        skeleton = document.createElement('div');
        skeleton.id = 'skeleton';
        skeleton.className = 'skeleton-loader';
        skeleton.innerHTML = '<div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div>';
        directoryList.appendChild(skeleton);
    }
    skeleton.classList.remove('hidden');
    directoryList.style.display = 'block';
    
    try {
        const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}&show_all=${showAll}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Hide skeleton loader if it exists
        skeleton = document.getElementById('skeleton');
        if (skeleton) {
            skeleton.classList.add('hidden');
        }
        
        let html = '';
        
        // Add parent directory link if not at root
        if (data.parent_path) {
            html += `
                <div class="directory-item" data-path="${data.parent_path.replace(/"/g, '&quot;')}" style="border-bottom: 2px solid var(--border); margin-bottom: var(--space-s); cursor: pointer;">
                    <div class="directory-item-name">
                        📁 <strong>..</strong> (Go up to parent directory)
                    </div>
                </div>
            `;
        }
        
        // Add subdirectories
        if (data.directories.length > 0) {
            html += '<div style="color: var(--text-tertiary); font-size: var(--font-caption); margin: var(--space-s) 0; font-weight: bold;">📂 Folders:</div>';
            data.directories.forEach(dir => {
                html += `
                    <div class="directory-item" data-path="${dir.path.replace(/"/g, '&quot;')}" data-video-count="${dir.video_count}" style="cursor: pointer;">
                        <div class="directory-item-name">
                            📁 ${dir.name}
                        </div>
                        <div class="directory-item-count">
                            ${dir.video_count} videos →
                        </div>
                    </div>
                `;
            });
        }
        
        // Add video files with checkboxes
        if (data.files.length > 0) {
            html += '<div style="color: var(--text-tertiary); font-size: var(--font-caption); margin: var(--space-m) 0 var(--space-s) 0; font-weight: bold; border-top: 2px solid var(--border); padding-top: var(--space-s);">🎬 Videos in this folder:</div>';
            data.files.forEach((file, index) => {
                const isSelected = selectedFiles.includes(file.path);
                const statusIcon = getStatusIcon(file);
                const escapedPath = file.path.replace(/"/g, '&quot;');
                html += `
                    <div class="file-item ${isSelected ? 'selected' : ''}">
                        <input type="checkbox" id="file-${index}" value="${escapedPath}"
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleFileSelection(this.value)">
                        <label for="file-${index}" style="flex: 1; cursor: pointer; display: flex; align-items: center; gap: var(--space-s);">
                            ${statusIcon} ${file.name}
                        </label>
                    </div>
                `;
            });
        }
        
        if (data.directories.length === 0 && data.files.length === 0) {
            html += '<div style="color: var(--text-tertiary); text-align: center; padding: var(--space-l);">No folders or videos found</div>';
        }
        
        directoryList.innerHTML = html;
        updateSelectionStatus();
        
    } catch (error) {
        // Hide skeleton loader if it exists
        const skeletonEl = document.getElementById('skeleton');
        if (skeletonEl) {
            skeletonEl.classList.add('hidden');
        }
        directoryList.innerHTML = `<div style="color: var(--color-red); text-align: center; padding: var(--space-l);">Error: ${error.message}</div>`;
        console.error('Browse error:', error);
        showToast('error', `Failed to browse directory: ${error.message}`);
    }
}

function getStatusIcon(file) {
    if (file.has_subtitles) {
        return '<span class="status-icon" style="color: var(--color-green);" title="Has subtitles" aria-label="Has subtitles">✓</span>';
    } else {
        return '<span class="status-icon" style="color: var(--color-yellow);" title="Missing subtitles" aria-label="Missing subtitles">⚠️</span>';
    }
}

function refreshBrowser() {
    if (currentPath) {
        browseDirectories(currentPath);
        showToast('info', 'Directory refreshed');
    }
}

/* ============================================
   FILTER MANAGEMENT
   ============================================ */

function filterEmptyFolders() {
    const hideEmpty = document.getElementById('hide-empty').checked;
    const folders = document.querySelectorAll('.directory-item');
    
    folders.forEach(folder => {
        const count = parseInt(folder.dataset.videoCount);
        if (!isNaN(count)) {
            if (hideEmpty && count === 0) {
                folder.style.display = 'none';
            } else {
                folder.style.display = 'flex';
            }
        }
    });
    
    announceToScreenReader(hideEmpty ? 'Empty folders hidden' : 'Showing all folders');
}

/* ============================================
   FILE SELECTION
   ============================================ */

function toggleFileSelection(filePath) {
    const index = selectedFiles.indexOf(filePath);
    if (index > -1) {
        selectedFiles.splice(index, 1);
        console.log('Deselected:', filePath);
    } else {
        selectedFiles.push(filePath);
        console.log('Selected:', filePath);
    }
    console.log('Total selected files:', selectedFiles.length);
    updateSelectionStatus();
    
    // Update visual selection
    document.querySelectorAll('.file-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.value === filePath) {
            if (index === -1) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
    });
    
    // Automatically calculate estimates
    if (selectedFiles.length > 0) {
        calculateEstimatesAuto();
    } else {
        const costPrimary = document.getElementById('costPrimary');
        const costSecondary = document.getElementById('costSecondary');
        costPrimary.textContent = '0 files selected';
        costSecondary.textContent = 'Select videos to see estimates';
    }
}

function updateSelectionStatus() {
    const count = selectedFiles.length;
    const submitBtn = document.getElementById('submitBtn');
    const selectionPanel = document.getElementById('selectionPanel');
    const selectionCount = document.getElementById('selectionCount');
    
    if (count > 0) {
        showStatus('scanStatus', `✅ ${count} file${count > 1 ? 's' : ''} selected`, 'success');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = `Transcribe ${count} File${count > 1 ? 's' : ''}`;
        }
        selectionPanel.classList.remove('hidden');
        selectionCount.textContent = `✓ ${count} file${count > 1 ? 's' : ''} selected`;
        
        announceToScreenReader(`${count} file${count > 1 ? 's' : ''} selected`);
    } else {
        showStatus('scanStatus', 'Select files to continue', 'info');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Select Files to Continue';
        }
        selectionPanel.classList.add('hidden');
    }
    
    console.log('Selection updated:', count, 'files selected');
}

function selectAll() {
    selectedFiles = [];
    document.querySelectorAll('.file-item input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        const filePath = cb.value;
        if (!selectedFiles.includes(filePath)) {
            selectedFiles.push(filePath);
        }
        cb.closest('.file-item').classList.add('selected');
    });
    updateSelectionStatus();
    if (selectedFiles.length > 0) {
        calculateEstimatesAuto();
        showToast('success', `Selected all ${selectedFiles.length} files`);
    }
}

function selectNone() {
    selectedFiles = [];
    document.querySelectorAll('.file-item input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.file-item').classList.remove('selected');
    });
    updateSelectionStatus();
    
    const costPrimary = document.getElementById('costPrimary');
    const costSecondary = document.getElementById('costSecondary');
    costPrimary.textContent = '0 files selected';
    costSecondary.textContent = 'Select videos to see estimates';
    
    showToast('info', 'Selection cleared');
}

function clearSelection() {
    selectNone();
}

/* ============================================
   SELECTION PANEL
   ============================================ */

function toggleSelectionList() {
    const list = document.getElementById('selectionList');
    const btn = document.getElementById('viewFilesBtn');
    
    if (list.classList.contains('hidden')) {
        // Show list
        list.classList.remove('hidden');
        btn.textContent = 'hide files ▲';
        
        // Populate list
        let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        selectedFiles.forEach(file => {
            const filename = file.split('/').pop();
            html += `<li style="padding: var(--space-xs) 0; color: rgba(255, 255, 255, 0.9);">• ${filename}</li>`;
        });
        html += '</ul>';
        list.innerHTML = html;
    } else {
        // Hide list
        list.classList.add('hidden');
        btn.textContent = 'view files ▼';
    }
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
        document.querySelectorAll('.file-item input[type="checkbox"]:checked')
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
    const autoSaveKeyterms = document.getElementById('autoSaveKeyterms').checked;
    
    const requestBody = {
        files: selectedFilesList,
        model: model,
        language: language,
        profanity_filter: profanityFilter,
        force_regenerate: forceRegenerate,
        save_raw_json: saveRawJson,
        auto_save_keyterms: autoSaveKeyterms
    };
    
    const keyTerms = document.getElementById('keyTerms').value.trim();
    if (keyTerms) {
        requestBody.keyterms = keyTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
    
    if (enableTranscript) {
        requestBody.enable_transcript = true;
    }
    
    showStatus('submitStatus', '🚀 Submitting batch...', 'info');
    document.getElementById('submitBtn').disabled = true;
    
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
        
        showStatus('submitStatus', 
            `✅ Batch submitted! ${data.enqueued} files queued. Batch ID: ${currentBatchId}`, 
            'success'
        );
        
        showToast('success', `Batch submitted: ${data.enqueued} files queued`);
        announceToScreenReader(`Batch submitted: ${data.enqueued} files queued`);
        
        document.getElementById('jobCard').style.display = 'block';
        document.getElementById('fileProgress').style.display = 'block';
        startJobMonitoring(currentBatchId);
        
    } catch (error) {
        showStatus('submitStatus', `❌ Error: ${error.message}`, 'error');
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
            
            if (data.state === 'SUCCESS') {
                showToast('success', 'Batch processing completed!');
                announceToScreenReader('Batch processing completed');
            } else if (data.state === 'FAILURE') {
                showToast('error', 'Batch processing failed');
                announceToScreenReader('Batch processing failed');
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
            showStatus('submitStatus', '🛑 Job cancelled', 'info');
            showToast('info', 'Job cancelled');
            announceToScreenReader('Job cancelled');
        }
    } catch (error) {
        console.error('Cancel error:', error);
        showToast('error', 'Failed to cancel job');
    }
}

function updateJobDisplay(data) {
    const statusDiv = document.getElementById('jobStatus');
    const statsDiv = document.getElementById('jobStats');
    const cancelBtn = document.getElementById('cancelBtn');
    const fileProgressDiv = document.getElementById('fileProgress');
    
    let statusHtml = '';
    let statsHtml = '';
    
    if (data.state === 'PENDING') {
        statusHtml = '<div class="loader"></div>Job queued, waiting to start...';
        cancelBtn.style.display = 'inline-block';
    } else if (data.state === 'STARTED') {
        statusHtml = '<div class="loader"></div>Processing videos...';
        cancelBtn.style.display = 'inline-block';
        
        if (data.children && data.children.length > 0) {
            fileProgressDiv.style.display = 'block';
            updateFileProgress(data.children);
        }
    } else if (data.state === 'SUCCESS') {
        statusHtml = '✅ Batch complete!';
        cancelBtn.style.display = 'none';
        
        if (data.children && data.children.length > 0) {
            fileProgressDiv.style.display = 'block';
            updateFileProgress(data.children);
        }
        
        if (data.data && data.data.results) {
            const results = data.data.results;
            const successful = results.filter(r => r.status === 'ok').length;
            const skipped = results.filter(r => r.status === 'skipped').length;
            const failed = results.filter(r => r.status === 'error').length;
            
            statsHtml = `
                <div class="stat-box">
                    <div class="stat-value">${successful}</div>
                    <div class="stat-label">Processed</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${skipped}</div>
                    <div class="stat-label">Skipped</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${failed}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${results.length}</div>
                    <div class="stat-label">Total</div>
                </div>
            `;
        }
    } else if (data.state === 'FAILURE') {
        statusHtml = '❌ Batch failed';
        cancelBtn.style.display = 'none';
        if (data.data && data.data.error) {
            statusHtml += `: ${data.data.error}`;
        }
    } else if (data.state === 'REVOKED') {
        statusHtml = '🛑 Job cancelled';
        cancelBtn.style.display = 'none';
    } else {
        statusHtml = `State: ${data.state}`;
        cancelBtn.style.display = 'none';
    }
    
    statusDiv.innerHTML = statusHtml;
    statsDiv.innerHTML = statsHtml;
}

function updateFileProgress(children) {
    const fileProgressList = document.getElementById('fileProgressList');
    let html = '';
    
    children.forEach(child => {
        let statusClass = 'pending';
        let statusText = 'Pending';
        let stageText = '';
        let filename = child.filename || child.current_file || 'Unknown file';
        
        if (child.state === 'PROGRESS') {
            statusClass = 'processing';
            statusText = '⏳ Processing';
            const stage = child.stage || '';
            const stageMap = {
                'checking': 'Checking existing files',
                'extracting_audio': 'Extracting audio',
                'transcribing': 'Transcribing with Deepgram',
                'generating_srt': 'Generating subtitles',
                'generating_transcript': 'Generating transcript',
                'saving_raw_json': 'Saving raw JSON',
                'saving_keyterms': 'Saving keyterms to CSV'
            };
            stageText = stageMap[stage] || stage;
        } else if (child.state === 'SUCCESS') {
            if (child.status === 'ok') {
                statusClass = 'completed';
                statusText = '✅ Completed';
            } else if (child.status === 'skipped') {
                statusClass = 'skipped';
                statusText = '⏭️ Skipped';
            }
        } else if (child.state === 'FAILURE') {
            statusClass = 'error';
            statusText = '❌ Error';
        }
        
        if (filename.includes('/')) {
            filename = filename.split('/').pop();
        }
        
        html += `
            <div class="file-progress-item ${statusClass}">
                <div class="progress-filename">${filename}</div>
                ${stageText ? `<div class="progress-stage">${stageText}</div>` : ''}
                <div class="progress-status">${statusText}</div>
            </div>
        `;
    });
    
    fileProgressList.innerHTML = html || '<div style="color: var(--text-tertiary); text-align: center;">No file details available</div>';
}