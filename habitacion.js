// Función para obtener parámetros de la URL
function obtenerParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    fechaInicio: params.get('fechaInicio'),
    fechaFin: params.get('fechaFin'),
    semanaInicio: parseInt(params.get('semanaInicio')) || 0,
    semanaFin: parseInt(params.get('semanaFin')) || 0,
    adultos: parseInt(params.get('adultos')) || 1,
    niños: parseInt(params.get('niños')) || 0,
    habitaciones: parseInt(params.get('habitaciones')) || 1, // Cantidad máxima de habitaciones
    noches: parseInt(params.get('noches')) || 1
  };
}

// Variables globales
let maxHabitaciones = 1;
let parametrosReserva = {};
let todasHabitaciones = [];
let habitacionesDisponibles = [];
let habitacionesSeleccionadas = [];
let resumenVisible = false;

// Función principal al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  parametrosReserva = obtenerParametrosURL();
  maxHabitaciones = parametrosReserva.habitaciones;
  
  fetch("habitaciones.json")
    .then(response => {
      if (!response.ok) throw new Error("Error al cargar las habitaciones");
      return response.json();
    })
    .then(data => {
      todasHabitaciones = corregirDatosHabitaciones(data);
      habitacionesDisponibles = filtrarHabitacionesDisponibles(todasHabitaciones, parametrosReserva);
      mostrarHabitaciones(habitacionesDisponibles);
      configurarFiltros();
      mostrarInfoReserva();
      configurarSeleccionHabitaciones();
      confirmarReserva();
    })
    .catch(error => {
      console.error("Error:", error);
      mostrarErrorCarga();
    });
});

// Función para corregir datos de habitaciones
function corregirDatosHabitaciones(habitaciones) {
  return habitaciones.map(habitacion => {
    if (habitacion.nombre.includes("Cuádruple") && habitacion.capacidad < 4) {
      return {...habitacion, capacidad: 4};
    }
    if (habitacion.nombre.includes("Familiar") && habitacion.capacidad < 3) {
      return {...habitacion, capacidad: 4};
    }
    return habitacion;
  });
}

// Función para filtrar habitaciones disponibles
function filtrarHabitacionesDisponibles(habitaciones, {semanaInicio, semanaFin, adultos, niños}) {
  const totalPersonas = adultos + niños;
  const hayNiños = niños > 0;
  
  return habitaciones.filter(habitacion => {
    // Verificar disponibilidad en el rango de semanas
    if (semanaInicio && semanaFin && habitacion.accesible) {
      for (let semana = semanaInicio; semana <= semanaFin; semana++) {
        if (habitacion.accesible.includes(semana)) {
          return false;
        }
      }
    }
    
    const capacidadSuficiente = habitacion.capacidad >= totalPersonas;
    const aptaParaNiños = !hayNiños || habitacion.apta_niños;
    
    return capacidadSuficiente && aptaParaNiños;
  });
}

// Función para mostrar información de la reserva
function mostrarInfoReserva() {
  const infoReserva = document.createElement('div');
  infoReserva.className = 'alert alert-info mb-4';
  
  const formatoFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  infoReserva.innerHTML = `
    <strong>Buscando para:</strong> 
    ${parametrosReserva.adultos} adulto${parametrosReserva.adultos > 1 ? 's' : ''}, 
    ${parametrosReserva.niños} niño${parametrosReserva.niños > 1 ? 's' : ''}, 
    Máximo ${maxHabitaciones} habitación${maxHabitaciones > 1 ? 'es' : ''}
    <br>
    <strong>Fechas:</strong> ${formatoFecha(parametrosReserva.fechaInicio)} al ${formatoFecha(parametrosReserva.fechaFin)}
    (${parametrosReserva.noches} noche${parametrosReserva.noches > 1 ? 's' : ''})
  `;
  document.querySelector('.main-content .container').prepend(infoReserva);
}

