# **Updated Full Implementation Plan**

Based on the new screenshot and design system documentation, here's a comprehensive, prioritized implementation roadmap:

---
## **Implementation Checklist**

### Phase 1: Critical UX Fixes + Design Token Foundation
- [ ] Establish design system foundation (CSS variables)
- [ ] Extract inline CSS to external stylesheet
- [ ] Replace hardcoded colors with CSS variables
- [ ] Set data-theme="dark" on HTML by default
- [ ] Fix cost display (remove negative numbers)
- [ ] Improve selection status bar
- [ ] Add expandable panel for selected files
- [ ] Add "view files" and "clear all" buttons
- [ ] Add hover states to folders & files
- [ ] Add visual feedback for clickable items
- [ ] Add selection highlighting with blue accent
- [ ] Improve button states (primary button styling)
- [ ] Add hover, active, and disabled states
- [ ] Add focus-visible outline for accessibility
- [ ] Update transcribe button text dynamically

### Phase 2: Navigation & Layout Improvements
- [ ] Add breadcrumb navigation
- [ ] Implement clickable path segments
- [ ] Add home icon for root navigation
- [ ] Style current breadcrumb item
- [ ] Make action bar sticky
- [ ] Implement two-column layout (optional)
- [ ] Create collapsible sidebar for directory browser
- [ ] Add responsive grid layout
- [ ] Optimize for mobile/tablet views

### Phase 3: Enhanced Feedback & Micro-interactions
- [ ] Improve status icons with color-coded meanings
- [ ] Replace generic warning triangles
- [ ] Add meaningful status labels (missing subtitle, has subtitle, processing, error)
- [ ] Add loading states for folder navigation
- [ ] Implement skeleton loader
- [ ] Add loading animation
- [ ] Implement toast notifications
- [ ] Create success, error, warning, and info toast types
- [ ] Add auto-dismiss for non-error toasts
- [ ] Add progress tracking section
- [ ] Create collapsible progress panel
- [ ] Show real-time file progress with progress bars
- [ ] Display ETA and percentage complete

### Phase 4: Theme Toggle & Polish
- [ ] Implement theme toggle functionality
- [ ] Add moon/sun icon toggle button
- [ ] Save theme preference to localStorage
- [ ] Add smooth transition animations
- [ ] Announce theme changes to screen readers
- [ ] Add keyboard shortcuts
- [ ] Implement Ctrl/Cmd + A for select all
- [ ] Implement Escape for clear selection
- [ ] Implement Enter for start transcription
- [ ] Implement Ctrl/Cmd + T for theme toggle
- [ ] Create keyboard shortcuts help panel
- [ ] Add filter for empty folders
- [ ] Implement "hide empty folders" toggle
- [ ] Fix input field placeholders
- [ ] Move example text from value to placeholder
- [ ] Add proper labels and ARIA attributes
- [ ] Add info tooltips for input fields

### Phase 5: Accessibility & Responsive
- [ ] Fix semantic HTML structure
- [ ] Add proper header, main, and footer tags
- [ ] Use section elements with ARIA labels
- [ ] Add ARIA labels & screen reader support
- [ ] Add ARIA labels to icon-only buttons
- [ ] Implement live region for status updates
- [ ] Add sr-only class for screen reader text
- [ ] Test with screen readers
- [ ] Implement mobile responsive layout
- [ ] Add mobile breakpoint styles
- [ ] Optimize typography for mobile
- [ ] Make buttons full-width on mobile
- [ ] Add touch-friendly target sizes
- [ ] Test on various mobile devices

---


## **PHASE 1: Critical UX Fixes + Design Token Foundation** (1-2 days)

### 1.1 Establish Design System Foundation
**Effort: 2-3 hours**

