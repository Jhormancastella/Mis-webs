import { auth, db, signInWithEmailAndPassword, signOut, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from './firebase-config.js';

let editingId = null;

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
    } else {
      await addDoc(collection(db, "projects"), project);
    }
    alert('✅ Proyecto guardado');
    document.getElementById('projectForm').reset();
    loadProjects();
  } catch (err) {
    console.error(err);
    alert('❌ Error al guardar: ' + (err.message || 'Desconocido'));
  }
});

async function login() {
  const password = document.getElementById('password').value;
  if (!password) {
    alert('⚠️ Por favor ingresa la contraseña');
    return;
  }

  // Validar localmente (opcional, pero útil para evitar llamadas innecesarias)
  if (password !== 'Rosy123') {
    alert('❌ Contraseña incorrecta');
    return;
  }

  try {
    // Intentar iniciar sesión con Firebase
    await signInWithEmailAndPassword(auth, 'admin@portfolio.com', password);
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    loadProjects();
  } catch (err) {
    console.error('Error de Firebase:', err);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      alert('❌ Contraseña incorrecta');
    } else if (err.code === 'auth/user-not-found') {
      alert('❌ Usuario no registrado. Contacta al administrador.');
    } else {
      alert('❌ Error: ' + err.message);
    }
  }
}

function logout() {
  signOut(auth).then(() => {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('adminSection').style.display = 'none';
    editingId = null;
    document.getElementById('password').value = '';
  }).catch(console.error);
}

async function loadProjects() {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list = document.getElementById('projectsList');
    list.innerHTML = snapshot.empty
      ? '<p>📭 No hay proyectos aún.</p>'
      : snapshot.docs.map(doc => {
          const p = doc.data();
          return `
            <div class="project-item">
              <strong>${p.title}</strong> (${p.category})<br>
              ${p.description}<br>
              <button type="button" onclick="editProject('${doc.id}')">✏️ Editar</button>
              <button type="button" onclick="deleteProject('${doc.id}')">🗑️ Eliminar</button>
            </div>
          `;
        }).join('');
  } catch (err) {
    console.error(err);
    document.getElementById('projectsList').innerHTML = '❌ Error al cargar proyectos';
  }
}

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

window.deleteProject = async (id) => {
  if (confirm('⚠️ ¿Eliminar este proyecto?')) {
    try {
      await deleteDoc(doc(db, "projects", id));
      loadProjects();
    } catch (err) {
      alert('❌ Error al eliminar');
    }
  }
};
