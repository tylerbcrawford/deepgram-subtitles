// Deepgram Subtitle Generator - Web UI Client

let selectedFiles = [];
let currentPath = '/media';
let currentFolder = '/media'; // Track which folder files are selected from
let currentBatchId = null;
let eventSource = null;
let pollInterval = null;
let onlyFoldersWithVideos = true; // Default to filtering empty folders

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

    // Check if we should load saved settings
    const savedSettings = localStorage.getItem('deepgramSettings');
    const shouldLoadSaved = savedSettings !== null;

    if (shouldLoadSaved) {
        // Load saved settings
        loadSavedSettings();
    } else {
        // Apply default settings
        applyDefaultSettings();
    }

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
                    <option value="claude-sonnet-4-5">Claude Sonnet 4.5 (Best Quality)</option>
                    <option value="claude-haiku-4-5">Claude Haiku 4.5 (Faster, Cheaper)</option>
                `;
            } else {
                modelSelect.innerHTML = `
                    <option value="gpt-5">GPT-5 (Best Quality)</option>
                    <option value="gpt-5-mini">GPT-5 Mini (Faster, Cheaper)</option>
                `;
            }
            
            // Trigger change event to update API key status check
            modelSelect.dispatchEvent(new Event('change'));
        });
        
        // Initialize with correct models for default provider on page load
        llmProvider.dispatchEvent(new Event('change'));
    }
    
    // Setup Generate Keyterms button handler
    const generateBtn = document.getElementById('generateKeytermsBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateKeyterms);
    }
    
    // Check API key status on page load
    checkApiKeyStatus();

    // Initialize keyterm cost estimate
    updateKeytermCostEstimate();

    // Re-check API key status when provider changes
    if (llmProvider) {
        llmProvider.addEventListener('change', checkApiKeyStatus);
    }

    // Handle overwrite checkbox to control file text color
    const forceRegenerateCheckbox = document.getElementById('forceRegenerate');
    if (forceRegenerateCheckbox) {
        forceRegenerateCheckbox.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('overwrite-enabled');
            } else {
                document.body.classList.remove('overwrite-enabled');
            }
            // Update button state when overwrite checkbox changes
            updateSelectionStatus();
        });
    }

    // Handle auto-clear files checkbox
    const autoClearFilesCheckbox = document.getElementById('autoClearFiles');
    if (autoClearFilesCheckbox) {
        autoClearFilesCheckbox.addEventListener('change', function() {
            localStorage.setItem('autoClearFiles', this.checked);
        });
    }

    // Update cost estimate when keyterms change
    const keytermsField = document.getElementById('keyterms');
    if (keytermsField) {
        keytermsField.addEventListener('input', function() {
            if (selectedFiles.length > 0) {
                calculateEstimatesAuto();
            }
        });
    }
});

/* ============================================
   BREADCRUMB NAVIGATION
   ============================================ */

function updateBreadcrumb(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;  // Exit early if breadcrumb element doesn't exist

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
    
    // Clear selection when navigating to a different folder (Group B: Folder Scope)
    if (path !== currentFolder && selectedFiles.length > 0) {
        selectedFiles = [];
        currentFolder = path;
        updateSelectionStatus();
    }
    
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
        const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}&show_all=${showAll}&only_folders_with_videos=${onlyFoldersWithVideos}`);
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
                const videoText = dir.video_count === 1 ? 'video' : 'videos';
                html += `
                    <button class="browser-item directory-item" data-path="${dir.path.replace(/"/g, '&quot;')}" data-video-count="${dir.video_count}">
                        <span class="item-icon">📁</span>
                        <span class="item-name">${dir.name}</span>
                        <span class="item-meta">${dir.video_count} ${videoText}</span>
                        <span class="item-action">→</span>
                    </button>
                `;
            });
            html += '</div>';
        }
        
        // Update folder count display
        const folderCount = document.getElementById('folderCount');
        if (folderCount) {
            const folderText = data.directories.length === 1 ? 'folder' : 'folders';
            folderCount.textContent = `${data.directories.length} ${folderText}`;
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
                    <label class="browser-item browser-file ${isSelected ? 'selected' : ''}" data-has-subtitles="${file.has_subtitles ? 'true' : 'false'}">
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
        // Group B: Set current folder when first file is selected
        if (selectedFiles.length === 0) {
            currentFolder = currentPath;
        }
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
        // Update keyterm cost estimate
        updateKeytermCostEstimate();
    } else {
        // Clear keyterms when no files are selected
        clearKeytermField();
        const costPrimary = document.getElementById('costPrimary');
        const costSecondary = document.getElementById('costSecondary');
        costPrimary.textContent = '0 files selected';
        costSecondary.textContent = 'Select videos to see estimates';
        // Clear keyterm cost estimate
        updateKeytermCostEstimate();
    }
}

