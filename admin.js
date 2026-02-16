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
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let currentEditingId = null
let isDarkMode = false

const FALLBACK_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mkg4YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg=="

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle()
  setupAuthListener()
  setupLoginForm()
  setupProjectForm()
  setupLogout()
})

function safeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function isValidHttpUrl(value, allowEmpty = false) {
  const text = safeText(value)
  if (allowEmpty && text === "") return true

  try {
    const parsed = new URL(text)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

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
      localStorage.setItem("darkMode", String(isDarkMode))
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
  if (!loginForm) return

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = safeText(document.getElementById("email").value)
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
  if (!logoutBtn) return

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
  if (!form || !cancelBtn) return

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const projectData = {
      name: safeText(document.getElementById("projectName").value),
      category: safeText(document.getElementById("projectCategory").value),
      url: safeText(document.getElementById("projectUrl").value),
      icon: safeText(document.getElementById("projectIcon").value),
      github: safeText(document.getElementById("projectGithub").value),
      description: safeText(document.getElementById("projectDescription").value),
      updatedAt: serverTimestamp(),
    }

    if (!isValidHttpUrl(projectData.url)) {
      alert("La URL del proyecto no es válida.")
      return
    }
    if (!isValidHttpUrl(projectData.icon)) {
      alert("La URL del icono no es válida.")
      return
    }
    if (!isValidHttpUrl(projectData.github, true)) {
      alert("La URL de GitHub no es válida.")
      return
    }

    try {
      if (currentEditingId) {
        const projectRef = doc(db, "projects", currentEditingId)
        await updateDoc(projectRef, projectData)
        alert("✅ Proyecto actualizado exitosamente")
      } else {
        projectData.createdAt = serverTimestamp()
        await addDoc(collection(db, "projects"), projectData)
        alert("✅ Proyecto agregado exitosamente")
      }

      resetForm()
      await loadProjects()
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
      count += 1
      const project = { id: docSnap.id, ...docSnap.data() }
      projectsList.appendChild(createProjectItem(project))
    })

    document.getElementById("projectsCount").textContent = count

    if (count === 0) {
      const emptyMessage = document.createElement("p")
      emptyMessage.style.textAlign = "center"
      emptyMessage.style.padding = "40px"
      emptyMessage.style.color = "#666"
      emptyMessage.textContent = "No hay proyectos. Agrega tu primer proyecto arriba."
      projectsList.appendChild(emptyMessage)
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

  const icon = document.createElement("img")
  icon.className = "project-item-icon"
  icon.src = safeText(project.icon) || FALLBACK_ICON
  icon.alt = safeText(project.name) || "Proyecto"
  icon.addEventListener("error", () => {
    icon.src = FALLBACK_ICON
  })

  const info = document.createElement("div")
  info.className = "project-item-info"

  const name = document.createElement("div")
  name.className = "project-item-name"
  name.textContent = safeText(project.name) || "Sin nombre"

  const category = document.createElement("span")
  category.className = "project-item-category"
  category.textContent = categoryEmojis[project.category] || safeText(project.category) || "Sin categoría"

  const description = document.createElement("div")
  description.className = "project-item-description"
  description.textContent = safeText(project.description) || "Sin descripción."

  info.appendChild(name)
  info.appendChild(category)
  info.appendChild(description)

  const actions = document.createElement("div")
  actions.className = "project-item-actions"

  const editBtn = document.createElement("button")
  editBtn.className = "btn-edit"
  editBtn.type = "button"
  editBtn.textContent = "✏️ Editar"
  editBtn.addEventListener("click", () => {
    editProject(project.id)
  })

  const deleteBtn = document.createElement("button")
  deleteBtn.className = "btn-delete"
  deleteBtn.type = "button"
  deleteBtn.textContent = "🗑️ Eliminar"
  deleteBtn.addEventListener("click", () => {
    deleteProject(project.id, safeText(project.name))
  })

  actions.appendChild(editBtn)
  actions.appendChild(deleteBtn)

  item.appendChild(icon)
  item.appendChild(info)
  item.appendChild(actions)

  return item
}

async function editProject(projectId) {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)
    if (!projectSnap.exists()) return

    const projectData = projectSnap.data()
    currentEditingId = projectId
    document.getElementById("projectName").value = safeText(projectData.name)
    document.getElementById("projectCategory").value = safeText(projectData.category)
    document.getElementById("projectUrl").value = safeText(projectData.url)
    document.getElementById("projectIcon").value = safeText(projectData.icon)
    document.getElementById("projectGithub").value = safeText(projectData.github)
    document.getElementById("projectDescription").value = safeText(projectData.description)

    document.getElementById("formTitle").textContent = "✏️ Editar Proyecto"
    document.getElementById("submitBtn").textContent = "Actualizar Proyecto"
    document.getElementById("cancelBtn").style.display = "inline-block"

    document.getElementById("projectForm").scrollIntoView({ behavior: "smooth" })
  } catch (error) {
    console.error("Error al cargar proyecto:", error)
  }
}

async function deleteProject(projectId, projectName) {
  if (!confirm(`¿Estás seguro de que deseas eliminar "${projectName}"?`)) return

  try {
    await deleteDoc(doc(db, "projects", projectId))
    alert("✅ Proyecto eliminado exitosamente")
    await loadProjects()
  } catch (error) {
    console.error("Error al eliminar proyecto:", error)
    alert("❌ Error al eliminar el proyecto. Intenta de nuevo.")
  }
}