```css
/* Create CSS variables file */
:root {
  /* Colors - Accent (same for both themes) */
  --color-blue: #00AEEF;
  --color-green: #00B398;
  --color-yellow: #FFD700;
  --color-red: #F93822;
  
  /* Spacing Scale */
  --space-xs: 4px;
  --space-s: 8px;
  --space-m: 16px;
  --space-l: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Typography */
  --font-h1: 32px;
  --font-h2: 24px;
  --font-h3: 20px;
  --font-body: 16px;
  --font-caption: 14px;
  --font-small: 12px;
}

/* Dark Mode (default) */
[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2A2A2A;
  --surface: #242424;
  --text-primary: #FFFFFF;
  --text-secondary: #E0E0E0;
  --text-tertiary: #999999;
  --border: #404040;
  --disabled: #666666;
  
  --shadow-1: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-2: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-3: 0 8px 16px rgba(0, 0, 0, 0.5);
}

/* Light Mode */
[data-theme="light"] {
  --bg-primary: #F5F5F5;
  --bg-secondary: rgba(204, 204, 204, 0.1);
  --surface: #FFFFFF;
  --text-primary: #000000;
  --text-secondary: #333333;
  --text-tertiary: #666666;
  --border: #CCCCCC;
  --disabled: #999999;
  
  --shadow-1: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-2: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-3: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

**Implementation:**
- Extract all inline CSS to external stylesheet
- Replace hardcoded colors with CSS variables
- Set `data-theme="dark"` on `<html>` by default

---

### 1.2 Fix Cost Display (Negative Numbers)
**Effort: 10 minutes**

**Current Issue:** Shows `-$0.01 cost • -0:36 processing time`

**Fix:**
```javascript
// In your cost calculation function
function updateCostDisplay(files) {
  const totalMinutes = calculateTotalDuration(files);
  const cost = totalMinutes * 0.0043;
  
  // Remove negative signs
  const costText = files.length === 0 
    ? '$0.00 estimated cost' 
    : `$${cost.toFixed(2)} cost`;
  
  const timeText = files.length === 0
    ? '0:00 processing time'
    : `${formatDuration(totalMinutes)} processing time`;
  
  document.getElementById('cost-display').textContent = 
    `${files.length} files • ${costText} • ~${timeText}`;
}
```

---

### 1.3 Improve Selection Status Bar
**Effort: 30 minutes**

**Current Issue:** Green bar at bottom only shows "✓ 1 file selected" - no context

**Fix:**
```html
<!-- Replace current green bar with expandable panel -->
<div class="selection-panel" id="selection-panel">
  <div class="selection-summary">
    <span class="selection-count">✓ 1 file selected</span>
    <button class="btn-text" onclick="toggleSelectionList()">
      view files ▼
    </button>
    <button class="btn-text" onclick="clearSelection()">
      clear all
    </button>
  </div>
  
  <div class="selection-list hidden" id="selection-list">
    <!-- Dynamically populated with selected file names -->
  </div>
</div>
```

```css
.selection-panel {
  background: var(--color-green);
  padding: var(--space-m);
  border-radius: var(--radius-md);
  margin-top: var(--space-m);
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  color: #FFFFFF;
}

.selection-count {
  font-size: var(--font-body);
  font-weight: 600;
}

.btn-text {
  background: transparent;
  border: none;
  color: #FFFFFF;
  text-decoration: underline;
  cursor: pointer;
  font-size: var(--font-caption);
}
```

---

### 1.4 Add Hover States to Folders & Files
**Effort: 20 minutes**

**Current Issue:** Folders/files don't feel clickable (see screenshot - no visual feedback)

**Fix:**
```css
.folder-item, .file-item {
  padding: var(--space-m);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 150ms ease-in-out;
}

.folder-item:hover, .file-item:hover {
  background: var(--bg-secondary);
}

