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
// Configurar la paginación
function initializePagination(data) {
    totalRows = data.length;
    totalPages = Math.ceil(totalRows / itemsPerPage);
    renderPage();
    renderPagination();
}

function renderPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = allData.slice(start, end);
    populateTable(pageData);
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    const createPageButton = (page, text) => {
        const button = document.createElement('button');
        button.innerText = text || page;
        if (currentPage === page) {
            button.classList.add('current');
            button.disabled = true;
        }
        button.onclick = () => {
            currentPage = page;
            renderPage();
            renderPagination();
        };
        return button;
    };

    // Botones de primera y anterior
    if (currentPage > 1) {
        paginationContainer.appendChild(createPageButton(1, '<<'));
        paginationContainer.appendChild(createPageButton(currentPage - 1, '<'));
    }

    // Páginas visibles
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    } else if (currentPage > totalPages - 3) {
        startPage = Math.max(totalPages - 4, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createPageButton(i));
    }

    // Botones de siguiente y última
    if (currentPage < totalPages) {
        paginationContainer.appendChild(createPageButton(currentPage + 1, '>'));
        paginationContainer.appendChild(createPageButton(totalPages, '>>'));
    }
}

function populateTable(data) {
    const tbody = document.querySelector('#results tbody');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.comprador}</td>
            <td>${row.nomenclatura}</td>
            <td>${row.item}</td>
            <td>${row.cantidad}</td>
            <td>${row.departamento}</td>
            <td>${row.fecha_ingreso}</td>
        `;
        tbody.appendChild(tr);
    });

    // Actualiza el conteo de filas
    document.getElementById('row-count').innerText = `Total de filas: ${totalRows}`;
}
