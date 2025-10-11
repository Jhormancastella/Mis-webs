// Variables globales
let currentWebsite = null;
let isDarkMode = false;
let currentFilter = 'all';
let isAdmin = false;
let projects = [];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupThemeToggle();
    setupFilters();
    setupSearch();
    setupScrollTop();
    setCurrentYear();
    loadProjects();
});

// Configurar año actual
function setCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// Configurar toggle de tema
function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('darkMode') === 'true';
    if (saved) {
        document.body.classList.add('dark');
        isDarkMode = true;
    }

    toggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode);
    });
}

// Configurar filtros
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterProjects();
        });
    });
}

// Configurar búsqueda
function setupSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', filterProjects);
}

// Filtrar proyectos
function filterProjects() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const cards = document.querySelectorAll('.website-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const category = card.dataset.category;
        const name = card.querySelector('.website-name').textContent.toLowerCase();
        const description = card.querySelector('.website-description').textContent.toLowerCase();

        const matchesFilter = currentFilter === 'all' || category === currentFilter;
        const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);

        if (matchesFilter && matchesSearch) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });

    updateProjectCount(visibleCount);
    
    const noResults = document.getElementById('noResults');
    if (visibleCount === 0) {
        noResults.classList.add('show');
    } else {
        noResults.classList.remove('show');
    }
}

// Actualizar contador de proyectos
function updateProjectCount(count) {
    const countElement = document.getElementById('projectCount');
    countElement.textContent = `Mostrando ${count} proyecto${count !== 1 ? 's' : ''}`;
}

// Configurar botón de scroll hacia arriba
function setupScrollTop() {
    const scrollTopBtn = document.getElementById('scrollTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Cargar proyectos desde Firebase
function loadProjects() {
    const websiteGrid = document.getElementById('websiteGrid');
    websiteGrid.innerHTML = '<div class="loading">Cargando proyectos...</div>';

    db.collection('projects').orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            projects = [];
            querySnapshot.forEach((doc) => {
                projects.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderProjects(projects);
            updateProjectCount(projects.length);
            
            if (isAdmin) {
                renderAdminProjects(projects);
            }
        })
        .catch((error) => {
            console.error("Error cargando proyectos: ", error);
            websiteGrid.innerHTML = '<div class="no-results show">Error cargando proyectos</div>';
        });
}

// Renderizar proyectos en la cuadrícula
function renderProjects(projects) {
    const websiteGrid = document.getElementById('websiteGrid');
    
    if (projects.length === 0) {
        websiteGrid.innerHTML = '<div class="no-results show">No hay proyectos disponibles</div>';
        return;
    }
    
    websiteGrid.innerHTML = '';
    
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'website-card';
        card.dataset.category = project.category;
        card.style.animationDelay = `${(index % 6) * 0.1 + 0.1}s`;
        
        card.innerHTML = `
            <img class="favicon loading" alt="${project.name}" src="${project.icon}">
            <div class="website-name">${project.name}</div>
            <div class="website-description">${project.description}</div>
            <div class="status">Cargando...</div>
        `;
        
        websiteGrid.appendChild(card);
        
        // Cargar icono
        const favicon = card.querySelector('.favicon');
        const statusElement = card.querySelector('.status');
        loadFavicon(favicon, project.icon, project.icon, statusElement);
        
        // Agregar evento de clic
        card.addEventListener('click', function() {
            openModal(project);
        });
    });
}

// Cargar favicon
function loadFavicon(faviconElement, mainSrc, fallbackSrc, statusElement) {
    const img = new Image();
    img.onload = () => {
        faviconElement.src = mainSrc;
        faviconElement.classList.remove('loading');
        statusElement.textContent = '✓ Cargado';
        statusElement.style.color = '#27ae60';
    };
    img.onerror = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
            faviconElement.src = fallbackSrc;
            faviconElement.classList.add('fallback');
            faviconElement.classList.remove('loading');
            statusElement.textContent = '⚠ Fallback';
            statusElement.style.color = '#f39c12';
        };
        fallbackImg.onerror = () => {
            faviconElement.src = 'image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mmg0YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg==';
            faviconElement.classList.remove('loading');
            statusElement.textContent = '✗ Sin icono';
            statusElement.style.color = '#e74c3c';
        };
        fallbackImg.src = fallbackSrc;
    };
    img.src = mainSrc;
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de administración
    document.getElementById('adminToggle').addEventListener('click', openAuthModal);
    
    // Cerrar panel de administración
    document.getElementById('adminClose').addEventListener('click', closeAdminPanel);
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeAuthModal();
        }
    });
}

// Abrir modal de autenticación
function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('adminPassword').focus();
}

// Cerrar modal de autenticación
function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('adminPassword').value = '';
}

// Autenticar administrador
function authenticate() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === 'Rosy123') {
        isAdmin = true;
        closeAuthModal();
        openAdminPanel();
        renderAdminProjects(projects);
    } else {
        alert('Contraseña incorrecta');
    }
}