.folder-item.selected, .file-item.selected {
  background: rgba(0, 174, 239, 0.15);
  border-left: 3px solid var(--color-blue);
}
```

---

### 1.5 Improve Button States
**Effort: 30 minutes**

**Current Issue:** Blue "Transcribe" button doesn't follow design system

**Fix:**
```css
/* Primary Button */
.btn-primary {
  background: var(--color-blue);
  color: #FFFFFF;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  min-height: 44px;
  box-shadow: none;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background: var(--disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary:focus-visible {
  outline: 2px solid rgba(0, 174, 239, 0.4);
  outline-offset: 4px;
}
```

Apply to Transcribe button:
```javascript
// Dynamic button text
function updateTranscribeButton(selectedCount) {
  const btn = document.getElementById('transcribe-btn');
  if (selectedCount === 0) {
    btn.disabled = true;
    btn.textContent = 'Select Files to Continue';
  } else {
    btn.disabled = false;
    btn.textContent = `Transcribe ${selectedCount} File${selectedCount > 1 ? 's' : ''}`;
  }
}
```

---

## **PHASE 2: Navigation & Layout Improvements** (1 day)

### 2.1 Add Breadcrumb Navigation
**Effort: 45 minutes**

**Current Issue:** Path shown as `/media/YouTube/_INBOX` with no way to click parent folders

**Fix:**
```html
<div class="breadcrumb" id="breadcrumb">
  <button class="breadcrumb-item" onclick="navigateToPath('/')">
    <svg><!-- home icon --></svg>
  </button>
  <span class="breadcrumb-separator">/</span>
  <button class="breadcrumb-item" onclick="navigateToPath('/media')">media</button>
  <span class="breadcrumb-separator">/</span>
  <button class="breadcrumb-item" onclick="navigateToPath('/media/YouTube')">YouTube</button>
  <span class="breadcrumb-separator">/</span>
  <span class="breadcrumb-item current">_INBOX</span>
</div>
```

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--surface);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-m);
}

.breadcrumb-item {
  background: transparent;
  border: none;
  color: var(--color-blue);
  cursor: pointer;
  font-size: var(--font-body);
  padding: var(--space-s);
  border-radius: var(--radius-sm);
  transition: background 150ms ease-in-out;
}

.breadcrumb-item:hover:not(.current) {
  background: var(--bg-secondary);
}

.breadcrumb-item.current {
  color: var(--text-primary);
  cursor: default;
  font-weight: 600;
}

.breadcrumb-separator {
  color: var(--text-tertiary);
  font-size: var(--font-caption);
}
```

---

### 2.2 Sticky Action Bar
**Effort: 20 minutes**

**Fix:** Make the cost summary + Transcribe button sticky so users don't lose context when scrolling

```css
.action-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  padding: var(--space-m) 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

---

### 2.3 Two-Column Layout (Optional)
**Effort: 1-2 hours**

Split view once files are selected:
- **Left:** Directory browser (collapsible)
- **Right:** Selected files + options

```html
<div class="layout-container" id="layout">
  <aside class="sidebar" id="sidebar">
    <!-- Directory browser -->
  </aside>
  
  <main class="main-content">
    <!-- Selected files + form options -->
  </main>
</div>
```

```css
.layout-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--space-l);
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .layout-container {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    max-height: 400px;
    overflow-y: auto;
  }
}
```

---

## **PHASE 3: Enhanced Feedback & Micro-interactions** (1 day)

### 3.1 Improve Status Icons
**Effort: 30 minutes**

**Current Issue:** Yellow warning triangles (⚠️) next to every file - unclear meaning

**Fix:**
```javascript
// Replace with color-coded, meaningful icons
const statusIcons = {
  missingSubtitle: { icon: '⚠️', color: 'var(--color-yellow)', label: 'Missing subtitle' },
  hasSubtitle: { icon: '✓', color: 'var(--color-green)', label: 'Has subtitle' },
  processing: { icon: '⏳', color: 'var(--color-blue)', label: 'Processing' },
  error: { icon: '✕', color: 'var(--color-red)', label: 'Error' }
};

function renderFileStatus(file) {
  const status = statusIcons[file.status];
  return `
    <span 
      class="status-icon" 
      style="color: ${status.color}" 
      title="${status.label}"
      aria-label="${status.label}"
    >
      ${status.icon}
    </span>
  `;
}
```

```css
.status-icon {
  font-size: 16px;
  margin-right: var(--space-s);
}
```

---

### 3.2 Add Loading States for Folder Navigation
**Effort: 30 minutes**

**Fix:** Show skeleton loader when clicking folders (to handle slow 500-file scans)

```html
<div class="skeleton-loader" id="skeleton">
  <div class="skeleton-item"></div>
  <div class="skeleton-item"></div>
  <div class="skeleton-item"></div>
</div>
```

```css
.skeleton-item {
  height: 48px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--border) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-s);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 3.3 Toast Notifications for Actions
**Effort: 1 hour**

**Fix:** Add toast notifications for success/error feedback

```javascript
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
      toast.remove();
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
  return icons[type];
}
```

```css
.toast {
  position: fixed;
  top: var(--space-l);
  right: var(--space-l);
  min-width: 300px;
  max-width: 500px;
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: var(--space-m);
  box-shadow: var(--shadow-3);
  display: flex;
  align-items: center;
  gap: var(--space-m);
  opacity: 0;
  transform: translateX(400px);
  transition: all 300ms ease-out;
  z-index: 1000;
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-success { border-left: 4px solid var(--color-green); }
.toast-error { border-left: 4px solid var(--color-red); }
.toast-warning { border-left: 4px solid var(--color-yellow); }
.toast-info { border-left: 4px solid var(--color-blue); }

.toast-icon {
  font-size: 20px;
  font-weight: bold;
}

.toast-success .toast-icon { color: var(--color-green); }
.toast-error .toast-icon { color: var(--color-red); }
.toast-warning .toast-icon { color: var(--color-yellow); }
.toast-info .toast-icon { color: var(--color-blue); }

.toast-close {
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 16px;
}
```

