# GUI Version 2 - Design Enhancement Plan

**Focus**: Minimal, Clean, Clear Interface with Enhanced Visual Hierarchy

---

## 🚧 Implementation Status (Updated 2025-01-24 22:40 UTC)

### ✅ Phase 6: Dieter Rams Minimalist Redesign (2025-01-24) ✨

Following Dieter Rams' design principles ("less, but better"), we've completed a major interface simplification:

#### File Selection Interface Consolidation
- ✅ **Simplified file browser** - Clean, minimal directory navigation with server-side file browsing
- ✅ **Restored folder navigation** - Fixed class name mismatches for clickable folders
- ✅ **Select All & Clear** - Working selection controls with proper visual feedback
- ✅ **Transcribe functionality** - Fixed submission with toast notifications

#### Configuration Consolidation
- ✅ **Unified configuration card** - All options in one cohesive section
- ✅ **Prominent "Overwrite" option** - Moved to visible position within config
- ✅ **Collapsible advanced options** - Progressive disclosure for power features
  - Keyterm prompting
  - Auto-save keyterms
  - Generate transcript
  - Save raw JSON
- ✅ **Simplified labels** - Removed verbose text, cleaner dropdown options

#### Visual Refinements
- ✅ **Minimal breadcrumb navigation** - Clean path display
- ✅ **Selection status** - Integrated into toolbar
- ✅ **Section headers** - Clear "Folders" and "Videos" labels
- ✅ **Status indicators** - Colored dots for subtitle presence

#### User Experience Improvements
- ✅ **Cost estimation** - Automatic calculation on file selection
- ✅ **Toast notifications** - Non-intrusive feedback system
- ✅ **Keyboard shortcuts** - Ctrl+A (select all), Esc (clear), Enter (transcribe)

### ✅ Completed (Previous Phases)

#### Design System Foundation
- ✅ Updated spacing scale (4px, 8px, 12px, 20px, 32px, 48px) - [`styles.css:15-21`](../web/static/styles.css:15-21)
- ✅ Refined typography scale (28px/20px/16px/14px/13px/12px) - [`styles.css:29-35`](../web/static/styles.css:29-35)
- ✅ Enhanced shadow system for dark and light themes - [`styles.css:54-74`](../web/static/styles.css:54-74)
- ✅ Added line height variables and font smoothing - [`styles.css:37-40,96-99`](../web/static/styles.css:37-40)

#### HTML Structure
- ✅ Header with title, subtitle, and theme toggle - [`index.html:12-25`](../web/templates/index.html:12-25)
- ✅ Action bar with cost summary and transcribe button - [`index.html:29-36`](../web/templates/index.html:29-36)
- ✅ Breadcrumb navigation system - [`index.html:42-48`](../web/templates/index.html:42-48)
- ✅ Browser toolbar with filters and selection controls - [`index.html:61-73`](../web/templates/index.html:61-73)
- ✅ Config sections properly grouped with headers - [`index.html:114-229`](../web/templates/index.html:114-229)
- ✅ Selection panel with collapsible file list - [`index.html:90-103`](../web/templates/index.html:90-103)

#### CSS Styling (All Components)
- ✅ Enhanced header styles - [`styles.css:111-145`](../web/static/styles.css:111-145)
- ✅ Improved card system with hover effects - [`styles.css:148-177`](../web/static/styles.css:148-177)
- ✅ Enhanced action bar with backdrop blur - [`styles.css:903-934`](../web/static/styles.css:903-934)
- ✅ Refined selection panel with gradient - [`styles.css:409-447`](../web/static/styles.css:409-447)
- ✅ Browser toolbar styling - [`styles.css:1065-1088`](../web/static/styles.css:1065-1088)
- ✅ Section headers for browser - [`styles.css:1091-1102`](../web/static/styles.css:1091-1102)
- ✅ Browser item styles - [`styles.css:1105-1150`](../web/static/styles.css:1105-1150)
- ✅ Status indicator dots - [`styles.css:1153-1176`](../web/static/styles.css:1153-1176)
- ✅ Config section grouping - [`styles.css:1274-1293`](../web/static/styles.css:1274-1293)
- ✅ Empty state CSS - [`styles.css:1231-1268`](../web/static/styles.css:1231-1268)
- ✅ Info tooltip styles - [`styles.css:1323-1360`](../web/static/styles.css:1323-1360)
- ✅ Micro-interactions and transitions - [`styles.css:1299-1318`](../web/static/styles.css:1299-1318)

