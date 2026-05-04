import { auth } from "./firebase-config.js"
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const errorMessage = document.getElementById("error-message")

  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "admin.html"
    }
  })

  if (!loginForm) return

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email")?.value.trim() || ""
    const password = document.getElementById("password")?.value || ""
    errorMessage.textContent = ""

    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.location.href = "admin.html"
    } catch (error) {
      console.error("Error de login:", error)
      errorMessage.textContent = "No se pudo iniciar sesión. Verifica tus credenciales."
    }
  })
})
