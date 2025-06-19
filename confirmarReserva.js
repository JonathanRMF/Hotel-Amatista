document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("habitacion-seleccionada");
  
  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const idsSeleccionados = urlParams.get('habitacionesIds')?.split(',') || [];
  const fechaInicio = urlParams.get('fechaInicio');
  const fechaFin = urlParams.get('fechaFin');
  const adultos = urlParams.get('adultos');
  const niños = urlParams.get('niños');
  const noches = urlParams.get('noches');
  const total = urlParams.get('total');

  // Mostrar alerta si no hay habitaciones seleccionadas
  if (idsSeleccionados.length === 0 || !idsSeleccionados[0]) {
    contenedor.innerHTML = `
      <div class="alert alert-warning">
        No se ha seleccionado ninguna habitación.
        <a href="habitaciones.html" class="alert-link">Volver a selección</a>
      </div>`;
    return;
  }

  // Formateador de fechas
  const formatoFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Cargar y mostrar habitaciones
  fetch("habitaciones.json")
    .then(response => response.json())
    .then(habitaciones => {
      const habitacionesSeleccionadas = habitaciones.filter(h => 
        idsSeleccionados.includes(h.id.toString())
      );

      if (habitacionesSeleccionadas.length === 0) {
        contenedor.innerHTML = `
          <div class="alert alert-danger">
            No se encontraron las habitaciones seleccionadas.
            <a href="habitaciones.html" class="alert-link">Volver a selección</a>
          </div>`;
        return;
      }

      let htmlHabitaciones = habitacionesSeleccionadas.map(habitacion => `
        <div class="card room-card mb-3">
          <div class="card-body">
            <h4 class="room-title mb-3">${habitacion.nombre}</h4>
            <img src="${habitacion.imagen}" class="img-fluid rounded mb-3" alt="${habitacion.nombre}">
            <h5 class="text-primary mb-3">$${habitacion.precio.toLocaleString()} <small class="text-muted">por noche</small></h5>
          </div>
        </div>
      `).join('');

      const htmlResumen = `
        <div class="card mt-4">
          <div class="card-body">
            <h3 class="room-title mb-3">Resumen de la Reserva</h3>
            <div class="mb-3">
              <h5 class="mb-2">Periodo de estadía</h5>
              <p>${formatoFecha(fechaInicio)} - ${formatoFecha(fechaFin)} (${noches} noches)</p>
              <h5 class="mb-2">Huéspedes</h5>
              <p>${adultos} adulto${adultos > 1 ? 's' : ''}, ${niños} niño${niños > 1 ? 's' : ''}</p>
            </div>
            <div class="border-top pt-3">
              <div class="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span>$${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      contenedor.innerHTML = htmlHabitaciones + htmlResumen;
    })
    .catch(error => {
      contenedor.innerHTML = `
        <div class="alert alert-danger">
          Error al cargar los datos: ${error.message}
          <a href="habitacion.html" class="alert-link">Volver a selección</a>
        </div>`;
      console.error("Error:", error);
    });

  // Control de formularios y sesión
  const formRegistro = document.getElementById("formRegistro");
  const btnLogin = document.getElementById("loginBtn");
  const btnSesion = document.getElementById("btnSesion");
  const menuUsuario = document.getElementById("menuUsuario");

  // Limpiar errores de formulario
  const limpiarErrores = () => {
    const inputs = formRegistro.querySelectorAll(".form-control");
    inputs.forEach(input => input.classList.remove("is-invalid", "is-valid"));
    document.getElementById("confirmFeedback").textContent = "";
  };

  // Mostrar modal de login
  const mostrarLogin = () => {
    const loginModal = new bootstrap.Modal(document.getElementById("modalLogin"));
    loginModal.show();
  };

  // Registrar nuevo usuario
  formRegistro.addEventListener("submit", function(e) {
    e.preventDefault();
    limpiarErrores();
    
    const nombre = document.getElementById("regNombre").value.trim();
    const apellido = document.getElementById("regApellido").value.trim();
    const correo = document.getElementById("regCorreo").value.trim();
    const contraseña = document.getElementById("regContraseña").value;
    const confirmar = document.getElementById("regConfirmar").value;

    let validado = true;

    // Validación de nombre
    if (nombre === "") {
      document.getElementById("regNombre").classList.add("is-invalid");
      document.getElementById("regNombreFeedback").textContent = "Campo obligatorio";
      validado = false;
    }

    // Validación de apellido
    if (apellido === "") {
      document.getElementById("regApellido").classList.add("is-invalid");
      document.getElementById("regApellidoFeedback").textContent = "Campo obligatorio";
      validado = false;
    }

    // Validación de correo
    if (correo === "" || !/\S+@\S+\.\S+/.test(correo)) {
      document.getElementById("regCorreo").classList.add("is-invalid");
      document.getElementById("regCorreoFeedback").textContent = correo === "" ? "Campo obligatorio" : "Correo inválido";
      validado = false;
    }

    // Validación de contraseña
    if (contraseña.length < 8) {
      document.getElementById("regContraseña").classList.add("is-invalid");
      document.getElementById("regContraseñaFeedback").textContent = "Debe tener al menos 8 caracteres";
      validado = false;
    }

    // Validación de confirmación de contraseña
    if (contraseña !== confirmar || confirmar === "") {
      document.getElementById("regConfirmar").classList.add("is-invalid");
      document.getElementById("confirmFeedback").textContent = confirmar === "" ? "Campo obligatorio" : "Las contraseñas no coinciden.";
      validado = false;
    }

    if (validado) {
      const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
      if (usuarios.some(u => u.correo === correo)) {
        alert("Este correo ya está registrado.");
        return;
      }

      const nuevoUsuario = {
        nombre,
        apellido,
        correo,
        contraseña: btoa(contraseña)
      };
      
      usuarios.push(nuevoUsuario);
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
      
      // Mostrar mensaje de éxito y limpiar formulario
      const mensajeExito = document.getElementById("mensajeExitoRegistro");
      mensajeExito.textContent = "Registro exitoso";
      mensajeExito.classList.remove("d-none");
      formRegistro.reset();

      setTimeout(() => {
        mensajeExito.classList.add("d-none");
        // Cerrar modal y mostrar login
        const modalRegistro = document.getElementById("modalRegistro");
        if (modalRegistro) {
          modalRegistro.classList.remove("show");
          modalRegistro.style.display = "none";
          document.body.classList.remove("modal-open");
          const backdrop = document.querySelector(".modal-backdrop");
          if (backdrop) backdrop.remove();
        }
        mostrarLogin();
      }, 1000);
    }
  });

  // Iniciar sesión
  btnLogin.addEventListener("click", function(e) {
    e.preventDefault();
    
    const correo = document.getElementById("inputcorreo").value.trim();
    const contraseña = document.getElementById("inputcontraseña").value;

    // Limpiar feedback previo
    document.getElementById("emailFeedback").textContent = "";
    document.getElementById("passwordFeedback").textContent = "";
    document.getElementById("inputcorreo").classList.remove("is-invalid");
    document.getElementById("inputcontraseña").classList.remove("is-invalid");

    if (!correo || !contraseña) {
      if (!correo) {
        document.getElementById("inputcorreo").classList.add("is-invalid");
        document.getElementById("emailFeedback").textContent = "Campo obligatorio";
      }
      if (!contraseña) {
        document.getElementById("inputcontraseña").classList.add("is-invalid");
        document.getElementById("passwordFeedback").textContent = "Campo obligatorio";
      }
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuario = usuarios.find(u => u.correo === correo && atob(u.contraseña) === contraseña);

    if (usuario) {
      sessionStorage.setItem("usuarioActivo", JSON.stringify(usuario));
      mostrarUsuarioLogueado();
      actualizarDatosUsuario();

      // Mostrar feedback positivo
      document.getElementById("inputcorreo").classList.add("is-valid");
      document.getElementById("inputcontraseña").classList.add("is-valid");

      const mensajeExito = document.getElementById("mensajeExitoLogin");
      mensajeExito.textContent = "Inicio de sesión exitoso";
      mensajeExito.classList.remove("d-none");

      setTimeout(() => {
        mensajeExito.classList.add("d-none");
        location.reload();
      }, 1000);
    } else {
      document.getElementById("inputcorreo").classList.add("is-invalid");
      document.getElementById("inputcontraseña").classList.add("is-invalid");
      document.getElementById("passwordFeedback").textContent = "Correo o contraseña incorrectos";
    }
  });

  // Mostrar/ocultar menú de usuario
  btnSesion.addEventListener("click", () => {
    if (sessionStorage.getItem("usuarioActivo")) {
      menuUsuario.classList.toggle("d-none");
    }
  });

  // Cerrar sesión
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    sessionStorage.clear();
    location.reload();
  });

  // Inicialización
  mostrarUsuarioLogueado();
  actualizarDatosUsuario();
});

// Función para actualizar los datos del usuario en los inputs
function actualizarDatosUsuario() {
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  if (usuarioActivo) {
    // Obtener elementos del DOM
    const inputNombre = document.getElementById("Nombre");
    const inputApellido = document.getElementById("Apellido");
    const inputMail = document.getElementById("Mail");
    const inputCmail = document.getElementById("Cmail");

    // Asignar valores si los elementos existen
    if (inputNombre) inputNombre.value = usuarioActivo.nombre || "";
    if (inputApellido) inputApellido.value = usuarioActivo.apellido || "";
    if (inputMail) inputMail.value = usuarioActivo.correo || "";
    if (inputCmail) inputCmail.value = usuarioActivo.correo || "";

    //Bloqueo de los Inputs
    inputNombre.disabled = true;
    inputApellido.disabled = true;
    inputMail.disabled = true;
    inputCmail.disabled = true;
  }
}

// Función para mostrar el nombre del usuario en la interfaz
function mostrarUsuarioLogueado() {
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo"));
  const btnSesion = document.getElementById("btnSesion");
  const menuUsuario = document.getElementById("menuUsuario");

  if (usuarioActual && btnSesion) {
    btnSesion.innerHTML = `
      <img src="Imagenes/Logos/logousuario.png" class="icono-usuario">
      <span id="nombreUsuarioHeader">${usuarioActual.nombre}</span>
    `;
    
    btnSesion.removeAttribute("data-bs-toggle");
    btnSesion.removeAttribute("data-bs-target");
    menuUsuario.classList.add("d-none");
  }
}

// Cerrar menú al hacer clic fuera
document.addEventListener("click", function(e) {
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

// Función para validar y guardar la reserva
function guardarReserva() {
  // Obtener elementos del formulario
  const nombreInput = document.getElementById("Nombre");
  const apellidoInput = document.getElementById("Apellido");
  const mailInput = document.getElementById("Mail");
  const cmailInput = document.getElementById("Cmail");
  const metodoPagoSelect = document.querySelector("select[name='metodoPago']");
  
  const nombre = nombreInput.value.trim();
  const apellido = apellidoInput.value.trim();
  const email = mailInput.value.trim();
  const confirmEmail = cmailInput.value.trim();
  const metodoPago = metodoPagoSelect.value;
  
  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const idsHabitaciones = urlParams.get('habitacionesIds')?.split(',') || [];
  const fechaInicio = urlParams.get('fechaInicio');
  const fechaFin = urlParams.get('fechaFin');
  const adultos = urlParams.get('adultos');
  const niños = urlParams.get('niños');
  const noches = urlParams.get('noches');
  const total = urlParams.get('total');

  // Validar campos
  let validado = true;

  // Validación de nombre
  if (nombre === "") {
    nombreInput.classList.add("is-invalid");
    document.getElementById("nombreFeedback").textContent = "Campo obligatorio";
    validado = false;
  }

  // Validación de apellido
  if (apellido === "") {
    apellidoInput.classList.add("is-invalid");
    document.getElementById("apellidoFeedback").textContent = "Campo obligatorio";
    validado = false;
  }
  
  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    mailInput.classList.add("is-invalid");
    document.getElementById("mailFeedback").textContent = "Campo obligatorio";
    validado = false;
  } else if (!emailRegex.test(email)) {
    mailInput.classList.add("is-invalid");
    document.getElementById("mailFeedback").textContent = "El email no tiene un formato válido";
    validado = false;
  }
  
  // Validación de confirmación de email
  if (email !== confirmEmail) {
    cmailInput.classList.add("is-invalid");
    document.getElementById("cmailFeedback").textContent = "Los emails no coinciden";
    validado = false;
  }

  // Si hay errores, detener el proceso
  if (!validado) {
    return false;
  }

  // Crear objeto de reserva
  const nuevaReserva = {
    email,
    idsHabitaciones,
    fechaInicio,
    fechaFin,
    adultos,
    niños,
    metodoPago,
    fechaReserva: new Date().toISOString() // Agregar fecha/hora de la reserva
  };

  // Obtener reservas existentes o inicializar array vacío
  const reservasExistentes = JSON.parse(localStorage.getItem('reservas')) || [];

  // Agregar la nueva reserva
  reservasExistentes.push(nuevaReserva);

  // Guardar en localStorage
  localStorage.setItem('reservas', JSON.stringify(reservasExistentes));

  window.location.href = 'https://jonathanrmf.github.io/Hotel-Amatista/'; 

  return true;
}

// Asignar la función al botón de confirmar
document.addEventListener("DOMContentLoaded", () => {
  const btnConfirmar = document.getElementById("confirmar");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", function(e) {
      e.preventDefault();
      guardarReserva();
    });
  }
});
