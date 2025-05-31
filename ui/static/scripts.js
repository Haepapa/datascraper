// DOM Elements
const tablesContainer = document.getElementById("tablesContainer");
const tableSelector = document.getElementById("tableSelector");
const addRecordBtn = document.getElementById("addRecordBtn");
const recordModal = document.getElementById("recordModal");
const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const closeBtn = document.querySelector(".close-btn");
const recordForm = document.getElementById("recordForm");
const modalTitle = document.getElementById("modalTitle");
const cancelBtn = document.getElementById("cancelBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

// Form elements
const recordIdInput = document.getElementById("recordId");
const tableIndexInput = document.getElementById("tableIndex");
const activeInput = document.getElementById("active");
const sourceInput = document.getElementById("source");
const urlInput = document.getElementById("url");

// Track the record to be deleted
let recordToDelete = null;
let tableToDeleteFrom = null;

// Current selected table index
let currentTableIndex = 0;

// Storage Variables
let containerName = "data";
let blobName = "urls.json";

// Initialize the application
function init() {
  populateTableSelector();
  renderAllTables();
  setupEventListeners();
}

// Populate the table selector dropdown
function populateTableSelector() {
  tableSelector.innerHTML = "";

  urlData.forEach((table, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = table.title;
    tableSelector.appendChild(option);
  });
}

// Render all tables
function renderAllTables() {
  tablesContainer.innerHTML = "";

  urlData.forEach((tableData, tableIndex) => {
    const tableSection = document.createElement("div");
    tableSection.className = "table-section";
    tableSection.id = `table-section-${tableIndex}`;

    const tableTitle = document.createElement("h2");
    tableTitle.className = "table-title";
    tableTitle.textContent = tableData.title;

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";

    const table = document.createElement("table");
    table.id = `url-table-${tableIndex}`;

    const thead = document.createElement("thead");
    thead.innerHTML = `
            <tr>
                <th>Active</th>
                <th>Source</th>
                <th>URL</th>
                <th>Actions</th>
            </tr>
        `;

    const tbody = document.createElement("tbody");
    tbody.id = `url-table-body-${tableIndex}`;

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    tableSection.appendChild(tableTitle);
    tableSection.appendChild(tableContainer);
    tablesContainer.appendChild(tableSection);

    renderTableData(tableIndex);
  });
}

// Render data for a specific table
function renderTableData(tableIndex) {
  const tableData = urlData[tableIndex];
  const tbody = document.getElementById(`url-table-body-${tableIndex}`);

  if (!tbody) return;

  tbody.innerHTML = "";

  if (tableData.data.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
            <td colspan="4" class="empty-state">
                <p>No URLs found</p>
                <button class="btn btn-primary empty-add-btn" data-table-index="${tableIndex}">Add Your First URL</button>
            </td>
        `;
    tbody.appendChild(emptyRow);

    // Add event listener to the empty state add button
    const emptyAddBtn = tbody.querySelector(".empty-add-btn");
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener("click", () => openAddModal(tableIndex));
    }

    return;
  }

  tableData.data.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>
                <span class="status-indicator ${
                  record.active ? "status-active" : "status-inactive"
                }"></span>
                ${record.active ? "Yes" : "No"}
            </td>
            <td>${escapeHtml(record.source)}</td>
            <td><a href="${escapeHtml(
              record.url
            )}" target="_blank" style="color: var(--primary-color);">${escapeHtml(
      record.url
    )}</a></td>
            <td class="action-buttons">
                <button class="btn btn-edit" data-id="${
                  record.id
                }" data-table-index="${tableIndex}">Edit</button>
                <button class="btn btn-delete" data-id="${
                  record.id
                }" data-table-index="${tableIndex}">Delete</button>
            </td>
        `;
    tbody.appendChild(row);
  });

  // Add event listeners to the edit and delete buttons
  tbody.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.dataset.id);
      const tableIndex = parseInt(button.dataset.tableIndex);
      openEditModal(id, tableIndex);
    });
  });

  tbody.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.dataset.id);
      const tableIndex = parseInt(button.dataset.tableIndex);
      openDeleteConfirmation(id, tableIndex);
    });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Table selector change
  tableSelector.addEventListener("change", (e) => {
    currentTableIndex = parseInt(e.target.value);
  });

  // Add record button
  addRecordBtn.addEventListener("click", () => openAddModal(currentTableIndex));

  // Close modal button
  closeBtn.addEventListener("click", closeModal);

  // Cancel button in form
  cancelBtn.addEventListener("click", closeModal);

  // Form submission
  recordForm.addEventListener("submit", handleFormSubmit);

  // Delete confirmation
  confirmDeleteBtn.addEventListener("click", deleteRecord);
  cancelDeleteBtn.addEventListener("click", closeDeleteConfirmation);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
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
  recordIdInput.value = "";
  tableIndexInput.value = tableIndex;
  activeInput.checked = true;
  sourceInput.value = "";
  urlInput.value = "";

  recordModal.style.display = "flex";
}

