// INICIO DEL SCRIPT
// ==========================
// VARIABLES GLOBALES
// ==========================

let grid, estadoCarga, mensajeError, btnVerMas, inputBusqueda, modalDetalles, btnCerrarModal;
let btnBuscar, selectPlataforma, selectOrdenar;

// NUEVOS ELEMENTOS DE SPINNER
let spinnerBuscar, textoBuscar;
let spinnerVerMas, textoVerMas;

let paginaActual = 0;
const juegosPorPagina = 27;
let juegosEnCache = [];
let juegosActuales = [];
let busquedaActiva = false;


// ==========================
// SPINNERS
// ==========================

// Activa/desactiva spinner del BOTÓN BUSCAR
function activarSpinnerBuscar(modo) {
    if (!btnBuscar) return;
    if (modo) {
        btnBuscar.disabled = true;
        spinnerBuscar.classList.remove("hidden");
        textoBuscar.textContent = "Buscando...";
    } else {
        btnBuscar.disabled = false;
        spinnerBuscar.classList.add("hidden");
        textoBuscar.textContent = "Buscar";
    }
}

// Activa/desactiva spinner del BOTÓN VER MÁS
function activarSpinnerVerMas(modo) {
    if (!btnVerMas) return;
    if (modo) {
        btnVerMas.disabled = true;
        spinnerVerMas.classList.remove("hidden");
        textoVerMas.textContent = "Cargando...";
    } else {
        btnVerMas.disabled = false;
        spinnerVerMas.classList.add("hidden");
        textoVerMas.textContent = "Ver más";
    }
}



// ==========================
// MODAL
// ==========================

function abrirModal(juego) {
    const titulo = juego.title || juego.external || "Juego";
    const thumb = juego.thumb || juego.thumbnail || "";
    const normal = typeof juego.normalPrice !== 'undefined' ? juego.normalPrice : "-";
    const oferta = typeof juego.salePrice !== 'undefined' ? juego.salePrice : (juego.cheapest ?? "-");
    const ahorro = juego.savings ? Math.round(Number(juego.savings)) : "-";

    document.querySelector('#modal-titulo').textContent = titulo;

    const imagen = document.querySelector('#modal-imagen');
    imagen.src = thumb || "";
    imagen.alt = titulo;

    document.querySelector('#modal-precio-normal').textContent =
        normal !== "-" ? `$${normal}` : "No disponible";

    document.querySelector('#modal-precio-oferta').textContent =
        oferta !== "-" ? `$${oferta}` : "No disponible";

    document.querySelector('#modal-ahorro').textContent =
        ahorro !== "-" ? `${ahorro}%` : "No disponible";

    let enlaceURL = "#";

    if (juego.gameID) {
        enlaceURL = `https://www.cheapshark.com/api/redirect/steam?appID=${juego.gameID}`;
    } else if (juego.dealID) {
        enlaceURL = `https://www.cheapshark.com/redirect?dealID=${juego.dealID}`;
    }

    document.querySelector('#modal-enlace-tienda').href = enlaceURL;

    modalDetalles.classList.remove("hidden");
}

function cerrarModal() {
    modalDetalles.classList.add("hidden");
}



// ==========================
// CARD DE JUEGOS
// ==========================

function crearCard(juego) {
    const card = document.createElement('article');
    card.className = 'game-card';

    const titulo = juego.title || juego.external || "Juego";
    const thumb = juego.thumb || juego.thumbnail || "";
    const precioOferta = juego.salePrice ?? juego.cheapest ?? "-";
    const precioNormal = juego.normalPrice ?? "-";
    const ahorro = juego.savings ? `${Math.round(Number(juego.savings))}%` : null;
    const rating = juego.rating ?? juego.steamRating ?? "N/A";
    const descripcion = juego.description || juego.shortDescription || "Sin descripción";

    card.innerHTML = `
        <img src="${thumb}" alt="${titulo}" />
        <div class="game-card-content">
            <h3 class="game-card-title">${titulo}</h3>
            <div class="game-card-price">
                ${precioNormal !== "-" ? `<span class="game-card-price-normal">$${precioNormal}</span>` : ""}
                ${precioOferta !== "-" ? `<span class="game-card-price-sale">$${precioOferta}</span>` : ""}
                ${ahorro ? `<span class="game-card-discount">-${ahorro}</span>` : ""}
            </div>
            <p class="game-card-description">${descripcion}</p>
            <div class="game-card-footer">
                <span class="game-card-rating">⭐ ${rating}</span>
                <button class="game-card-button btn-detalles">Ver detalles</button>
            </div>
        </div>
    `.trim();

    const btn = card.querySelector('.btn-detalles');
    btn.addEventListener('click', () => abrirModal(juego));

    return card;
}



