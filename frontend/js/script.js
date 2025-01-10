let sortAscending = true;

async function search(event) {
    event.preventDefault(); // Prevenir la recarga del formulario

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
        const data = await response.json();

        // Formatear las fechas y eliminar duplicados
        const uniqueData = removeDuplicates(data.map(row => ({
            ...row,
            fecha_ingreso: formatDate(row.fecha_ingreso),
        })));

        populateTable(uniqueData);
    } catch (error) {
        console.error("Error al obtener datos:", error);
    }
}

function removeDuplicates(data) {
    const seen = new Set();
    return data.filter(item => {
        const key = `${item.comprador}|${item.item}|${item.fecha_ingreso}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
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

    document.getElementById("row-count").innerText = `Total de filas: ${data.length}`;
}

function sortTableByDate() {
    const tableBody = document.querySelector("#results tbody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const dateA = parseDate(a.cells[5].innerText);
        const dateB = parseDate(b.cells[5].innerText);
        return sortAscending ? dateA - dateB : dateB - dateA;
    });

    sortAscending = !sortAscending;

    tableBody.innerHTML = "";
    rows.forEach(row => tableBody.appendChild(row));
}