// Función para mostrar las habitaciones
function mostrarHabitaciones(habitaciones) {
  const contenedor = document.getElementById("contenedor-habitaciones");
  const contador = document.getElementById("contador-resultados");
  
  contador.textContent = `${habitaciones.length} ${habitaciones.length === 1 ? 'habitación disponible' : 'habitaciones disponibles'}`;
  contenedor.innerHTML = '';

  if (habitaciones.length === 0) {
    mostrarMensajeNoDisponibles();
    return;
  }

  habitaciones.forEach((habitacion, index) => {
    const card = crearCardHabitacion(habitacion, index);
    const extraInfo = crearInfoExtraHabitacion(habitacion, index);
    
    contenedor.appendChild(card);
    contenedor.appendChild(extraInfo);
  });
}

// Función para crear tarjeta de habitación
function crearCardHabitacion(habitacion, index) {
  const collapseId = `info-extra-${index}`;
  const precioTotal = habitacion.precio * parametrosReserva.noches;
  const estaSeleccionada = habitacionesSeleccionadas.some(h => h.id === habitacion.id);
  
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
            <span class="badge bg-primary">${parametrosReserva.noches} noche${parametrosReserva.noches > 1 ? 's' : ''}</span>
          </div>
          
          <button class="btn btn-sm btn-outline-info mb-2" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
            <i class="bi bi-info-circle"></i> Detalles
          </button>

          <div class="d-flex justify-content-between align-items-center border-top pt-2">
            <div>
              <span class="text-muted">${habitacion.ubicacion}</span>
            </div>
            <div class="text-end">
              <div class="fw-bold text-primary">$${precioTotal.toLocaleString()} <small class="text-muted">($${habitacion.precio.toLocaleString()}/noche)</small></div>
              <button class="btn ${estaSeleccionada ? 'btn-success' : 'btn-primary'} btn-sm mt-1">
                ${estaSeleccionada ? '✓ Seleccionada' : 'Seleccionar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Función para crear información adicional de habitación
function crearInfoExtraHabitacion(habitacion, index) {
  const collapseId = `info-extra-${index}`;
  
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

        <div class="col-md-6 mb-3">
          <h6><i class="bi bi-calendar-check me-2"></i>Disponibilidad</h6>
          <p>Disponible para tu estadía completa</p>
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
  
  return extraInfo;
}

// Función para mostrar mensaje de error
function mostrarErrorCarga() {
  document.getElementById("contenedor-habitaciones").innerHTML = `
    <div class="alert alert-danger text-center" role="alert">
      No se pudieron cargar las habitaciones. Intenta más tarde.
    </div>
  `;
}

// Función para mostrar mensaje cuando no hay disponibilidad
function mostrarMensajeNoDisponibles() {
  let mensaje = `No hay habitaciones disponibles para ${parametrosReserva.adultos + parametrosReserva.niños} personas `;
  mensaje += `entre el ${new Date(parametrosReserva.fechaInicio).toLocaleDateString('es-ES')} y el ${new Date(parametrosReserva.fechaFin).toLocaleDateString('es-ES')}.`;
  
  if (parametrosReserva.niños > 0) {
    mensaje += "<br>No encontramos habitaciones aptas para niños que cumplan con tus criterios.";
  } else {
    mensaje += "<br>Intenta con otras fechas o menos huéspedes.";
  }
  
  document.getElementById("contenedor-habitaciones").innerHTML = `
    <div class="alert alert-info text-center" role="alert">
      ${mensaje}
    </div>
  `;
}

// Función para configurar filtros
function configurarFiltros() {
  const form = document.getElementById('filtros-form');
  const limpiar = document.getElementById('limpiar-filtros');

  form.addEventListener('input', aplicarFiltros);
  
  limpiar.addEventListener('click', () => {
    form.reset();
    mostrarHabitaciones(habitacionesDisponibles);
  });
}

// Función para aplicar filtros
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
    const cumplePrecio = precios.length === 0 || precios.some(p => {
      if (p === 'economico') return hab.precio < 8000;
      if (p === 'medio') return hab.precio >= 8000 && hab.precio <= 10000;
      if (p === 'alto') return hab.precio > 10000;
      return true;
    });

    const cumpleTipo = tipos.length === 0 || 
      tipos.some(t => hab.nombre.toLowerCase().includes(t.toLowerCase()));

    const cumpleServicios = servicios.length === 0 || 
      servicios.every(s => hab.servicios.map(v => v.toLowerCase()).includes(s.toLowerCase()));

    const cumpleCancelacion = !cancelacion || 
      (cancelacion === 'gratuita' && hab.politica_cancelacion.includes('gratuita')) ||
      (cancelacion === 'no-reembolsable' && hab.politica_cancelacion.includes('no'));

    const cumpleCapacidad = capacidades.length === 0 || 
      capacidades.some(c => {
        if (c === 4) return hab.capacidad >= 4;
        return hab.capacidad === c;
      });

    const cumpleAptaNiños = !aptaNiños || hab.apta_niños;

    return cumplePrecio && cumpleTipo && cumpleServicios && cumpleCancelacion && cumpleCapacidad && cumpleAptaNiños;
  });

  mostrarHabitaciones(habitacionesFiltradas);
}

