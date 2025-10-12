import { db } from "./firebase-config.js"
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let currentWebsite = null
let isDarkMode = false
let currentFilter = "all"
let allProjects = []

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle()
  setupFilters()
  setupSearch()
  setupScrollTop()
  setCurrentYear()
  loadProjects()
})

function setCurrentYear() {
  document.getElementById("currentYear").textContent = new Date().getFullYear()
}

function setupThemeToggle() {
  const toggle = document.getElementById("themeToggle")
  const saved = localStorage.getItem("darkMode") === "true"
  if (saved) {
    document.body.classList.add("dark")
    isDarkMode = true
  }

  toggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode
    document.body.classList.toggle("dark", isDarkMode)
    localStorage.setItem("darkMode", isDarkMode)
  })
}

function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn")
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      currentFilter = this.dataset.filter
      filterProjects()
    })
  })
}

function setupSearch() {
  const searchBar = document.getElementById("searchBar")
  searchBar.addEventListener("input", filterProjects)
}

function filterProjects() {
  const searchTerm = document.getElementById("searchBar").value.toLowerCase()
  const cards = document.querySelectorAll(".website-card")
  let visibleCount = 0

  cards.forEach((card) => {
    const category = card.dataset.category
    const websiteData = JSON.parse(card.getAttribute("data-website"))
    const name = websiteData.name.toLowerCase()
    const description = websiteData.description.toLowerCase()

    const matchesFilter = currentFilter === "all" || category === currentFilter
    const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm)

    if (matchesFilter && matchesSearch) {
      card.classList.remove("hidden")
      visibleCount++
    } else {
      card.classList.add("hidden")
    }
  })

  updateProjectCount(visibleCount)

  const noResults = document.getElementById("noResults")
  if (visibleCount === 0) {
    noResults.classList.add("show")
  } else {
    noResults.classList.remove("show")
  }
}

function updateProjectCount(count) {
  const countElement = document.getElementById("projectCount")
  countElement.textContent = `Mostrando ${count} proyecto${count !== 1 ? "s" : ""}`
}

function setupScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTop")

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollTopBtn.classList.add("visible")
    } else {
      scrollTopBtn.classList.remove("visible")
    }
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
    querySnapshot.forEach((doc) => {
      allProjects.push({ id: doc.id, ...doc.data() })
    })

    renderProjects()
  } catch (error) {
    console.error("Error loading projects:", error)
    document.getElementById("projectCount").textContent = "Error al cargar proyectos"
  }
}

function renderProjects() {
  const grid = document.getElementById("websiteGrid")
  grid.innerHTML = ""

  if (allProjects.length === 0) {
    grid.innerHTML =
      '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: #666;">No hay proyectos disponibles. Agrega uno desde el panel de administración.</p>'
    updateProjectCount(0)
    return
  }

  allProjects.forEach((project, index) => {
    const card = createProjectCard(project, index)
    grid.appendChild(card)
  })

  updateProjectCount(allProjects.length)
  setupCardListeners()
}

function createProjectCard(project, index) {
  const card = document.createElement("div")
  card.className = "website-card"
  card.dataset.category = project.category
  card.setAttribute(
    "data-website",
    JSON.stringify({
      name: project.name,
      url: project.url,
      icon: project.icon,
      fallback: project.icon,
      description: project.description,
      github: project.github || "",
    }),
  )
  card.style.animationDelay = `${index * 0.1}s`

  card.innerHTML = `
        <img class="favicon loading" alt="${project.name}">
        <div class="website-name">${project.name}</div>
        <div class="website-description">${project.description}</div>
        <div class="status">Cargando...</div>
    `

  const favicon = card.querySelector(".favicon")
  const statusElement = card.querySelector(".status")
  loadFavicon(favicon, project.icon, project.icon, statusElement)

  return card
}

function loadFavicon(faviconElement, mainSrc, fallbackSrc, statusElement) {
  const img = new Image()
  img.onload = () => {
    faviconElement.src = mainSrc
    faviconElement.classList.remove("loading")
    statusElement.textContent = "✓ Cargado"
    statusElement.style.color = "#27ae60"
  }
  img.onerror = () => {
    faviconElement.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mkg4YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg=="
    faviconElement.classList.remove("loading")
    statusElement.textContent = "✗ Sin icono"
    statusElement.style.color = "#e74c3c"
  }
  img.src = mainSrc
}

function setupCardListeners() {
  const cards = document.querySelectorAll(".website-card")
  cards.forEach((card) => {
    card.addEventListener("click", function (e) {
      if (!e.target.closest(".modal-btn")) {
        openModal(this)
      }
    })
  })

  const modal = document.getElementById("websiteModal")
  modal.addEventListener("click", (e) => {
    if (e.target === modal) window.closeModal()
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeModal()
  })
}

function openModal(cardElement) {
  const websiteData = JSON.parse(cardElement.getAttribute("data-website"))
  currentWebsite = websiteData

  document.getElementById("modalIcon").src = cardElement.querySelector(".favicon").src
  document.getElementById("modalTitle").textContent = websiteData.name
  document.getElementById("modalDescription").textContent = websiteData.description

  document.getElementById("websiteModal").classList.add("active")
  document.body.style.overflow = "hidden"

  document.querySelector(".modal-btn").focus()
}

window.closeModal = () => {
  document.getElementById("websiteModal").classList.remove("active")
  document.body.style.overflow = "auto"
}

window.visitWebsite = () => {
  if (currentWebsite) {
    window.open(currentWebsite.url.trim(), "_blank", "noopener,noreferrer")
    window.closeModal()
  }
}