/* ============================================
   FOLDER FILTERING
   ============================================ */

function toggleFolderFilter() {
    const checkbox = document.getElementById('onlyFoldersWithVideos');
    onlyFoldersWithVideos = checkbox.checked;

    // Reload current directory with new filter
    browseDirectories(currentPath);

    const filterText = onlyFoldersWithVideos ? 'Showing folders with media only' : 'Showing all folders';
    showToast('info', filterText);
}

/* ============================================
   SETTINGS PERSISTENCE
   ============================================ */

function toggleRememberSettings() {
    const rememberCheckbox = document.getElementById('rememberSettings');

    if (rememberCheckbox.checked) {
        // Save current settings to localStorage
        saveCurrentSettings();
        showToast('info', 'Settings will be remembered');
    } else {
        // Clear saved settings from localStorage
        localStorage.removeItem('deepgramSettings');
        showToast('info', 'Settings cleared - using defaults');
    }
}

function applyDefaultSettings() {
    // Reset checkboxes that should be unchecked by default
    const enableTranscript = document.getElementById('enableTranscript');
    const forceRegenerate = document.getElementById('forceRegenerate');
    const saveRawJson = document.getElementById('saveRawJson');
    const detectLanguage = document.getElementById('detectLanguage');
    const multiLanguage = document.getElementById('multiLanguage');
    const preserveExisting = document.getElementById('preserveExisting');

    if (enableTranscript) enableTranscript.checked = false;
    if (forceRegenerate) forceRegenerate.checked = false;
    if (saveRawJson) saveRawJson.checked = false;
    if (detectLanguage) detectLanguage.checked = false;
    if (multiLanguage) multiLanguage.checked = false;
    if (preserveExisting) preserveExisting.checked = false;

    // Set checkboxes that should be checked by default (best practices for subtitles)
    const numerals = document.getElementById('numerals');
    const fillerWords = document.getElementById('fillerWords');
    const measurements = document.getElementById('measurements');
    const diarization = document.getElementById('diarization');
    const utterances = document.getElementById('utterances');
    const paragraphs = document.getElementById('paragraphs');
    const onlyFoldersWithVideos = document.getElementById('onlyFoldersWithVideos');

    if (numerals) numerals.checked = true;
    // fillerWords defaults to unchecked (not enabled by default)
    if (fillerWords) fillerWords.checked = false;
    if (measurements) measurements.checked = true;
    if (diarization) diarization.checked = true;
    if (utterances) utterances.checked = true;
    if (paragraphs) paragraphs.checked = true;
    if (onlyFoldersWithVideos) onlyFoldersWithVideos.checked = true;

    // Reset profanity filter radio buttons to default (off)
    const profanityFilterOff = document.querySelector('input[name="profanityFilter"][value="off"]');
    if (profanityFilterOff) profanityFilterOff.checked = true;

    // Uncheck remember settings
    const rememberCheckbox = document.getElementById('rememberSettings');
    if (rememberCheckbox) rememberCheckbox.checked = false;
}

