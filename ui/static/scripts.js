// Password protection variables
let isAuthenticated = false;
let authenticationTimer = null;
let currentChallenge = 0;

// DOM Elements
const passwordModal = document.getElementById('passwordModal');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('passwordInput');
const challengeNumber = document.getElementById('challengeNumber');
const passwordError = document.getElementById('passwordError');
const mainContent = document.getElementById('mainContent');

const tablesContainer = document.getElementById('tablesContainer');
const tableSelector = document.getElementById('tableSelector');
const addRecordBtn = document.getElementById('addRecordBtn');
const recordModal = document.getElementById('recordModal');
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const closeBtn = document.querySelector('.close-btn');
const recordForm = document.getElementById('recordForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Form elements
const recordIdInput = document.getElementById('recordId');
const tableIndexInput = document.getElementById('tableIndex');
const activeInput = document.getElementById('active');
const sourceInput = document.getElementById('source');
const urlInput = document.getElementById('url');

// Track the record to be deleted
let recordToDelete = null;
let tableToDeleteFrom = null;

// Current selected table index
let currentTableIndex = 0;

// Initialize the application
function init() {
    showPasswordChallenge();
    setupPasswordEventListeners();
    
    // Only initialize main app if already authenticated
    if (isAuthenticated) {
        initializeMainApp();
    }
}

// Generate and show password challenge
function showPasswordChallenge() {
    currentChallenge = Math.floor(Math.random() * 100) + 1; // Random number 1-100
    challengeNumber.textContent = currentChallenge;
    passwordModal.style.display = 'flex';
    mainContent.style.display = 'none';
    passwordInput.focus();
    passwordError.style.display = 'none';
    passwordInput.value = '';
}

// Setup password form event listeners
function setupPasswordEventListeners() {
    passwordForm.addEventListener('submit', handlePasswordSubmit);
}

// Handle password form submission
function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const userAnswer = parseInt(passwordInput.value);
    const correctAnswer = currentChallenge + 3;
    
    if (userAnswer === correctAnswer) {
        // Correct answer
        isAuthenticated = true;
        passwordModal.style.display = 'none';
        mainContent.style.display = 'block';
        
        // Initialize main app
        initializeMainApp();
        
        // Set 5-minute timer to reset authentication
        startAuthenticationTimer();
        
        passwordError.style.display = 'none';
    } else {
        // Incorrect answer
        passwordError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        // Generate new challenge after wrong answer
        setTimeout(() => {
            showPasswordChallenge();
        }, 2000);
    }
}

// Start 5-minute authentication timer
function startAuthenticationTimer() {
    // Clear existing timer if any
    if (authenticationTimer) {
        clearTimeout(authenticationTimer);
    }
    
    // Set new timer for 5 minutes (300,000 milliseconds)
    authenticationTimer = setTimeout(() => {
        resetAuthentication();
    }, 300000);
}

// Reset authentication and show password challenge again
function resetAuthentication() {
    isAuthenticated = false;
    if (authenticationTimer) {
        clearTimeout(authenticationTimer);
        authenticationTimer = null;
    }
    
    // Close any open modals
    recordModal.style.display = 'none';
    confirmDeleteModal.style.display = 'none';
    
    // Show password challenge
    showPasswordChallenge();
}

// Initialize the main application
function initializeMainApp() {
    populateTableSelector();
    renderAllTables();
    setupEventListeners();
}

// Populate the table selector dropdown
function populateTableSelector() {
    tableSelector.innerHTML = '';
    
    urlData.forEach((table, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = table.title;
        tableSelector.appendChild(option);
    });
}

