const THEME_STORAGE_KEY = "portfolio-theme"
const MODE_STORAGE_KEY = "portfolio-theme-mode"
const THEMES = new Set([
  "normal",
  "neon-tech",
  "minimalist-glass",
  "arcade-8bit",
  "retro-os",
  "matrix",
  "cyber-chaos",
])

let activeLayoutCleanup = null
let matrixFrame = 0
let windowZIndex = 2

export function initializeThemeSwitcher() {
  const trigger = document.getElementById("themeSettingsButton")
  const panel = document.getElementById("themePanel")
  const closeButton = document.getElementById("closeThemePanel")
  const themeSelect = document.getElementById("themeSelect")
  const modeControl = document.getElementById("themeModeControl")
  const modeToggle = document.getElementById("themeModeToggle")
  const modeLabel = document.getElementById("themeModeLabel")
  const headerModeToggle = document.getElementById("themeToggle")
  const headerModeIcon = document.getElementById("themeIcon")
  if (!trigger || !panel || !themeSelect || !modeControl || !modeToggle || !modeLabel) return

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
  const state = {
    theme: THEMES.has(savedTheme) ? savedTheme : "normal",
    mode: savedMode === "light" ? "light" : "dark",
  }

  const setPanelOpen = (open) => {
    panel.classList.toggle("is-open", open)
    panel.setAttribute("aria-hidden", String(!open))
    trigger.setAttribute("aria-expanded", String(open))
    if (open) themeSelect.focus()
  }

  const applyTheme = () => {
    const body = document.body
    destroyLayout()
    if (state.theme === "normal") {
      body.removeAttribute("data-theme")
      body.removeAttribute("data-mode")
      modeControl.hidden = true
    } else {
      body.dataset.theme = state.theme
      body.dataset.mode = state.mode
      modeControl.hidden = false
    }
    themeSelect.value = state.theme
    modeToggle.setAttribute("aria-checked", String(state.mode === "dark"))
    modeToggle.disabled = state.theme === "normal"
    modeLabel.textContent = state.mode === "dark" ? "Oscuro" : "Claro"
    if (headerModeToggle && headerModeIcon) {
      const isDark = state.theme === "normal"
        ? document.documentElement.classList.contains("dark")
        : state.mode === "dark"
      headerModeIcon.className = isDark
        ? "bi bi-moon-stars text-indigo-400 text-xl"
        : "bi bi-sun text-yellow-400 text-xl"
      const label = state.theme === "normal"
        ? "Cambiar modo claro/oscuro"
        : `Cambiar a modo ${isDark ? "claro" : "oscuro"}`
      headerModeToggle.setAttribute("aria-label", label)
      headerModeToggle.title = label
    }
    refreshThemeLayout()
    if (state.theme === "normal") {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, state.theme)
      localStorage.setItem(MODE_STORAGE_KEY, state.mode)
    }
  }

  trigger.addEventListener("click", () => setPanelOpen(!panel.classList.contains("is-open")))
  closeButton?.addEventListener("click", () => {
    setPanelOpen(false)
    trigger.focus()
  })
  themeSelect.addEventListener("change", () => {
    state.theme = THEMES.has(themeSelect.value) ? themeSelect.value : "normal"
    applyTheme()
  })
  modeToggle.addEventListener("click", () => {
    if (state.theme === "normal") return
    state.mode = state.mode === "dark" ? "light" : "dark"
    applyTheme()
  })
  document.addEventListener("portfolio:toggle-theme-mode", () => {
    if (state.theme === "normal") return
    state.mode = state.mode === "dark" ? "light" : "dark"
    applyTheme()
  })
  document.addEventListener("pointerdown", (event) => {
    if (!panel.contains(event.target) && !trigger.contains(event.target)) setPanelOpen(false)
  })
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      setPanelOpen(false)
      trigger.focus()
    }
  })

  applyTheme()
}

export function refreshThemeLayout() {
  const theme = document.body.dataset.theme
  const grid = document.getElementById("websiteGrid")
  if (!grid || !theme || theme === "normal") return
  destroyLayout()

  const cards = Array.from(grid.querySelectorAll(".website-card"))
  if (cards.length === 0) return

  switch (theme) {
    case "neon-tech":
      createCarousel(grid, cards)
      break
    case "minimalist-glass":
      createGlassStack(grid, cards)
      break
    case "arcade-8bit":
      createArcadeSelect(grid, cards)
      break
    case "retro-os":
      createDesktopWindows(grid, cards)
      break
    case "matrix":
      createMatrixTerminal(grid, cards)
      break
    case "cyber-chaos":
      createChaosGrid(grid, cards)
      break
  }
}

function getGrid() {
  return document.getElementById("websiteGrid")
}