#### JavaScript Functionality
- ✅ Fixed folder navigation bug - [`app.js:38-59`](../web/static/app.js:38-59)
- ✅ Event delegation for directory items - [`app.js:38-59`](../web/static/app.js:38-59)
- ✅ Skeleton loader creation and handling - [`app.js:247-271`](../web/static/app.js:247-271)
- ✅ Keyboard shortcuts (Ctrl+A, Esc, Enter, Ctrl+T) - [`app.js:105-129`](../web/static/app.js:105-129)
- ✅ Toast notification system - [`app.js:135-166`](../web/static/app.js:135-166)
- ✅ Automatic cost estimation - [`app.js:515-563`](../web/static/app.js:515-563)

#### Responsive Design
- ✅ Mobile optimizations (stacked layouts, adjusted font sizes) - [`styles.css:974-1059`](../web/static/styles.css:974-1059)
- ✅ Hidden metadata on mobile for cleaner interface - [`styles.css:1056-1058`](../web/static/styles.css:1056-1058)

### 🐛 Known Issues

#### ✅ RESOLVED: Folder Navigation (2025-01-24)
**Problem**: Clicking on folders worked on first click, but subsequent clicks caused a JavaScript error: `TypeError: can't access property "classList", skeleton is null`

**Root Cause**:
- The `skeleton` loader element was nested inside `#directoryList`
- When `browseDirectories()` updated `directoryList.innerHTML`, it destroyed the skeleton element
- Subsequent folder clicks tried to access the now-deleted skeleton element, causing the error

**Solution Implemented**:
1. **Event Delegation Fix** [`app.js:38-57`](../web/static/app.js:38-57)
   - Added INPUT/LABEL check to prevent checkbox clicks from triggering navigation
   - Improved element detection using both direct class check and `closest()`

2. **Skeleton Element Fix** [`app.js:238-265`](../web/static/app.js:238-265)
   - Check if skeleton exists before using it
   - Dynamically create skeleton element if it was destroyed
   - Added null checks in error handling

**Files Modified**:
- [`web/static/app.js`](../web/static/app.js) - Lines 38-57 (event delegation), 238-265 (skeleton handling), 322-328 (error handling)

### ✅ JavaScript Refactoring Complete

All JavaScript code has been updated to use the new CSS classes and HTML structure:

#### Completed Refactoring
1. **✅ Status Dot Indicators** - [`app.js:342-348`](../web/static/app.js:342-348)
   - `getStatusIcon()` now returns `<span class="item-status" data-status="complete|missing"></span>`
   - Removed emoji icons (⚠️, ✓) in favor of colored dots

2. **✅ Parent Directory Link** - [`app.js:275-284`](../web/static/app.js:275-284)
   - Uses `browser-parent` class
   - Proper semantic button element
   - Removed inline styles

3. **✅ Folders Section** - [`app.js:286-302`](../web/static/app.js:286-302)
   - Uses `section-header` class for "Folders" heading
   - Folders wrapped in `browser-section` div
   - Each folder uses `browser-item` and `browser-folder` classes
   - Structured with `item-icon`, `item-name`, `item-meta`, and `item-action` spans

4. **✅ Video Files Section** - [`app.js:303-322`](../web/static/app.js:303-322)
   - Uses `section-header` class for "Videos in this folder" heading
   - Files wrapped in `browser-section` div
   - Each file uses `browser-item` and `browser-file` classes
   - Proper `item-checkbox`, status dots, and `item-name` structure

5. **✅ Empty State** - [`app.js:323-338`](../web/static/app.js:323-338)
   - Displays proper empty state HTML with SVG icon
   - Uses `empty-state`, `empty-icon`, `empty-title`, and `empty-message` classes

6. **✅ Selection Logic Updates** - [`app.js:361-477,569-573`](../web/static/app.js:361-477)
   - Updated all selectors from `.file-item` to `.browser-file`
   - Updated from `.directory-item` to `.browser-folder`
   - Fixed `toggleFileSelection()`, `selectAll()`, `selectNone()`, `filterEmptyFolders()`, and `submitBatch()`