// Open modal for editing a record
function openEditModal(id, tableIndex) {
  const record = urlData[tableIndex].data.find((item) => item.id === id);
  if (!record) return;

  modalTitle.textContent = `Edit URL in ${urlData[tableIndex].title}`;
  recordIdInput.value = record.id;
  tableIndexInput.value = tableIndex;
  activeInput.checked = record.active;
  sourceInput.value = record.source;
  urlInput.value = record.url;

  recordModal.style.display = "flex";
}

// Close the modal
function closeModal() {
  recordModal.style.display = "none";
  recordForm.reset();
}

// Handle form submission (add or edit)
function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    active: activeInput.checked,
    source: sourceInput.value.trim(),
    url: urlInput.value.trim(),
  };

  // Validate form data
  if (!formData.source || !formData.url) {
    alert("Please fill in all fields");
    return;
  }

  const tableIndex = parseInt(tableIndexInput.value);
  const recordId = recordIdInput.value;
  let updatedUrlData = urlData;

  if (recordId) {
    // Edit existing record
    const id = parseInt(recordId);
    const index = updatedUrlData[tableIndex].data.findIndex(
      (item) => item.id === id
    );

    if (index !== -1) {
      updatedUrlData[tableIndex].data[index] = {
        ...updatedUrlData[tableIndex].data[index],
        ...formData,
      };
    }
  } else {
    // Add new record
    const newId =
      updatedUrlData[tableIndex].data.length > 0
        ? Math.max(...updatedUrlData[tableIndex].data.map((item) => item.id)) +
          1
        : 1;
    updatedUrlData[tableIndex].data.push({ id: newId, ...formData });
  }

  // Send updated data to the backend
  if (sendJsonToFunction(updatedUrlData, containerName, blobName)) {
    urlData = updatedUrlData;
  }
  // Update the UI
  renderTableData(tableIndex);
  closeModal();
}

// Open delete confirmation modal
function openDeleteConfirmation(id, tableIndex) {
  recordToDelete = id;
  tableToDeleteFrom = tableIndex;
  confirmDeleteModal.style.display = "flex";
}

// Close delete confirmation modal
function closeDeleteConfirmation() {
  confirmDeleteModal.style.display = "none";
  recordToDelete = null;
  tableToDeleteFrom = null;
}

// Delete a record
function deleteRecord() {
  if (recordToDelete === null || tableToDeleteFrom === null) return;

  let updatedUrlData = urlData;
  updatedUrlData[tableToDeleteFrom].data = urlData[
    tableToDeleteFrom
  ].data.filter((item) => item.id !== recordToDelete);

  console.log("URL data after deletion:", urlData);
  if (sendJsonToFunction(updatedUrlData, containerName, blobName)) {
    urlData = updatedUrlData;
  }

  renderTableData(tableToDeleteFrom);
  closeDeleteConfirmation();

  // This is where you would send the delete request to your backend
  console.log(
    "Delete request ready to be sent for ID:",
    recordToDelete,
    "from table:",
    tableToDeleteFrom
  );
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

// Function to send JSON data to the blob
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
document.addEventListener("DOMContentLoaded", init);
