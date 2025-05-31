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

/**
 * Initializes the application by populating the table selector, rendering all URL tables, and setting up event listeners for user interactions.
 */
function init() {
  populateTableSelector();
  renderAllTables();
  setupEventListeners();
}

/**
 * Populates the table selector dropdown with options for each URL table.
 *
 * Each option represents a table's title and is assigned its corresponding index as the value.
 */
function populateTableSelector() {
  tableSelector.innerHTML = "";

  urlData.forEach((table, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = table.title;
    tableSelector.appendChild(option);
  });
}

/**
 * Renders all URL tables and their contents into the tables container.
 *
 * Creates a section for each table in {@link urlData}, including its title and a table element with headers and body. Each table's data is populated by calling {@link renderTableData} with the corresponding index.
 */
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

/**
 * Renders the rows for a specific URL table, displaying all records or an empty state if none exist.
 *
 * Updates the table body with each record's status, source, URL, and action buttons for editing or deleting. If the table has no records, shows an empty state with an option to add a new URL. Attaches event listeners to action buttons for editing and deleting records.
 *
 * @param {number} tableIndex - The index of the table to render.
 */
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

/**
 * Attaches event listeners to UI elements for handling table selection, record addition, editing, deletion, and modal interactions.
 *
 * Sets up all necessary event handlers to enable user interaction with the URL tables and modals.
 */
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

/**
 * Opens the modal dialog for adding a new URL record to the specified table.
 *
 * Sets the modal title to reflect the target table, resets form fields to their default values, and displays the modal.
 *
 * @param {number} tableIndex - Index of the table to which the new URL will be added.
 */
function openAddModal(tableIndex) {
  modalTitle.textContent = `Add New URL to ${urlData[tableIndex].title}`;
  recordIdInput.value = "";
  tableIndexInput.value = tableIndex;
  activeInput.checked = true;
  sourceInput.value = "";
  urlInput.value = "";

  recordModal.style.display = "flex";
}

/**
 * Opens the modal dialog for editing a URL record in the specified table.
 *
 * Populates the form fields with the selected record's data and displays the modal for editing.
 *
 * @param {string} id - The unique identifier of the record to edit.
 * @param {number} tableIndex - The index of the table containing the record.
 */
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

/**
 * Closes the record modal and resets the form fields.
 */
function closeModal() {
  recordModal.style.display = "none";
  recordForm.reset();
}

/**
 * Handles submission of the add/edit record form, updating or inserting a URL record in the selected table.
 *
 * Validates required fields, updates the appropriate table's data, persists changes to the backend, and refreshes the UI.
 *
 * @param {Event} e - The form submission event.
 */
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

/**
 * Opens the delete confirmation modal for a specific record in a given table.
 *
 * @param {string} id - The ID of the record to be deleted.
 * @param {number} tableIndex - The index of the table containing the record.
 */
function openDeleteConfirmation(id, tableIndex) {
  recordToDelete = id;
  tableToDeleteFrom = tableIndex;
  confirmDeleteModal.style.display = "flex";
}

/**
 * Closes the delete confirmation modal and clears the record and table targeted for deletion.
 */
function closeDeleteConfirmation() {
  confirmDeleteModal.style.display = "none";
  recordToDelete = null;
  tableToDeleteFrom = null;
}

/**
 * Deletes a URL record from the specified table and updates the backend data store.
 *
 * Removes the record identified by {@link recordToDelete} from the table at {@link tableToDeleteFrom}, persists the change to the backend, and updates the UI accordingly.
 *
 * @remark If either {@link recordToDelete} or {@link tableToDeleteFrom} is null, the function exits without making changes.
 */
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

/**
 * Escapes special HTML characters in a string to prevent XSS vulnerabilities.
 *
 * @param {string} unsafe - The input string that may contain HTML special characters.
 * @returns {string} The escaped string safe for insertion into HTML.
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends JSON data to the backend to overwrite a blob in the specified container.
 *
 * @param {Object} data - The JSON-serializable data to be sent.
 * @param {string} container - The name of the storage container.
 * @param {string} blob - The name of the blob to overwrite.
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
document.addEventListener("DOMContentLoaded", init);