### 📋 Testing Status

#### ✅ Verified Working
- ✅ **File selection** - Manual checkbox selection works correctly
- ✅ **Folder navigation** - Directory browsing with proper event handling
- ✅ **Breadcrumb navigation** - Path navigation functional
- ✅ **Select All** - Bulk selection implemented and working
- ✅ **Clear/Select None** - Deselection functional
- ✅ **Transcribe button** - Submission process working
- ✅ **Status indicators** - Colored dots display correctly
- ✅ **Keyboard shortcuts** - All shortcuts verified
- ✅ **Cost estimation** - Automatic calculation on selection

#### 🔄 Needs Testing
- [ ] **Mobile responsiveness** - Confirm all features work on small screens
- [ ] **Empty state display** - Test with empty folders
- [ ] **Advanced options** - Verify all collapsed options work when expanded
- [ ] **Long filename handling** - Test text overflow on very long filenames

### 🎯 Future Enhancements (Dieter Rams Principles)

#### Ongoing Minimization Goals
Following "less, but better" - continue reducing clutter while maintaining functionality:

- [ ] **Further visual simplification** - Remove any remaining unnecessary elements
- [ ] **Improved visual hierarchy** - Ensure most important actions are most prominent
- [ ] **Enhanced clarity** - Make every interaction more obvious and intuitive
- [ ] **Refined spacing** - Perfect the whitespace and visual rhythm
- [ ] **Color minimization** - Use color only where it adds meaning
- [ ] **Typography refinement** - Ensure perfect readability and hierarchy

