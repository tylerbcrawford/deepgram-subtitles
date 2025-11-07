// Deepgram Subtitle Generator - Web UI Client

let selectedFiles = [];
let currentPath = '/media';
let currentFolder = '/media'; // Track which folder files are selected from
let currentBatchId = null;
let eventSource = null;
let pollInterval = null;
let onlyFoldersWithVideos = true; // Default to filtering empty folders
let isInitialLoad = true; // Flag to prevent clearing keyterms on initial page load

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

    // Check if we should load saved settings
    const savedSettings = localStorage.getItem('deepgramSettings');
    const shouldLoadSaved = savedSettings !== null;

    let initialPath = '/media'; // Default path

    if (shouldLoadSaved) {
        // Load saved settings (including folder path and keyterms)
        const restoredPath = loadSavedSettings();
        if (restoredPath) {
            initialPath = restoredPath;
        }
    } else {
        // Apply default settings and clear keyterms
        applyDefaultSettings();
        clearKeytermField();
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

    // Automatically load directory on page load
    console.log('Initial path for browseDirectories:', initialPath);
    browseDirectories(initialPath);

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

    // Setup keyterm checkbox handlers (mutual exclusivity)
    const preserveCheckbox = document.getElementById('preserveExisting');
    const overwriteCheckbox = document.getElementById('overwriteExisting');

    if (preserveCheckbox) {
        preserveCheckbox.addEventListener('change', function() {
            if (this.checked && overwriteCheckbox) {
                overwriteCheckbox.checked = false;
            }
            updateGenerateKeytermButtonState();
        });
    }

    if (overwriteCheckbox) {
        overwriteCheckbox.addEventListener('change', function() {
            if (this.checked && preserveCheckbox) {
                preserveCheckbox.checked = false;
            }
            updateGenerateKeytermButtonState();
        });
    }

    // Check API key status on page load
    checkApiKeyStatus();

    // Initialize keyterm cost estimate
    updateKeytermCostEstimate();

    // Re-check API key status when provider changes
    if (llmProvider) {
        llmProvider.addEventListener('change', checkApiKeyStatus);
    }

    // Handle language selection change for keyterms availability
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.addEventListener('change', updateKeytermAvailability);
    }

    // Handle multi-language toggle for keyterms availability
    const multiLanguageCheckbox = document.getElementById('multiLanguage');
    if (multiLanguageCheckbox) {
        multiLanguageCheckbox.addEventListener('change', handleMultiLanguageToggle);
    }

    // Initialize keyterm availability state on page load
    updateKeytermAvailability();

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
    const keytermsField = document.getElementById('keyTerms');
    if (keytermsField) {
        let isAutoLoading = false; // Flag to track programmatic changes
        let autoSaveTimeout = null; // Debounce timer for auto-save

        keytermsField.addEventListener('input', function(e) {
            if (selectedFiles.length > 0) {
                calculateEstimatesAuto();
            }
            // Update button state when user manually edits keyterms
            updateGenerateKeytermButtonState();

            // Only trigger auto-save and label reset if this is a manual edit (not programmatic)
            if (!isAutoLoading) {
                // Reset label ONLY if it shows auto-loaded or generated (not if it shows "saved")
                const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
                if (keyTermsLabel && (keyTermsLabel.textContent.includes('auto-loaded') || keyTermsLabel.textContent.includes('generated')) && !keyTermsLabel.textContent.includes('saved')) {
                    console.log('Resetting keyterm label from:', keyTermsLabel.textContent);
                    resetKeytermLabel();
                }

                // Auto-save after user stops typing (debounced)
                if (autoSaveTimeout) {
                    clearTimeout(autoSaveTimeout);
                }

                console.log('Setting auto-save timer...');
                autoSaveTimeout = setTimeout(() => {
                    console.log('Auto-save timer triggered');
                    autoSaveKeyterms();
                }, 1500); // Wait 1.5 seconds after user stops typing
            }
        });

        // Store the flag on the field for access in other functions
        keytermsField._isAutoLoading = () => isAutoLoading;
        keytermsField._setAutoLoading = (value) => { isAutoLoading = value; };
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

    // Clear keyterms when navigating directories (but not on initial load if settings are restored)
    if (!isInitialLoad) {
        clearKeytermField();
    } else {
        isInitialLoad = false; // Reset flag after first load
    }

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
        // Clear keyterms field immediately
        clearKeytermField();
        // Navigate back to /media directory
        browseDirectories('/media');
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

    if (numerals) numerals.checked = false;
    // fillerWords defaults to unchecked (not enabled by default)
    if (fillerWords) fillerWords.checked = false;
    if (measurements) measurements.checked = true;
    if (diarization) diarization.checked = false;
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
        autoClearFiles: document.getElementById('autoClearFiles')?.checked,
        currentPath: currentPath, // Save the current folder path
        keyterms: document.getElementById('keyTerms')?.value.trim() || '' // Save keyterms
    };

    console.log('Saving settings with currentPath:', currentPath);
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

            // Restore folder path (will be returned and used for initial navigation)
            let restoredPath = null;
            if (settings.currentPath) {
                currentPath = settings.currentPath;
                restoredPath = settings.currentPath;
                console.log('Restored currentPath from settings:', currentPath);
            }

            // Restore keyterms
            if (settings.keyterms) {
                const keytermsInput = document.getElementById('keyTerms');
                if (keytermsInput) {
                    // Set flag to prevent input listener from triggering auto-save
                    if (keytermsInput._setAutoLoading) {
                        keytermsInput._setAutoLoading(true);
                    }

                    keytermsInput.value = settings.keyterms;

                    // Reset flag after a brief delay
                    setTimeout(() => {
                        if (keytermsInput._setAutoLoading) {
                            keytermsInput._setAutoLoading(false);
                        }
                    }, 100);

                    // Update label to show restored state
                    const keytermCount = settings.keyterms.split(',').filter(k => k.trim().length > 0).length;
                    const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
                    if (keyTermsLabel && keytermCount > 0) {
                        keyTermsLabel.textContent = `KEYTERMS (${keytermCount} restored from last session)`;
                        keyTermsLabel.style.color = 'var(--color-blue)';
                        keyTermsLabel.setAttribute('data-original-text', 'KEYTERMS');
                    }
                }
            }

            // Check the remember settings checkbox
            if (rememberCheckbox) rememberCheckbox.checked = true;

            // Return the restored path so it can be used for initial navigation
            return restoredPath;
        } catch (e) {
            console.error('Error loading saved settings:', e);
            localStorage.removeItem('deepgramSettings');
            applyDefaultSettings();
            return null;
        }
    }
    return null;
}

