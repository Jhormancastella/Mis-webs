
import { auth, db } from "./firebase-config.js"
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let currentEditingId = null
let isDarkMode = false

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle()
  setupAuthListener()
  setupLoginForm()
  setupProjectForm()
  setupLogout()
})

function setupThemeToggle() {
  const saved = localStorage.getItem("darkMode") === "true"
  if (saved) {
    document.body.classList.add("dark")
    isDarkMode = true
  }

  const toggle = document.getElementById("themeToggle")
  if (toggle) {
    toggle.addEventListener("click", () => {
      isDarkMode = !isDarkMode
      document.body.classList.toggle("dark", isDarkMode)
      localStorage.setItem("darkMode", isDarkMode)
    })
  }
}

function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showAdminPanel()
      loadProjects()
    } else {
      showLoginScreen()
    }
  })
}

function showLoginScreen() {
  document.getElementById("loginScreen").style.display = "flex"
  document.getElementById("adminPanel").style.display = "none"
}

function showAdminPanel() {
  document.getElementById("loginScreen").style.display = "none"
  document.getElementById("adminPanel").style.display = "block"
}

function setupLoginForm() {
  const loginForm = document.getElementById("loginForm")
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const errorDiv = document.getElementById("loginError")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      errorDiv.textContent = ""
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      errorDiv.textContent = "Credenciales incorrectas. Intenta de nuevo."
    }
  })
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn")
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  })
}

function setupProjectForm() {
  const form = document.getElementById("projectForm")
  const cancelBtn = document.getElementById("cancelBtn")

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const projectData = {
      name: document.getElementById("projectName").value,
      category: document.getElementById("projectCategory").value,
      url: document.getElementById("projectUrl").value,
      icon: document.getElementById("projectIcon").value,
      github: document.getElementById("projectGithub").value || "",
      description: document.getElementById("projectDescription").value,
      updatedAt: serverTimestamp(),
    }

    try {
      if (currentEditingId) {
        // Update existing project
        const projectRef = doc(db, "projects", currentEditingId)
        await updateDoc(projectRef, projectData)
        alert("✅ Proyecto actualizado exitosamente")
      } else {
        // Add new project
        projectData.createdAt = serverTimestamp()
        await addDoc(collection(db, "projects"), projectData)
        alert("✅ Proyecto agregado exitosamente")
      }

      resetForm()
      loadProjects()
    } catch (error) {
      console.error("Error al guardar proyecto:", error)
      alert("❌ Error al guardar el proyecto. Intenta de nuevo.")
    }
  })

  cancelBtn.addEventListener("click", resetForm)
}

function resetForm() {
  document.getElementById("projectForm").reset()
  document.getElementById("projectId").value = ""
  currentEditingId = null
  document.getElementById("formTitle").textContent = "➕ Agregar Nuevo Proyecto"
  document.getElementById("submitBtn").textContent = "Agregar Proyecto"
  document.getElementById("cancelBtn").style.display = "none"
}

async function loadProjects() {
  try {
    const projectsRef = collection(db, "projects")
    const q = query(projectsRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const projectsList = document.getElementById("projectsList")
    projectsList.innerHTML = ""

    let count = 0
    querySnapshot.forEach((docSnap) => {
      count++
      const project = { id: docSnap.id, ...docSnap.data() }
      const projectItem = createProjectItem(project)
      projectsList.appendChild(projectItem)
    })

    document.getElementById("projectsCount").textContent = count

    if (count === 0) {
      projectsList.innerHTML =
        '<p style="text-align: center; padding: 40px; color: #666;">No hay proyectos. Agrega tu primer proyecto arriba.</p>'
    }
  } catch (error) {
    console.error("Error al cargar proyectos:", error)
  }
}

function createProjectItem(project) {
  const item = document.createElement("div")
  item.className = "project-item"

  const categoryEmojis = {
    tool: "🔧 Herramientas",
    map: "🗺️ Mapas",
    fun: "🎮 Entretenimiento",
  }

  item.innerHTML = `
        <img src="${project.icon}" alt="${project.name}" class="project-item-icon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mmg0YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg=='">
        <div class="project-item-info">
            <div class="project-item-name">${project.name}</div>
            <span class="project-item-category">${categoryEmojis[project.category] || project.category}</span>
            <div class="project-item-description">${project.description}</div>
        </div>
        <div class="project-item-actions">
            <button class="btn-edit" onclick="editProject('${project.id}')">✏️ Editar</button>
            <button class="btn-delete" onclick="deleteProject('${project.id}', '${project.name}')">🗑️ Eliminar</button>
        </div>
    `

  return item
}

window.editProject = async (projectId) => {
  try {
    const projectsRef = collection(db, "projects")
    const querySnapshot = await getDocs(projectsRef)

    let projectData = null
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id === projectId) {
        projectData = docSnap.data()
      }
    })

    if (projectData) {
      currentEditingId = projectId
      document.getElementById("projectName").value = projectData.name
      document.getElementById("projectCategory").value = projectData.category
      document.getElementById("projectUrl").value = projectData.url
      document.getElementById("projectIcon").value = projectData.icon
      document.getElementById("projectGithub").value = projectData.github || ""
      document.getElementById("projectDescription").value = projectData.description

      document.getElementById("formTitle").textContent = "✏️ Editar Proyecto"
      document.getElementById("submitBtn").textContent = "Actualizar Proyecto"
      document.getElementById("cancelBtn").style.display = "inline-block"

      // Scroll to form
      document.getElementById("projectForm").scrollIntoView({ behavior: "smooth" })
    }
  } catch (error) {
    console.error("Error al cargar proyecto:", error)
  }
}

window.deleteProject = async (projectId, projectName) => {
  if (confirm(`¿Estás seguro de que deseas eliminar "${projectName}"?`)) {
    try {
      await deleteDoc(doc(db, "projects", projectId))
      alert("✅ Proyecto eliminado exitosamente")
      loadProjects()
    } catch (error) {
      console.error("Error al eliminar proyecto:", error)
      alert("❌ Error al eliminar el proyecto. Intenta de nuevo.")
    }
  }
}
