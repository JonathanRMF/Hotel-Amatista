// Función para obtener parámetros de la URL
function obtenerParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    semana: parseInt(params.get('semana')) || 27,
    adultos: parseInt(params.get('adultos')) || 1,
    niños: parseInt(params.get('niños')) || 0,
    habitaciones: parseInt(params.get('habitaciones')) || 1
  };
}

let parametrosReserva = {};
let todasHabitaciones = [];
let habitacionesDisponibles = [];

document.addEventListener("DOMContentLoaded", () => {
  parametrosReserva = obtenerParametrosURL();
  
  fetch("habitaciones.json")
    .then(response => {
      if (!response.ok) throw new Error("Error al cargar las habitaciones");
      return response.json();
    })
    .then(data => {
      // Corregir inconsistencias en los datos
      const datosCorregidos = corregirDatosHabitaciones(data);
      todasHabitaciones = datosCorregidos;
      
      // Filtrar por disponibilidad, capacidad y aptitud para niños
      habitacionesDisponibles = filtrarHabitacionesDisponibles(datosCorregidos, parametrosReserva);
      mostrarHabitaciones(habitacionesDisponibles);
      configurarFiltros();
      mostrarInfoReserva();
    })
    .catch(error => {
      console.error("Error:", error);
      document.getElementById("contenedor-habitaciones").innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
          No se pudieron cargar las habitaciones. Intenta más tarde.
        </div>
      `;
    });
});

// Función para corregir inconsistencias en los datos
function corregirDatosHabitaciones(habitaciones) {
  return habitaciones.map(habitacion => {
    // Corregir capacidad basada en el nombre si es necesario
    if (habitacion.nombre.includes("Cuadruple") && habitacion.capacidad < 4) {
      return {...habitacion, capacidad: 4};
    }
    if (habitacion.nombre.includes("Familiar") && habitacion.capacidad < 3) {
      return {...habitacion, capacidad: 4};
    }
    return habitacion;
  });
}

// Función para mostrar los parámetros de la reserva
function mostrarInfoReserva() {
  const infoReserva = document.createElement('div');
  infoReserva.className = 'alert alert-info mb-4';
  infoReserva.innerHTML = `
    <strong>Buscando para:</strong> 
    ${parametrosReserva.adultos} adulto${parametrosReserva.adultos > 1 ? 's' : ''}, 
    ${parametrosReserva.niños} niño${parametrosReserva.niños > 1 ? 's' : ''}, 
    ${parametrosReserva.habitaciones} habitación${parametrosReserva.habitaciones > 1 ? 'es' : ''} 
    (Semana ${parametrosReserva.semana})
  `;
  document.querySelector('.main-content .container').prepend(infoReserva);
}

// Función para filtrar por disponibilidad, capacidad y aptitud para niños
function filtrarHabitacionesDisponibles(habitaciones, {semana, adultos, niños}) {
  const totalPersonas = adultos + niños;
  const hayNiños = niños > 0;
  
  return habitaciones.filter(habitacion => {
    const disponibleSemana = !habitacion.accesible.includes(semana);
    const capacidadSuficiente = habitacion.capacidad >= totalPersonas;
    const aptaParaNiños = !hayNiños || habitacion.apta_niños;
    
    return disponibleSemana && capacidadSuficiente && aptaParaNiños;
  });
}

function mostrarHabitaciones(habitaciones) {
  const contenedor = document.getElementById("contenedor-habitaciones");
  const contador = document.getElementById("contador-resultados");
  
  contador.textContent = `${habitaciones.length} ${habitaciones.length === 1 ? 'habitación disponible' : 'habitaciones disponibles'}`;

  contenedor.innerHTML = '';

  if (habitaciones.length === 0) {
    let mensaje = `No hay habitaciones disponibles para ${parametrosReserva.adultos + parametrosReserva.niños} personas en la semana ${parametrosReserva.semana}.`;
    
    if (parametrosReserva.niños > 0) {
      mensaje += "<br>No encontramos habitaciones aptas para niños que cumplan con tus criterios.";
    } else {
      mensaje += "<br>Intenta con otras fechas o menos huéspedes.";
    }
    
    contenedor.innerHTML = `
      <div class="alert alert-info text-center" role="alert">
        ${mensaje}
      </div>
    `;
    return;
  }

  habitaciones.forEach((habitacion, index) => {
    const collapseId = `info-extra-${index}`;
    
    const card = document.createElement("div");
    card.className = "card mb-3";

    card.innerHTML = `
      <div class="row g-0">
        <div class="col-md-4 card-img-container">
          <img src="${habitacion.imagen}" class="img-fluid rounded-start" alt="${habitacion.nombre}">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title">${habitacion.nombre}</h5>
            <p class="card-text">${habitacion.descripcion}</p>
            <div class="d-flex align-items-center flex-wrap mb-2 gap-2">
              <span class="badge bg-secondary">Capacidad: ${habitacion.capacidad} personas</span>
              ${habitacion.apta_niños ? '<span class="badge bg-info"><i class="bi bi-emoji-smile"></i> Apta niños</span>' : ''}
              <span class="badge bg-${habitacion.politica_cancelacion.includes("no") ? "danger" : "success"}">
                ${habitacion.politica_cancelacion}
              </span>
            </div>
            
            <button class="btn btn-sm btn-outline-info mb-2" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
              <i class="bi bi-info-circle"></i> Detalles
            </button>

            <div class="d-flex justify-content-between align-items-center border-top pt-2">
              <div>
                <span class="text-muted">${habitacion.ubicacion}</span>
              </div>
              <div class="text-end">
                <div class="fw-bold text-primary">$${habitacion.precio.toLocaleString()}</div>
                <button class="btn btn-primary btn-sm mt-1">Seleccionar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const extraInfo = document.createElement("div");
    extraInfo.className = "collapse mb-4";
    extraInfo.id = collapseId;
    extraInfo.innerHTML = `
      <div class="card card-body p-3">
        <div class="row">
          <div class="col-md-6 mb-3">
            <h6><i class="bi bi-door-closed-fill me-2"></i>Tipo de cama</h6>
            <p>${habitacion.camas}</p>
          </div>
          <div class="col-md-6 mb-3">
            <h6><i class="bi bi-people-fill me-2"></i>Capacidad</h6>
            <p>${habitacion.capacidad} personas</p>
          </div>

          <div class="col-12">
            <h6><i class="bi bi-stars me-2"></i>Servicios</h6>
            <ul class="list-unstyled row row-cols-2 row-cols-md-3 g-2">
              ${habitacion.servicios.map(servicio => `
                <li class="d-flex align-items-center">
                  <i class="bi bi-check-circle-fill text-success me-2"></i> ${servicio}
                </li>`).join("")}
            </ul>
          </div>
          
          ${habitacion.apta_niños ? `
          <div class="col-12 mt-2">
            <h6><i class="bi bi-emoji-smile me-2"></i>Para niños</h6>
            <p>Esta habitación cuenta con características especiales para la comodidad de los niños</p>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    contenedor.appendChild(card);
    contenedor.appendChild(extraInfo);
  });
}

function configurarFiltros() {
  const form = document.getElementById('filtros-form');
  const limpiar = document.getElementById('limpiar-filtros');

  form.addEventListener('input', aplicarFiltros);
  
  limpiar.addEventListener('click', () => {
    form.reset();
    mostrarHabitaciones(habitacionesDisponibles);
  });
}

function aplicarFiltros() {
  const form = document.getElementById('filtros-form');
  const formData = new FormData(form);

  const precios = formData.getAll('precio');
  const tipos = formData.getAll('tipo');
  const servicios = formData.getAll('servicio');
  const cancelacion = formData.get('cancelacion');
  const capacidades = formData.getAll('capacidad').map(Number);
  const aptaNiños = formData.get('apta-niños') === 'on';

  const habitacionesFiltradas = habitacionesDisponibles.filter(hab => {
    // Filtro por precio
    const cumplePrecio = precios.length === 0 || precios.some(p => {
      if (p === 'economico') return hab.precio < 8000;
      if (p === 'medio') return hab.precio >= 8000 && hab.precio <= 10000;
      if (p === 'alto') return hab.precio > 10000;
      return true;
    });

    // Filtro por tipo
    const cumpleTipo = tipos.length === 0 || 
      tipos.some(t => hab.nombre.toLowerCase().includes(t.toLowerCase()));

    // Filtro por servicios
    const cumpleServicios = servicios.length === 0 || 
      servicios.every(s => hab.servicios.map(v => v.toLowerCase()).includes(s.toLowerCase()));

    // Filtro de política de cancelación
    const cumpleCancelacion = !cancelacion || 
      (cancelacion === 'gratuita' && hab.politica_cancelacion.includes('gratuita')) ||
      (cancelacion === 'no-reembolsable' && hab.politica_cancelacion.includes('no'));

    // Filtro por capacidad
    const cumpleCapacidad = capacidades.length === 0 || 
      capacidades.some(c => {
        if (c === 4) return hab.capacidad >= 4;
        return hab.capacidad === c;
      });

    // Filtro por aptitud para niños
    const cumpleAptaNiños = !aptaNiños || hab.apta_niños;

    return cumplePrecio && cumpleTipo && cumpleServicios && cumpleCancelacion && cumpleCapacidad && cumpleAptaNiños;
  });

  mostrarHabitaciones(habitacionesFiltradas);
}