/**
 * Digital Declutter Dashboard
 * A lightweight application to help users manage digital clutter
 * like browser tabs and bookmarks.
 */

// ====== APP INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
  // Set copyright year
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Initialize app state
  initializeAppState();
  
  // Set up UI handlers
  setupTabNavigation();
  setupFormHandlers();
  setupThemeToggle();
  setupDataManagement();
  
  // Render initial data
  renderAllData();
});

// ====== STATE MANAGEMENT ======
/**
 * App state containing all user data
 */
const appState = {
  tabs: [],
  bookmarks: [],
  theme: 'light'
};

/**
 * Initialize app state from localStorage or defaults
 */
function initializeAppState() {
  // Try to load saved data
  try {
    const savedData = localStorage.getItem('digitalDeclutterData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      appState.tabs = parsedData.tabs || [];
      appState.bookmarks = parsedData.bookmarks || [];
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('digitalDeclutterTheme');
    if (savedTheme) {
      appState.theme = savedTheme;
      applyTheme(savedTheme);
    }
  } catch (error) {
    console.error('Error loading saved data:', error);
    showToast('Error loading saved data. Starting fresh.', 'error');
  }
}

/**
 * Save current state to localStorage
 */
function saveAppState() {
  try {
    localStorage.setItem('digitalDeclutterData', JSON.stringify({
      tabs: appState.tabs,
      bookmarks: appState.bookmarks
    }));
    localStorage.setItem('digitalDeclutterTheme', appState.theme);
  } catch (error) {
    console.error('Error saving data:', error);
    showToast('Error saving data. Changes may not persist.', 'error');
  }
}

// ====== TAB MANAGEMENT ======
/**
 * Add a new tab to the state
 * @param {Object} tab - Tab object with url, title, category
 */
function addTab(tab) {
  // Add timestamp for reminders feature
  const tabWithTimestamp = {
    ...tab,
    id: generateId(),
    dateAdded: new Date().toISOString(),
    lastReviewed: new Date().toISOString()
  };
  
  appState.tabs.push(tabWithTimestamp);
  saveAppState();
  renderTabs();
  renderReminders();
  updateTabCategories();
  
  showToast('Tab added successfully!', 'success');
}

/**
 * Delete a tab by ID
 * @param {String} tabId - ID of tab to delete
 */
function deleteTab(tabId) {
  appState.tabs = appState.tabs.filter(tab => tab.id !== tabId);
  saveAppState();
  renderTabs();
  renderReminders();
  
  showToast('Tab deleted', 'info');
}

/**
 * Delete all tabs in a category
 * @param {String} category - Category name to delete
 */
function deleteTabCategory(category) {
  if (confirm(`Are you sure you want to delete all tabs in "${category}"?`)) {
    appState.tabs = appState.tabs.filter(tab => tab.category !== category);
    saveAppState();
    renderTabs();
    renderReminders();
    updateTabCategories();
    
    showToast(`Deleted all tabs in "${category}"`, 'info');
  }
}

/**
 * Mark a tab as reviewed
 * @param {String} tabId - ID of tab to mark as reviewed
 */
function markTabReviewed(tabId) {
  const tabIndex = appState.tabs.findIndex(tab => tab.id === tabId);
  if (tabIndex !== -1) {
    appState.tabs[tabIndex].lastReviewed = new Date().toISOString();
    saveAppState();
    renderTabs();
    renderReminders();
    
    showToast('Tab marked as reviewed', 'success');
  }
}

/**
 * Update available tab categories in datalist
 */
function updateTabCategories() {
  const categoriesSet = new Set(appState.tabs.map(tab => tab.category));
  const datalist = document.getElementById('tabCategories');
  
  // Clear existing options
  datalist.innerHTML = '';
  
  // Add new options
  categoriesSet.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    datalist.appendChild(option);
  });
}

// ====== BOOKMARK MANAGEMENT ======
/**
 * Add a new bookmark folder to the state
 * @param {Object} bookmark - Bookmark object with name, count, description
 */
