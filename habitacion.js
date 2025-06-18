// Variables iniciales
let rooms = 1;
let adults = 1;
let children = 0;

const button = document.getElementById("guestsButton");
const dropdown = document.getElementById("guestsDropdown");

button.addEventListener("click", () => {
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});

document.getElementById("applyGuests").addEventListener("click", () => {
  const totalGuests = adults + children;
  button.textContent = `${rooms} Habitación${rooms > 1 ? 'es' : ''}, ${totalGuests} Huésped${totalGuests > 1 ? 'es' : ''}`;
  dropdown.style.display = "none";
});

function updateCounter(type, value) {
  if (type === "rooms") {
    rooms = Math.max(1, rooms + value);
    document.getElementById("roomsCount").textContent = rooms;
  } else if (type === "adults") {
    adults = Math.max(1, adults + value);
    document.getElementById("adultsCount").textContent = adults;
  } else if (type === "children") {
    children = Math.max(0, children + value);
    document.getElementById("childrenCount").textContent = children;
  }
}

// Cierra el dropdown al hacer clic fuera
document.addEventListener("click", function(event) {
  const isClickInside = button.contains(event.target) || dropdown.contains(event.target);
  if (!isClickInside) {
    dropdown.style.display = "none";
  }
});

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

// Función para formatear la semana como fecha
function formatearSemanaComoFecha(semana) {
  const año = new Date().getFullYear();
  const fechaInicio = new Date(año, 0, 1);
  const dias = (semana - 1) * 7;
  const fecha = new Date(fechaInicio.setDate(fechaInicio.getDate() + dias));
  
  // Formatear como "día/mes/año"
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  return `${dia}/${mes}/${año}`;
}

let parametrosReserva = {};
let todasHabitaciones = [];
let habitacionesDisponibles = [];

