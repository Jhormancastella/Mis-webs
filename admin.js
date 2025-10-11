
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
    alert('✅ Guardado exitosamente');
    document.getElementById('projectForm').reset();
    loadProjects();
  } catch (err) {
    console.error(err);
    alert('❌ Error: ' + (err.message || 'No se pudo guardar'));
  }
});

async function login() {
  const password = document.getElementById('password').value;
  if (password !== 'Rosy123') {
    alert('❌ Contraseña incorrecta');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, 'admin@portfolio.com', 'Rosy123');
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    loadProjects();
  } catch (err) {
    alert('❌ Error de autenticación');
  }
}

function logout() {
  signOut(auth);
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('adminSection').style.display = 'none';
  editingId = null;
}

async function loadProjects() {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const list = document.getElementById('projectsList');
  list.innerHTML = '';
  snapshot.forEach(doc => {
    const p = doc.data();
    const div = document.createElement('div');
    div.className = 'project-item';
    div.innerHTML = `
      <strong>${p.title}</strong> (${p.category})<br>
      ${p.description}<br>
      <button type="button" onclick="editProject('${doc.id}')">Editar</button>
      <button type="button" onclick="deleteProject('${doc.id}')">Eliminar</button>
    `;
    list.appendChild(div);
  });
}

window.editProject = async (id) => {
  const docSnap = await getDocs(collection(db, "projects"));
  const projectDoc = docSnap.docs.find(d => d.id === id);
  if (projectDoc) {
    const p = projectDoc.data();
    editingId = id;
    document.getElementById('title').value = p.title;
    document.getElementById('url').value = p.url;
    document.getElementById('logoUrl').value = p.logoUrl;
    document.getElementById('githubUrl').value = p.githubUrl;
    document.getElementById('description').value = p.description;
    document.getElementById('category').value = p.category;
  }
};

window.deleteProject = async (id) => {
  if (confirm('¿Eliminar?')) {
    await deleteDoc(doc(db, "projects", id));
    loadProjects();
  }
};