// Abrir panel de administración
function openAdminPanel() {
    document.getElementById('adminPanel').classList.add('active');
}

// Cerrar panel de administración
function closeAdminPanel() {
    document.getElementById('adminPanel').classList.remove('active');
    isAdmin = false;
}

// Renderizar proyectos en el panel de administración
function renderAdminProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<p>No hay proyectos</p>';
        return;
    }
    
    projectsList.innerHTML = '';
    
    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'admin-project-item';
        projectItem.innerHTML = `
            <div class="admin-project-header">
                <div class="admin-project-name">${project.name}</div>
                <div class="admin-project-actions">
                    <button class="admin-project-btn btn-edit" onclick="editProject('${project.id}')">Editar</button>
                    <button class="admin-project-btn btn-delete" onclick="deleteProject('${project.id}')">Eliminar</button>
                </div>
            </div>
            <div class="admin-project-details">
                <p><strong>Categoría:</strong> ${getCategoryName(project.category)}</p>
                <p><strong>URL:</strong> ${project.url}</p>
                <p><strong>GitHub:</strong> ${project.github || 'No especificado'}</p>
            </div>
        `;
        
        projectsList.appendChild(projectItem);
    });
}

// Obtener nombre de categoría
function getCategoryName(category) {
    const categories = {
        'tool': '🔧 Herramientas',
        'map': '🗺️ Mapas',
        'fun': '🎮 Entretenimiento'
    };
    return categories[category] || category;
}

// Agregar nuevo proyecto
function addProject() {
    const name = document.getElementById('projectName').value;
    const url = document.getElementById('projectUrl').value;
    const icon = document.getElementById('projectIcon').value;
    const github = document.getElementById('projectGithub').value;
    const description = document.getElementById('projectDescription').value;
    const category = document.getElementById('projectCategory').value;
    
    if (!name || !url || !icon || !description) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    const projectData = {
        name,
        url,
        icon,
        github,
        description,
        category,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('projects').add(projectData)
        .then(() => {
            alert('Proyecto agregado exitosamente');
            clearAdminForm();
            loadProjects();
        })
        .catch((error) => {
            console.error("Error agregando proyecto: ", error);
            alert('Error al agregar el proyecto');
        });
}

// Limpiar formulario de administración
function clearAdminForm() {
    document.getElementById('projectName').value = '';
    document.getElementById('projectUrl').value = '';
    document.getElementById('projectIcon').value = '';
    document.getElementById('projectGithub').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectCategory').value = 'tool';
}

// Editar proyecto
function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectUrl').value = project.url;
        document.getElementById('projectIcon').value = project.icon;
        document.getElementById('projectGithub').value = project.github || '';
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectCategory').value = project.category;
        
        // Cambiar el botón a "Actualizar"
        const addButton = document.querySelector('.admin-form button');
        addButton.textContent = 'Actualizar Proyecto';
        addButton.onclick = function() { updateProject(projectId); };
        
        // Scroll al formulario
        document.querySelector('.admin-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// Actualizar proyecto
function updateProject(projectId) {
    const name = document.getElementById('projectName').value;
    const url = document.getElementById('projectUrl').value;
    const icon = document.getElementById('projectIcon').value;
    const github = document.getElementById('projectGithub').value;
    const description = document.getElementById('projectDescription').value;
    const category = document.getElementById('projectCategory').value;
    
    if (!name || !url || !icon || !description) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    const projectData = {
        name,
        url,
        icon,
        github,
        description,
        category,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('projects').doc(projectId).update(projectData)
        .then(() => {
            alert('Proyecto actualizado exitosamente');
            clearAdminForm();
            resetAddButton();
            loadProjects();
        })
        .catch((error) => {
            console.error("Error actualizando proyecto: ", error);
            alert('Error al actualizar el proyecto');
        });
}

// Restablecer botón de agregar
function resetAddButton() {
    const addButton = document.querySelector('.admin-form button');
    addButton.textContent = 'Agregar Proyecto';
    addButton.onclick = function() { addProject(); };
}

// Eliminar proyecto
function deleteProject(projectId) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
        db.collection('projects').doc(projectId).delete()
            .then(() => {
                alert('Proyecto eliminado exitosamente');
                loadProjects();
            })
            .catch((error) => {
                console.error("Error eliminando proyecto: ", error);
                alert('Error al eliminar el proyecto');
            });
    }
}

// Abrir modal de proyecto
function openModal(project) {
    currentWebsite = project;

    document.getElementById('modalIcon').src = project.icon;
    document.getElementById('modalTitle').textContent = project.name;
    document.getElementById('modalDescription').textContent = project.description;

    document.getElementById('websiteModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    document.querySelector('.modal-btn').focus();
}

// Cerrar modal
function closeModal() {
    document.getElementById('websiteModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Visitar sitio web
function visitWebsite() {
    if (currentWebsite) {
        window.open(currentWebsite.url.trim(), '_blank', 'noopener,noreferrer');
        closeModal();
    }
}
