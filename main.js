import { db } from "./firebase-config.js"
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let currentWebsite = null
let isDarkMode = false
let currentFilter = "all"
let allProjects = []
let lastFocusedElement = null
let modalListenersAttached = false
let currentPage = 1
let itemsPerPage = 8
let viewAllMode = false

const FALLBACK_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mmg0YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg=="

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle()
  setupFilters()
  setupSearch()
  setupScrollTop()
  setupModalControls()
  setCurrentYear()
  setupPagination()
  loadProjects()
})

function safeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function setCurrentYear() {
  const el = document.getElementById("currentYear")
  if (el) el.textContent = new Date().getFullYear()
}

function setupThemeToggle() {
  const toggle = document.getElementById("themeToggle")
  const icon = document.getElementById("themeIcon")
  if (!toggle) return

  isDarkMode = localStorage.getItem("darkMode") === "true"
  document.documentElement.classList.toggle("dark", isDarkMode)
  updateThemeIcon(icon, isDarkMode)

  toggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode
    document.documentElement.classList.toggle("dark", isDarkMode)
    localStorage.setItem("darkMode", String(isDarkMode))
    updateThemeIcon(icon, isDarkMode)
  })
}

function updateThemeIcon(icon, dark) {
  if (!icon) return
  if (dark) {
    icon.className = "bi bi-moon-stars text-indigo-400 text-xl"
  } else {
    icon.className = "bi bi-sun text-yellow-400 text-xl"
  }
}

function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn")
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("is-active"))
      this.classList.add("is-active")
      currentFilter = this.dataset.filter || "all"
      resetPagination()
      filterAndRender()
    })
  })
  const allBtn = document.querySelector('[data-filter="all"]')
  if (allBtn) allBtn.classList.add("is-active")
}

function setupSearch() {
  const searchBar = document.getElementById("searchBar")
  if (searchBar) {
    searchBar.addEventListener("input", () => {
      resetPagination()
      filterAndRender()
    })
  }
}

function filterAndRender() {
  const searchTerm = (document.getElementById("searchBar")?.value || "").toLowerCase()
  const filteredProjects = allProjects.filter(project => {
    const category = safeText(project.category) || "other"
    const name = safeText(project.name).toLowerCase()
    const description = safeText(project.description).toLowerCase()
    const matchesFilter = currentFilter === "all" || category === currentFilter
    const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm)
    return matchesFilter && matchesSearch
  })
  renderProjects(filteredProjects)
  updatePagination(filteredProjects.length)
  const noResults = document.getElementById("noResults")
  if (noResults) noResults.classList.toggle("hidden", filteredProjects.length !== 0)
}

function renderProjects(projects) {
  const grid = document.getElementById("websiteGrid")
  if (!grid) return
  grid.innerHTML = ""
  if (projects.length === 0) { updateProjectCount(0); return }
  let projectsToRender = projects
  if (!viewAllMode) {
    const start = (currentPage - 1) * itemsPerPage
    projectsToRender = projects.slice(start, start + itemsPerPage)
  }
  projectsToRender.forEach((project, index) => grid.appendChild(createProjectCard(project, index)))
  updateProjectCount(viewAllMode ? projects.length : projectsToRender.length)
  setupCardListeners()
}

function resetPagination() {
  currentPage = 1
  viewAllMode = false
  const itemsSelect = document.getElementById("itemsPerPage")
  if (itemsSelect) itemsSelect.value = "8"
}

function updateProjectCount(count) {
  const el = document.getElementById("projectCount")
  if (el) el.textContent = `Mostrando ${count} proyecto${count !== 1 ? "s" : ""}`
}

function setupScrollTop() {
  const btn = document.getElementById("scrollTop")
  if (!btn) return
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.pageYOffset > 300))
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }))
}

async function loadProjects() {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    allProjects = []
    querySnapshot.forEach((docSnap) => allProjects.push({ id: docSnap.id, ...docSnap.data() }))
    filterAndRender()
  } catch (error) {
    console.error("Error loading projects:", error)
    const el = document.getElementById("projectCount")
    if (el) el.textContent = "Error al cargar proyectos"
  }
}

