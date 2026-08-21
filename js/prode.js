// js/prode.js
// Truco para pruebas: entrar con ?reset=1 al final de la URL borra el "ya voté"
if (new URLSearchParams(window.location.search).get("reset") === "1") {
    localStorage.removeItem("prode_ya_voto");
}

import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== Estado de las selecciones tipo "toggle" =====
let sexoElegido = null;
let parecidoElegido = null;
let peloElegido = null;
let llantoElegido;

// Conecta un grupo de botones .toggle para que se marque uno solo como activo
function armarToggleGroup(contenedorId, datasetKey, onSelect) {
    const contenedor = document.getElementById(contenedorId);
    contenedor.querySelectorAll(".toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            contenedor.querySelectorAll(".toggle").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            onSelect(btn.dataset[datasetKey]);
        });
    });
}

armarToggleGroup("toggleSexo", "sexo", v => sexoElegido = v);
armarToggleGroup("toggleParecido", "parecido", v => parecidoElegido = v);
armarToggleGroup("togglePelo", "pelo", v => peloElegido = v);
armarToggleGroup("toggleLlanto", "llanto", v => llantoElegido = v);

// ===== Sliders: mostrar el valor elegido en vivo =====
const pesoGuess = document.getElementById("pesoGuess");
const pesoVal = document.getElementById("pesoVal");
pesoGuess.addEventListener("input", () => {
    pesoVal.textContent = Number(pesoGuess.value).toFixed(2) + " kg";
});

const alturaGuess = document.getElementById("alturaGuess");
const alturaVal = document.getElementById("alturaVal");
alturaGuess.addEventListener("input", () => {
    alturaVal.textContent = alturaGuess.value + " cm";
});

// ===== Guardar la predicción =====
const formMsg = document.getElementById("formMsg");

function mostrarError(texto) {
    formMsg.textContent = texto;
    formMsg.classList.add("error");
}

document.getElementById("btnVotar").addEventListener("click", async () => {
    formMsg.classList.remove("error");

    const nombre = document.getElementById("votanteNombre").value.trim();
    const fecha = document.getElementById("fechaGuess").value;
    const hora = document.getElementById("horaGuess").value;

    if (!nombre) return mostrarError("Poné tu nombre.");
    if (!sexoElegido) return mostrarError("Elegí varón o mujer.");
    if (!fecha) return mostrarError("Elegí una fecha.");
    if (!hora) return mostrarError("Elegí una hora aproximada.");

    const prediccion = {
        nombre,
        sexo: sexoElegido,
        fecha,
        hora,
        peso: Number(pesoGuess.value),
        altura: Number(alturaGuess.value),
        parecido: parecidoElegido,
        pelo: peloElegido,
        llanto: llantoElegido,
        creado: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "predicciones"), prediccion);
        localStorage.setItem("prode_ya_voto", "1");
        mostrarEspera();
    } catch (e) {
        console.error(e);
        mostrarError("Uy, hubo un error al guardar. Probá de nuevo.");
    }
});

function mostrarEspera() {
    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("waitingCard").classList.remove("hidden");
}

// ===== Al cargar la página =====
// Si ya votó desde este dispositivo, mostrar directamente la pantalla de espera.
// (El chequeo de si YA NACIÓ el bebé se agrega en js/reveal.js, próximo paso)
if (localStorage.getItem("prode_ya_voto") === "1") {
    mostrarEspera();
}