function saveCurrentSettings() {
    const settings = {
        language: document.getElementById('language')?.value,
        enableTranscript: document.getElementById('enableTranscript')?.checked,
        forceRegenerate: document.getElementById('forceRegenerate')?.checked,
        numerals: document.getElementById('numerals')?.checked,
        measurements: document.getElementById('measurements')?.checked,
        fillerWords: document.getElementById('fillerWords')?.checked,
        detectLanguage: document.getElementById('detectLanguage')?.checked,
        multiLanguage: document.getElementById('multiLanguage')?.checked,
        profanityFilter: document.querySelector('input[name="profanityFilter"]:checked')?.value,
        saveRawJson: document.getElementById('saveRawJson')?.checked,
        diarization: document.getElementById('diarization')?.checked,
        utterances: document.getElementById('utterances')?.checked,
        paragraphs: document.getElementById('paragraphs')?.checked,
        preserveExisting: document.getElementById('preserveExisting')?.checked,
        onlyFoldersWithVideos: document.getElementById('onlyFoldersWithVideos')?.checked,
        autoClearFiles: document.getElementById('autoClearFiles')?.checked
    };

    localStorage.setItem('deepgramSettings', JSON.stringify(settings));
}

function loadSavedSettings() {
    const rememberCheckbox = document.getElementById('rememberSettings');
    const savedSettings = localStorage.getItem('deepgramSettings');

    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);

            // Apply saved settings
            if (settings.language) document.getElementById('language').value = settings.language;
            if (settings.enableTranscript !== undefined) document.getElementById('enableTranscript').checked = settings.enableTranscript;
            if (settings.forceRegenerate !== undefined) document.getElementById('forceRegenerate').checked = settings.forceRegenerate;
            if (settings.numerals !== undefined) document.getElementById('numerals').checked = settings.numerals;
            if (settings.measurements !== undefined) document.getElementById('measurements').checked = settings.measurements;
            if (settings.fillerWords !== undefined) document.getElementById('fillerWords').checked = settings.fillerWords;
            if (settings.detectLanguage !== undefined) document.getElementById('detectLanguage').checked = settings.detectLanguage;
            if (settings.multiLanguage !== undefined) document.getElementById('multiLanguage').checked = settings.multiLanguage;
            if (settings.saveRawJson !== undefined) document.getElementById('saveRawJson').checked = settings.saveRawJson;
            if (settings.diarization !== undefined) document.getElementById('diarization').checked = settings.diarization;
            if (settings.utterances !== undefined) document.getElementById('utterances').checked = settings.utterances;
            if (settings.paragraphs !== undefined) document.getElementById('paragraphs').checked = settings.paragraphs;
            if (settings.preserveExisting !== undefined) document.getElementById('preserveExisting').checked = settings.preserveExisting;
            if (settings.onlyFoldersWithVideos !== undefined) {
                document.getElementById('onlyFoldersWithVideos').checked = settings.onlyFoldersWithVideos;
                onlyFoldersWithVideos = settings.onlyFoldersWithVideos;
            }
            if (settings.autoClearFiles !== undefined) {
                document.getElementById('autoClearFiles').checked = settings.autoClearFiles;
                localStorage.setItem('autoClearFiles', settings.autoClearFiles);
            }

            if (settings.profanityFilter) {
                const radio = document.querySelector(`input[name="profanityFilter"][value="${settings.profanityFilter}"]`);
                if (radio) radio.checked = true;
            }

            // Check the remember settings checkbox
            if (rememberCheckbox) rememberCheckbox.checked = true;
        } catch (e) {
            console.error('Error loading saved settings:', e);
            localStorage.removeItem('deepgramSettings');
            applyDefaultSettings();
        }
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
   MULTI-LANGUAGE TOGGLE HANDLER
   ============================================ */

