// Deepgram Subtitle Generator - Web UI Client

let scannedFiles = [];
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
}

// Scan directory for videos
async function scanDirectory() {
    const path = document.getElementById('scanPath').value;
    showStatus('scanStatus', '🔍 Scanning directory...', 'info');
    
    try {
        const response = await fetch(`/api/scan?root=${encodeURIComponent(path)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        scannedFiles = data.files;
        
        if (scannedFiles.length === 0) {
            showStatus('scanStatus', '✅ No videos need subtitles in this directory', 'success');
            document.getElementById('filesList').style.display = 'none';
            document.getElementById('submitBtn').disabled = true;
            return;
        }
        
        showStatus('scanStatus', `✅ Found ${data.count} videos without subtitles`, 'success');
        displayFiles(scannedFiles);
        document.getElementById('submitBtn').disabled = false;
        
    } catch (error) {
        showStatus('scanStatus', `❌ Error: ${error.message}`, 'error');
        console.error('Scan error:', error);
    }
}

// Display scanned files with checkboxes
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
        checkbox.checked = true;
        
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
}

// Select all files
function selectAll() {
    document.querySelectorAll('.file-item input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
}

// Deselect all files
function selectNone() {
    document.querySelectorAll('.file-item input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
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
    
    const model = document.getElementById('model').value;
    const language = document.getElementById('language').value;
    const enableTranscript = document.getElementById('enableTranscript').checked;
    const forceRegenerate = document.getElementById('forceRegenerate').checked;
    
    // Build request body
    const requestBody = {
        files: selectedFiles,
        model: model,
        language: language,
        force_regenerate: forceRegenerate
    };
    
    // Add transcript-related fields if enabled
    if (enableTranscript) {
        requestBody.enable_transcript = true;
        
        const speakerMap = document.getElementById('speakerMap').value.trim();
        if (speakerMap) {
            requestBody.speaker_map = speakerMap;
        }
        
        const keyTerms = document.getElementById('keyTerms').value.trim();
        if (keyTerms) {
            // Split by comma and clean up whitespace
            requestBody.key_terms = keyTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
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
    
    let statusHtml = '';
    let statsHtml = '';
    
    // Show current state
    if (data.state === 'PENDING') {
        statusHtml = '<div class="loader"></div>Job queued, waiting to start...';
        cancelBtn.style.display = 'inline-block';
    } else if (data.state === 'STARTED') {
        statusHtml = '<div class="loader"></div>Processing videos...';
        cancelBtn.style.display = 'inline-block';
    } else if (data.state === 'SUCCESS') {
        statusHtml = '✅ Batch complete!';
        cancelBtn.style.display = 'none';
        
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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load config
    fetch('/api/config')
        .then(r => r.json())
        .then(config => {
            document.getElementById('model').value = config.default_model;
            document.getElementById('language').value = config.default_language;
        })
        .catch(err => console.error('Failed to load config:', err));
});