---

### 3.4 Progress Tracking Section
**Effort: 1-2 hours**

**Fix:** Add collapsible progress panel that appears when transcription starts

```html
<div class="progress-section hidden" id="progress-section">
  <div class="progress-header">
    <h3>Transcription Progress</h3>
    <button class="btn-icon" onclick="toggleProgress()">
      <svg><!-- collapse icon --></svg>
    </button>
  </div>
  
  <div class="progress-list" id="progress-list">
    <!-- Dynamically populated with file progress -->
  </div>
</div>
```

```javascript
function renderFileProgress(file) {
  return `
    <div class="progress-item" id="progress-${file.id}">
      <div class="progress-item-header">
        <span class="file-name">${file.name}</span>
        <span class="progress-status ${file.status}">${file.statusText}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${file.progress}%"></div>
      </div>
      <div class="progress-details">
        <span>${file.progress}%</span>
        <span>${file.eta}</span>
      </div>
    </div>
  `;
}
```

```css
.progress-section {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-l);
  margin-top: var(--space-xl);
  box-shadow: var(--shadow-1);
}

.progress-item {
  padding: var(--space-m);
  border-bottom: 1px solid var(--border);
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin: var(--space-s) 0;
}

.progress-fill {
  height: 100%;
  background: var(--color-blue);
  transition: width 300ms ease-out;
}

.progress-status.completed { color: var(--color-green); }
.progress-status.error { color: var(--color-red); }
.progress-status.processing { color: var(--color-blue); }
```

---

## **PHASE 4: Theme Toggle & Polish** (0.5 day)

### 4.1 Theme Toggle Implementation
**Effort: 1 hour**

```html
<!-- Add to top-right of header -->
<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
  <svg class="theme-icon theme-icon-dark"><!-- moon icon --></svg>
  <svg class="theme-icon theme-icon-light"><!-- sun icon --></svg>
</button>
```

```javascript
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
}

// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  document.querySelectorAll('.theme-icon').forEach(icon => {
    icon.style.display = icon.classList.contains(`theme-icon-${savedTheme}`) ? 'block' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', initTheme);
```

```css
.theme-toggle {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease-in-out;
}

.theme-toggle:hover {
  background: var(--bg-secondary);
}

.theme-toggle:focus-visible {
  outline: 2px solid rgba(0, 174, 239, 0.4);
  outline-offset: 4px;
}

.theme-icon {
  width: 20px;
  height: 20px;
  fill: var(--text-primary);
  transition: all 300ms ease-in-out;
}

html {
  transition: background 300ms ease-in-out, color 300ms ease-in-out;
}
```

---

### 4.2 Keyboard Shortcuts
**Effort: 30 minutes**

```javascript
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + A: Select All
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    selectAllFiles();
  }
  
  // Escape: Clear selection
  if (e.key === 'Escape') {
    clearSelection();
  }
  
  // Enter: Start transcription if files selected
  if (e.key === 'Enter' && selectedFiles.length > 0) {
    startTranscription();
  }
  
  // Ctrl/Cmd + T: Toggle theme
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault();
    toggleTheme();
  }
});

// Display keyboard shortcuts hint
function showKeyboardShortcuts() {
  return `
    <div class="shortcuts-panel">
      <h4>Keyboard Shortcuts</h4>
      <dl>
        <dt>Ctrl/⌘ + A</dt><dd>Select all files</dd>
        <dt>Escape</dt><dd>Clear selection</dd>
        <dt>Enter</dt><dd>Start transcription</dd>
        <dt>Ctrl/⌘ + T</dt><dd>Toggle theme</dd>
      </dl>
    </div>
  `;
}
```

---

### 4.3 Filter Empty Folders
**Effort: 20 minutes**

**Fix:** Add toggle to hide folders with 0 videos (like "audiobooks", "music")

```html
<div class="filter-bar">
  <label class="checkbox-label">
    <input type="checkbox" id="hide-empty" onchange="filterEmptyFolders()">
    Hide empty folders
  </label>
</div>
```

