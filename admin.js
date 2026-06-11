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
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mmg0YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg=="

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
  } catch { return false }
}

function setupThemeToggle() {
  isDarkMode = localStorage.getItem("darkMode") === "true"
  document.documentElement.classList.toggle("dark", isDarkMode)
  const toggle = document.getElementById("themeToggle")
  const icon = document.getElementById("themeIcon")
  if (icon) updateAdminThemeIcon(icon, isDarkMode)
  if (toggle) {
    toggle.addEventListener("click", () => {
      isDarkMode = !isDarkMode
      document.documentElement.classList.toggle("dark", isDarkMode)
      localStorage.setItem("darkMode", String(isDarkMode))
      if (icon) updateAdminThemeIcon(icon, isDarkMode)
    })
  }
}

function updateAdminThemeIcon(icon, dark) {
  if (dark) {
    icon.className = "bi bi-moon-stars text-indigo-400 text-xl"
  } else {
    icon.className = "bi bi-sun text-yellow-400 text-xl"
  }
}

function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) { showAdminPanel(); loadProjects() }
    else { showLoginScreen() }
  })
}

function showLoginScreen() {
  document.getElementById("loginScreen").style.display = "flex"
  document.getElementById("adminPanel").classList.add("hidden")
}

function showAdminPanel() {
  document.getElementById("loginScreen").style.display = "none"
  document.getElementById("adminPanel").classList.remove("hidden")
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
      if (errorDiv) errorDiv.textContent = ""
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      if (errorDiv) errorDiv.textContent = "Credenciales incorrectas. Intenta de nuevo."
    }
  })
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn")
  if (!logoutBtn) return
  logoutBtn.addEventListener("click", async () => {
    try { await signOut(auth) } catch (error) { console.error("Error al cerrar sesión:", error) }
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

    if (!isValidHttpUrl(projectData.url)) { alert("La URL del proyecto no es válida."); return }
    if (!isValidHttpUrl(projectData.icon)) { alert("La URL del icono no es válida."); return }
    if (!isValidHttpUrl(projectData.github, true)) { alert("La URL de GitHub no es válida."); return }

    try {
      if (currentEditingId) {
        await updateDoc(doc(db, "projects", currentEditingId), projectData)
        alert("✅ Proyecto actualizado exitosamente")
      } else {
        projectData.createdAt = serverTimestamp()
        await addDoc(collection(db, "projects"), projectData)
        alert("✅ Proyecto agregado exitosamente")
      }
      resetForm()
      await loadProjects()
      window.location.href = "index.html"
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
  document.getElementById("cancelBtn").classList.add("hidden")
}

async function loadProjects() {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const projectsList = document.getElementById("projectsList")
    projectsList.innerHTML = ""
    let count = 0
    querySnapshot.forEach((docSnap) => {
      count += 1
      projectsList.appendChild(createProjectItem({ id: docSnap.id, ...docSnap.data() }))
    })
    document.getElementById("projectsCount").textContent = count
    if (count === 0) {
      const empty = document.createElement("p")
      empty.className = "text-center text-gray-400 py-10 text-sm"
      empty.textContent = "No hay proyectos. Agrega tu primer proyecto arriba."
      projectsList.appendChild(empty)
    }
  } catch (error) {
    console.error("Error al cargar proyectos:", error)
  }
}

function createProjectItem(project) {
  const categoryLabels = { tool: "🔧 Herramientas", map: "🗺️ Mapas", fun: "🎮 Entretenimiento" }
  const categoryColors = { tool: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400", map: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400", fun: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" }

  const item = document.createElement("div")
  item.className = "flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200"

  const icon = document.createElement("img")
  icon.className = "w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0"
  icon.src = safeText(project.icon) || FALLBACK_ICON
  icon.alt = safeText(project.name) || "Proyecto"
  icon.addEventListener("error", () => { icon.src = FALLBACK_ICON })

  const info = document.createElement("div")
  info.className = "flex-1 min-w-0 text-center sm:text-left"

  const name = document.createElement("div")
  name.className = "font-bold text-gray-900 dark:text-white text-base mb-1"
  name.textContent = safeText(project.name) || "Sin nombre"

  const categoryBadge = document.createElement("span")
  categoryBadge.className = `inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColors[project.category] || "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`
  categoryBadge.textContent = categoryLabels[project.category] || safeText(project.category) || "Sin categoría"

  const description = document.createElement("div")
  description.className = "text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2"
  description.textContent = safeText(project.description) || "Sin descripción."

  info.appendChild(name)
  info.appendChild(categoryBadge)
  info.appendChild(description)

  const actions = document.createElement("div")
  actions.className = "flex gap-2 flex-shrink-0"

  const editBtn = document.createElement("button")
  editBtn.className = "px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
  editBtn.type = "button"
  editBtn.textContent = "✏️ Editar"
  editBtn.addEventListener("click", () => editProject(project.id))

  const deleteBtn = document.createElement("button")
  deleteBtn.className = "px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
  deleteBtn.type = "button"
  deleteBtn.textContent = "🗑️ Eliminar"
  deleteBtn.addEventListener("click", () => deleteProject(project.id, safeText(project.name)))

  actions.appendChild(editBtn)
  actions.appendChild(deleteBtn)

  item.appendChild(icon)
  item.appendChild(info)
  item.appendChild(actions)
  return item
}

async function editProject(projectId) {
  try {
    const projectSnap = await getDoc(doc(db, "projects", projectId))
    if (!projectSnap.exists()) return
    const data = projectSnap.data()
    currentEditingId = projectId
    document.getElementById("projectName").value = safeText(data.name)
    document.getElementById("projectCategory").value = safeText(data.category)
    document.getElementById("projectUrl").value = safeText(data.url)
    document.getElementById("projectIcon").value = safeText(data.icon)
    document.getElementById("projectGithub").value = safeText(data.github)
    document.getElementById("projectDescription").value = safeText(data.description)
    document.getElementById("formTitle").textContent = "✏️ Editar Proyecto"
    document.getElementById("submitBtn").textContent = "Actualizar Proyecto"
    document.getElementById("cancelBtn").classList.remove("hidden")
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