// Render all tables
function renderAllTables() {
    tablesContainer.innerHTML = '';
    
    urlData.forEach((tableData, tableIndex) => {
        const tableSection = document.createElement('div');
        tableSection.className = 'table-section';
        tableSection.id = `table-section-${tableIndex}`;
        
        // Table title with controls
        const tableHeader = document.createElement('div');
        tableHeader.innerHTML = `
            <h2 class="table-title">
                ${tableData.title}
                <div class="section-controls">
                    <button class="btn minimize-btn btn-small" id="dashboard-toggle-${tableIndex}">
                        ${tableData.dashboardVisible ? 'Hide Stats' : 'Show Stats'}
                    </button>
                    <button class="btn minimize-btn btn-small" id="table-toggle-${tableIndex}">
                        ${tableData.tableVisible ? 'Hide Table' : 'Show Table'}
                    </button>
                </div>
            </h2>
        `;
        
        // Dashboard container
        const dashboardContainer = document.createElement('div');
        dashboardContainer.className = `dashboard-container ${tableData.dashboardVisible ? '' : 'hidden'}`;
        dashboardContainer.id = `dashboard-${tableIndex}`;
        
        // Search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <span class="search-icon">🔍</span>
            <input type="search" class="search-input" id="search-input-${tableIndex}" 
                placeholder="Search (min 3 characters)..." value="${tableData.searchTerm || ''}">
        `;
        
        // Table container
        const tableContainer = document.createElement('div');
        tableContainer.className = `table-container ${tableData.tableVisible ? '' : 'hidden'}`;
        tableContainer.id = `table-container-${tableIndex}`;
        
        const table = document.createElement('table');
        table.id = `url-table-${tableIndex}`;
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th data-column="active" data-table-index="${tableIndex}">
                    Active
                    <span class="sort-icon ${getSortIconClass(tableData, 'active')}"></span>
                </th>
                <th data-column="source" data-table-index="${tableIndex}">
                    Source
                    <span class="sort-icon ${getSortIconClass(tableData, 'source')}"></span>
                </th>
                <th data-column="url" data-table-index="${tableIndex}">
                    URL
                    <span class="sort-icon ${getSortIconClass(tableData, 'url')}"></span>
                </th>
                <th data-column="errors" data-table-index="${tableIndex}">
                    Errors
                    <span class="sort-icon ${getSortIconClass(tableData, 'errors')}"></span>
                </th>
                <th>Actions</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        tbody.id = `url-table-body-${tableIndex}`;
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Assemble the section
        tableSection.appendChild(tableHeader);
        tableSection.appendChild(dashboardContainer);
        tableSection.appendChild(searchContainer);
        tableSection.appendChild(tableContainer);
        tablesContainer.appendChild(tableSection);
        
        // Render dashboard and table data
        renderDashboard(tableIndex);
        renderTableData(tableIndex);
        
        // Add event listeners for minimize/maximize buttons
        document.getElementById(`dashboard-toggle-${tableIndex}`).addEventListener('click', () => {
            toggleDashboard(tableIndex);
        });
        
        document.getElementById(`table-toggle-${tableIndex}`).addEventListener('click', () => {
            toggleTable(tableIndex);
        });
        
        // Add event listeners for sorting
        const headers = table.querySelectorAll('th[data-column]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                const tableIndex = parseInt(header.dataset.tableIndex);
                handleSort(column, tableIndex);
            });
        });
        
        // Add event listener for search
        const searchInput = document.getElementById(`search-input-${tableIndex}`);
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            handleSearch(searchTerm, tableIndex);
        });
    });
}

// Toggle dashboard visibility
function toggleDashboard(tableIndex) {
    const tableData = urlData[tableIndex];
    const dashboard = document.getElementById(`dashboard-${tableIndex}`);
    const toggleBtn = document.getElementById(`dashboard-toggle-${tableIndex}`);
    
    tableData.dashboardVisible = !tableData.dashboardVisible;
    
    if (tableData.dashboardVisible) {
        dashboard.classList.remove('hidden');
        toggleBtn.textContent = 'Hide Stats';
    } else {
        dashboard.classList.add('hidden');
        toggleBtn.textContent = 'Show Stats';
    }
}

// Toggle table visibility
function toggleTable(tableIndex) {
    const tableData = urlData[tableIndex];
    const tableContainer = document.getElementById(`table-container-${tableIndex}`);
    const toggleBtn = document.getElementById(`table-toggle-${tableIndex}`);
    
    tableData.tableVisible = !tableData.tableVisible;
    
    if (tableData.tableVisible) {
        tableContainer.classList.remove('hidden');
        toggleBtn.textContent = 'Hide Table';
    } else {
        tableContainer.classList.add('hidden');
        toggleBtn.textContent = 'Show Table';
    }
}

// Render dashboard with stats
function renderDashboard(tableIndex) {
    const dashboard = document.getElementById(`dashboard-${tableIndex}`);
    const processedData = getProcessedData(tableIndex);
    
    // Calculate stats
    const totalCount = processedData.length;
    const activeCount = processedData.filter(item => item.active).length;
    const inactiveCount = totalCount - activeCount;
    
    // Count by source
    const sourceCounts = {};
    processedData.forEach(item => {
        sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    });
    
    // Sort sources by count (descending) and show all sources
    const sortedSources = Object.entries(sourceCounts)
        .sort(([,a], [,b]) => b - a);
    
    const maxCount = Math.max(...Object.values(sourceCounts), 1);
    
    // Calculate pie chart percentage
    const activePercentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
    
    dashboard.innerHTML = `
        <div class="dashboard-header">
            <h3 class="dashboard-title">Statistics</h3>
        </div>
        <div class="dashboard-content">
            <div class="stat-card">
                <span class="stat-number">${totalCount}</span>
                <div class="stat-label">Total URLs</div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Active Status</div>
                <div class="pie-chart" style="background: conic-gradient(var(--primary-color) 0deg ${activePercentage * 3.6}deg, var(--secondary-text) ${activePercentage * 3.6}deg 360deg);"></div>
                <div style="text-align: center; margin-top: 8px; font-size: 11px;">
                    <div style="color: var(--primary-color);">Active: ${activeCount}</div>
                    <div style="color: var(--secondary-text);">Inactive: ${inactiveCount}</div>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Sources Distribution</div>
                <div class="bar-chart">
                    ${sortedSources.map(([source, count]) => `
                        <div class="bar-item">
                            <div class="bar-visual" style="height: ${Math.max((count / maxCount) * 80, 20)}px;">
                                <div class="bar-fill" style="height: ${Math.max((count / maxCount) * 80, 20)}px;"></div>
                            </div>
                            <div class="bar-count">${count}</div>
                            <div class="bar-label">${source}</div>
                        </div>
                    `).join('')}
                    ${sortedSources.length === 0 ? '<div style="text-align: center; color: var(--secondary-text); font-size: 12px; padding: 20px;">No data</div>' : ''}
                </div>
            </div>
        </div>
    `;
}

// Get the appropriate sort icon class based on current sort state
function getSortIconClass(tableData, column) {
    if (tableData.sortColumn !== column) {
        return 'sort-none';
    }
    return tableData.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
}

// Handle sorting when a column header is clicked
function handleSort(column, tableIndex) {
    const tableData = urlData[tableIndex];
    
    // Toggle sort direction or set to ascending if it's a new column
    if (tableData.sortColumn === column) {
        tableData.sortDirection = tableData.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        tableData.sortColumn = column;
        tableData.sortDirection = 'asc';
    }
    
    renderTableData(tableIndex);
    renderDashboard(tableIndex); // Update dashboard with sorted data
    
    // Update sort icons
    const table = document.getElementById(`url-table-${tableIndex}`);
    const headers = table.querySelectorAll('th[data-column]');
    
    headers.forEach(header => {
        const headerColumn = header.dataset.column;
        const sortIcon = header.querySelector('.sort-icon');
        
        if (headerColumn === tableData.sortColumn) {
            sortIcon.className = `sort-icon ${tableData.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'}`;
        } else {
            sortIcon.className = 'sort-icon sort-none';
        }
    });
}

