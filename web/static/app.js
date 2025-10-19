// Deepgram Subtitle Generator - Web UI Client

let selectedFiles = [];
let currentPath = '/media';
let currentBatchId = null;
let eventSource = null;
let pollInterval = null;

// Utility function to show status messages
function showStatus(elementId, message, type = 'info') {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `status ${type}`;
    el.style.display = 'block';
}

// Toggle transcript options visibility
function toggleTranscriptOptions() {
    const checkbox = document.getElementById('enableTranscript');
    const options = document.getElementById('transcriptOptions');
    options.style.display = checkbox.checked ? 'block' : 'none';
    
    // Reset speaker map checkbox when transcript is disabled
    if (!checkbox.checked) {
        const speakerMapCheckbox = document.getElementById('enableSpeakerMap');
        if (speakerMapCheckbox) {
            speakerMapCheckbox.checked = false;
            toggleSpeakerMapInput();
        }
    }
}

// Toggle speaker map input visibility
function toggleSpeakerMapInput() {
    const checkbox = document.getElementById('enableSpeakerMap');
    const input = document.getElementById('speakerMapInput');
    input.style.display = checkbox.checked ? 'block' : 'none';
}

// Browse directories and show files
async function browseDirectories(path) {
    currentPath = path;
    const directoryList = document.getElementById('directoryList');
    const scanPath = document.getElementById('scanPath');
    const showAll = true;  // Always show all videos
    
    scanPath.value = path;
    directoryList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Loading...</div>';
    directoryList.style.display = 'block';
    
    try {
        const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}&show_all=${showAll}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        let html = '';
        
        // Add parent directory link if not at root
        if (data.parent_path) {
            html += `
                <div class="directory-item" onclick="browseDirectories('${data.parent_path}')" style="border-bottom: 2px solid #3a3a3a; margin-bottom: 10px;">
                    <div class="directory-item-name">
                        📁 <strong>..</strong> (Go up to parent directory)
                    </div>
                </div>
            `;
        }
        
        // Add subdirectories
        if (data.directories.length > 0) {
            html += '<div style="color: #888; font-size: 0.9em; margin: 10px 0; font-weight: bold;">📂 Folders:</div>';
            data.directories.forEach(dir => {
                html += `
                    <div class="directory-item" onclick="browseDirectories('${dir.path}')">
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
            html += '<div style="color: #888; font-size: 0.9em; margin: 15px 0 10px 0; font-weight: bold; border-top: 2px solid #3a3a3a; padding-top: 10px;">🎬 Videos in this folder:</div>';
            data.files.forEach((file, index) => {
                const isSelected = selectedFiles.includes(file.path);
                const statusIcon = file.has_subtitles ?
                    '<span style="color: #4aff8e; font-size: 1.1em;" title="Has subtitles">✓</span>' :
                    '<span style="color: #ff9a4a; font-size: 1.1em;" title="Missing subtitles">⚠️</span>';
                // Escape file path for safe HTML attribute
                const escapedPath = file.path.replace(/"/g, '&quot;');
                html += `
                    <div class="file-item">
                        <input type="checkbox" id="file-${index}" value="${escapedPath}"
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleFileSelection(this.value)">
                        <label for="file-${index}" style="flex: 1; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            ${statusIcon} ${file.name}
                        </label>
                    </div>
                `;
            });
        }
        
        if (data.directories.length === 0 && data.files.length === 0) {
            html += '<div style="color: #888; text-align: center; padding: 20px;">No folders or videos found</div>';
        }
        
        directoryList.innerHTML = html;
        updateSelectionStatus();
        
    } catch (error) {
        directoryList.innerHTML = `<div style="color: #ff4a4a; text-align: center; padding: 20px;">Error: ${error.message}</div>`;
        console.error('Browse error:', error);
    }
}

// Refresh current directory
function refreshBrowser() {
    if (currentPath) {
        browseDirectories(currentPath);
    }
}

// Toggle file selection
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
    
    // Automatically calculate estimates
    if (selectedFiles.length > 0) {
        calculateEstimatesAuto();
    } else {
        // Show zeros when no files selected
        document.getElementById('estSummary').innerHTML = '0 files • 0:00 duration<br>~$0.00 cost • ~0:00 processing time';
    }
}

// Update selection status display
function updateSelectionStatus() {
    const count = selectedFiles.length;
    const submitBtn = document.getElementById('submitBtn');
    
    if (count > 0) {
        showStatus('scanStatus', `✅ ${count} file${count > 1 ? 's' : ''} selected`, 'success');
        if (submitBtn) submitBtn.disabled = false;
    } else {
        showStatus('scanStatus', 'Select files to continue', 'info');
        if (submitBtn) submitBtn.disabled = true;
    }
    
    console.log('Selection updated:', count, 'files selected');
}

// Update keyterm count and estimate tokens
function updateKeyTermCount() {
    const input = document.getElementById('keyTerms').value;
    const terms = input.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const termCount = terms.length;
    
    // Rough token estimation: ~1.3 tokens per word on average
    const totalWords = terms.reduce((acc, term) => acc + term.split(/\s+/).length, 0);
    const estimatedTokens = Math.ceil(totalWords * 1.3);
    
    const countEl = document.getElementById('keyTermCount');
    countEl.textContent = `${termCount} keyterms, ~${estimatedTokens} tokens`;
    
    // Warn if limits exceeded
    if (termCount > 100) {
        countEl.style.color = '#ff4a4a';
        countEl.textContent += ' ⚠️ Exceeds 100 keyterm limit';
    } else if (estimatedTokens > 500) {
        countEl.style.color = '#ff9a4a';
        countEl.textContent += ' ⚠️ May exceed 500 token limit';
    } else {
        countEl.style.color = '#4a9eff';
    }
}

// Scan directory for videos
async function scanDirectory() {
    const path = document.getElementById('scanPath').value;
    const showAll = true;  // Always show all videos
    showStatus('scanStatus', '🔍 Scanning directory...', 'info');
    
    try {
        const response = await fetch(`/api/scan?root=${encodeURIComponent(path)}&show_all=${showAll}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        scannedFiles = data.files;
        
        if (scannedFiles.length === 0) {
            const message = showAll ?
                '✅ No videos found in this directory' :
                '✅ No videos need subtitles in this directory';
            showStatus('scanStatus', message, 'success');
            document.getElementById('filesList').style.display = 'none';
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('estimateBtn').disabled = true;
            return;
        }
        
        const message = showAll ?
            `✅ Found ${data.count} videos` :
            `✅ Found ${data.count} videos without subtitles`;
        showStatus('scanStatus', message, 'success');
        displayFiles(scannedFiles);
        document.getElementById('submitBtn').disabled = false;
        
    } catch (error) {
        showStatus('scanStatus', `❌ Error: ${error.message}`, 'error');
        console.error('Scan error:', error);
    }
}

// Display scanned files with checkboxes (NOT auto-selected)
function displayFiles(files) {
    const container = document.getElementById('filesList');
    container.innerHTML = '';
    
    files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `file-${index}`;
        checkbox.value = file;
        checkbox.checked = false;  // NOT auto-selected by default
        
        const label = document.createElement('label');
        label.htmlFor = `file-${index}`;
        label.textContent = file.replace(/^\/media\//, '');
        label.style.cursor = 'pointer';
        label.style.flex = '1';
        
        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
    
    container.style.display = 'block';
    document.getElementById('estimateBtn').disabled = false;
}

// Select all files
function selectAll() {
    selectedFiles = [];
    document.querySelectorAll('.file-item input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        const filePath = cb.value;
        if (!selectedFiles.includes(filePath)) {
            selectedFiles.push(filePath);
        }
    });
    updateSelectionStatus();
    if (selectedFiles.length > 0) {
        calculateEstimatesAuto();
    }
}

// Deselect all files
function selectNone() {
    selectedFiles = [];
    document.querySelectorAll('.file-item input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    updateSelectionStatus();
    document.getElementById('estSummary').innerHTML = '0 files • 0:00 duration<br>~$0.00 cost • ~0:00 processing time';
}

// Automatically calculate cost and time estimates
async function calculateEstimatesAuto() {
    if (selectedFiles.length === 0) {
        document.getElementById('estSummary').innerHTML = '0 files • 0:00 duration<br>~$0.00 cost • ~0:00 processing time';
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
        document.getElementById('estSummary').innerHTML = '0 files • 0:00 duration<br>~$0.00 cost • ~0:00 processing time';
    }
}

// Display cost and time estimates in compact format
function displayEstimates(data) {
    const estSummary = document.getElementById('estSummary');
    
    // Format duration as HH:MM:SS or MM:SS
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
    const line1 = `${data.total_files} ${fileText} • ${formatDuration(data.total_duration_seconds)} duration`;
    const line2 = `~$${data.estimated_cost_usd.toFixed(2)} cost • ~${formatDuration(data.estimated_processing_time_seconds)} processing time`;
    
    estSummary.innerHTML = `${line1}<br>${line2}`;
}

// Submit batch for transcription
async function submitBatch() {
    const selectedFiles = Array.from(
        document.querySelectorAll('.file-item input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (selectedFiles.length === 0) {
        showStatus('submitStatus', '⚠️ Please select at least one file', 'error');
        return;
    }
    
    const model = 'nova-3'; // Hardcoded to Nova-3
    const language = document.getElementById('language').value;
    const profanityFilter = document.getElementById('profanityFilter').value;
    const enableTranscript = document.getElementById('enableTranscript').checked;
    const forceRegenerate = document.getElementById('forceRegenerate').checked;
    const saveRawJson = document.getElementById('saveRawJson').checked;
    
    // Build request body
    const requestBody = {
        files: selectedFiles,
        model: model,
        language: language,
        profanity_filter: profanityFilter,
        force_regenerate: forceRegenerate,
        save_raw_json: saveRawJson
    };
    
    // Add keyterms if provided (independent of transcript generation)
    const keyTerms = document.getElementById('keyTerms').value.trim();
    if (keyTerms) {
        // Split by comma and clean up whitespace
        requestBody.keyterms = keyTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
    
    // Add transcript-related fields if enabled
    if (enableTranscript) {
        requestBody.enable_transcript = true;
        
        // Only add speaker map if the checkbox is checked
        const enableSpeakerMap = document.getElementById('enableSpeakerMap').checked;
        if (enableSpeakerMap) {
            const speakerMap = document.getElementById('speakerMap').value.trim();
            if (speakerMap) {
                requestBody.speaker_map = speakerMap;
            }
        }
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
        
        // Show job status section and start monitoring
        document.getElementById('jobCard').style.display = 'block';
        startJobMonitoring(currentBatchId);
        
    } catch (error) {
        showStatus('submitStatus', `❌ Error: ${error.message}`, 'error');
        console.error('Submit error:', error);
        document.getElementById('submitBtn').disabled = false;
    }
}

// Start monitoring job progress
function startJobMonitoring(batchId) {
    // Clear any existing monitoring
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    if (eventSource) {
        eventSource.close();
    }
    
    // Start Server-Sent Events connection for heartbeat
    eventSource = new EventSource('/api/progress');
    eventSource.addEventListener('ping', function(e) {
        // Connection is alive
    });
    
    // Poll for job status
    pollInterval = setInterval(() => checkJobStatus(batchId), 3000);
    
    // Check immediately
    checkJobStatus(batchId);
}

// Check job status
async function checkJobStatus(batchId) {
    try {
        const response = await fetch(`/api/job/${batchId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        updateJobDisplay(data);
        
        // If job is complete, stop polling
        if (data.state === 'SUCCESS' || data.state === 'FAILURE' || data.state === 'REVOKED') {
            clearInterval(pollInterval);
            if (eventSource) {
                eventSource.close();
            }
            document.getElementById('submitBtn').disabled = false;
        }
        
    } catch (error) {
        console.error('Status check error:', error);
    }
}

// Cancel current job
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
        }
    } catch (error) {
        console.error('Cancel error:', error);
    }
}

// Update job status display
function updateJobDisplay(data) {
    const statusDiv = document.getElementById('jobStatus');
    const statsDiv = document.getElementById('jobStats');
    const cancelBtn = document.getElementById('cancelBtn');
    const fileProgressDiv = document.getElementById('fileProgress');
    
    let statusHtml = '';
    let statsHtml = '';
    
    // Show current state
    if (data.state === 'PENDING') {
        statusHtml = '<div class="loader"></div>Job queued, waiting to start...';
        cancelBtn.style.display = 'inline-block';
    } else if (data.state === 'STARTED') {
        statusHtml = '<div class="loader"></div>Processing videos...';
        cancelBtn.style.display = 'inline-block';
        
        // Show detailed file progress if children data available
        if (data.children && data.children.length > 0) {
            fileProgressDiv.style.display = 'block';
            updateFileProgress(data.children);
        }
    } else if (data.state === 'SUCCESS') {
        statusHtml = '✅ Batch complete!';
        cancelBtn.style.display = 'none';
        
        // Show final file progress
        if (data.children && data.children.length > 0) {
            fileProgressDiv.style.display = 'block';
            updateFileProgress(data.children);
        }
        
        // Show results if available
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

// Update file progress display
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
                'saving_raw_json': 'Saving raw JSON'
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
        
        // Extract just the filename from path
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
    
    fileProgressList.innerHTML = html || '<div style="color: #888; text-align: center;">No file details available</div>';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load config
    fetch('/api/config')
        .then(r => r.json())
        .then(config => {
            document.getElementById('language').value = config.default_language;
        })
        .catch(err => console.error('Failed to load config:', err));
    
    // Reset all checkboxes to default (unchecked) state
    document.getElementById('enableTranscript').checked = false;
    document.getElementById('enableSpeakerMap').checked = false;
    document.getElementById('forceRegenerate').checked = false;
    document.getElementById('saveRawJson').checked = false;
    
    // Reset profanity filter to default (off)
    document.getElementById('profanityFilter').value = 'off';
    
    // Hide transcript and speaker map options
    document.getElementById('transcriptOptions').style.display = 'none';
    document.getElementById('speakerMapInput').style.display = 'none';
    
    // Clear speaker map field
    document.getElementById('speakerMap').value = '';
    
    // Automatically load /media directory on page load
    browseDirectories('/media');
});