function handleMultiLanguageToggle() {
    const multiLanguage = document.getElementById('multiLanguage');
    const keyTerms = document.getElementById('keyTerms');

    if (multiLanguage && multiLanguage.checked && keyTerms && keyTerms.value.trim()) {
        showToast('warning', 'Note: Keyterm prompting is not available with multi-language mode');
    }
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

// Track the generating toast so we can remove it when done
let generatingToast = null;

function showToast(type, message, options = {}) {
    // DISABLED: Toast notifications are currently disabled
    return null;

    // Remove any existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto-dismiss after 3 seconds unless it's an error or persist flag
    if (type !== 'error' && !options.persist) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    return toast;
}

// Update unified status display
function updateUnifiedStatus(text, showProgress = false, progressPercent = 0) {
    const statusText = document.getElementById('statusText');
    const statusProgress = document.getElementById('statusProgress');
    const progressFill = document.getElementById('progressFill');
    const progressLabel = document.getElementById('progressLabel');

    if (statusText) statusText.textContent = text;

    if (showProgress) {
        if (statusProgress) statusProgress.style.display = 'flex';
        if (progressFill) progressFill.style.width = progressPercent + '%';
        if (progressLabel) progressLabel.textContent = Math.round(progressPercent) + '%';
    } else {
        if (statusProgress) statusProgress.style.display = 'none';
    }
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
        toggleBtn.textContent = 'Advanced Options ▲';
    } else {
        advancedOptions.classList.add('hidden');
        toggleBtn.textContent = 'Advanced Options ▼';
    }
}

/* ============================================
   FILE SELECTION
   ============================================ */

function updateSelectionStatus() {
    const count = selectedFiles.length;
    const submitBtn = document.getElementById('submitBtn');

    if (count > 0) {
        // Check if any selected files need transcription
        const forceRegenerate = document.getElementById('forceRegenerate')?.checked || false;
        const selectedElements = document.querySelectorAll('.browser-file input[type="checkbox"]:checked');

        // Check if all selected files already have subtitles
        let allHaveSubtitles = true;
        selectedElements.forEach(checkbox => {
            const fileElement = checkbox.closest('.browser-file');
            const hasSubtitles = fileElement?.getAttribute('data-has-subtitles') === 'true';
            if (!hasSubtitles) {
                allHaveSubtitles = false;
            }
        });

        // Disable button if all files have subtitles and overwrite is not checked
        const shouldDisable = allHaveSubtitles && !forceRegenerate;

        if (submitBtn) {
            submitBtn.disabled = shouldDisable;
            submitBtn.textContent = 'Transcribe';
        }
        announceToScreenReader(`${count} file${count > 1 ? 's' : ''} selected`);
        calculateEstimatesAuto();
    } else {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Transcribe';
            submitBtn.classList.remove('completed');
        }
        // Show 0 cost estimate when no files selected
        updateUnifiedStatus('0 files • 0:00 • $0.00', false);
    }
}

// Group B: Select All in Current Folder
function selectAllInFolder() {
    selectedFiles = [];
    currentFolder = currentPath; // Lock to current folder
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
        const fileText = selectedFiles.length === 1 ? 'file' : 'files';
        showToast('success', `Selected ${selectedFiles.length} ${fileText} in this folder`);
        // Auto-load keyterms for the first selected file
        loadKeytermsForSelection();
    }
}

// Legacy function for backward compatibility
function selectAll() {
    selectAllInFolder();
}

function selectNone() {
    selectedFiles = [];
    currentFolder = currentPath; // Reset folder scope
    document.querySelectorAll('.browser-file input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.browser-file').classList.remove('selected');
    });
    // Clear keyterms when clearing selection
    clearKeytermField();
    updateSelectionStatus();
    // showToast('info', 'Selection cleared'); // Disabled
}

function clearSelection() {
    selectNone();
}

/* ============================================
   COST ESTIMATION
   ============================================ */

async function calculateEstimatesAuto() {
    if (selectedFiles.length === 0) {
        updateUnifiedStatus('', false);
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

        // Add LLM keyterm cost if applicable
        let llmCost = 0;
        const keytermField = document.getElementById('keyterms');
        if (keytermField && keytermField.value.trim()) {
            // Estimate LLM cost for all selected files
            llmCost = await estimateLLMCostForBatch(selectedFiles);
        }

        data.llm_cost = llmCost;
        data.total_cost = data.estimated_cost_usd + llmCost;

        displayEstimates(data);

    } catch (error) {
        console.error('Estimate error:', error);
        updateUnifiedStatus('', false);
    }
}