// Función para configurar selección de habitaciones con límite
function configurarSeleccionHabitaciones() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-primary') || e.target.classList.contains('btn-success')) {
      const btn = e.target;
      const card = btn.closest('.card');
      const cards = Array.from(document.querySelectorAll('.card'));
      const index = cards.indexOf(card) / 2;
      const habitacion = habitacionesDisponibles[index];
      
      const existeIndex = habitacionesSeleccionadas.findIndex(h => h.id === habitacion.id);
      
      if (existeIndex >= 0) {
        // Deseleccionar habitación
        habitacionesSeleccionadas.splice(existeIndex, 1);
        btn.textContent = 'Seleccionar';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
      } else {
        // Verificar límite de habitaciones
        if (habitacionesSeleccionadas.length >= maxHabitaciones) {
          const alerta = document.getElementById("alerta");
          const contenidoOriginal = alerta.innerHTML; // Guardamos TODO el contenido (texto + HTML si hay)
          
          // Aplicamos cambios visuales
          setTimeout(() => {
              alerta.classList.add("alerta-error");
              alerta.innerHTML = `❌ <strong>Error:</strong> Máximo ${maxHabitaciones} habitaciones permitidas`;
              
              // Restauramos después de 3 segundos
              setTimeout(() => {
                  alerta.classList.remove("alerta-error");
                  alerta.innerHTML = contenidoOriginal; // ¡Restauramos exactamente lo que había!
              }, 3000);
          }, 500); // Pequeño retraso para mejor UX
          return;
        }
        
        // Seleccionar nueva habitación
        habitacionesSeleccionadas.push(habitacion);
        btn.textContent = '✓ Seleccionada';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
      }
      
      actualizarResumen();
    }
  });
}

// Función para actualizar el resumen de reserva
function actualizarResumen() {
  const resumen = document.getElementById('resumen-reserva');
  const total = habitacionesSeleccionadas.reduce((sum, hab) => sum + (hab.precio * parametrosReserva.noches), 0);
  
  document.getElementById('resumen-fechas').textContent = 
    `${formatearFecha(parametrosReserva.fechaInicio)} - ${formatearFecha(parametrosReserva.fechaFin)}`;
  document.getElementById('resumen-noches').textContent = 
    `${parametrosReserva.noches} ${parametrosReserva.noches === 1 ? 'noche' : 'noches'}`;
  document.getElementById('resumen-habitaciones').textContent = 
    `${habitacionesSeleccionadas.length} de ${maxHabitaciones} habitación${maxHabitaciones > 1 ? 'es' : ''}`;
  document.getElementById('resumen-huespedes').textContent = 
    `${parametrosReserva.adultos + parametrosReserva.niños} ${parametrosReserva.adultos + parametrosReserva.niños === 1 ? 'huésped' : 'huéspedes'}`;
  document.getElementById('resumen-total').textContent = 
    `$${total.toLocaleString()}`;

  if (habitacionesSeleccionadas.length > 0 && !resumenVisible) {
    resumen.classList.remove('d-none');
    resumenVisible = true;
  } else if (habitacionesSeleccionadas.length === 0 && resumenVisible) {
    resumen.classList.add('d-none');
    resumenVisible = false;
  }
}