function destroyLayout() {
  const hadLayoutListeners = activeLayoutCleanup !== null
  if (activeLayoutCleanup) {
    activeLayoutCleanup.abort()
    activeLayoutCleanup = null
  }
  if (matrixFrame) {
    cancelAnimationFrame(matrixFrame)
    matrixFrame = 0
  }
  document.getElementById("themeMatrixCanvas")?.remove()

  const grid = getGrid()
  const hasThemeStructure = grid?.querySelector(".theme-layout") || hadLayoutListeners
  if (grid && hasThemeStructure) {
    const cards = Array.from(grid.querySelectorAll(".website-card"))
    cards.forEach((card) => {
      card.style.removeProperty("--stack-index")
      card.style.removeProperty("--chaos-x")
      card.style.removeProperty("--chaos-y")
      card.style.removeProperty("--mouse-shift-x")
      card.style.removeProperty("--mouse-shift-y")
      card.style.removeProperty("--carousel-offset")
      card.style.removeProperty("--carousel-shift")
      card.style.removeProperty("--carousel-rotation")
      card.style.removeProperty("--carousel-scale")
      card.style.removeProperty("--carousel-opacity")
      card.style.removeProperty("--glitch-delay")
      card.removeAttribute("aria-hidden")
      card.tabIndex = 0
      grid.appendChild(card)
    })
    Array.from(grid.children).forEach((child) => {
      if (!child.classList.contains("website-card")) child.remove()
    })
  }
}

function createLayoutShell(grid, className) {
  const shell = document.createElement("section")
  shell.className = `theme-layout ${className}`
  shell.setAttribute("aria-label", "Proyectos")
  grid.appendChild(shell)
  return shell
}

function createCarousel(grid, cards) {
  const shell = createLayoutShell(grid, "neon-carousel")
  const previous = createLayoutButton("Anterior", "‹", "neon-carousel__previous")
  const next = createLayoutButton("Siguiente", "›", "neon-carousel__next")
  const viewport = document.createElement("div")
  viewport.className = "neon-carousel__viewport"
  const track = document.createElement("div")
  track.className = "neon-carousel__track"
  cards.forEach((card) => track.appendChild(card))
  viewport.appendChild(track)
  shell.append(previous, viewport, next)

  let index = 0
  const controller = new AbortController()
  activeLayoutCleanup = controller
  const update = () => {
    track.style.setProperty("--carousel-index", String(index))
    track.querySelectorAll(".website-card").forEach((card, cardIndex) => {
      const offset = ((cardIndex - index + cards.length + 1) % cards.length) - 1
      card.style.setProperty("--carousel-offset", String(offset))
      card.style.setProperty("--carousel-shift", `${offset * 62}%`)
      card.style.setProperty("--carousel-rotation", `${offset * -24}deg`)
      card.style.setProperty("--carousel-scale", String(Math.max(0.48, 1 - Math.abs(offset) * 0.13)))
      card.style.setProperty("--carousel-opacity", String(Math.max(0, 1 - Math.abs(offset) * 0.26)))
      const hidden = Math.abs(offset) > 1
      card.setAttribute("aria-hidden", String(hidden))
      card.tabIndex = hidden ? -1 : 0
    })
  }
  const move = (amount) => {
    index = (index + amount + cards.length) % cards.length
    update()
  }
  previous.addEventListener("click", () => move(-1), { signal: controller.signal })
  next.addEventListener("click", () => move(1), { signal: controller.signal })
  viewport.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY) {
      event.preventDefault()
      move(event.deltaY > 0 || event.deltaX > 0 ? 1 : -1)
    }
  }, { passive: false, signal: controller.signal })
  document.addEventListener("keydown", (event) => {
    if (!grid.contains(document.activeElement)) return
    if (event.key === "ArrowRight") move(1)
    if (event.key === "ArrowLeft") move(-1)
  }, { signal: controller.signal })
  update()
}

