const sidebarExtendido = document.getElementById("sidebar-extendido");
const mainSidebar = document.getElementById("sidebar");


function mostrarMenu() {
  sidebarExtendido.classList.add("visible");
  mainSidebar.classList.add("oculto");
}


// Cuando el mouse sale del sidebar extendido
sidebarExtendido.addEventListener("mouseleave", () => {
  sidebarExtendido.classList.remove("visible");
  mainSidebar.classList.remove("oculto");
});


// Mostrar sección en navbar superior al hacer scroll
const sectionTitle = document.getElementById("section-title");
const secciones = document.querySelectorAll("section");


window.addEventListener("scroll", () => {
  let current = "";
  secciones.forEach((sec) => {
    const top = window.scrollY;
    const offset = sec.offsetTop - 100;
    if (top >= offset) {
      current = sec.getAttribute("id");
    }
  });


  switch (current) {
    case "inicio":
      sectionTitle.textContent = "Inicio";
      break;
    case "proposito":
      sectionTitle.textContent = "Propósito";
      break;
    case "servicios":
      sectionTitle.textContent = "Servicios";
      break;
    case "contacto":
      sectionTitle.textContent = "Reservar";
      break;
    default:
      sectionTitle.textContent = "";
  }
});

// Carga el menú desde el JSON
async function cargamenu() {
  try {
    // Limpiar contenedores antes de cargar nuevos datos
    document.getElementById('menu').innerHTML = '';
    document.getElementById('menu-postre').innerHTML = '';
    document.getElementById('menu-bebida').innerHTML = '';

    // Hacer todas las peticiones en paralelo
    const [menuResponse, postresResponse, bebidasResponse] = await Promise.all([
      fetch('./menu.json'),
      fetch('./menu_postres.json'),
      fetch('./menu_bebidas.json')
    ]);

    // Procesar los JSON (también en paralelo)
    const [menuArray, menupostresArray, menubebidaArray] = await Promise.all([
      menuResponse.json(),
      postresResponse.json(),
      bebidasResponse.json()
    ]);

    // Función reutilizable para crear tarjetas
    const crearCard = (item) => {
      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
      <div class="card">
<img src="${item.imagen}" class="card-img-top img-fluid card-img-fixed" alt="${item.nombre}">
<div class="card-body">
  <h5 class="card-title">${item.nombre}</h5>
  <p class="card-text">${item.descripcion}</p>
</div>
      </div>
      `;
      return card;
    };

    // Renderizar cada sección usando fragmentos para mejor rendimiento
    const renderizarSeccion = (contenedorId, items) => {
      const contenedor = document.getElementById(contenedorId);
      const fragment = document.createDocumentFragment();
      
      items.forEach(item => {
fragment.appendChild(crearCard(item));
      });

      contenedor.appendChild(fragment);
    };

    // Llenar las secciones
    renderizarSeccion('menu', menuArray);
    renderizarSeccion('menu-postre', menupostresArray);
    renderizarSeccion('menu-bebida', menubebidaArray);

  } catch (error) {
    console.error("Error al cargar el menú:", error);
    document.getElementById('menu').innerHTML = `
      <div class="alert alert-danger">No se pudo cargar el menú. Recarga la página.</div>
    `;
  }
}

//indica cual ver
function ver(num) {
  const ids = ["infoHabitacion", "infoSpa", "infoGastronomia", "infoConfort"];
  // Ocultar todas las secciones con animación
  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element.classList.contains('mostrar')) {
      element.style.height = `${element.scrollHeight}px`;
      // Forzar reflow para la animación
      void element.offsetHeight;
      element.classList.remove('mostrar');
      element.style.height = '0';
    }
  });
  
  // Mostrar la sección seleccionada
  const selected = document.getElementById(ids[num]);
  selected.style.display = 'block';
  selected.style.height = '0';
  // Forzar reflow
  void selected.offsetHeight;
  selected.classList.add('mostrar');
  selected.style.height = `${selected.scrollHeight}px`;
  
  // Eliminar la altura después de la animación
  setTimeout(() => {
    if (selected.classList.contains('mostrar')) {
      selected.style.height = 'auto';
    }
  }, 550);
}

function suscribirse() {
  const inputEmail = document.getElementById('Novedades-email');
  const aprobado = document.getElementById('Novedades-aprobado');
  const error = document.getElementById('Novedades-error');

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailValido.test(inputEmail.value.trim())) {
    aprobado.style.display = 'block';
    error.style.display = 'none';
  } else {
    error.style.display = 'block';
    aprobado.style.display = 'none';
  }
}

// Función para mostrar/ocultar galería de imágenes
function mostrarGaleria(id) {
    // Ocultar todas las galerías primero
    document.querySelectorAll('.galeria-imagenes').forEach(galeria => {
galeria.classList.remove('active');
    });
    
    // Mostrar la galería seleccionada
    const galeria = document.getElementById(id);
    galeria.classList.toggle('active');
}

// Función para cerrar otros acordeones cuando se abre uno
function cerrarOtrosAcordeones(idActual) {
    const todosLosAcordeones = document.querySelectorAll('.collapse');
    todosLosAcordeones.forEach(acordeon => {
if (acordeon.id !== idActual && acordeon.classList.contains('show')) {
    const bsCollapse = new bootstrap.Collapse(acordeon, {
toggle: false
    });
    bsCollapse.hide();
}
    });
}

// Cerrar todos los acordeones al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const acordeones = document.querySelectorAll('.collapse');
    acordeones.forEach(acordeon => {
if (acordeon.classList.contains('show')) {
    const bsCollapse = new bootstrap.Collapse(acordeon, {
toggle: false
    });
    bsCollapse.hide();
}
    });
});