// ==========================
// RENDERIZACIÓN
// ==========================

function renderizarVideojuegos(lista, limpiar = false) {
    if (limpiar) grid.innerHTML = '';
    lista.forEach(juego => grid.appendChild(crearCard(juego)));
}



// ==========================
// CARGA INICIAL
// ==========================

async function cargarVideojuegosInicial() {
    estadoCarga.classList.remove("hidden");

    paginaActual = 0;
    juegosEnCache = [];
    juegosActuales = [];

    try {
        const url = 'https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=60&pageNumber=0';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Respuesta ${res.status}`);

        const data = await res.json();

        juegosEnCache = data;
        juegosActuales = data;

        renderizarVideojuegos(data.slice(0, juegosPorPagina));
        paginaActual++;

    } catch (e) {
        mensajeError.textContent = "Error al cargar juegos.";
        mensajeError.classList.remove("hidden");
    }

    estadoCarga.classList.add("hidden");
}



// ==========================
// CARGAR MÁS JUEGOS
// ==========================

async function cargarMasJuegos() {

    activarSpinnerVerMas(true);

    try {
        const url = `https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=${juegosPorPagina}&pageNumber=${paginaActual}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error();

        const data = await res.json();

        if (data.length === 0) {
            mensajeError.textContent = "No hay más juegos disponibles";
            mensajeError.classList.remove("hidden");
            activarSpinnerVerMas(false);
            return;
        }

        juegosEnCache.push(...data);
        juegosActuales.push(...data);

        renderizarVideojuegos(data);
        paginaActual++;

    } catch (e) {
        mensajeError.textContent = "Error al cargar más juegos.";
        mensajeError.classList.remove("hidden");
    }

    activarSpinnerVerMas(false);
}



// ==========================
// FILTROS Y BÚSQUEDA
// ==========================

function aplicarFiltros() {
    const termino = inputBusqueda.value.trim().toLowerCase();

    let resultados = juegosEnCache.filter(j =>
        (j.title || j.external || "").toLowerCase().includes(termino)
    );

    const ordenar = selectOrdenar.value;

    if (ordenar === "rating") {
        resultados.sort((a, b) => (b.metacriticScore || 0) - (a.metacriticScore || 0));
    } else if (ordenar === "recent") {
        resultados.sort(
            (a, b) => (b.steamRatingCount || 0) - (a.steamRatingCount || 0)
        );
    } else if (ordenar === "name") {
        resultados.sort((a, b) =>
            (a.title || "").localeCompare(b.title || "")
        );
    }

    return resultados;
}

function ejecutarBusqueda() {
    activarSpinnerBuscar(true);

    grid.innerHTML = "";

    const resultados = aplicarFiltros();

    if (resultados.length === 0) {
        mensajeError.textContent = "No se encontraron resultados.";
        mensajeError.classList.remove("hidden");
    } else {
        mensajeError.classList.add("hidden");
        renderizarVideojuegos(resultados, true);
    }

    activarSpinnerBuscar(false);
}



// ==========================
// INICIALIZACIÓN
// ==========================

document.addEventListener('DOMContentLoaded', () => {

    // VINCULACIÓN DE ELEMENTOS
    grid = document.querySelector('#grid-videogames');
    estadoCarga = document.querySelector('#estado-de-carga');
    mensajeError = document.querySelector('#mensaje-de-error');
    btnVerMas = document.querySelector('#btn-ver-mas');
    inputBusqueda = document.querySelector('#input-busqueda');
    modalDetalles = document.querySelector('#modal');
    btnCerrarModal = document.querySelector('#btn-cerrar-modal');
    btnBuscar = document.querySelector('#btn-buscar');
    selectPlataforma = document.querySelector('#select-plataforma');
    selectOrdenar = document.querySelector('#select-ordenar');

    // SPINNERS
    spinnerBuscar = document.querySelector('#spinner-buscar');
    textoBuscar = document.querySelector('#texto-buscar');

    spinnerVerMas = document.querySelector('#spinner-vermas');
    textoVerMas = document.querySelector('#texto-vermas');

    // EVENTOS
    btnBuscar.addEventListener('click', ejecutarBusqueda);
    btnVerMas.addEventListener('click', cargarMasJuegos);
    btnCerrarModal.addEventListener('click', cerrarModal);

    inputBusqueda.addEventListener('keypress', e => {
        if (e.key === "Enter") ejecutarBusqueda();
    });

    selectOrdenar.addEventListener('change', ejecutarBusqueda);

    // CARGAR INICIAL
    cargarVideojuegosInicial();
});
