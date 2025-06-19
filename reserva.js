let checkInDate = null;
let checkOutDate = null;

flatpickr("#calendarContainer", {
  mode: "range",
  inline: true,
  minDate: "today",
  showMonths: 2,
  onChange: function (selectedDates, dateStr, instance) {
    if (selectedDates.length === 2) {
      checkInDate = selectedDates[0];
      checkOutDate = selectedDates[1];

      const formatDate = (date) => {
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };

      const formattedRange = `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`;
      document.getElementById("dateInput").value = formattedRange;

      // Fuerza el redibujado del calendario para actualizar las clases .inRange
      instance.redraw();
    }
  },
  onDayCreate: function(dObj, dStr, fp, dayElem) {
    // Limpia la clase .inRange en cada día
    dayElem.classList.remove("inRange");

    const date = dayElem.dateObj;
    if (checkInDate && checkOutDate && date > checkInDate && date < checkOutDate) {
      dayElem.classList.add("inRange");
    }
  },
});

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

function verificarYRedirigir() {
  if (!checkInDate || !checkOutDate) {
    const mensaje = document.getElementById("mensajeFechas");
    mensaje.classList.remove("d-none");

    // Ocultar automáticamente luego de 3 segundos
    setTimeout(() => {
      mensaje.classList.add("d-none");
    }, 3000);

    return false;
  }

  // 1. Calcular número de semana ISO (1-52/53) para inicio y fin
  const semanaInicio = getISOWeeks(checkInDate);
  const semanaFin = getISOWeeks(checkOutDate);
  
  // 2. Calcular noches de estadía
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 3. Formatear fechas como YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  const fechaInicio = formatDate(checkInDate);
  const fechaFin = formatDate(checkOutDate);

  // Construir URL con todos los parámetros
  const urlParams = new URLSearchParams({
    fechaInicio: fechaInicio,
    fechaFin: fechaFin,
    semanaInicio: semanaInicio,
    semanaFin: semanaFin,
    noches: noches,
    habitaciones: rooms,
    adultos: adults,
    niños: children
  });

  window.location.href = `habitacion.html?${urlParams.toString()}`;
}

// Función para calcular semana ISO (1-52/53) - se mantiene igual
function getISOWeeks(date) {
  const target = new Date(date);
  const dayNr = (date.getDay() + 6) % 7; // Ajuste para que semana empiece en Lunes
  
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

// Asignar al botón
document.getElementById("bookButton").addEventListener("click", verificarYRedirigir);