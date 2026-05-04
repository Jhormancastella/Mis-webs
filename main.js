import { db } from "./firebase-config.js"
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let currentWebsite = null
let isDarkMode = false
let currentFilter = "all"
let allProjects = []
let lastFocusedElement = null
let modalListenersAttached = false

const FALLBACK_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mmg0YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg=="

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle()
  setupFilters()
  setupSearch()
  setupScrollTop()
  setupModalControls()
  setCurrentYear()
  loadProjects()
})

function safeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function setCurrentYear() {
  const currentYear = document.getElementById("currentYear")
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear()
  }
}

function setupThemeToggle() {
  const toggle = document.getElementById("themeToggle")
  if (!toggle) return

  const saved = localStorage.getItem("darkMode") === "true"
  if (saved) {
    document.body.classList.add("dark")
    isDarkMode = true
  }

  toggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode
    document.body.classList.toggle("dark", isDarkMode)
    localStorage.setItem("darkMode", String(isDarkMode))
  })
}

function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn")
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      currentFilter = this.dataset.filter || "all"
      filterProjects()
    })
  })
}

function setupSearch() {
  const searchBar = document.getElementById("searchBar")
  if (searchBar) {
    searchBar.addEventListener("input", filterProjects)
  }
}

function filterProjects() {
  const searchValue = document.getElementById("searchBar")?.value || ""
  const searchTerm = searchValue.toLowerCase()
  const cards = document.querySelectorAll(".website-card")
  let visibleCount = 0

  cards.forEach((card) => {
    const category = card.dataset.category || ""
    const websiteData = card.websiteData || {}
    const name = safeText(websiteData.name).toLowerCase()
    const description = safeText(websiteData.description).toLowerCase()

    const matchesFilter = currentFilter === "all" || category === currentFilter
    const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm)

    if (matchesFilter && matchesSearch) {
      card.classList.remove("hidden")
      visibleCount += 1
    } else {
      card.classList.add("hidden")
    }
  })

  updateProjectCount(visibleCount)

  const noResults = document.getElementById("noResults")
  if (noResults) {
    noResults.classList.toggle("show", visibleCount === 0)
  }
}

function updateProjectCount(count) {
  const countElement = document.getElementById("projectCount")
  if (countElement) {
    countElement.textContent = `Mostrando ${count} proyecto${count !== 1 ? "s" : ""}`
  }
}

function setupScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTop")
  if (!scrollTopBtn) return

  window.addEventListener("scroll", () => {
    scrollTopBtn.classList.toggle("visible", window.pageYOffset > 300)
  })

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  })
}

