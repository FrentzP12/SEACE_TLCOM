let sortAscending = true;
let currentPage = 1;
let totalRows = 0;
let totalPages = 0;
let itemsPerPage = 15; // Número de elementos por página
let allData = []; // Datos cargados

// Función principal de búsqueda
async function search(event) {
    event.preventDefault();

    const descripcion = document.getElementById("descripcion").value;
    const departamento = document.getElementById("departamento").value;
    const comprador = document.getElementById("comprador").value;
    const fecha_inicio = document.getElementById("fecha_inicio").value;
    const fecha_fin = document.getElementById("fecha_fin").value;

    const params = new URLSearchParams({
        p_descripcion: descripcion || "",
        p_departamento: departamento || "",
        p_comprador: comprador || "",
        p_fecha_inicio: fecha_inicio || "",
        p_fecha_fin: fecha_fin || ""
    });

    try {
        const response = await fetch(`/buscar_items?${params.toString()}`);
        allData = await response.json();

        // Formatear las fechas en los datos obtenidos
        allData = allData.map(row => ({
            ...row,
            fecha_ingreso: formatDate(row.fecha_ingreso),
        }));

        currentPage = 1; // Reiniciar a la primera página
        initializePagination(allData);
    } catch (error) {
        console.error("Error al obtener datos:", error);
    }
}

// Función para inicializar la paginación
function initializePagination(dataArray) {
    allData = dataArray;
    totalRows = allData.length;
    totalPages = Math.ceil(totalRows / itemsPerPage);

    currentPage = 1; // Reiniciar la página actual
    renderPage(); // Mostrar la primera página
    createPageButtons(); // Crear los botones de paginación
    updatePaginationInfo(); // Actualizar la información del rango de resultados
}
function updatePaginationInfo() {
    const startRow = (currentPage - 1) * itemsPerPage + 1;
    const endRow = Math.min(currentPage * itemsPerPage, totalRows);
    const infoContainer = document.getElementById("pagination-info");
    infoContainer.textContent = 
        `Mostrando de ${startRow} a ${endRow} del total ${totalRows} - Página: ${currentPage}/${totalPages}`;
}
// Renderizar los datos en la tabla
function renderPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = allData.slice(startIndex, endIndex);

    populateTable(pageData);
    updatePaginationInfo();
    createPageButtons();
}

// Llenar la tabla con los datos paginados
function populateTable(data) {
    const tableBody = document.querySelector("#results tbody");
    tableBody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.comprador}</td>
            <td>${row.nomenclatura}</td>
            <td>${row.item}</td>
            <td>${row.cantidad}</td>
            <td>${row.departamento}</td>
            <td>${row.fecha_ingreso}</td>
        `;
        tableBody.appendChild(tr);
    });

    document.getElementById("row-count").innerText = `Total de filas: ${totalRows}`;
}

// Actualizar la información de la paginación
function updatePaginationInfo() {
    const startRow = (currentPage - 1) * itemsPerPage + 1;
    const endRow = Math.min(currentPage * itemsPerPage, totalRows);
    document.getElementById("pagination-info").innerText = 
        `Mostrando de ${startRow} a ${endRow} del total ${totalRows} - Página: ${currentPage}/${totalPages}`;
}

// Crear los botones de paginación dinámicamente
function createPageButtons() {
    const pageButtonsContainer = document.getElementById("pagination");
    pageButtonsContainer.innerHTML = "";

    const maxVisibleButtons = 5; // Número máximo de botones visibles
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // Agregar botón para ir a la primera página
    if (currentPage > 1) {
        addPaginationButton(pageButtonsContainer, "«", 1);
        addPaginationButton(pageButtonsContainer, "‹", currentPage - 1);
    }

    // Agregar botones numéricos
    for (let i = startPage; i <= endPage; i++) {
        addPaginationButton(pageButtonsContainer, i, i, i === currentPage);
    }

    // Agregar botón para ir a la última página
    if (currentPage < totalPages) {
        addPaginationButton(pageButtonsContainer, "›", currentPage + 1);
        addPaginationButton(pageButtonsContainer, "»", totalPages);
    }
}

// Función para añadir un botón de paginación
function addPaginationButton(container, text, page, isActive = false) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = isActive ? "pagination-btn active" : "pagination-btn";
    button.disabled = isActive;
    button.onclick = () => goToPage(page);
    container.appendChild(button);
}

// Ir a una página específica
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage();
}

// Ordenar los datos por fecha
function sortTableByDate() {
    allData.sort((a, b) => {
        const dateA = parseDate(a.fecha_ingreso);
        const dateB = parseDate(b.fecha_ingreso);
        return sortAscending ? dateA - dateB : dateB - dateA;
    });

    sortAscending = !sortAscending;
    renderPage();
}

// Formatear la fecha a DD/MM/YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Convertir la fecha de DD/MM/YYYY a un objeto Date
function parseDate(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
}