/* ============================================
   KEYTERMS AUTO-LOADING
   ============================================ */

function resetKeytermLabel() {
    const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
    if (keyTermsLabel) {
        const originalText = keyTermsLabel.getAttribute('data-original-text') || 'KEYTERMS';
        keyTermsLabel.textContent = originalText;
        keyTermsLabel.style.color = '';
    }
}

function clearKeytermField() {
    const keytermsInput = document.getElementById('keyTerms');
    if (keytermsInput) {
        keytermsInput.value = '';
    }
    resetKeytermLabel();
}

async function autoSaveKeyterms() {
    // Only auto-save if we have a selected file
    if (selectedFiles.length === 0) {
        return;
    }

    const keytermsInput = document.getElementById('keyTerms');
    const keyterms = keytermsInput?.value.trim();

    if (!keyterms) {
        return; // Don't save empty keyterms
    }

    const firstFile = selectedFiles[0];

    try {
        const response = await fetch('/api/keyterms/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_path: firstFile,
                keyterms: keyterms
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`Auto-saved ${data.keyterms_count} keyterms`);

            // Update label to show it was saved
            const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
            if (keyTermsLabel) {
                keyTermsLabel.textContent = `KEYTERMS (${data.keyterms_count} saved)`;
                keyTermsLabel.style.color = 'var(--color-green)';
                keyTermsLabel.setAttribute('data-original-text', 'KEYTERMS');
            }
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to auto-save keyterms:', response.status, errorData);
        }
    } catch (error) {
        console.error('Error auto-saving keyterms:', error);
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
            updateGenerateKeytermButtonState();
            return;
        }

        const data = await response.json();

        if (data.keyterms && data.keyterms.length > 0) {
            // Populate the keyterms text box
            const keyTermsInput = document.getElementById('keyTerms');
            if (keyTermsInput) {
                // Set flag to prevent input listener from resetting label
                if (keyTermsInput._setAutoLoading) {
                    keyTermsInput._setAutoLoading(true);
                }

                // Join keyterms with commas
                keyTermsInput.value = data.keyterms.join(', ');

                // Reset flag after a brief delay
                setTimeout(() => {
                    if (keyTermsInput._setAutoLoading) {
                        keyTermsInput._setAutoLoading(false);
                    }
                }, 100);

                // Show a subtle notification
                console.log(`Auto-loaded ${data.count} keyterms from CSV`);

                // Show persistent indicator that keyterms were auto-loaded
                const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
                if (keyTermsLabel) {
                    keyTermsLabel.textContent = `KEYTERMS (${data.count} auto-loaded)`;
                    keyTermsLabel.style.color = 'var(--color-green)';
                    // Store the original text for later reset
                    keyTermsLabel.setAttribute('data-original-text', 'KEYTERMS');
                }
            }
        }

        // Update button state after loading keyterms
        updateGenerateKeytermButtonState();
    } catch (error) {
        console.error('Failed to load keyterms:', error);
        // Silently fail - not critical
        updateGenerateKeytermButtonState();
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

    // Update keyterm availability when multi-language is toggled
    updateKeytermAvailability();
}