function displayEstimates(data) {
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
    const totalCost = data.total_cost !== undefined ? data.total_cost : data.estimated_cost_usd;
    const statusText = `${data.total_files} ${fileText} • ${formatDuration(data.total_duration_seconds)} • $${totalCost.toFixed(2)}`;
    updateUnifiedStatus(statusText, false);
}

async function estimateLLMCostForBatch(files) {
    // This is a rough estimation based on typical transcript sizes
    // Claude Sonnet pricing: ~$3 per million input tokens, ~$15 per million output tokens
    // GPT pricing: ~$2.50 per million input tokens, ~$10 per million output tokens

    const provider = document.getElementById('llmProvider')?.value || 'anthropic';
    const model = document.getElementById('llmModel')?.value || 'claude-sonnet-4-5';

    try {
        // Make parallel requests to estimate cost for each file
        const costPromises = files.map(async (file) => {
            try {
                const response = await fetch('/api/keyterms/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        video_path: file,
                        provider: provider,
                        model: model,
                        estimate_only: true
                    })
                });

                if (!response.ok) return 0;

                const data = await response.json();
                return data.estimated_cost || 0;
            } catch (error) {
                console.error(`Failed to estimate LLM cost for ${file}:`, error);
                return 0;
            }
        });

        const costs = await Promise.all(costPromises);
        return costs.reduce((sum, cost) => sum + cost, 0);
    } catch (error) {
        console.error('Failed to estimate LLM costs:', error);
        return 0;
    }
}

/* ============================================
   BATCH SUBMISSION
   ============================================ */

