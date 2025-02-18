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
    const nomenclatura = document.getElementById("nomenclatura").value;
    const departamento = document.getElementById("departamento").value;
    const comprador = document.getElementById("comprador").value;
    const fecha_inicio = document.getElementById("fecha_inicio").value;
    const fecha_fin = document.getElementById("fecha_fin").value;

    const params = new URLSearchParams({
        p_descripcion: descripcion || "",
        p_nomenclatura: nomenclatura || "",
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
// Pagination
function initializePagination(data) {
    totalRows = data.length;
    totalPages = Math.ceil(totalRows / itemsPerPage);
    renderPage();
    renderPagination();
}

function renderPage() {
    const tbody = document.querySelector('#results tbody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = allData.slice(start, end);

    pageData.forEach(item => {
        const row = document.createElement('tr');
        // Crear enlaces para documentos separados por coma
        const documentosHTML = item.documentos
        ? item.documentos.split(', ').map(url => `<a href="${url}" target="_blank">Descargar</a>`).join(' | ')
        : 'N/A';
        row.innerHTML = `
            <td>${item.comprador}</td>
            <td>${item.nomenclatura}</td>
            <td>${item.item}</td>
            <td>${item.cantidad}</td>
            <td>${item.departamento}</td>
            <td>${item.fecha_ingreso}</td>
            <td>${documentosHTML}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('row-count').innerText = `Total de filas: ${totalRows}`;
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const maxVisibleButtons = 7;
    let startPage = Math.max(currentPage - Math.floor(maxVisibleButtons / 2), 1);
    let endPage = startPage + maxVisibleButtons - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
    }

    if (currentPage > 1) {
        pagination.appendChild(createPaginationButton('«', currentPage - 1));
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.appendChild(createPaginationButton(i, i));
    }

    if (currentPage < totalPages) {
        pagination.appendChild(createPaginationButton('»', currentPage + 1));
    }
}
function clearFields() {
    // Seleccionar todos los inputs dentro del formulario
    const inputs = document.querySelectorAll('#search-form input[type="text"], #search-form input[type="date"]');
    
    // Limpiar cada input
    inputs.forEach(input => input.value = '');
}
function createPaginationButton(label, page) {
    const button = document.createElement('button');
    button.innerText = label;

    if (page === currentPage) {
        button.classList.add('active');
    } else {
        button.addEventListener('click', () => {
            currentPage = page;
            renderPage();
            renderPagination();
        });
    }

    return button;
}
