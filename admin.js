// admin.js - Versión simplificada: autenticación local con sessionStorage
import { db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from './firebase-config.js';

let editingId = null;

// Verificar si ya inició sesión
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'block';
  loadProjects();
} else {
  document.getElementById('adminSection').style.display = 'none';
}

// === Función de login local ===
function login() {
  const password = document.getElementById('password').value;
  if (password === 'Rosy123') {
    sessionStorage.setItem('adminLoggedIn', 'true');
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    loadProjects();
  } else {
    alert('❌ Contraseña incorrecta');
  }
}

// === Cerrar sesión ===
function logout() {
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('adminSection').style.display = 'none';
  document.getElementById('authSection').style.display = 'block';
  editingId = null;
  document.getElementById('password').value = '';
}

// === Guardar o actualizar proyecto ===
document.getElementById('projectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const project = {
    title: document.getElementById('title').value.trim(),
    url: document.getElementById('url').value.trim(),
    logoUrl: document.getElementById('logoUrl').value.trim() || '',
    githubUrl: document.getElementById('githubUrl').value.trim() || '',
    description: document.getElementById('description').value.trim(),
    category: document.getElementById('category').value,
    createdAt: new Date()
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "projects", editingId), project);
      editingId = null;
      alert('✅ Proyecto actualizado');
    } else {
      await addDoc(collection(db, "projects"), project);
      alert('✅ Proyecto agregado');
    }
    document.getElementById('projectForm').reset();
    loadProjects();
  } catch (err) {
    console.error('Error al guardar:', err);
    alert('❌ No se pudo guardar el proyecto. Revisa la consola.');
  }
});

// === Cargar proyectos desde Firestore ===
async function loadProjects() {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list = document.getElementById('projectsList');
    
    if (snapshot.empty) {
      list.innerHTML = '<p>📭 No hay proyectos aún.</p>';
      return;
    }

    list.innerHTML = '';
    snapshot.forEach(doc => {
      const p = doc.data();
      const div = document.createElement('div');
      div.className = 'project-item';
      div.innerHTML = `
        <strong>${p.title}</strong> (${p.category})<br>
        ${p.description}<br>
        <button type="button" onclick="editProject('${doc.id}')">✏️ Editar</button>
        <button type="button" onclick="deleteProject('${doc.id}')">🗑️ Eliminar</button>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Error al cargar:', err);
    document.getElementById('projectsList').innerHTML = '❌ Error de conexión con Firebase';
  }
}

// === Editar proyecto ===
window.editProject = async (id) => {
  const snapshot = await getDocs(collection(db, "projects"));
  const found = snapshot.docs.find(d => d.id === id);
  if (found) {
    const p = found.data();
    editingId = id;
    document.getElementById('title').value = p.title;
    document.getElementById('url').value = p.url;
    document.getElementById('logoUrl').value = p.logoUrl || '';
    document.getElementById('githubUrl').value = p.githubUrl || '';
    document.getElementById('description').value = p.description;
    document.getElementById('category').value = p.category;
  }
};

// === Eliminar proyecto ===
window.deleteProject = async (id) => {
  if (confirm('⚠️ ¿Eliminar este proyecto?')) {
    try {
      await deleteDoc(doc(db, "projects", id));
      alert('🗑️ Proyecto eliminado');
      loadProjects();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('❌ No se pudo eliminar');
    }
  }
};