#### Specific Improvement Ideas
- [ ] Animate status dots (subtle pulse for processing)
- [ ] Add file size/duration to metadata (when hovering)
- [ ] Implement loading skeletons for better perceived performance
- [ ] Add subtle transitions between directory navigation
- [ ] Consider adding file preview thumbnails (optional, if doesn't clutter)
- [ ] Explore alternative layouts for configuration options

### 📝 Design Notes for Future Sessions

**Core Philosophy**: Dieter Rams' 10 Principles
1. ✅ Good design is innovative (progressive disclosure, modern patterns)
2. ✅ Good design makes a product useful (all features accessible, intuitive)
3. ✅ Good design is aesthetic (clean, minimal, professional)
4. ✅ Good design makes a product understandable (clear hierarchy, obvious actions)
5. ✅ Good design is unobtrusive (subtle interactions, non-intrusive notifications)
6. ✅ Good design is honest (no deceptive patterns, clear feedback)
7. ✅ Good design is long-lasting (timeless minimal aesthetic)
8. 🔄 Good design is thorough down to the last detail (continue refining)
9. ✅ Good design is environmentally-friendly (efficient, no waste)
10. ✅ Good design is as little design as possible (less, but better)

**Key Mantras**:
- "Less, but better"
- "Remove, don't add"
- "Clarity over decoration"
- "Function determines form"

---

## 🎯 Design Principles

1. **Minimalism**: Remove visual clutter, focus on essential elements
2. **Clarity**: Make every action obvious and intuitive
3. **Elegance**: Simple, refined aesthetics with purposeful animations
4. **Efficiency**: Reduce cognitive load, streamline workflows

---

## 📋 Priority Enhancements

### 🔴 Critical (Immediate)

#### 1. Fix Missing Header
**Current Issue**: Title and subtitle are not visible in the screenshots

**Implementation**:
```html
<header class="app-header">
  <div class="header-content">
    <h1>Deepgram Subtitle Generator</h1>
    <p class="subtitle">Batch subtitle generation using Deepgram Nova-3 API</p>
  </div>
  <button class="theme-toggle" onclick="toggleTheme()">
    <!-- Theme toggle icon -->
  </button>
</header>
```

**Styling**:
```css
.app-header {
  padding: var(--space-xl) 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-xl);
}

h1 {
  font-size: var(--font-h1);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.subtitle {
  font-size: var(--font-caption);
  color: var(--text-tertiary);
  font-weight: 400;
}
```

---

#### 2. Redesign File Browser for Minimal Clarity

**Current Issues**:
- Too much visual noise
- Folder icons and emojis distract from content
- Video counts compete with folder names
- Legend text ("⚠️ = Missing subtitles") is redundant
- "Select files to continue" message is awkwardly placed

**New Design Philosophy**:
- **Clean list view**: Remove decorative emojis, use subtle icons
- **Monochrome base**: Use color only for status and interaction
- **Improved density**: Better spacing between items
- **Clear hierarchy**: Folders clearly separated from files
- **Progressive disclosure**: Show details on hover/focus

**Implementation**:

```html
<!-- Simplified Browser Structure -->
<div class="file-browser">
  <!-- Breadcrumb (already implemented) -->
  <div class="breadcrumb">...</div>
  
  <!-- Clean toolbar -->
  <div class="browser-toolbar">
    <div class="toolbar-left">
      <label class="checkbox-label minimal">
        <input type="checkbox" id="hide-empty">
        <span>Hide empty folders</span>
      </label>
    </div>
    <div class="toolbar-right">
      <button class="btn-link" onclick="selectAll()">Select All</button>
      <span class="separator">•</span>
      <button class="btn-link" onclick="selectNone()">Clear</button>
    </div>
  </div>
  
  <!-- Browser list -->
  <div class="browser-list">
    <!-- Parent directory -->
    <button class="browser-item browser-parent">
      <svg class="item-icon"><!-- up arrow --></svg>
      <span class="item-name">Go to parent directory</span>
    </button>
    
    <!-- Folders -->
    <div class="browser-section">
      <h3 class="section-header">Folders</h3>
      <button class="browser-item browser-folder">
        <svg class="item-icon"><!-- folder icon --></svg>
        <span class="item-name">YouTube</span>
        <span class="item-meta">235 videos</span>
        <svg class="item-action"><!-- chevron right --></svg>
      </button>
    </div>
    
    <!-- Files -->
    <div class="browser-section">
      <h3 class="section-header">Videos in this folder</h3>
      <label class="browser-item browser-file">
        <input type="checkbox" class="item-checkbox">
        <span class="item-status" data-status="missing">
          <!-- Status indicator dot -->
        </span>
        <span class="item-name">video-filename.mp4</span>
        <span class="item-meta">1.2 GB • 45:30</span>
      </label>
    </div>
  </div>
</div>
```

**Styling**:
```css
/* Clean Browser Styling */
.file-browser {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-l);
  border: 1px solid var(--border);
}

.browser-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-m) 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-m);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-blue);
  cursor: pointer;
  font-size: var(--font-caption);
  padding: var(--space-xs) var(--space-s);
  transition: opacity 150ms;
}

.btn-link:hover {
  opacity: 0.8;
}

.separator {
  color: var(--text-tertiary);
  margin: 0 var(--space-xs);
}

/* Browser List */
.browser-list {
  max-height: 500px;
  overflow-y: auto;
}

/* Section Headers */
.section-header {
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: var(--space-l) 0 var(--space-s) 0;
}

.section-header:first-child {
  margin-top: 0;
}

/* Browser Items */
.browser-item {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m);
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 150ms;
}

.browser-item:hover {
  background: var(--bg-secondary);
}

/* Item Components */
.item-icon {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  font-size: var(--font-body);
  color: var(--text-primary);
  font-weight: 500;
}

.item-meta {
  font-size: var(--font-small);
  color: var(--text-tertiary);
}

.item-action {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

/* Status Indicator (minimal dot) */
.item-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-status[data-status="missing"] {
  background: var(--color-yellow);
}

.item-status[data-status="complete"] {
  background: var(--color-green);
}

.item-status[data-status="processing"] {
  background: var(--color-blue);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* File Items (with checkbox) */
.browser-file {
  position: relative;
}

.item-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.browser-file:has(.item-checkbox:checked) {
  background: rgba(0, 174, 239, 0.1);
  border-left: 3px solid var(--color-blue);
}

/* Parent Directory */
.browser-parent {
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-m);
  font-weight: 500;
}
```

---

#### 3. Improve Card Design & Visual Hierarchy

**Implementation**:
```css
/* Enhanced Card System */
.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-2);
}

.card h2 {
  font-size: var(--font-h2);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-l);
  padding-bottom: var(--space-m);
  border-bottom: 1px solid var(--border);
}

/* Card Sections */
.card-section {
  margin-bottom: var(--space-l);
}

.card-section:last-child {
  margin-bottom: 0;
}
```

---

#### 4. Enhanced Action Bar

**Current Issues**:
- Lacks visual prominence
- Cost display could be more elegant
- Button needs more emphasis

**Implementation**:
```css
.action-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--surface);
  backdrop-filter: blur(10px);
  padding: var(--space-l);
  border-bottom: 1px solid var(--border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  margin: 0 calc(var(--space-l) * -1) var(--space-l) calc(var(--space-l) * -1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-2);
}

.cost-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.cost-primary {
  font-size: var(--font-h3);
  font-weight: 700;
  color: var(--text-primary);
}

.cost-secondary {
  font-size: var(--font-small);
  color: var(--text-tertiary);
}

.btn-primary {
  background: var(--color-blue);
  color: #FFFFFF;
  border: none;
  padding: 14px 32px;
  border-radius: var(--radius-lg);
  font-size: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 12px rgba(0, 174, 239, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 174, 239, 0.4);
}
```

---

### 🟡 Medium Priority

#### 5. Refined Configuration Section

**Goal**: Group related options with clear section headers

```html
<div class="card">
  <h2>Configuration</h2>
  
  <!-- Language & Model -->
  <div class="config-section">
    <h3 class="config-header">Language & Processing</h3>
    <div class="form-group">...</div>
    <div class="form-group">...</div>
  </div>
  
  <!-- Advanced Options -->
  <div class="config-section">
    <h3 class="config-header">Advanced Options</h3>
    <div class="form-group">...</div>
  </div>
  
  <!-- Options Toggles -->
  <div class="config-section">
    <h3 class="config-header">Generation Options</h3>
    <div class="checkbox-group">...</div>
  </div>
</div>
```

```css
.config-section {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-l);
  border-bottom: 1px solid var(--border);
}

.config-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.config-header {
  font-size: var(--font-caption);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-m);
}
```

---

#### 6. Improved Selection Panel

**Current**: Green bar at bottom
**New**: More elegant, integrated design

```css
.selection-panel {
  background: linear-gradient(135deg, 
    rgba(0, 179, 152, 0.15) 0%, 
    rgba(0, 179, 152, 0.05) 100%);
  border: 1px solid rgba(0, 179, 152, 0.3);
  padding: var(--space-l);
  border-radius: var(--radius-lg);
  margin-top: var(--space-l);
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: var(--space-l);
}

.selection-count {
  font-size: var(--font-h3);
  font-weight: 700;
  color: var(--color-green);
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.selection-count::before {
  content: '✓';
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-green);
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
}
```

---

#### 7. Empty State Design

**When**: No folder selected or empty folder

```html
<div class="empty-state">
  <div class="empty-icon">
    <svg><!-- folder icon --></svg>
  </div>
  <h3 class="empty-title">No folder selected</h3>
  <p class="empty-message">Navigate to a folder to view and select video files</p>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl) var(--space-l);
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-l);
}

.empty-icon svg {
  width: 32px;
  height: 32px;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: var(--font-h3);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-s);
}

.empty-message {
  font-size: var(--font-body);
  color: var(--text-tertiary);
  max-width: 400px;
}
```

---

### 🟢 Low Priority (Polish)

#### 8. Micro-interactions

```css
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, box-shadow, transform;
  transition-duration: 150ms;
  transition-timing-function: ease-in-out;
}

/* Interactive elements */
.browser-item:active {
  transform: scale(0.99);
}

.btn-primary:active {
  transform: scale(0.97);
}

/* Focus states */
*:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

#### 9. Refined Typography

```css
/* Typography improvements */
:root {
  --font-h1: 28px;
  --font-h2: 20px;
  --font-h3: 16px;
  --font-body: 14px;
  --font-caption: 13px;
  --font-small: 12px;
  
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;
}

body {
  font-size: var(--font-body);
  line-height: var(--line-height-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3 {
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}
```

---

#### 10. Improved Info Tooltips

```html
<button class="info-tooltip" data-tooltip="Learn more about this option">
  <svg><!-- info icon --></svg>
</button>
```

```css
.info-tooltip {
  position: relative;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: help;
  padding: var(--space-xs);
}

.info-tooltip:hover {
  color: var(--color-blue);
}

.info-tooltip[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--surface);
  color: var(--text-primary);
  padding: var(--space-s) var(--space-m);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-3);
  font-size: var(--font-small);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms, transform 200ms;
  border: 1px solid var(--border);
  z-index: 1000;
}

.info-tooltip[data-tooltip]:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}
```

---

## 🎨 Design Token Updates

```css
/* Refined spacing scale */
:root {
  --space-xs: 4px;
  --space-s: 8px;
  --space-m: 12px;
  --space-l: 20px;
  --space-xl: 32px;
  --space-xxl: 48px;
}