function createGlassStack(grid, cards) {
  const shell = createLayoutShell(grid, "glass-stack")
  const stage = document.createElement("div")
  stage.className = "glass-stack__stage"
  const controls = document.createElement("div")
  controls.className = "theme-layout__controls"
  const previous = createLayoutButton("Proyecto anterior", "‹", "glass-stack__previous")
  const next = createLayoutButton("Siguiente proyecto", "›", "glass-stack__next")
  cards.forEach((card) => stage.appendChild(card))
  controls.append(previous, next)
  shell.append(stage, controls)

  let index = 0
  const controller = new AbortController()
  activeLayoutCleanup = controller
  const update = () => stage.querySelectorAll(".website-card").forEach((card, cardIndex) => {
    const offset = (cardIndex - index + cards.length) % cards.length
    card.style.setProperty("--stack-index", String(offset))
    card.style.setProperty("--stack-y", `${offset * 13}px`)
    card.style.setProperty("--stack-scale", String(1 - offset * 0.055))
    card.style.setProperty("--stack-rotation", `${(offset - 1) * 2}deg`)
    card.style.setProperty("--stack-opacity", String(Math.max(0.2, 1 - offset * 0.16)))
    const hidden = offset > 2
    card.setAttribute("aria-hidden", String(hidden))
    card.tabIndex = hidden ? -1 : 0
  })
  const move = () => {
    index = (index + 1) % cards.length
    update()
  }
  previous.addEventListener("click", () => {
    index = (index - 1 + cards.length) % cards.length
    update()
  }, { signal: controller.signal })
  next.addEventListener("click", move, { signal: controller.signal })
  stage.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) < 8) return
    event.preventDefault()
    event.deltaY > 0 ? move() : (index = (index - 1 + cards.length) % cards.length, update())
  }, { passive: false, signal: controller.signal })
  update()
}

function createArcadeSelect(grid, cards) {
  const shell = createLayoutShell(grid, "arcade-select")
  const selectGrid = document.createElement("div")
  selectGrid.className = "arcade-select__grid"
  const preview = document.createElement("aside")
  preview.className = "arcade-select__preview"
  preview.setAttribute("aria-live", "polite")
  preview.innerHTML = '<p class="arcade-select__ready">PLAYER 1<br>READY?</p><img alt="" hidden><h2></h2><p></p>'
  const previewImage = preview.querySelector("img")
  const previewName = preview.querySelector("h2")
  const previewDescription = preview.querySelectorAll("p")[1]
  const controller = new AbortController()
  activeLayoutCleanup = controller
  const updatePreview = (card) => {
    previewName.textContent = card.querySelector(".website-name")?.textContent || "Proyecto"
    previewDescription.textContent = card.querySelector(".website-description")?.textContent || ""
    const favicon = card.querySelector(".favicon")
    previewImage.src = favicon?.src || ""
    previewImage.hidden = !favicon
    preview.classList.add("is-ready")
  }
  cards.forEach((card) => {
    selectGrid.appendChild(card)
    card.addEventListener("mouseenter", () => updatePreview(card), { signal: controller.signal })
    card.addEventListener("focus", () => updatePreview(card), { signal: controller.signal })
  })
  shell.append(selectGrid, preview)
}

function createDesktopWindows(grid, cards) {
  const shell = createLayoutShell(grid, "retro-desktop")
  const controller = new AbortController()
  activeLayoutCleanup = controller
  cards.forEach((card, index) => {
    const windowFrame = document.createElement("article")
    windowFrame.className = "retro-window"
    windowFrame.style.setProperty("--window-index", String(index))
    const titleBar = document.createElement("div")
    titleBar.className = "retro-window__titlebar"
    titleBar.innerHTML = `<span>${escapeHTML(card.querySelector(".website-name")?.textContent || "Proyecto")}</span>`
    const controls = document.createElement("div")
    controls.className = "retro-window__controls"
    const minimize = createWindowControl("_", "Minimizar")
    const maximize = createWindowControl("□", "Maximizar")
    const close = createWindowControl("×", "Cerrar")
    controls.append(minimize, maximize, close)
    titleBar.appendChild(controls)
    windowFrame.append(titleBar, card)
    shell.appendChild(windowFrame)

    minimize.addEventListener("click", (event) => {
      event.stopPropagation()
      windowFrame.classList.toggle("is-minimized")
    }, { signal: controller.signal })
    maximize.addEventListener("click", (event) => {
      event.stopPropagation()
      windowFrame.classList.toggle("is-maximized")
    }, { signal: controller.signal })
    close.addEventListener("click", (event) => {
      event.stopPropagation()
      windowFrame.classList.add("is-closed")
    }, { signal: controller.signal })
    titleBar.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || windowFrame.classList.contains("is-maximized")) return
      const startX = event.clientX
      const startY = event.clientY
      let offsetX = 0
      let offsetY = 0
      const move = (moveEvent) => {
        offsetX = moveEvent.clientX - startX
        offsetY = moveEvent.clientY - startY
        windowFrame.style.setProperty("--drag-x", `${offsetX}px`)
        windowFrame.style.setProperty("--drag-y", `${offsetY}px`)
      }
      const stop = () => {
        titleBar.removeEventListener("pointermove", move)
        titleBar.removeEventListener("pointerup", stop)
        titleBar.removeEventListener("pointercancel", stop)
      }
      titleBar.setPointerCapture(event.pointerId)
      titleBar.addEventListener("pointermove", move, { signal: controller.signal })
      titleBar.addEventListener("pointerup", stop, { once: true, signal: controller.signal })
      titleBar.addEventListener("pointercancel", stop, { once: true, signal: controller.signal })
      windowFrame.style.zIndex = String(++windowZIndex)
    }, { signal: controller.signal })
  })
}