// Handle search input
function handleSearch(searchTerm, tableIndex) {
    urlData[tableIndex].searchTerm = searchTerm;
    renderTableData(tableIndex);
    renderDashboard(tableIndex); // Update dashboard with filtered data
}

// Get filtered and sorted data for a table
function getProcessedData(tableIndex) {
    const tableData = urlData[tableIndex];
    let processedData = [...tableData.data];
    
    // Apply search filter if search term is 3 or more characters
    if (tableData.searchTerm && tableData.searchTerm.length >= 3) {
        const searchTerm = tableData.searchTerm.toLowerCase();
        processedData = processedData.filter(record => {
            return (
                (typeof record.active === 'boolean' && 
                    (record.active ? 'yes' : 'no').includes(searchTerm)) ||
                record.source.toLowerCase().includes(searchTerm) ||
                record.url.toLowerCase().includes(searchTerm) ||
                record.errors.toString().includes(searchTerm)
            );
        });
    }
    
    // Apply sorting if a sort column is specified
    if (tableData.sortColumn) {
        processedData.sort((a, b) => {
            let valueA, valueB;
            
            if (tableData.sortColumn === 'active') {
                valueA = a.active;
                valueB = b.active;
            } else if (tableData.sortColumn === 'errors') {
                valueA = a.errors;
                valueB = b.errors;
            } else {
                valueA = a[tableData.sortColumn].toLowerCase();
                valueB = b[tableData.sortColumn].toLowerCase();
            }
            
            if (valueA === valueB) return 0;
            
            let comparison = 0;
            if (typeof valueA === 'boolean') {
                comparison = valueA === valueB ? 0 : valueA ? -1 : 1;
            } else {
                comparison = valueA < valueB ? -1 : 1;
            }
            
            return tableData.sortDirection === 'asc' ? comparison : -comparison;
        });
    }
    
    return processedData;
}