// Función auxiliar para formatear fechas
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// Función para confirmar reserva
function confirmarReserva() {
  const btnConfirmar = document.getElementById('btn-confirmar-reserva');
  
  btnConfirmar.addEventListener('click', () => {

    // Crear objeto con todos los datos necesarios
    const datosReserva = {
      fechaInicio: parametrosReserva.fechaInicio,
      fechaFin: parametrosReserva.fechaFin,
      adultos: parametrosReserva.adultos,
      niños: parametrosReserva.niños,
      noches: parametrosReserva.noches,
      // Pasar todos los IDs como parámetro separado por comas
      habitacionesIds: habitacionesSeleccionadas.map(h => h.id).join(','),
      // Pasar también los nombres para mostrar (opcional)
      habitacionesNombres: habitacionesSeleccionadas.map(h => encodeURIComponent(h.nombre)).join(','),
      total: habitacionesSeleccionadas.reduce((sum, h) => sum + (h.precio * parametrosReserva.noches), 0)
    };

    // Construir URL con todos los parámetros
    const params = new URLSearchParams();
    for (const key in datosReserva) {
      params.append(key, datosReserva[key]);
    }

    // Redirigir con todos los parámetros en la URL
    window.location.href = `confirmar.html?${params.toString()}`;
  });
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

        // Cerrar modal de registro
        const modalRegistro = document.getElementById("modalRegistro");
        if (modalRegistro) {
          modalRegistro.classList.remove("show");
          modalRegistro.style.display = "none";
          document.body.classList.remove("modal-open");
          const backdrop = document.querySelector(".modal-backdrop");
          if (backdrop) backdrop.remove();
        }

        // Limpiar y resetear formulario de registro
        formRegistro.reset();
        campos.forEach(({ id, feedback }) => {
          const input = document.getElementById(id);
          const feedbackDiv = document.getElementById(feedback);
          input.classList.remove("is-invalid", "is-valid");
          feedbackDiv.textContent = "";
        });

        // Limpiar formulario de login
        const inputCorreo = document.getElementById("inputcorreo");
        const inputContraseña = document.getElementById("inputcontraseña");
        const emailFeedback = document.getElementById("emailFeedback");
        const passwordFeedback = document.getElementById("passwordFeedback");

        inputCorreo.value = "";
        inputContraseña.value = "";
        inputCorreo.classList.remove("is-invalid", "is-valid");
        inputContraseña.classList.remove("is-invalid", "is-valid");
        emailFeedback.textContent = "";
        passwordFeedback.textContent = "";

        // Mostrar modal de login
        mostrarLogin();

      }, 1000);

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
      <span id="nombreUsuarioHeader">${nombre}</span>
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

// Función mejorada para obtener nombres de habitaciones
function obtenerNombresHabitaciones(idsHabitaciones, catalogoHabitaciones) {
  if (!Array.isArray(idsHabitaciones)) {
    console.error('idsHabitaciones no es un array:', idsHabitaciones);
    return ['Habitación no especificada'];
  }

  if (!Array.isArray(catalogoHabitaciones)) {
    console.error('El catálogo de habitaciones no es válido');
    return idsHabitaciones.map(id => `Habitación #${id}`);
  }

  return idsHabitaciones.map(id => {
    // Convertir id a número por si acaso (ya que en el JSON son números)
    const idNum = Number(id);
    
    // Buscar habitación (comparando como número)
    const habitacion = catalogoHabitaciones.find(h => h.id === idNum);
              
    return habitacion.nombre;
  });
}

// Obtencion de la ID
const misReservasBtn = document.getElementById('misReservas');