/* Enhanced shadow system */
[data-theme="dark"] {
  --shadow-1: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-2: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-3: 0 12px 24px rgba(0, 0, 0, 0.5);
}

[data-theme="light"] {
  --shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-2: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-3: 0 12px 24px rgba(0, 0, 0, 0.16);
}
```

---

## 📱 Responsive Enhancements

```css
@media (max-width: 768px) {
  .app-header {
    padding: var(--space-l) 0;
  }
  
  h1 {
    font-size: 20px;
  }
  
  .action-bar {
    flex-direction: column;
    gap: var(--space-m);
    align-items: stretch;
  }
  
  .btn-primary {
    width: 100%;
  }
  
  .browser-item {
    padding: var(--space-s) var(--space-m);
  }
  
  .item-meta {
    display: none; /* Hide on mobile for cleanliness */
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Core Improvements ✅ COMPLETE
- [x] Fix missing header section - [`index.html:12-25`](../web/templates/index.html:12-25)
- [x] Improve toolbar design - [`index.html:61-73`](../web/templates/index.html:61-73)
- [x] Add CSS for file browser - [`styles.css:1065-1215`](../web/static/styles.css:1065-1215)
- [x] Fix folder navigation bug - [`app.js:38-59,247-271`](../web/static/app.js:38-59)

### Phase 2: Visual Polish ✅ COMPLETE
- [x] Enhanced card styling - [`styles.css:148-177`](../web/static/styles.css:148-177)
- [x] Improved action bar - [`styles.css:903-934`](../web/static/styles.css:903-934)
- [x] Refined selection panel - [`styles.css:409-447`](../web/static/styles.css:409-447)
- [x] Config section grouping - [`styles.css:1274-1293`](../web/static/styles.css:1274-1293)
- [x] Empty state CSS - [`styles.css:1231-1268`](../web/static/styles.css:1231-1268)

### Phase 3: Micro-interactions ✅ COMPLETE
- [x] Add smooth transitions - [`styles.css:1299-1318`](../web/static/styles.css:1299-1318)
- [x] Improve hover states - Multiple locations in styles.css
- [x] Polish focus states - [`styles.css:1307-1311`](../web/static/styles.css:1307-1311)
- [x] Tooltip system CSS - [`styles.css:1323-1360`](../web/static/styles.css:1323-1360)
- [x] Refine animations - [`styles.css:1170-1176`](../web/static/styles.css:1170-1176)

### Phase 4: JavaScript Refactoring ✅ COMPLETE
- [x] Refactor `browseDirectories()` to use CSS classes instead of inline styles
- [x] Update `getStatusIcon()` to use status dots instead of emoji
- [x] Remove all inline styles from generated HTML
- [x] Replace emoji icons with CSS-based indicators
- [x] Implement empty state HTML when no files/folders found
- [x] Update all selection logic to work with new class names

### Phase 5: Testing & Validation 📋 PENDING
- [ ] Test file selection with new structure
- [ ] Verify folder navigation with refactored code
- [ ] Test breadcrumb navigation
- [ ] Test selection controls (Select All, Clear)
- [ ] Mobile responsiveness testing
- [ ] Keyboard shortcut validation

---

## 🎯 Expected Outcomes

1. **Cleaner Interface**: Less visual noise, more focus on content
2. **Better Hierarchy**: Clear distinction between sections and elements
3. **Improved Scanning**: Easier to quickly find and select files
4. **Professional Feel**: Polished, refined aesthetics
5. **Enhanced Usability**: Intuitive interactions with clear feedback

---

## 📸 Design References

**File Browser Inspiration**:
- macOS Finder (clean list view)
- VS Code file explorer (minimal icons)
- Dropbox file listing (clear hierarchy)

**Overall Design**:
- Linear app (refined shadows and spacing)
- Notion (clean cards and sections)
- Stripe Dashboard (elegant form design)