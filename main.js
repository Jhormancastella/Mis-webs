import { db } from "https://portfolio-admin-eef519.gitlab.io/firebase-config.js"
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
  setupModeToggle()
  setupThemePicker()
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

// =============================================
// MODO CLARO / OSCURO — independiente del tema
// =============================================
function setupModeToggle() {
  const btn = document.getElementById('modeToggleBtn')
  if (!btn) return

  const saved = localStorage.getItem('colorMode') || 'light'
  applyMode(saved)

  btn.addEventListener('click', () => {
    const current = localStorage.getItem('colorMode') || 'light'
    applyMode(current === 'light' ? 'dark' : 'light')
  })
}

function applyMode(mode) {
  document.body.classList.toggle('mode-dark', mode === 'dark')
  const btn = document.getElementById('modeToggleBtn')
  if (btn) btn.textContent = mode === 'dark' ? '🌞' : '🌓'
  localStorage.setItem('colorMode', mode)
  isDarkMode = mode === 'dark'
}

// =============================================
// SELECTOR DE TEMAS — 10 temas visuales
// =============================================
const THEMES = [
  { id: 'default',     label: 'Claro',       emoji: '☀️',  colors: ['#f8f9fa','#3498db','#2c3e50'] },
  { id: 't-dark',      label: 'Oscuro',      emoji: '🌑',  colors: ['#121212','#333','#e0e0e0'] },
  { id: 't-vintage',   label: 'Vintage',     emoji: '🕰️', colors: ['#f5efe0','#c9a96e','#3b2a1a'] },
  { id: 't-neon',      label: 'Neón',        emoji: '⚡',  colors: ['#0d0d0d','#00ffe7','#ff00ff'] },
  { id: 't-nature',    label: 'Naturaleza',  emoji: '🌿',  colors: ['#e8f5e9','#388e3c','#1b5e20'] },
  { id: 't-ocean',     label: 'Océano',      emoji: '🌊',  colors: ['#e3f2fd','#1976d2','#00bcd4'] },
  { id: 't-logos',     label: 'Solo Logos',  emoji: '🖼️', colors: ['#111','#444','#fff'] },
  { id: 't-mosaic',    label: 'Mosaico',     emoji: '🔲',  colors: ['#fafafa','#e0e0e0','#222'] },
  { id: 't-futuristic',label: 'Futurista',   emoji: '🤖',  colors: ['#050510','#7b8cff','#00ffcc'] },
  { id: 't-galaxy',    label: 'Galaxia',     emoji: '🌌',  colors: ['#1a0533','#9b59b6','#e8d5ff'] },
]

const ALL_THEME_CLASSES = THEMES.map(t => t.id).filter(id => id !== 'default')

function applyTheme(themeId) {
  // Guardar snapshot antes de cambiar
  const prev = localStorage.getItem('activeTheme') || 'default'
  if (prev !== themeId) {
    localStorage.setItem('prevTheme', prev)
    const restore = document.getElementById('themePanelRestore')
    if (restore) restore.style.display = 'flex'
  }

  document.body.classList.remove(...ALL_THEME_CLASSES)
  if (themeId !== 'default') document.body.classList.add(themeId)

  localStorage.setItem('activeTheme', themeId)

  // Carrusel solo en t-logos
  const carousel = document.getElementById('carouselWrapper')
  if (carousel) carousel.style.display = themeId === 't-logos' ? 'block' : 'none'

  // Actualizar tarjetas activas en el panel
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.themeId === themeId)
  })
}

function setupThemePicker() {
  const btn = document.getElementById('themePickerBtn')
  const overlay = document.getElementById('themePanelOverlay')
  const panel = document.getElementById('themePanel')
  const closeBtn = document.getElementById('themePanelClose')
  const restoreBtn = document.getElementById('restoreThemeBtn')
  const grid = document.getElementById('themeGrid')

  if (!btn || !panel) return

  // Restaurar tema guardado
  const saved = localStorage.getItem('activeTheme') || 'default'
  document.body.classList.remove(...ALL_THEME_CLASSES)
  if (saved !== 'default') document.body.classList.add(saved)
  const carousel = document.getElementById('carouselWrapper')
  if (carousel) carousel.style.display = saved === 't-logos' ? 'block' : 'none'

  // Construir grid de temas
  if (grid) {
    THEMES.forEach(theme => {
      const card = document.createElement('div')
      card.className = 'theme-card' + (saved === theme.id ? ' active' : '')
      card.dataset.themeId = theme.id
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.setAttribute('aria-label', `Tema ${theme.label}`)

      const preview = document.createElement('div')
      preview.className = 'theme-card-preview'
      preview.style.background = `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%)`
      preview.textContent = theme.emoji

      const label = document.createElement('div')
      label.className = 'theme-card-label'
      label.style.background = theme.colors[0]
      label.style.color = theme.colors[2]
      label.textContent = theme.label

      card.appendChild(preview)
      card.appendChild(label)

      card.addEventListener('click', () => {
        applyTheme(theme.id)
        closePanel()
      })
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyTheme(theme.id); closePanel() }
      })

      grid.appendChild(card)
    })
  }

  // Mostrar si hay tema previo
  const prev = localStorage.getItem('prevTheme')
  if (prev && prev !== saved) {
    const restore = document.getElementById('themePanelRestore')
    if (restore) restore.style.display = 'flex'
  }

  btn.addEventListener('click', () => openPanel())
  if (overlay) overlay.addEventListener('click', () => closePanel())
  if (closeBtn) closeBtn.addEventListener('click', () => closePanel())
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      const prev = localStorage.getItem('prevTheme') || 'default'
      applyTheme(prev)
      localStorage.removeItem('prevTheme')
      const restore = document.getElementById('themePanelRestore')
      if (restore) restore.style.display = 'none'
      closePanel()
    })
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel()
  })
}

function openPanel() {
  document.getElementById('themePanelOverlay')?.classList.add('open')
  document.getElementById('themePanel')?.classList.add('open')
}

function closePanel() {
  document.getElementById('themePanelOverlay')?.classList.remove('open')
  document.getElementById('themePanel')?.classList.remove('open')
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
  buildCarousel()
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

function buildCarousel() {
  const track = document.getElementById('carouselTrack')
  if (!track || allProjects.length === 0) return

  track.innerHTML = ''

  // Duplicar para loop infinito
  const items = [...allProjects, ...allProjects]
  items.forEach(project => {
    const item = document.createElement('div')
    item.className = 'carousel-item'

    const img = document.createElement('img')
    img.src = safeText(project.icon) || FALLBACK_ICON
    img.alt = safeText(project.name) || 'Proyecto'
    img.onerror = () => { img.src = FALLBACK_ICON }

    const span = document.createElement('span')
    span.textContent = safeText(project.name) || 'Proyecto'

    item.appendChild(img)
    item.appendChild(span)

    item.addEventListener('click', () => {
      const card = [...document.querySelectorAll('.website-card')]
        .find(c => c.websiteData?.name === safeText(project.name))
      if (card) openModal(card)
      else {
        // fallback: crear websiteData temporal
        const fakeCard = { websiteData: {
          name: safeText(project.name),
          url: safeText(project.url),
          icon: safeText(project.icon),
          description: safeText(project.description),
        }, querySelector: () => null }
        openModal(fakeCard)
      }
    })

    track.appendChild(item)
  })
}