// Cargar datos de habitaciones
async function cargarHabitaciones() {
  try {
    const response = await fetch('habitaciones.json');
    if (!response.ok) throw new Error('Error al cargar habitaciones');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Modificamos el event listener para usar los datos de las habitaciones
misReservasBtn.addEventListener('click', async function() {
  // Obtener usuario activo
  const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'));
  const emailUsuario = usuarioActivo.correo;
  const habitaciones = await cargarHabitaciones();

  // Obtener y filtrar reservas
  const todasLasReservas = JSON.parse(localStorage.getItem('reservas')) || [];
  const reservasUsuario = todasLasReservas.filter(reserva => reserva.email === emailUsuario);
  
  // Mostrar en el modal
  const cardsContainer = document.getElementById('cardsContainer');
  cardsContainer.innerHTML = '';
  
  if (reservasUsuario.length === 0) {
    cardsContainer.innerHTML = '<p>No tienes reservas realizadas.</p>';
  } else {
    reservasUsuario.forEach((reserva, index) => {
      const card = document.createElement('div');
      card.className = 'col-md-6 mb-4';
      
      // Obtener nombres (usando la función mejorada)
      const nombresHabitaciones = obtenerNombresHabitaciones(
        reserva.idsHabitaciones || [],
        habitaciones
      );

      card.innerHTML = `
        <div class="card room-card h-100">
          <div class="card-body">
            <div class="mb-3">
              <h5>Detalles de la reserva:</h5>
              <p><strong>Fecha de reserva:</strong> ${reserva.fechaReserva}</p>
              <p><strong>Fecha de Entrada:</strong> ${reserva.fechaInicio}</p>
              <p><strong>Fecha de Salida:</strong> ${reserva.fechaFin}</p>
              <p><strong>Huéspedes:</strong> ${reserva.adultos} adultos, ${reserva.niños} niños</p>
              <p><strong>Método de pago:</strong> ${reserva.metodoPago}</p>
            </div>
            <h5 class="mb-2">Habitaciones reservadas:</h5>
            <ul class="list-group">
              ${nombresHabitaciones.map(nombre => `
                <li class="list-group-item">${nombre}</li>
              `).join('')}
            </ul>
            <div class="d-grid mt-3">
              <button class="btn btn-danger btn-lg py-2 cancelar-btn" data-reserva-id="${reserva.id || index}">
                <i class="bi bi-x-circle me-2"></i> Cancelar Reserva
              </button>
            </div>
          </div>
        </div>
      `;
      cardsContainer.appendChild(card);
    });

    // Eventos para botones de cancelar
    document.querySelectorAll('.cancelar-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const reservaId = this.getAttribute('data-reserva-id');
        cancelarReserva(reservaId);
      });
    });
  }
  
  // Mostrar modal
  new bootstrap.Modal(document.getElementById('infoModal')).show();
});

//Canselar Reserva
async function cancelarReserva(reservaId) {
  const { isConfirmed } = await Swal.fire({
    title: '¿Cancelar reserva?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'No, mantener'
  });

  if (isConfirmed) {
    const reservas = JSON.parse(localStorage.getItem('reservas')) || [];
    
    // Encontrar el índice correcto de la reserva
    const reservaIndex = reservas.findIndex(reserva => {
      // Si la reserva tiene ID, comparamos con él, sino usamos el índice original
      return reserva.id ? reserva.id.toString() === reservaId.toString() : false;
    });
    
    // Si no encontramos por ID, intentamos por índice numérico
    const indexToDelete = reservaIndex !== -1 ? reservaIndex : parseInt(reservaId);
    
    if (indexToDelete >= 0 && indexToDelete < reservas.length) {
      reservas.splice(indexToDelete, 1);
      localStorage.setItem('reservas', JSON.stringify(reservas));
      
      // Recargar las reservas (usando el mismo código que en el click de misReservasBtn)
      misReservasBtn.click();
      
      Swal.fire(
        'Cancelada!',
        'Tu reserva ha sido cancelada.',
        'success'
      );
    } else {
      Swal.fire(
        'Error',
        'No se pudo encontrar la reserva a cancelar.',
        'error'
      );
    }
  }
}