function createProjectCard(project, index) {
  const categoryMeta = {
    tool: { label: "Herramienta", emoji: "🔧" },
    map:  { label: "Mapa",        emoji: "🗺️" },
    fun:  { label: "Juego",       emoji: "🎮" },
  }

  const websiteData = {
    name:        safeText(project.name),
    url:         safeText(project.url),
    icon:        safeText(project.icon),
    description: safeText(project.description),
    github:      safeText(project.github),
  }

  const category = safeText(project.category) || "other"
  const meta = categoryMeta[category] || { label: "Proyecto", emoji: "🌐" }

  const card = document.createElement("div")
  card.className = [
    "website-card card-shimmer animate-fade-in-up",
    "relative flex flex-col items-center text-center",
    "bg-white dark:bg-gray-900",
    "border-2 border-gray-100 dark:border-gray-700",
    "rounded-2xl pt-5 pb-4 px-4 cursor-pointer",
    "transition-all duration-300",
    "hover:-translate-y-2",
  ].join(" ")

  card.dataset.category = category
  card.websiteData = websiteData
  card.style.animationDelay = `${index * 0.07}s`
  card.setAttribute("role", "button")
  card.setAttribute("tabindex", "0")
  card.setAttribute("aria-label", `Abrir detalles de ${websiteData.name || "proyecto"}`)

  // GitHub corner link (only if exists)
  if (websiteData.github) {
    const ghLink = document.createElement("a")
    ghLink.className = "github-link"
    ghLink.href = websiteData.github
    ghLink.target = "_blank"
    ghLink.rel = "noopener noreferrer"
    ghLink.title = "Ver repositorio"
    ghLink.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.912.832.091-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.447-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.547 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`
    // stop click propagation so it doesn't open the modal
    ghLink.addEventListener("click", (e) => e.stopPropagation())
    card.appendChild(ghLink)
  }

  // Icon wrapper with colored bg
  const iconWrapper = document.createElement("div")
  iconWrapper.className = "icon-wrapper"

  const favicon = document.createElement("img")
  favicon.className = "favicon loading w-10 h-10 rounded-xl object-cover"
  favicon.alt = websiteData.name || "Proyecto"
  iconWrapper.appendChild(favicon)
  card.appendChild(iconWrapper)

  // Category badge
  const badge = document.createElement("span")
  badge.className = "category-badge"
  badge.textContent = `${meta.emoji} ${meta.label}`
  card.appendChild(badge)

  // Name
  const name = document.createElement("div")
  name.className = "website-name font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight mb-1"
  name.textContent = websiteData.name || "Proyecto sin nombre"
  card.appendChild(name)

  // Description — 1 line always visible
  const description = document.createElement("div")
  description.className = "website-description"
  description.textContent = websiteData.description || ""
  card.appendChild(description)

  loadFavicon(favicon, websiteData.icon, null)
  return card
}

function loadFavicon(faviconElement, src, statusElement) {
  const img = new Image()
  img.onload = () => {
    faviconElement.src = src
    faviconElement.classList.remove("loading")
  }
  img.onerror = () => {
    faviconElement.src = FALLBACK_ICON
    faviconElement.classList.remove("loading")
  }
  img.src = src || FALLBACK_ICON
}

function setupCardListeners() {
  document.querySelectorAll(".website-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card))
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(card) }
    })
  })
}

function setupPagination() {
  const itemsSelect = document.getElementById("itemsPerPage")
  const prevBtn = document.getElementById("prevPageBtn")
  const nextBtn = document.getElementById("nextPageBtn")
  const viewAllBtn = document.getElementById("viewAllBtn")

  if (itemsSelect) {
    itemsSelect.addEventListener("change", () => {
      const value = itemsSelect.value
      if (value === "all") { viewAllMode = true; currentPage = 1; itemsPerPage = allProjects.length }
      else { itemsPerPage = parseInt(value); viewAllMode = false; currentPage = 1 }
      filterAndRender()
    })
  }
  if (prevBtn) prevBtn.addEventListener("click", () => { if (currentPage > 1) { currentPage -= 1; filterAndRender() } })
  if (nextBtn) nextBtn.addEventListener("click", () => {
    const max = Math.ceil(getFilteredCount() / itemsPerPage)
    if (!viewAllMode && currentPage < max) { currentPage += 1; filterAndRender() }
  })
  if (viewAllBtn) viewAllBtn.addEventListener("click", () => {
    viewAllMode = true; itemsPerPage = allProjects.length; currentPage = 1; filterAndRender()
  })
}

function getFilteredCount() {
  const searchTerm = (document.getElementById("searchBar")?.value || "").toLowerCase()
  return allProjects.filter(p => {
    const matchesFilter = currentFilter === "all" || safeText(p.category) === currentFilter
    const matchesSearch = safeText(p.name).toLowerCase().includes(searchTerm) || safeText(p.description).toLowerCase().includes(searchTerm)
    return matchesFilter && matchesSearch
  }).length
}

function updatePagination(totalItems) {
  const pageNumbers = document.getElementById("pageNumbers")
  const prevBtn = document.getElementById("prevPageBtn")
  const nextBtn = document.getElementById("nextPageBtn")
  const paginationContainer = document.getElementById("paginationContainer")

  if (viewAllMode) { if (paginationContainer) paginationContainer.style.display = "none"; return }
  if (paginationContainer) paginationContainer.style.display = "flex"

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (prevBtn) prevBtn.disabled = currentPage === 1
  if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages <= 1

  if (pageNumbers) {
    pageNumbers.innerHTML = ""
    if (totalPages <= 1) return
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)

    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button")
      btn.className = [
        "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border transition-all duration-200",
        i === currentPage
          ? "bg-indigo-500 text-white border-indigo-500"
          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-500"
      ].join(" ")
      btn.textContent = i
      btn.addEventListener("click", () => { currentPage = i; filterAndRender() })
      pageNumbers.appendChild(btn)
    }
  }
}

function setupModalControls() {
  if (modalListenersAttached) return
  modalListenersAttached = true
  const modal = document.getElementById("websiteModal")
  if (!modal) return
  document.getElementById("closeModalBtn")?.addEventListener("click", () => window.closeModal())
  document.getElementById("visitWebsiteBtn")?.addEventListener("click", () => window.visitWebsite())
  modal.addEventListener("click", (e) => { if (e.target === modal) window.closeModal() })
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.closeModal() })
}

function openModal(cardElement) {
  const websiteData = cardElement.websiteData
  if (!websiteData) return

  currentWebsite = websiteData
  lastFocusedElement = document.activeElement

  const category = cardElement.dataset.category || "other"
  const categoryMeta = {
    tool: { label: "Herramienta", emoji: "🔧", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
    map:  { label: "Mapa",        emoji: "🗺️", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
    fun:  { label: "Juego",       emoji: "🎮", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  }
  const meta = categoryMeta[category] || { label: "Proyecto", emoji: "🌐", color: "bg-gray-100 text-gray-500" }

  const modalIcon = document.getElementById("modalIcon")
  const modalTitle = document.getElementById("modalTitle")
  const modalDescription = document.getElementById("modalDescription")
  const websiteModal = document.getElementById("websiteModal")
  const modalBadge = document.getElementById("modalBadge")
  const modalGithub = document.getElementById("modalGithub")

  if (modalIcon) {
    modalIcon.src = cardElement.querySelector(".favicon")?.src || FALLBACK_ICON
    modalIcon.alt = websiteData.name || ""
  }
  if (modalTitle) modalTitle.textContent = websiteData.name || "Proyecto"
  if (modalDescription) modalDescription.textContent = websiteData.description || "Sin descripción."

  if (modalBadge) {
    modalBadge.textContent = `${meta.emoji} ${meta.label}`
    modalBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${meta.color}`
  }

  if (modalGithub) {
    if (websiteData.github) {
      modalGithub.href = websiteData.github
      modalGithub.classList.remove("hidden")
      modalGithub.classList.add("inline-flex")
    } else {
      modalGithub.classList.add("hidden")
      modalGithub.classList.remove("inline-flex")
    }
  }

  if (websiteModal) websiteModal.classList.add("active")
  document.body.style.overflow = "hidden"
  document.getElementById("closeModalBtn")?.focus()
}


window.closeModal = () => {
  const modal = document.getElementById("websiteModal")
  if (modal) modal.classList.remove("active")
  document.body.style.overflow = "auto"
  currentWebsite = null
  if (lastFocusedElement?.focus) lastFocusedElement.focus()
}

window.visitWebsite = () => {
  if (!currentWebsite?.url) return
  try {
    const parsed = new URL(currentWebsite.url.trim())
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Protocolo no permitido")
    window.open(parsed.toString(), "_blank", "noopener,noreferrer")
    window.closeModal()
  } catch (error) {
    console.error("URL de proyecto inválida:", error)
    alert("La URL del proyecto no es válida.")
  }
}