// Render data for a specific table
function renderTableData(tableIndex) {
    const tableData = urlData[tableIndex];
    const tbody = document.getElementById(`url-table-body-${tableIndex}`);
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const processedData = getProcessedData(tableIndex);
    
    if (processedData.length === 0) {
        const emptyRow = document.createElement('tr');
        
        // Check if empty due to filtering or no data
        if (tableData.searchTerm && tableData.searchTerm.length >= 3 && tableData.data.length > 0) {
            emptyRow.innerHTML = `
                <td colspan="5" class="empty-state">
                    <p>No results found for "${tableData.searchTerm}"</p>
                </td>
            `;
        } else {
            emptyRow.innerHTML = `
                <td colspan="5" class="empty-state">
                    <p>No URLs found</p>
                    <button class="btn btn-primary empty-add-btn" data-table-index="${tableIndex}">Add Your First URL</button>
                </td>
            `;
            
            // Add event listener to the empty state add button after rendering
            setTimeout(() => {
                const emptyAddBtn = tbody.querySelector('.empty-add-btn');
                if (emptyAddBtn) {
                    emptyAddBtn.addEventListener('click', () => openAddModal(tableIndex));
                }
            }, 0);
        }
        
        tbody.appendChild(emptyRow);
        return;
    }
    
    processedData.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="status-indicator ${record.active ? 'status-active' : 'status-inactive'}"></span>
                ${record.active ? 'Yes' : 'No'}
            </td>
            <td>${escapeHtml(record.source)}</td>
            <td><a href="${escapeHtml(record.url)}" target="_blank" style="color: var(--primary-color);">${escapeHtml(record.url)}</a></td>
            <td style="text-align: center; color: ${record.errors > 0 ? 'var(--delete-color)' : 'var(--secondary-text)'};">${record.errors}</td>
            <td class="action-buttons">
                <button class="btn btn-edit" data-id="${record.id}" data-table-index="${tableIndex}">Edit</button>
                <button class="btn btn-delete" data-id="${record.id}" data-table-index="${tableIndex}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners to the edit and delete buttons
    tbody.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            const tableIndex = parseInt(button.dataset.tableIndex);
            openEditModal(id, tableIndex);
        });
    });
    
    tbody.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            const tableIndex = parseInt(button.dataset.tableIndex);
            openDeleteConfirmation(id, tableIndex);
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Table selector change
    tableSelector.addEventListener('change', (e) => {
        currentTableIndex = parseInt(e.target.value);
    });
    
    // Add record button
    addRecordBtn.addEventListener('click', () => openAddModal(currentTableIndex));
    
    // Close modal button
    closeBtn.addEventListener('click', closeModal);
    
    // Cancel button in form
    cancelBtn.addEventListener('click', closeModal);
    
    // Form submission
    recordForm.addEventListener('submit', handleFormSubmit);
    
    // Delete confirmation
    confirmDeleteBtn.addEventListener('click', deleteRecord);
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === recordModal) {
            closeModal();
        }
        if (e.target === confirmDeleteModal) {
            closeDeleteConfirmation();
        }
    });
}