function addBookmark(bookmark) {
  const bookmarkWithMeta = {
    ...bookmark,
    id: generateId(),
    dateAdded: new Date().toISOString(),
    archived: false
  };
  
  appState.bookmarks.push(bookmarkWithMeta);
  saveAppState();
  renderBookmarks();
  
  showToast('Bookmark folder added successfully!', 'success');
}

/**
 * Delete a bookmark by ID
 * @param {String} bookmarkId - ID of bookmark to delete
 */
function deleteBookmark(bookmarkId) {
  appState.bookmarks = appState.bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
  saveAppState();
  renderBookmarks();
  
  showToast('Bookmark folder deleted', 'info');
}

/**
 * Toggle archive state of a bookmark
 * @param {String} bookmarkId - ID of bookmark to toggle
 */
function toggleBookmarkArchive(bookmarkId) {
  const bookmarkIndex = appState.bookmarks.findIndex(bookmark => bookmark.id === bookmarkId);
  if (bookmarkIndex !== -1) {
    appState.bookmarks[bookmarkIndex].archived = !appState.bookmarks[bookmarkIndex].archived;
    saveAppState();
    renderBookmarks();
    
    const status = appState.bookmarks[bookmarkIndex].archived ? 'archived' : 'unarchived';
    showToast(`Bookmark folder ${status}`, 'info');
  }
}

// ====== UI RENDERING ======
/**
 * Render all data to the UI
 */
function renderAllData() {
  renderTabs();
  renderBookmarks();
  renderReminders();
  updateTabCategories();
  updateStatistics();
}

/**
 * Render tabs to the UI, grouped by category
 */
