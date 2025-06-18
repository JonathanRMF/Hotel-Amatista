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

  // 1. Calcular número de semana ISO (1-52/53)
  const numeroSemana = getISOWeeks(checkInDate);
  
  // 2. Calcular noches de estadía
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 3. Formato ISO de fecha (YYYY-MM-DD) como backup
  const fechaISO = checkInDate.toISOString().split('T')[0];

  // Construir URL
  const urlParams = new URLSearchParams({
    semana: numeroSemana,    // Número de semana (prioridad)
    fecha: fechaISO,         // Fecha ISO como alternativa
    noches: noches,
    habitaciones: rooms,
    adultos: adults,
    niños: children
  });

  window.location.href = `habitacion.html?${urlParams.toString()}`;
}

// Función para calcular semana ISO (1-52/53)
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