```javascript
function filterEmptyFolders() {
  const hideEmpty = document.getElementById('hide-empty').checked;
  const folders = document.querySelectorAll('.folder-item');
  
  folders.forEach(folder => {
    const count = parseInt(folder.dataset.videoCount);
    if (hideEmpty && count === 0) {
      folder.style.display = 'none';
    } else {
      folder.style.display = 'flex';
    }
  });
}
```

---

### 4.4 Fix Input Field Placeholders
**Effort: 5 minutes**

**Current Issue:** Keyterm field shows example as value, not placeholder

**Fix:**
```html
<!-- Before -->
<input type="text" value="e.g., Deepgram, iPhone, customer service, Dr. Smith">

<!-- After -->
<input 
  type="text" 
  placeholder="e.g., Deepgram, iPhone, customer service, Dr. Smith"
  aria-label="Keyterm prompting (optional)"
  id="keyterm-input"
>
```

Add proper label:
```html
<label for="keyterm-input" class="input-label">
  Keyterm Prompting (optional)
  <button class="info-tooltip" aria-label="Learn more about keyterm prompting">
    <svg><!-- info icon --></svg>
  </button>
</label>
```

---

## **PHASE 5: Accessibility & Responsive** (0.5 day)

### 5.1 Semantic HTML Fixes
**Effort: 30 minutes**

```html
<!-- Wrap main content in semantic tags -->
<header>
  <h1>Deepgram Subtitle Generator</h1>
  <nav><!-- theme toggle, etc --></nav>
</header>

<main>
  <section aria-label="File browser">
    <!-- Directory browser -->
  </section>
  
  <section aria-label="Transcription options">
    <!-- Form controls -->
  </section>
</main>

<footer>
  <!-- Status info, links -->
</footer>
```

---

### 5.2 ARIA Labels & Screen Reader Support
**Effort: 30 minutes**

```html
<!-- Add ARIA labels to icon-only buttons -->
<button 
  class="folder-expand" 
  aria-label="Expand folder" 
  aria-expanded="false"
>
  <svg><!-- chevron icon --></svg>
</button>

<!-- Add live region for status updates -->
<div 
  aria-live="polite" 
  aria-atomic="true" 
  class="sr-only" 
  id="status-announcer"
></div>
```

```javascript
// Announce status changes
function announceToScreenReader(message) {
  const announcer = document.getElementById('status-announcer');
  announcer.textContent = message;
  
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### 5.3 Mobile Responsive Layout
**Effort: 1 hour**

```css
/* Mobile breakpoint */
@media (max-width: 768px) {
  :root {
    --font-h1: 24px;
    --font-h2: 20px;
    --font-body: 14px;
  }
  
  .layout-container {
    grid-template-columns: 1fr;
    padding: var(--space-m);
  }
  
  .action-bar {
    flex-direction: column;
    gap: var(--space-m);
  }
  
  .breadcrumb {
    overflow-x: auto;
    scrollbar-width: none;
  }
  
  .folder-item, .file-item {
    padding: var(--space-s);
  }
  
  .btn-primary {
    width: 100%;
    font-size: var(--font-caption);
  }
  
  .toast {
    left: var(--space-m);
    right: var(--space-m);
    top: var(--space-m);
    min-width: unset;
  }
}
```

---

## **Implementation Timeline Summary**

| Phase | Effort | Priority | Impact |
|-------|--------|----------|--------|
| **Phase 1:** Critical UX + Tokens | 4-5 hours | 🔴 HIGH | Foundation for everything |
| **Phase 2:** Navigation & Layout | 8 hours | 🟡 MEDIUM | Better usability |
| **Phase 3:** Feedback & Progress | 8 hours | 🟡 MEDIUM | Professional feel |
| **Phase 4:** Theme & Polish | 4 hours | 🟢 LOW | Nice-to-have |
| **Phase 5:** Accessibility | 4 hours | 🔴 HIGH | Required for compliance |

**Total Estimated Time:** 3-4 days for complete implementation

---

## **Quick Start (Day 1 Priority)**

If you need to ship something fast, do these in order:

1. ✅ Set up CSS variables (1 hour)
2. ✅ Fix negative cost display (10 min)
3. ✅ Add hover states to folders/files (20 min)
4. ✅ Improve button states (30 min)
5. ✅ Add selection preview panel (30 min)
6. ✅ Fix keyterm placeholder (5 min)
7. ✅ Add breadcrumb navigation (45 min)
8. ✅ Theme toggle (1 hour)

**Day 1 Result:** Fully functional UI with modern design system (4-5 hours total)