function renderTabs() {
  const tabsContainer = document.getElementById('tabsContainer');
  
  // Group tabs by category
  const tabsByCategory = {};
  appState.tabs.forEach(tab => {
    if (!tabsByCategory[tab.category]) {
      tabsByCategory[tab.category] = [];
    }
    tabsByCategory[tab.category].push(tab);
  });
  
  // Clear container
  tabsContainer.innerHTML = '';
  
  // If no tabs, show empty state
  if (appState.tabs.length === 0) {
    renderEmptyState(tabsContainer, 'No tabs added yet', 'Add your first tab above');
    return;
  }
  
  // Render each category
  Object.keys(tabsByCategory).sort().forEach(category => {
    const tabs = tabsByCategory[category];
    
    // Create category card
    const categoryCard = document.createElement('div');
    categoryCard.className = 'card';
    
    // Card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    
    const titleDiv = document.createElement('div');
    
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = category;
    titleDiv.appendChild(cardTitle);
    
    const cardSubtitle = document.createElement('div');
    cardSubtitle.className = 'card-subtitle';
    cardSubtitle.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''}`;
    titleDiv.appendChild(cardSubtitle);
    
    cardHeader.appendChild(titleDiv);
    
    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = tabs.length;
    cardHeader.appendChild(badge);
    
    categoryCard.appendChild(cardHeader);
    
    // Card content - tab list
    const tabList = document.createElement('ul');
    tabList.className = 'card-list';
    
    tabs.forEach(tab => {
      const tabItem = document.createElement('li');
      tabItem.className = 'card-list-item';
      
      const tabInfo = document.createElement('div');
      
      const tabTitle = document.createElement('div');
      tabTitle.className = 'card-list-item-title';
      
      // Create link for tab
      const tabLink = document.createElement('a');
      tabLink.href = tab.url;
      tabLink.target = '_blank';
      tabLink.rel = 'noopener noreferrer';
      tabLink.textContent = tab.title;
      tabTitle.appendChild(tabLink);
      
      tabInfo.appendChild(tabTitle);
      
      // Add last reviewed date
      const lastReviewed = document.createElement('div');
      lastReviewed.className = 'card-list-item-subtitle';
      const reviewDate = new Date(tab.lastReviewed);
      lastReviewed.textContent = `Last reviewed: ${formatDate(reviewDate)}`;
      tabInfo.appendChild(lastReviewed);
      
      tabItem.appendChild(tabInfo);
      
      // Tab actions
      const actions = document.createElement('div');
      actions.className = 'card-list-item-actions';
      
      // Mark as reviewed button
      const reviewBtn = document.createElement('button');
      reviewBtn.className = 'btn btn-small btn-outline';
      reviewBtn.textContent = '✓';
      reviewBtn.title = 'Mark as reviewed';
      reviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        markTabReviewed(tab.id);
      });
      actions.appendChild(reviewBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small btn-danger';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete tab';
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        deleteTab(tab.id);
      });
      actions.appendChild(deleteBtn);
      
      tabItem.appendChild(actions);
      tabList.appendChild(tabItem);
    });
    
    categoryCard.appendChild(tabList);
    
    // Card actions
    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';
    
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.className = 'btn btn-small btn-danger';
    deleteAllBtn.textContent = 'Delete Category';
    deleteAllBtn.addEventListener('click', () => {
      deleteTabCategory(category);
    });
    cardActions.appendChild(deleteAllBtn);
    
    categoryCard.appendChild(cardActions);
    
    // Add to container
    tabsContainer.appendChild(categoryCard);
  });
  
  // Update statistics
  updateStatistics();
}

/**
 * Render bookmarks to the UI
 */
function renderBookmarks() {
  const bookmarksContainer = document.getElementById('bookmarksContainer');
  
  // Clear container
  bookmarksContainer.innerHTML = '';
  
  // If no bookmarks, show empty state
  if (appState.bookmarks.length === 0) {
    renderEmptyState(bookmarksContainer, 'No bookmark folders added yet', 'Add your first folder above');
    return;
  }
  
  // Sort bookmarks: non-archived first, then alphabetically
  const sortedBookmarks = [...appState.bookmarks].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
  
  // Render each bookmark
  sortedBookmarks.forEach(bookmark => {
    const bookmarkCard = document.createElement('div');
    bookmarkCard.className = `card ${bookmark.archived ? 'archived' : ''}`;
    
    // Card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    
    const titleDiv = document.createElement('div');
    
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = bookmark.name;
    titleDiv.appendChild(cardTitle);
    
    const cardSubtitle = document.createElement('div');
    cardSubtitle.className = 'card-subtitle';
    cardSubtitle.textContent = bookmark.description || 'No description';
    titleDiv.appendChild(cardSubtitle);
    
    cardHeader.appendChild(titleDiv);
    
    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = bookmark.count;
    cardHeader.appendChild(badge);
    
    bookmarkCard.appendChild(cardHeader);
    
    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
    const dateAdded = document.createElement('div');
    dateAdded.className = 'card-list-item-subtitle';
    dateAdded.textContent = `Added: ${formatDate(new Date(bookmark.dateAdded))}`;
    cardContent.appendChild(dateAdded);
    
    // Archive toggle
    const archiveLabel = document.createElement('label');
    archiveLabel.className = 'archive-label';
    
    const archiveCheckbox = document.createElement('input');
    archiveCheckbox.type = 'checkbox';
    archiveCheckbox.checked = bookmark.archived;
    archiveCheckbox.addEventListener('change', () => {
      toggleBookmarkArchive(bookmark.id);
    });
    
    archiveLabel.appendChild(archiveCheckbox);
    archiveLabel.appendChild(document.createTextNode('Archive this folder'));
    
    cardContent.appendChild(archiveLabel);
    bookmarkCard.appendChild(cardContent);
    
    // Card actions
    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-small btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      deleteBookmark(bookmark.id);
    });
    cardActions.appendChild(deleteBtn);
    
    bookmarkCard.appendChild(cardActions);
    
    // Add to container
    bookmarksContainer.appendChild(bookmarkCard);
  });
  
  // Update statistics
  updateStatistics();
}

/**
 * Render reminders based on tabs that need attention
 */
function renderReminders() {
  const remindersContainer = document.getElementById('remindersContainer');
  
  // Clear container
  remindersContainer.innerHTML = '';
  
  // Get tabs that need attention (older than 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const tabsNeedingAttention = appState.tabs.filter(tab => {
    const lastReviewed = new Date(tab.lastReviewed);
    return lastReviewed < threeDaysAgo;
  });
  
  // Sort by oldest first
  tabsNeedingAttention.sort((a, b) => {
    return new Date(a.lastReviewed) - new Date(b.lastReviewed);
  });
  
  // If no reminders, show empty state
  if (tabsNeedingAttention.length === 0) {
    renderEmptyState(remindersContainer, 'All tabs are up to date', 'No reminders needed at this time');
    return;
  }
  
  // Render each reminder
  tabsNeedingAttention.forEach(tab => {
    const reminderCard = document.createElement('div');
    reminderCard.className = 'card reminder-card';
    
    // Card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    
    const titleDiv = document.createElement('div');
    
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = tab.title;
    titleDiv.appendChild(cardTitle);
    
    const cardSubtitle = document.createElement('div');
    cardSubtitle.className = 'card-subtitle';
    cardSubtitle.textContent = `Category: ${tab.category}`;
    titleDiv.appendChild(cardSubtitle);
    
    cardHeader.appendChild(titleDiv);
    
    const daysSinceReview = Math.floor((new Date() - new Date(tab.lastReviewed)) / (1000 * 60 * 60 * 24));
    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = `${daysSinceReview} day${daysSinceReview !== 1 ? 's' : ''} old`;
    cardHeader.appendChild(badge);
    
    reminderCard.appendChild(cardHeader);
    
    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
    const urlLink = document.createElement('a');
    urlLink.href = tab.url;
    urlLink.target = '_blank';
    urlLink.rel = 'noopener noreferrer';
    urlLink.textContent = tab.url;
    cardContent.appendChild(urlLink);
    
    const lastReviewed = document.createElement('div');
    lastReviewed.className = 'card-list-item-subtitle';
    lastReviewed.textContent = `Last reviewed: ${formatDate(new Date(tab.lastReviewed))}`;
    cardContent.appendChild(lastReviewed);
    
    reminderCard.appendChild(cardContent);
    
    // Card actions
    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';
    
    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'btn btn-small btn-outline';
    reviewBtn.textContent = 'Mark Reviewed';
    reviewBtn.addEventListener('click', () => {
      markTabReviewed(tab.id);
    });
    cardActions.appendChild(reviewBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-small btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      deleteTab(tab.id);
    });
    cardActions.appendChild(deleteBtn);
    
    reminderCard.appendChild(cardActions);
    
    // Add to container
    remindersContainer.appendChild(reminderCard);
  });
  
  // Update statistics
  updateStatistics();
}

/**
 * Render empty state UI for containers
 * @param {HTMLElement} container - Container to render empty state in
 * @param {String} title - Title text
 * @param {String} subtitle - Subtitle text
 */
function renderEmptyState(container, title, subtitle) {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  
  // Empty state icon (SVG)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '64');
  svg.setAttribute('height', '64');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  path1.setAttribute('x', '3');
  path1.setAttribute('y', '3');
  path1.setAttribute('width', '18');
  path1.setAttribute('height', '18');
  path1.setAttribute('rx', '2');
  path1.setAttribute('ry', '2');
  
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  path2.setAttribute('x1', '8');
  path2.setAttribute('y1', '12');
  path2.setAttribute('x2', '16');
  path2.setAttribute('y2', '12');
  
  svg.appendChild(path1);
  svg.appendChild(path2);
  emptyState.appendChild(svg);
  
  const emptyTitle = document.createElement('h3');
  emptyTitle.textContent = title;
  emptyState.appendChild(emptyTitle);
  
  const emptySubtitle = document.createElement('p');
  emptySubtitle.textContent = subtitle;
  emptyState.appendChild(emptySubtitle);
  
  container.appendChild(emptyState);
}

/**
 * Update statistics in UI
 */
function updateStatistics() {
  // Tab stats
  document.getElementById('tabTotalCount').textContent = appState.tabs.length;
  
  const uniqueCategories = new Set(appState.tabs.map(tab => tab.category));
  document.getElementById('tabCategoryCount').textContent = uniqueCategories.size;
  
  // Bookmark stats
  document.getElementById('bookmarkTotalCount').textContent = appState.bookmarks.length;
  
  // Reminder stats
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const tabsNeedingAttention = appState.tabs.filter(tab => {
    const lastReviewed = new Date(tab.lastReviewed);
    return lastReviewed < threeDaysAgo;
  });
  
  document.getElementById('reminderCount').textContent = tabsNeedingAttention.length;
}

// ====== UTILITY FUNCTIONS ======
/**
 * Generate a unique ID
 * @returns {String} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date to human-readable string
 * @param {Date} date - Date to format
 * @returns {String} Formatted date string
 */
function formatDate(date) {
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Show a toast notification
 * @param {String} message - Message to display
 * @param {String} type - Toast type: 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}

// ====== EVENT HANDLERS ======
/**
 * Set up tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and content sections
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetId = button.dataset.target;
      document.getElementById(targetId).classList.add('active');
    });
  });
}

/**
 * Set up form event handlers
 */
function setupFormHandlers() {
  // Tab form submission
  document.getElementById('tabForm').addEventListener('submit', event => {
    event.preventDefault();
    
    const tabUrl = document.getElementById('tabUrl').value.trim();
    const tabTitle = document.getElementById('tabTitle').value.trim();
    const tabCategory = document.getElementById('tabCategory').value.trim();
    
    // Validate inputs
    if (!tabUrl || !tabTitle || !tabCategory) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Add tab to state
    addTab({
      url: tabUrl,
      title: tabTitle,
      category: tabCategory
    });
    
    // Reset form
    document.getElementById('tabForm').reset();
  });
  
  // Bookmark form submission
  document.getElementById('bookmarkForm').addEventListener('submit', event => {
    event.preventDefault();
    
    const bookmarkName = document.getElementById('bookmarkName').value.trim();
    const bookmarkCount = parseInt(document.getElementById('bookmarkCount').value, 10);
    const bookmarkDescription = document.getElementById('bookmarkDescription').value.trim();
    
    // Validate inputs
    if (!bookmarkName || isNaN(bookmarkCount)) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Add bookmark to state
    addBookmark({
      name: bookmarkName,
      count: bookmarkCount,
      description: bookmarkDescription
    });
    
    // Reset form
    document.getElementById('bookmarkForm').reset();
  });
}

/**
 * Set up theme toggle
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  
  themeToggle.addEventListener('click', () => {
    const newTheme = appState.theme === 'light' ? 'dark' : 'light';
    appState.theme = newTheme;
    applyTheme(newTheme);
    saveAppState();
  });
}

/**
 * Apply theme to document
 * @param {String} theme - Theme name: 'light' or 'dark'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Set up data management (export/import/reset)
 */
function setupDataManagement() {
  // Export data
  document.getElementById('exportData').addEventListener('click', () => {
    const dataStr = JSON.stringify({
      tabs: appState.tabs,
      bookmarks: appState.bookmarks
    }, null, 2);
    
    // Create and trigger download
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-declutter-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Data exported successfully', 'success');
  });
  
  // Import data
  document.getElementById('importData').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate imported data
        if (!importedData.tabs || !Array.isArray(importedData.tabs) || 
            !importedData.bookmarks || !Array.isArray(importedData.bookmarks)) {
          throw new Error('Invalid data format');
        }
        
        appState.tabs = importedData.tabs;
        appState.bookmarks = importedData.bookmarks;
        saveAppState();
        renderAllData();
        
        showToast('Data imported successfully', 'success');
      } catch (error) {
        console.error('Import error:', error);
        showToast('Error importing data. Please check file format.', 'error');
      }
      
      // Reset file input
      event.target.value = '';
    };
    
    reader.readAsText(file);
  });
  
  // Clear all data
  document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      appState.tabs = [];
      appState.bookmarks = [];
      saveAppState();
      renderAllData();
      
      showToast('All data has been reset', 'info');
    }
  });
}