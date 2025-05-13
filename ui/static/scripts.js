// DOM Elements
const urlTableBody = document.getElementById('urlTableBody');
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
const activeInput = document.getElementById('active');
const sourceInput = document.getElementById('source');
const urlInput = document.getElementById('url');

// Track the record to be deleted
let recordToDelete = null;

// Initialize the application
function init() {
    renderUrlTable();
    setupEventListeners();
}

// Render the URL table with data
function renderUrlTable() {
    urlTableBody.innerHTML = '';
    
    if (urlData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" class="empty-state">
                <p>No URLs found</p>
                <button class="btn btn-primary" id="emptyAddBtn">Add Your First URL</button>
            </td>
        `;
        urlTableBody.appendChild(emptyRow);
        
        // Add event listener to the empty state add button
        const emptyAddBtn = document.getElementById('emptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', openAddModal);
        }
        
        return;
    }
    
    // Populate the table with URL data
    urlData.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="status-indicator ${record.active ? 'status-active' : 'status-inactive'}"></span>
                ${record.active ? 'Yes' : 'No'}
            </td>
            <td>${escapeHtml(record.source)}</td>
            <td><a href="${escapeHtml(record.url)}" target="_blank" style="color: var(--primary-color);">${escapeHtml(record.url)}</a></td>
            <td class="action-buttons">
                <button class="btn btn-primary" data-id="${record.id}">Edit</button>
                <button class="btn btn-delete" data-id="${record.url}">Delete</button>
            </td>
        `;
        urlTableBody.appendChild(row);
    });
    
    // Add event listeners to the edit and delete buttons
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', () => openEditModal(parseInt(button.dataset.id)));
    });
    
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            if (!button.classList.contains('btn-delete-conf')) {
            openDeleteConfirmation(button.dataset.id);
        }});
    });
}

// Set up event listeners
function setupEventListeners() {
    // Add record button
    addRecordBtn.addEventListener('click', openAddModal);
    
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
function openAddModal() {
    modalTitle.textContent = 'Add New URL';
    recordIdInput.value = '';
    activeInput.checked = true;
    sourceInput.value = '';
    urlInput.value = '';
    
    recordModal.style.display = 'flex';
}

// Open modal for editing a record
function openEditModal(id) {
    const record = urlData.find(item => item.id === id);
    if (!record) return;
    
    modalTitle.textContent = 'Edit URL';
    recordIdInput.value = record.id;
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
    
    // Check if it's an edit or add operation
    const recordId = recordIdInput.value;
    
    if (recordId) {
        // Edit existing record
        const id = parseInt(recordId);
        const index = urlData.findIndex(item => item.id === id);
        
        if (index !== -1) {
            urlData[index] = { ...urlData[index], ...formData };
        }
    } else {
        // Add new record
        const newId = urlData.length > 0 ? Math.max(...urlData.map(item => item.id)) + 1 : 1;
        urlData.push({ id: newId, ...formData });
    }
    
    // Update the UI
    renderUrlTable();
    closeModal();
    
    // This is where you would send the data to your backend
    console.log('Data ready to be sent to backend:', urlData);
}

// Open delete confirmation modal
function openDeleteConfirmation(id) {
    recordToDelete = id;
    console.log('openDeleteConfirmation(): Record to delete:', recordToDelete);
    confirmDeleteModal.style.display = 'flex';
}

// Close delete confirmation modal
function closeDeleteConfirmation() {
    confirmDeleteModal.style.display = 'none';
    console.log('closeDeleteConfirmation(): Record to delete:', recordToDelete);
    recordToDelete = null;
}

// Delete a record
function deleteRecord() {
    console.log('deleteRecord(): Record to delete:', recordToDelete);
    if (recordToDelete === null) return;
    
    updatedUrlData = urlData.filter(item => item.url !== recordToDelete);
    updatedUrlData = updatedUrlData.filter(item => item.url !== null);
    console.log('deleteRecord(): Updated URL data:', updatedUrlData);
    if (updatedUrlData.length === 0 || urlData.length === 0 ||(updatedUrlData.length === urlData.length) || (updatedUrlData.length > urlData.length)) {
        updatedUrlData = [];
    } else {
        if (sendJsonToFunction(updatedUrlData, "rssdata", "urls.json")) {
            urlData = updatedUrlData;
        } else{
            location.reload();
        }
    }
    renderUrlTable();
    closeDeleteConfirmation();
    
    // This is where you would send the delete request to your backend
    console.log('Delete request ready to be sent for URL:', recordToDelete);
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Function to send JSON data to the blob
async function sendJsonToFunction(data, container, blob) {
    try {
        const url = `/api/overwrite_blob?container=${encodeURIComponent(container)}&blob=${encodeURIComponent(blob)}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // alert("Blob overwritten successfully.");
            return true
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