/* ============================================
   KEYTERM AVAILABILITY (LANGUAGE CHECK)
   ============================================ */

function updateKeytermAvailability() {
    const languageSelect = document.getElementById('language');
    const multiLanguage = document.getElementById('multiLanguage');
    const keytermsInput = document.getElementById('keyTerms');
    const generateBtn = document.getElementById('generateKeytermsBtn');
    const preserveCheckbox = document.getElementById('preserveExisting');
    const overwriteCheckbox = document.getElementById('overwriteExisting');

    if (!languageSelect || !keytermsInput) return;

    const selectedLanguage = languageSelect.value;
    const isMultiLanguage = multiLanguage?.checked || false;

    // Keyterms only available for English (en or en-*)
    const isEnglish = selectedLanguage === 'en' || selectedLanguage.startsWith('en-');
    const keytermAvailable = isEnglish && !isMultiLanguage;

    // Disable/enable keyterms elements
    keytermsInput.disabled = !keytermAvailable;
    if (generateBtn) generateBtn.disabled = !keytermAvailable;
    if (preserveCheckbox) preserveCheckbox.disabled = !keytermAvailable;
    if (overwriteCheckbox) overwriteCheckbox.disabled = !keytermAvailable;

    // Update button state if keyterms are available
    if (keytermAvailable) {
        updateGenerateKeytermButtonState();
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
        generateBtn.classList.add('processing');
        generateBtn.classList.remove('completed');
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
        generateBtn.classList.remove('processing');
        generateBtn.textContent = 'Generate Keyterms';
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

                // Show completed state
                const generateBtn = document.getElementById('generateKeytermsBtn');
                if (generateBtn) {
                    generateBtn.classList.remove('processing');
                    generateBtn.classList.add('completed');
                    generateBtn.disabled = false; // Enable to show full green color
                    generateBtn.textContent = 'Done!';
                }

                // Remove the generating toast
                if (generatingToast) {
                    generatingToast.classList.remove('show');
                    setTimeout(() => generatingToast.remove(), 300);
                    generatingToast = null;
                }

                // Populate keyterms field
                const keytermsInput = document.getElementById('keyTerms');

                // Set flag to prevent input listener from resetting label
                if (keytermsInput._setAutoLoading) {
                    keytermsInput._setAutoLoading(true);
                }

                keytermsInput.value = data.keyterms.join(', ');

                // Reset flag after a brief delay
                setTimeout(() => {
                    if (keytermsInput._setAutoLoading) {
                        keytermsInput._setAutoLoading(false);
                    }
                }, 100);

                // Update label to show generated count
                const keyTermsLabel = document.querySelector('label[for="keyTerms"]');
                if (keyTermsLabel) {
                    keyTermsLabel.textContent = `KEYTERMS (${data.keyterm_count} generated)`;
                    keyTermsLabel.style.color = 'var(--color-green)';
                    keyTermsLabel.setAttribute('data-original-text', 'KEYTERMS');
                }

                // Show success message with cost
                showMessage(
                    `✅ Generated ${data.keyterm_count} keyterms • Cost: $${data.actual_cost.toFixed(3)} • Tokens: ${data.token_count}`,
                    'success'
                );

                // Reset button after 10 seconds
                setTimeout(() => {
                    if (generateBtn) {
                        generateBtn.classList.remove('completed');
                        generateBtn.disabled = false;
                        updateGenerateKeytermButtonState();
                    }
                }, 10000);
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
 * Update the Generate Keyterms button state based on whether keyterms exist
 */
function updateGenerateKeytermButtonState() {
    const generateBtn = document.getElementById('generateKeytermsBtn');
    const keytermsInput = document.getElementById('keyTerms');
    const preserveCheckbox = document.getElementById('preserveExisting');
    const overwriteCheckbox = document.getElementById('overwriteExisting');
    const languageSelect = document.getElementById('language');
    const multiLanguage = document.getElementById('multiLanguage');

    if (!generateBtn || !keytermsInput) return;

    // Check language availability first
    const selectedLanguage = languageSelect?.value || 'en';
    const isMultiLanguage = multiLanguage?.checked || false;
    const isEnglish = selectedLanguage === 'en' || selectedLanguage.startsWith('en-');
    const keytermAvailable = isEnglish && !isMultiLanguage;

    // If keyterms not available for this language, keep button disabled
    if (!keytermAvailable) {
        generateBtn.disabled = true;
        generateBtn.classList.remove('btn-green', 'btn-blue', 'btn-orange');
        generateBtn.textContent = 'Generate Keyterms';
        return;
    }

    const hasKeyterms = keytermsInput.value.trim().length > 0;
    const preserveChecked = preserveCheckbox?.checked || false;
    const overwriteChecked = overwriteCheckbox?.checked || false;

    // Remove all state classes
    generateBtn.classList.remove('btn-green', 'btn-blue', 'btn-orange');

    if (!hasKeyterms) {
        // No keyterms exist - Blue and enabled (same as transcribe button)
        generateBtn.disabled = false;
        generateBtn.classList.add('btn-blue');
        generateBtn.textContent = 'Generate Keyterms';
    } else if (overwriteChecked) {
        // Has keyterms + overwrite selected - Orange/Yellow and enabled
        generateBtn.disabled = false;
        generateBtn.classList.add('btn-orange');
        generateBtn.textContent = 'Overwrite Keyterms';
    } else if (preserveChecked) {
        // Has keyterms + merge selected - Blue and enabled
        generateBtn.disabled = false;
        generateBtn.classList.add('btn-blue');
        generateBtn.textContent = 'Merge with Existing';
    } else {
        // Has keyterms but no option selected - Disabled
        generateBtn.disabled = true;
        generateBtn.classList.remove('btn-green', 'btn-blue', 'btn-orange');
        generateBtn.textContent = 'Generate Keyterms';
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
    const overwriteExisting = document.getElementById('overwriteExisting').checked;
    const keytermsInput = document.getElementById('keyTerms');
    const hasKeyterms = keytermsInput?.value.trim().length > 0;

    // Confirm overwrite if keyterms exist and overwrite is selected
    if (hasKeyterms && overwriteExisting) {
        const keytermCount = keytermsInput.value.split(',').filter(k => k.trim().length > 0).length;
        const confirmed = confirm(
            `This will overwrite ${keytermCount} existing keyterm${keytermCount === 1 ? '' : 's'}. Continue?`
        );
        if (!confirmed) {
            return;
        }
    }

    try {
        // Start generation immediately - show persistent toast
        showSpinner('Processing');
        generatingToast = showMessage('Processing', 'info', { persist: true });

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