// Open modal for adding a new record
function openAddModal(tableIndex) {
    modalTitle.textContent = `Add New URL to ${urlData[tableIndex].title}`;
    recordIdInput.value = '';
    tableIndexInput.value = tableIndex;
    activeInput.checked = true;
    sourceInput.value = '';
    urlInput.value = '';
    
    recordModal.style.display = 'flex';
}

// Open modal for editing a record
function openEditModal(id, tableIndex) {
    const record = urlData[tableIndex].data.find(item => item.id === id);
    if (!record) return;
    
    modalTitle.textContent = `Edit URL in ${urlData[tableIndex].title}`;
    recordIdInput.value = record.id;
    tableIndexInput.value = tableIndex;
    activeInput.checked = record.active;
    sourceInput.value = record.source;
    urlInput.value = record.url;
    
    recordModal.style.display = 'flex';
}

// Close the modal
function closeModal() {
    recordModal.style.display = 'none';
    recordForm.reset();
}

// Handle form submission (add or edit)
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        active: activeInput.checked,
        source: sourceInput.value.trim(),
        url: urlInput.value.trim()
    };
    
    // Validate form data
    if (!formData.source || !formData.url) {
        alert('Please fill in all fields');
        return;
    }
    
    const tableIndex = parseInt(tableIndexInput.value);
    const recordId = recordIdInput.value;
    
    if (recordId) {
        // Edit existing record
        const id = parseInt(recordId);
        const index = urlData[tableIndex].data.findIndex(item => item.id === id);
        
        if (index !== -1) {
            urlData[tableIndex].data[index] = { ...urlData[tableIndex].data[index], ...formData };
        }
    } else {
        // Add new record
        const newId = urlData[tableIndex].data.length > 0 
            ? Math.max(...urlData[tableIndex].data.map(item => item.id)) + 1 
            : 1;
        urlData[tableIndex].data.push({ id: newId, ...formData });
    }
    
    // Update the UI
    renderTableData(tableIndex);
    renderDashboard(tableIndex); // Update dashboard after data change
    closeModal();
    
    // This is where you would send the data to your backend
    console.log('Data ready to be sent to backend:', urlData);
}

// Open delete confirmation modal
function openDeleteConfirmation(id, tableIndex) {
    recordToDelete = id;
    tableToDeleteFrom = tableIndex;
    confirmDeleteModal.style.display = 'flex';
}

// Close delete confirmation modal
function closeDeleteConfirmation() {
    confirmDeleteModal.style.display = 'none';
    recordToDelete = null;
    tableToDeleteFrom = null;
}

// Delete a record
function deleteRecord() {
    if (recordToDelete === null || tableToDeleteFrom === null) return;
    
    urlData[tableToDeleteFrom].data = urlData[tableToDeleteFrom].data.filter(
        item => item.id !== recordToDelete
    );
    
    renderTableData(tableToDeleteFrom);
    renderDashboard(tableToDeleteFrom); // Update dashboard after deletion
    closeDeleteConfirmation();
    
    // This is where you would send the delete request to your backend
    console.log('Delete request ready to be sent for ID:', recordToDelete, 'from table:', tableToDeleteFrom);
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Overwrites a blob in the specified storage container with the provided JSON data via a backend API call.
 *
 * @param {Object} data - The JSON-serializable data to store.
 * @param {string} container - The storage container name.
 * @param {string} blob - The blob name to overwrite.
 * @returns {Promise<boolean>} Resolves to true if the operation succeeds, or false if it fails.
 */
async function sendJsonToFunction(data, container, blob) {
  try {
    const url = `/api/overwrite_blob?container=${encodeURIComponent(
      container
    )}&blob=${encodeURIComponent(blob)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // alert("Blob overwritten successfully.");
      return true;
    } else {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      alert(`Failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred.");
    return false;
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle page visibility change to reset authentication when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isAuthenticated) {
        // Reset timer when user returns to tab
        startAuthenticationTimer();
    }
});