async function loadProjects() {
  try {
    const projectsRef = collection(db, "projects")
    const q = query(projectsRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    allProjects = []
    querySnapshot.forEach((docSnap) => {
      allProjects.push({ id: docSnap.id, ...docSnap.data() })
    })

    renderProjects()
  } catch (error) {
    console.error("Error loading projects:", error)
    const projectCount = document.getElementById("projectCount")
    if (projectCount) {
      projectCount.textContent = "Error al cargar proyectos"
    }
  }
}

function renderProjects() {
  const grid = document.getElementById("websiteGrid")
  if (!grid) return

  grid.innerHTML = ""

  if (allProjects.length === 0) {
    const emptyMessage = document.createElement("p")
    emptyMessage.style.textAlign = "center"
    emptyMessage.style.gridColumn = "1/-1"
    emptyMessage.style.padding = "40px"
    emptyMessage.style.color = "#666"
    emptyMessage.textContent = "No hay proyectos disponibles. Agrega uno desde el panel de administración."
    grid.appendChild(emptyMessage)
    updateProjectCount(0)
    return
  }

  allProjects.forEach((project, index) => {
    grid.appendChild(createProjectCard(project, index))
  })

  updateProjectCount(allProjects.length)
  setupCardListeners()
}

function createProjectCard(project, index) {
  const card = document.createElement("div")
  const websiteData = {
    name: safeText(project.name),
    url: safeText(project.url),
    icon: safeText(project.icon),
    description: safeText(project.description),
    github: safeText(project.github),
  }

  card.className = "website-card"
  card.dataset.category = safeText(project.category) || "other"
  card.websiteData = websiteData
  card.style.animationDelay = `${index * 0.1}s`
  card.setAttribute("role", "button")
  card.setAttribute("tabindex", "0")
  card.setAttribute("aria-label", `Abrir detalles de ${websiteData.name || "proyecto"}`)

  const favicon = document.createElement("img")
  favicon.className = "favicon loading"
  favicon.alt = websiteData.name || "Proyecto"

  const name = document.createElement("div")
  name.className = "website-name"
  name.textContent = websiteData.name || "Proyecto sin nombre"

  const description = document.createElement("div")
  description.className = "website-description"
  description.textContent = websiteData.description || "Sin descripción."

  const status = document.createElement("div")
  status.className = "status"
  status.textContent = "Cargando..."

  card.appendChild(favicon)
  card.appendChild(name)
  card.appendChild(description)
  card.appendChild(status)

  loadFavicon(favicon, websiteData.icon, status)
  return card
}

function loadFavicon(faviconElement, src, statusElement) {
  const img = new Image()
  img.onload = () => {
    faviconElement.src = src
    faviconElement.classList.remove("loading")
    statusElement.textContent = "✓ Cargado"
    statusElement.style.color = "#27ae60"
  }
  img.onerror = () => {
    faviconElement.src = FALLBACK_ICON
    faviconElement.classList.remove("loading")
    statusElement.textContent = "✗ Sin icono"
    statusElement.style.color = "#e74c3c"
  }
  img.src = src || FALLBACK_ICON
}

function setupCardListeners() {
  const cards = document.querySelectorAll(".website-card")
  cards.forEach((card) => {
    card.addEventListener("click", () => openModal(card))
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openModal(card)
      }
    })
  })
}

function setupModalControls() {
  if (modalListenersAttached) return
  modalListenersAttached = true

  const modal = document.getElementById("websiteModal")
  const closeButton = document.getElementById("closeModalBtn")
  const visitButton = document.getElementById("visitWebsiteBtn")

  if (!modal) return

  if (closeButton) {
    closeButton.addEventListener("click", () => window.closeModal())
  }
  if (visitButton) {
    visitButton.addEventListener("click", () => window.visitWebsite())
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      window.closeModal()
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.closeModal()
    }
  })
}

function openModal(cardElement) {
  const websiteData = cardElement.websiteData
  if (!websiteData) return

  currentWebsite = websiteData
  lastFocusedElement = document.activeElement

  const modalIcon = document.getElementById("modalIcon")
  const modalTitle = document.getElementById("modalTitle")
  const modalDescription = document.getElementById("modalDescription")
  const websiteModal = document.getElementById("websiteModal")
  const closeButton = document.getElementById("closeModalBtn")

  if (modalIcon) {
    modalIcon.src = cardElement.querySelector(".favicon")?.src || FALLBACK_ICON
    modalIcon.alt = websiteData.name || "Icono del proyecto"
  }
  if (modalTitle) {
    modalTitle.textContent = websiteData.name || "Proyecto"
  }
  if (modalDescription) {
    modalDescription.textContent = websiteData.description || "Sin descripción."
  }
  if (websiteModal) {
    websiteModal.classList.add("active")
  }
  document.body.style.overflow = "hidden"

  if (closeButton) {
    closeButton.focus()
  }
}

window.closeModal = () => {
  const websiteModal = document.getElementById("websiteModal")
  if (websiteModal) {
    websiteModal.classList.remove("active")
  }
  document.body.style.overflow = "auto"
  currentWebsite = null

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus()
  }
}

window.visitWebsite = () => {
  if (!currentWebsite?.url) return

  try {
    const parsedUrl = new URL(currentWebsite.url.trim())
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Protocolo no permitido")
    }

    window.open(parsedUrl.toString(), "_blank", "noopener,noreferrer")
    window.closeModal()
  } catch (error) {
    console.error("URL de proyecto inválida:", error)
    alert("La URL del proyecto no es válida.")
  }
}
