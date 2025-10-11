// main.js
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('proyectos-container');
    
    // Verificar que db esté disponible
    if (typeof db === 'undefined') {
        console.error('Firebase no está inicializado correctamente');
        return;
    }
    
    // Leer proyectos de Firestore
    db.collection('proyectos').onSnapshot((snapshot) => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-12"><p class="text-center">No hay proyectos aún.</p></div>';
            return;
        }
        
        snapshot.forEach((doc) => {
            const proyecto = doc.data();
            const card = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <img src="${proyecto.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                             class="card-img-top" 
                             alt="${proyecto.nombre}" 
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Error+de+Imagen'">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${proyecto.nombre}</h5>
                            <p class="card-text flex-grow-1">${proyecto.descripcion || 'Sin descripción'}</p>
                            <p><small class="text-muted">Categoría: ${proyecto.categoria || 'Sin categoría'}</small></p>
                            <div class="mt-auto">
                                <a href="${proyecto.url_pagina || '#'}" class="btn btn-primary" target="_blank">Ver Proyecto</a>
                                <a href="${proyecto.url_repo || '#'}" class="btn btn-outline-secondary" target="_blank">Repositorio</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    }, (error) => {
        console.error('Error al cargar proyectos:', error);
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar proyectos</p></div>';
    });
});