function createMatrixTerminal(grid, cards) {
  const canvas = document.createElement("canvas")
  canvas.id = "themeMatrixCanvas"
  canvas.className = "matrix-rain"
  canvas.setAttribute("aria-hidden", "true")
  document.body.prepend(canvas)
  const shell = createLayoutShell(grid, "matrix-terminal")
  const heading = document.createElement("div")
  heading.className = "matrix-terminal__heading"
  heading.innerHTML = "<span>jhorman@portfolio:~$</span> ls ./projects"
  const list = document.createElement("div")
  list.className = "matrix-terminal__list"
  cards.forEach((card, index) => {
    const row = document.createElement("div")
    row.className = "matrix-terminal__row"
    const prompt = document.createElement("span")
    prompt.textContent = `0${index + 1}  > `
    row.append(prompt, card)
    list.appendChild(row)
  })
  shell.append(heading, list)
  drawMatrix(canvas)
}

function drawMatrix(canvas) {
  const context = canvas.getContext("2d")
  if (!context) return
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const glyphs = "アイウエオカキクケコ012345789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let columns = []
  let fontSize = 16
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(window.innerWidth * ratio)
    canvas.height = Math.floor(window.innerHeight * ratio)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    columns = Array.from({ length: Math.ceil(window.innerWidth / fontSize) }, () => Math.random() * -50)
  }
  const draw = () => {
    const light = document.body.dataset.mode === "light"
    context.fillStyle = light ? "rgba(232, 255, 232, .12)" : "rgba(0, 0, 0, .12)"
    context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    context.fillStyle = light ? "#236b38" : "#00ff41"
    context.font = `${fontSize}px monospace`
    columns.forEach((y, index) => {
      const text = glyphs[Math.floor(Math.random() * glyphs.length)]
      context.fillText(text, index * fontSize, y * fontSize)
      columns[index] = y * fontSize > window.innerHeight && Math.random() > 0.975 ? 0 : y + 1
    })
    if (!reducedMotion) matrixFrame = requestAnimationFrame(draw)
  }
  window.addEventListener("resize", resize)
  activeLayoutCleanup = new AbortController()
  activeLayoutCleanup.signal.addEventListener("abort", () => window.removeEventListener("resize", resize), { once: true })
  resize()
  draw()
}

function createChaosGrid(grid, cards) {
  const shell = createLayoutShell(grid, "chaos-grid")
  const controller = new AbortController()
  activeLayoutCleanup = controller
  cards.forEach((card, index) => {
    const x = ((index * 37) % 49) - 24
    const y = ((index * 23) % 41) - 20
    card.style.setProperty("--chaos-x", `${x}px`)
    card.style.setProperty("--chaos-y", `${y}px`)
    card.style.setProperty("--glitch-delay", `${index * -0.3}s`)
    shell.appendChild(card)
  })
  const move = (event) => {
    const bounds = shell.getBoundingClientRect()
    const mouseX = (event.clientX - bounds.left) / bounds.width - 0.5
    const mouseY = (event.clientY - bounds.top) / bounds.height - 0.5
    shell.style.setProperty("--mouse-x", `${mouseX}`)
    shell.style.setProperty("--mouse-y", `${mouseY}`)
    cards.forEach((card) => {
      const cardBounds = card.getBoundingClientRect()
      const deltaX = (event.clientX - (cardBounds.left + cardBounds.width / 2)) / bounds.width
      const deltaY = (event.clientY - (cardBounds.top + cardBounds.height / 2)) / bounds.height
      card.style.setProperty("--mouse-shift-x", `${Math.max(-18, Math.min(18, -deltaX * 24))}px`)
      card.style.setProperty("--mouse-shift-y", `${Math.max(-18, Math.min(18, -deltaY * 24))}px`)
    })
  }
  shell.addEventListener("pointermove", move, { signal: controller.signal })
  shell.addEventListener("pointerleave", () => {
    shell.style.setProperty("--mouse-x", "0")
    shell.style.setProperty("--mouse-y", "0")
    cards.forEach((card) => {
      card.style.setProperty("--mouse-shift-x", "0px")
      card.style.setProperty("--mouse-shift-y", "0px")
    })
  }, { signal: controller.signal })
}

function createLayoutButton(label, text, className = "") {
  const button = document.createElement("button")
  button.type = "button"
  button.className = `theme-layout__button ${className}`.trim()
  button.setAttribute("aria-label", label)
  button.textContent = text
  return button
}

function createWindowControl(text, label) {
  const button = document.createElement("button")
  button.type = "button"
  button.className = "retro-window__control"
  button.textContent = text
  button.setAttribute("aria-label", label)
  return button
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character])
}