async function submitBatch() {
    const selectedFilesList = Array.from(
        document.querySelectorAll('.browser-file input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    if (selectedFilesList.length === 0) {
        showToast('warning', 'Please select at least one file');
        return;
    }
    
    // Check if user is trying to process files that already have subtitles
    const forceRegenerate = document.getElementById('forceRegenerate').checked;
    if (!forceRegenerate) {
        // Count how many selected files already have subtitles (green dot indicator)
        const filesWithSubtitles = Array.from(
            document.querySelectorAll('.browser-file input[type="checkbox"]:checked')
        ).filter(cb => {
            const fileItem = cb.closest('.browser-file');
            const statusIndicator = fileItem.querySelector('.item-status[data-status="complete"]');
            return statusIndicator !== null;
        }).length;
        
        if (filesWithSubtitles > 0) {
            const fileText = filesWithSubtitles === 1 ? 'file' : 'files';
            const allFiles = filesWithSubtitles === selectedFilesList.length;
            
            if (allFiles) {
                // All files already have subtitles - BLOCK submission
                showToast('error',
                    `All ${filesWithSubtitles} selected ${fileText} already have subtitles. ` +
                    `Check "Overwrite Existing Subtitles" to regenerate them.`
                );
                return;
            } else {
                // Some files have subtitles - warn but allow
                const proceed = confirm(
                    `${filesWithSubtitles} of ${selectedFilesList.length} selected files already have subtitles and will be skipped.\n\n` +
                    `To overwrite them, check the "Overwrite Existing Subtitles" option below.\n\n` +
                    `Continue with remaining ${selectedFilesList.length - filesWithSubtitles} files?`
                );
                if (!proceed) {
                    return;
                }
            }
        }
    }
    
    const model = 'nova-3';
    const multiLanguage = document.getElementById('multiLanguage')?.checked || false;
    let language = document.getElementById('language').value;

    // If multi-language is enabled, use "multi" instead of dropdown value
    if (multiLanguage) {
        language = 'multi';
    }

    // Get profanity filter value from radio buttons
    const profanityFilterRadio = document.querySelector('input[name="profanityFilter"]:checked');
    const profanityFilter = profanityFilterRadio ? profanityFilterRadio.value : 'off';

    const enableTranscript = document.getElementById('enableTranscript').checked;
    // forceRegenerate already declared above in the check
    const saveRawJson = document.getElementById('saveRawJson').checked;

    // Nova-3 Quality Enhancement parameters
    const numerals = document.getElementById('numerals')?.checked || false;
    // NOTE: fillerWords checkbox is now "Remove filler words" so we need to reverse the logic
    const removeFillerWords = document.getElementById('fillerWords')?.checked || false;
    const fillerWords = !removeFillerWords; // Backend expects true to INCLUDE them
    const detectLanguage = document.getElementById('detectLanguage')?.checked || false;
    const measurements = document.getElementById('measurements')?.checked || false;

    // Advanced Transcript Features
    const diarization = document.getElementById('diarization')?.checked || false;
    const utterances = document.getElementById('utterances')?.checked || false;
    const paragraphs = document.getElementById('paragraphs')?.checked || false;

    const requestBody = {
        files: selectedFilesList,
        model: model,
        language: language,
        profanity_filter: profanityFilter,
        force_regenerate: forceRegenerate,
        save_raw_json: saveRawJson,
        numerals: numerals,
        filler_words: fillerWords,
        detect_language: detectLanguage,
        measurements: measurements,
        diarization: diarization,
        utterances: utterances,
        paragraphs: paragraphs
    };

    const keyTerms = document.getElementById('keyTerms').value.trim();
    if (keyTerms) {
        // Validate: keyterms don't work with multi-language
        if (multiLanguage) {
            const proceed = confirm('Keyterm prompting is not available with multi-language code-switching mode. Continue without keyterms?');
            if (!proceed) {
                document.getElementById('submitBtn').disabled = false;
                return;
            }
        } else {
            requestBody.keyterms = keyTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
            // Auto-save keyterms whenever they are provided
            requestBody.auto_save_keyterms = true;
        }
    }
    
    if (enableTranscript) {
        requestBody.enable_transcript = true;
    }

    // Save settings if "Remember my last settings" is enabled
    const rememberCheckbox = document.getElementById('rememberSettings');
    if (rememberCheckbox && rememberCheckbox.checked) {
        saveCurrentSettings();
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.classList.remove('completed');

    // Keep the cost estimate visible (don't update status bar)

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

        announceToScreenReader(`Processing ${data.enqueued} files`);

        startJobMonitoring(currentBatchId);

    } catch (error) {
        console.error('Submit error:', error);
        showToast('error', `Failed to start: ${error.message}`);
        updateUnifiedStatus('Error starting batch', false);
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
                const results = data.data?.results || [];
                const successful = results.filter(r => r.status === 'ok').length;
                const skipped = results.filter(r => r.status === 'skipped').length;
                const failed = results.filter(r => r.status === 'error').length;

                updateUnifiedStatus(`Complete: ${successful} processed, ${skipped} skipped, ${failed} failed`, false);
                // showToast('success', 'Batch complete'); // Disabled
                announceToScreenReader('Batch processing completed');

                // After 10 seconds, reset button and optionally clear files
                setTimeout(() => {
                    const submitBtn = document.getElementById('submitBtn');
                    if (submitBtn) {
                        submitBtn.classList.remove('completed');
                        submitBtn.textContent = 'Transcribe';
                    }

                    // Check if auto-clear is enabled (default: true)
                    const autoClearEnabled = localStorage.getItem('autoClearFiles') !== 'false';
                    if (autoClearEnabled) {
                        // Clear file selections
                        selectNone();
                        // Refresh the current directory to show updated subtitle indicators
                        browseDirectories(currentPath);
                    }
                }, 10000);
            } else if (data.state === 'FAILURE') {
                updateUnifiedStatus('Batch failed', false);
                showToast('error', 'Processing failed');
                announceToScreenReader('Batch processing failed');
            } else if (data.state === 'REVOKED') {
                updateUnifiedStatus('Cancelled', false);
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
    const submitBtn = document.getElementById('submitBtn');

    if (data.state === 'PENDING' || data.state === 'STARTED') {
        // Keep the cost estimate visible during processing (don't clear status bar)
        // Add pulsing animation to button and change text
        if (submitBtn) {
            submitBtn.classList.add('processing');
            submitBtn.classList.remove('completed');
            submitBtn.textContent = 'Processing';
        }
    } else if (data.state === 'SUCCESS') {
        updateUnifiedStatus('Complete', false);
        // Remove pulsing animation and add completed state
        if (submitBtn) {
            submitBtn.classList.remove('processing');
            submitBtn.classList.add('completed');
            submitBtn.textContent = 'Done!';
        }
    } else if (data.state === 'FAILURE') {
        updateUnifiedStatus('Batch failed', false);
        // Remove pulsing animation and completed state
        if (submitBtn) {
            submitBtn.classList.remove('processing');
            submitBtn.classList.remove('completed');
        }
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
function showMessage(message, type = 'info', options = {}) {
    return showToast(type, message, options);
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
 * Update the keyterm cost estimate display
 */
async function updateKeytermCostEstimate() {
    const costElement = document.getElementById('keytermCostEstimate');

    if (!costElement) {
        console.error('keytermCostEstimate element not found');
        return;
    }

    // Get the current video path
    const videoPath = getCurrentVideoPath();

    if (!videoPath) {
        costElement.textContent = 'Est. cost: $0.00';
        costElement.style.color = 'var(--text-tertiary)';
        return;
    }

    const provider = document.getElementById('llmProvider').value;
    const model = document.getElementById('llmModel').value;

    try {
        costElement.textContent = 'Calculating...';
        costElement.style.color = 'var(--text-tertiary)';
        const estimate = await fetchCostEstimate(videoPath, provider, model);
        costElement.textContent = `Est. cost: $${estimate.estimated_cost.toFixed(4)}`;
        costElement.style.color = 'var(--text-secondary)';
    } catch (error) {
        console.error('Failed to estimate cost:', error);
        costElement.textContent = 'Unable to estimate cost';
        costElement.style.color = 'var(--text-tertiary)';
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
                
                // Remove the generating toast
                if (generatingToast) {
                    generatingToast.classList.remove('show');
                    setTimeout(() => generatingToast.remove(), 300);
                    generatingToast = null;
                }
                
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
                
                // Remove the generating toast
                if (generatingToast) {
                    generatingToast.classList.remove('show');
                    setTimeout(() => generatingToast.remove(), 300);
                    generatingToast = null;
                }
                
                showMessage(`❌ Generation failed: ${data.error}`, 'error');
            } else if (data.state === 'PROGRESS') {
                // Update spinner text with progress
                updateSpinnerText(`Generating keyterms: ${data.stage}...`);
            }
            // Continue polling if PENDING
        } catch (error) {
            clearInterval(interval);
            hideSpinner();
            
            // Remove the generating toast
            if (generatingToast) {
                generatingToast.classList.remove('show');
                setTimeout(() => generatingToast.remove(), 300);
                generatingToast = null;
            }
            
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
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.style.display = 'inline-flex';
            }
        } else {
            statusIndicator.className = 'api-key-status missing';
            statusIndicator.setAttribute('data-status', statusMessage);
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.style.display = 'none';
                generateBtn.title = `${statusMessage}. Configure in .env file.`;
            }
        }
    } catch (error) {
        console.error('Failed to check API key status:', error);
        statusIndicator.className = 'api-key-status missing';
        statusIndicator.setAttribute('data-status', 'Unable to check API key status');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.style.display = 'none';
        }
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
        // Start generation immediately - show persistent toast
        showSpinner('🤖 Generating keyterms with AI...');
        generatingToast = showMessage('🤖 Generating keyterms with AI...', 'info', { persist: true });
        
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
        
        // Remove the generating toast
        if (generatingToast) {
            generatingToast.classList.remove('show');
            setTimeout(() => generatingToast.remove(), 300);
            generatingToast = null;
        }
        
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}