document.addEventListener("DOMContentLoaded", () => {
  parametrosReserva = obtenerParametrosURL();
  
  // Actualizar los campos con los parámetros de la URL
  document.getElementById("dateInput").value = `Semana ${parametrosReserva.semana}`;
  
  const totalPersonas = parametrosReserva.adultos + parametrosReserva.niños;
  document.getElementById("guestsButton").textContent = 
    `${parametrosReserva.habitaciones} Habitación${parametrosReserva.habitaciones > 1 ? 'es' : ''}, ` +
    `${totalPersonas} Huésped${totalPersonas > 1 ? 'es' : ''}`;
  
  // Actualizar los contadores del dropdown
  rooms = parametrosReserva.habitaciones;
  adults = parametrosReserva.adultos;
  children = parametrosReserva.niños;
  document.getElementById("roomsCount").textContent = rooms;
  document.getElementById("adultsCount").textContent = adults;
  document.getElementById("childrenCount").textContent = children;
  
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

  // Configurar el botón de búsqueda
  document.getElementById("bookButton").addEventListener("click", () => {
    const semana = parametrosReserva.semana; // Mantener la misma semana por ahora
    const adultos = parseInt(document.getElementById("adultsCount").textContent);
    const niños = parseInt(document.getElementById("childrenCount").textContent);
    const habitaciones = parseInt(document.getElementById("roomsCount").textContent);
    
    // Actualizar la URL con los nuevos parámetros
    const nuevaURL = `${window.location.pathname}?semana=${semana}&adultos=${adultos}&niños=${niños}&habitaciones=${habitaciones}`;
    window.location.href = nuevaURL;
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
  document.getElementById('infoAlquiler').appendChild(infoReserva);
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
                <button class="btn btn-primary btn-sm mt-1">Reservar</button>
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

// Funcionalidad de login/registro (mantenida igual)
document.addEventListener("DOMContentLoaded", () => {
  const formRegistro = document.getElementById("formRegistro");

  // Limpiar errores visuales
  const limpiarErrores = () => {
    const inputs = formRegistro.querySelectorAll(".form-control");
    inputs.forEach(input => input.classList.remove("is-invalid", "is-valid"));
    document.getElementById("confirmFeedback").textContent = "";
  };

  // Función para mostrar el login modal (asegurate de tenerlo en tu HTML)
  const mostrarLogin = () => {
    const loginModal = new bootstrap.Modal(document.getElementById("modalLogin"));
    loginModal.show();
  };

  // REGISTRO
  formRegistro.addEventListener("submit", function (e) {
    e.preventDefault();
    limpiarErrores();

    const nombreInput = document.getElementById("regNombre");
    const apellidoInput = document.getElementById("regApellido");
    const correoInput = document.getElementById("regCorreo");
    const contraseñaInput = document.getElementById("regContraseña");
    const confirmarInput = document.getElementById("regConfirmar");

    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const correo = correoInput.value.trim();
    const contraseña = contraseñaInput.value;
    const confirmar = confirmarInput.value;

    let validado = true;

    // Validación de nombre
    if (nombre === "") {
      nombreInput.classList.add("is-invalid");
      document.getElementById("regNombreFeedback").textContent = "Campo obligatorio";
      validado = false;
    }

    // Validación de apellido
    if (apellido === "") {
      apellidoInput.classList.add("is-invalid");
      document.getElementById("regApellidoFeedback").textContent = "Campo obligatorio";
      validado = false;
    }

    // Validación de correo
    if (correo === "" || !/\S+@\S+\.\S+/.test(correo)) {
      correoInput.classList.add("is-invalid");
      document.getElementById("regCorreoFeedback").textContent = correo === "" ? "Campo obligatorio" : "Correo inválido";
      validado = false;
    }

    // Validación de contraseña
    if (contraseña.length < 8) {
      contraseñaInput.classList.add("is-invalid");
      document.getElementById("regContraseñaFeedback").textContent = "Debe tener al menos 8 caracteres";
      validado = false;
    }

    // Validación de confirmación de contraseña
    if (contraseña !== confirmar || confirmar === "") {
      confirmarInput.classList.add("is-invalid");
      document.getElementById("confirmFeedback").textContent = confirmar === "" ? "Campo obligatorio" : "Las contraseñas no coinciden.";
      validado = false;
    }

    if (validado) {
      const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
      const yaExiste = usuarios.some(u => u.correo === correo);

      if (yaExiste) {
        alert("Este correo ya está registrado.");
        return;
      }

      const nuevoUsuario = {
        nombre,
        apellido,
        correo,
        contraseña: btoa(contraseña) // Codifica la contraseña
      };
      usuarios.push(nuevoUsuario);
      localStorage.setItem("usuarios", JSON.stringify(usuarios));

      const mensajeExito = document.getElementById("mensajeExitoRegistro");
      mensajeExito.textContent = "Registro exitoso";
      mensajeExito.classList.remove("d-none");
      formRegistro.reset();

      setTimeout(() => {
        mensajeExito.classList.add("d-none");
        mostrarLogin(); // Muestra el modal de login
      }, 3000);
    }
  });

  // Evento para limpiar errores al escribir en campos
  const campos = [
    { id: "regNombre", feedback: "regNombreFeedback" },
    { id: "regApellido", feedback: "regApellidoFeedback" },
    { id: "regCorreo", feedback: "regCorreoFeedback" },
    { id: "regContraseña", feedback: "regContraseñaFeedback" },
    { id: "regConfirmar", feedback: "confirmFeedback" }
  ];

  campos.forEach(({ id, feedback }) => {
    const input = document.getElementById(id);
    const feedbackDiv = document.getElementById(feedback);

    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
      feedbackDiv.textContent = "";  // ⚠️ Limpia el mensaje también
    });
  });


  // INICIO DE SESIÓN
  const btnLogin = document.getElementById("loginBtn"); // ID corregido

  btnLogin.addEventListener("click", function (e) {
    e.preventDefault();

    const correo = document.getElementById("inputcorreo").value.trim();
    const contraseña = document.getElementById("inputcontraseña").value;

    const emailFeedback = document.getElementById("emailFeedback");
    const passwordFeedback = document.getElementById("passwordFeedback");

    emailFeedback.textContent = "";
    passwordFeedback.textContent = "";

    const inputCorreo = document.getElementById("inputcorreo");
    const inputContraseña = document.getElementById("inputcontraseña");

    inputCorreo.classList.remove("is-invalid", "is-valid");
    inputContraseña.classList.remove("is-invalid", "is-valid");

    if (!correo || !contraseña) {
      if (!correo) {
        inputCorreo.classList.add("is-invalid");
        emailFeedback.textContent = "Campo obligatorio.";
      }
      if (!contraseña) {
        inputContraseña.classList.add("is-invalid");
        passwordFeedback.textContent = "Campo obligatorio.";
      }
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuario = usuarios.find(u => u.correo === correo && atob(u.contraseña) === contraseña);

    if (usuario) {
      sessionStorage.setItem("usuarioActivo", JSON.stringify(usuario));
      mostrarUsuarioLogueado();

      inputCorreo.classList.add("is-valid");
      inputContraseña.classList.add("is-valid");

      const mensajeExito = document.getElementById("mensajeExitoLogin");
      mensajeExito.textContent = "Inicio de sesión exitoso";
      mensajeExito.classList.remove("d-none");

      setTimeout(() => {
        mensajeExito.classList.add("d-none");
        location.reload(); // Recarga toda la página
      }, 1000);
    } else {
      inputCorreo.classList.add("is-invalid");
      inputContraseña.classList.add("is-invalid");
      passwordFeedback.textContent = "Correo o contraseña incorrectos.";
    }
  });

  // CONTROL DE SESIÓN (vista pública vs privada)
  const estaLogueado = sessionStorage.getItem("usuarioActivo") !== null;

  const contenidoPublico = document.getElementById("contenidoPublico");
  const contenidoPrivado = document.getElementById("contenidoPrivado");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (estaLogueado) {
    contenidoPublico.style.display = "none";
    contenidoPrivado.style.display = "block";

    if (nombreUsuario) {
      nombreUsuario.textContent = sessionStorage.getItem("nombre");
    }

    if (cerrarSesionBtn) {
      cerrarSesionBtn.addEventListener("click", () => {
        sessionStorage.clear();
        location.reload();
      });
    }
  } else {
    contenidoPublico.style.display = "block";
    contenidoPrivado.style.display = "none";
  }
});

const btnSesion = document.getElementById("btnSesion");
const menuUsuario = document.getElementById("menuUsuario");

// Función para mostrar el nombre del usuario si está logueado
function mostrarUsuarioLogueado() {
  const usuarioActual = sessionStorage.getItem("usuarioActivo");
  if (usuarioActual) {
    const nombre = JSON.parse(usuarioActual).nombre;

    btnSesion.innerHTML = `
      <img src="Imagenes/Logos/logousuario.png" class="icono-usuario">
      ${nombre}
    `;
    btnSesion.removeAttribute("data-bs-toggle");
    btnSesion.removeAttribute("data-bs-target");
    menuUsuario.classList.add("d-none");
  }
}

btnSesion.addEventListener("click", () => {
  const usuarioActual = sessionStorage.getItem("usuarioActivo");
  if (usuarioActual) {
    // Si hay usuario, mostrar menú
    menuUsuario.classList.toggle("d-none");
  }
});

// Cerrar sesión
document.getElementById("cerrarSesion").addEventListener("click", () => {
  sessionStorage.clear(); // Elimina toda la información del usuario
  location.reload(); // Recarga la página para volver al estado inicial
});


document.getElementById("irARegistro").addEventListener("click", function (e) {
  e.preventDefault();
  const modalLogin = bootstrap.Modal.getInstance(document.getElementById("modalLogin"));
  modalLogin.hide();
  const modalRegistro = new bootstrap.Modal(document.getElementById("registroModal"));
  modalRegistro.show();
});

document.getElementById("volverALogin").addEventListener("click", function (e) {
  e.preventDefault();
  const modalRegistro = bootstrap.Modal.getInstance(document.getElementById("registroModal"));
  modalRegistro.hide();
  const modalLogin = new bootstrap.Modal(document.getElementById("modalLogin"));
  modalLogin.show();
});

document.addEventListener("DOMContentLoaded", () => {
  mostrarUsuarioLogueado();
});

// Cierra el menú de usuario si se hace clic fuera de él
document.addEventListener("click", function (e) {
  const btnSesion = document.getElementById("btnSesion");
  const menuUsuario = document.getElementById("menuUsuario");

  if (!menuUsuario.classList.contains("d-none")) {
    const clickDentroMenu = menuUsuario.contains(e.target);
    const clickEnBoton = btnSesion.contains(e.target);

    if (!clickDentroMenu && !clickEnBoton) {
      menuUsuario.classList.add("d-none");
    }
  }
});