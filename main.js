import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

let currentWebsite = null;
let isDarkMode = false;
let currentFilter = 'all';
let allProjects = [];

document.addEventListener('DOMContentLoaded', async function () {
  await loadProjectsFromFirebase();
  setupEventListeners();
  setupThemeToggle();
  setupFilters();
  setupSearch();
  setupScrollTop();
  setCurrentYear();
});

async function loadProjectsFromFirebase() {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    allProjects = [];
    querySnapshot.forEach(doc => {
      allProjects.push({ id: doc.id, ...doc.data() });
    });
    renderProjects(allProjects);
  } catch (err) {
    console.error("Error al cargar proyectos:", err);
    document.getElementById('projectCount').textContent = "Error al cargar";
  }
}

function renderProjects(projects) {
  const grid = document.getElementById('websiteGrid');
  grid.innerHTML = '';
  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'website-card';
    card.dataset.category = project.category;
    card.setAttribute('data-website', JSON.stringify({
      name: project.title,
      url: project.url,
      icon: project.logoUrl || 'image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌐</text></svg>',
      fallback: project.logoUrl || 'image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌐</text></svg>',
      description: project.description
    }));

    card.innerHTML = `
      <img class="favicon loading" alt="${project.title}">
      <div class="website-name">${project.title}</div>
      <div class="website-description">${project.description}</div>
      <div class="status">Cargando...</div>
    `;
    grid.appendChild(card);
  });
  initializeCards();
  updateProjectCount(projects.length);
}

function initializeCards() {
  const cards = document.querySelectorAll('.website-card');
  cards.forEach(card => {
    const websiteData = JSON.parse(card.getAttribute('data-website'));
    const favicon = card.querySelector('.favicon');
    const statusElement = card.querySelector('.status');
    loadFavicon(favicon, websiteData.icon, websiteData.fallback, statusElement);
  });
}

function loadFavicon(faviconElement, mainSrc, fallbackSrc, statusElement) {
  const img = new Image();
  img.onload = () => {
    faviconElement.src = mainSrc;
    faviconElement.classList.remove('loading');
    statusElement.textContent = '✓ Cargado';
    statusElement.style.color = '#27ae60';
  };
  img.onerror = () => {
    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      faviconElement.src = fallbackSrc;
      faviconElement.classList.add('fallback');
      faviconElement.classList.remove('loading');
      statusElement.textContent = '⚠ Fallback';
      statusElement.style.color = '#f39c12';
    };
    fallbackImg.onerror = () => {
      faviconElement.src = 'image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTMuOSAxMmMwLTEuNzEgMS4zOS0zLjEgMy4xLTMuMWg0VjdIN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNWg0di0xLjlIN2MtMS43MSAwLTMuMS0xLjM5LTMuMS0zLjF6TTggMTNoOHYtMkg4djJ6TTE5IDdoLTR2MS45aDRjMS43MSAwIDMuMSAxLjM5IDMuMSAzLjFzLTEuMzkgMy4xLTMuMSAzLjFoLTR2Mmg0YzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01eiIvPjwvc3ZnPg==';
      faviconElement.classList.remove('loading');
      statusElement.textContent = '✗ Sin icono';
      statusElement.style.color = '#e74c3c';
    };
    fallbackImg.src = fallbackSrc;
  };
  img.src = mainSrc;
}

function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('darkMode') === 'true';
  if (saved) {
    document.body.classList.add('dark');
    isDarkMode = true;
  }
  toggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  });
}

function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      filterProjects();
    });
  });
}

function setupSearch() {
  const searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('input', filterProjects);
}

function filterProjects() {
  const searchTerm = document.getElementById('searchBar').value.toLowerCase();
  const cards = document.querySelectorAll('.website-card');
  let visibleCount = 0;

  cards.forEach((card, index) => {
    if (index >= allProjects.length) return;
    const project = allProjects[index];
    const matchesFilter = currentFilter === 'all' || project.category === currentFilter;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm) || project.description.toLowerCase().includes(searchTerm);

    if (matchesFilter && matchesSearch) {
      card.classList.remove('hidden');
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });

  updateProjectCount(visibleCount);
  document.getElementById('noResults').classList.toggle('show', visibleCount === 0);
}

function updateProjectCount(count) {
  const countElement = document.getElementById('projectCount');
  countElement.textContent = `Mostrando ${count} proyecto${count !== 1 ? 's' : ''}`;
}

function setupScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.pageYOffset > 300);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setCurrentYear() {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.website-card') && !e.target.closest('.modal-btn')) {
      openModal(e.target.closest('.website-card'));
    }
  });

  const modal = document.getElementById('websiteModal');
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(cardElement) {
  const websiteData = JSON.parse(cardElement.getAttribute('data-website'));
  currentWebsite = websiteData;
  document.getElementById('modalIcon').src = cardElement.querySelector('.favicon').src;
  document.getElementById('modalTitle').textContent = websiteData.name;
  document.getElementById('modalDescription').textContent = websiteData.description;
  document.getElementById('websiteModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('websiteModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function visitWebsite() {
  if (currentWebsite) {
    window.open(currentWebsite.url.trim(), '_blank', 'noopener,noreferrer');
    closeModal();
  }
}
