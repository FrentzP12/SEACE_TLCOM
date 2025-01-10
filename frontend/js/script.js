let sortAscending = true;
let currentPage = 1;
let itemsPerPage = 15; // Máximo de 15 elementos por página
let allData = []; // Datos completos

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

        // Formatear las fechas
        allData = allData.map(row => ({
            ...row,
            fecha_ingreso: formatDate(row.fecha_ingreso),
        }));

        currentPage = 1; // Reiniciar a la primera página
        renderPage();
    } catch (error) {
        console.error("Error al obtener datos:", error);
    }
}

function renderPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = allData.slice(startIndex, endIndex);

    populateTable(pageData);
    updatePagination();
}

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

    document.getElementById("row-count").innerText = `Total de filas: ${allData.length}`;
}

function updatePagination() {
    const totalPages = Math.ceil(allData.length / itemsPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.className = i === currentPage ? "btn disabled" : "btn";
        button.onclick = () => {
            currentPage = i;
            renderPage();
        };
        pagination.appendChild(button);
    }
}

function sortTableByDate() {
    allData.sort((a, b) => {
        const dateA = parseDate(a.fecha_ingreso);
        const dateB = parseDate(b.fecha_ingreso);
        return sortAscending ? dateA - dateB : dateB - dateA;
    });

    sortAscending = !sortAscending;
    renderPage();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDate(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
}
