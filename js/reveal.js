// js/reveal.js
import { db } from "./firebase-config.js";
import {
    doc, getDoc, setDoc,
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PIN = "1234"; // cambiar acá

// ===== Cálculo de puntaje (sobre 100) =====
function calcularPuntaje(pred, real) {
    let pts = 0;
    if (pred.sexo === real.sexo) pts += 10;

    const diffDias = Math.abs(new Date(pred.fecha) - new Date(real.fecha)) / 86400000;
    pts += Math.max(0, 20 * (1 - diffDias / 10));

    const [ph, pm] = pred.hora.split(":").map(Number);
    const [rh, rm] = real.hora.split(":").map(Number);
    const diffHoras = Math.abs((ph * 60 + pm) - (rh * 60 + rm)) / 60;
    pts += Math.max(0, 20 * (1 - diffHoras / 12));

    const diffPeso = Math.abs(pred.peso - real.peso);
    pts += Math.max(0, 20 * (1 - diffPeso / 0.5));

    const diffAltura = Math.abs(pred.altura - real.altura);
    pts += Math.max(0, 15 * (1 - diffAltura / 8));

    return pts;
}

async function mostrarParticipantes() {
    const snap = await getDocs(collection(db, "predicciones"));
    const nombres = snap.docs.map(d => d.data().nombre);
    const cont = document.getElementById("listaParticipantes");
    if (!nombres.length) {
        cont.innerHTML = "<p class='muted'>Todavía no votó nadie.</p>";
        return;
    }
    cont.innerHTML = `
    <p class="muted">${nombres.length} persona${nombres.length === 1 ? "" : "s"} ya predijeron:</p>
    <ul class="lista-nombres">
      ${nombres.map(n => `<li>${n}</li>`).join("")}
    </ul>
  `;
}

// ===== Panel admin: abrir / validar PIN =====
document.getElementById("btnAbrirAdmin").addEventListener("click", () => {
    document.getElementById("adminCard").classList.toggle("hidden");
});

document.getElementById("btnPin").addEventListener("click", () => {
    if (document.getElementById("pinInput").value === PIN) {
        document.getElementById("adminForm").classList.remove("hidden");
        document.getElementById("formCard").classList.add("hidden");
        document.getElementById("waitingCard").classList.add("hidden");
        mostrarParticipantes(); // ← agregar esta línea
    } else {
        alert("PIN incorrecto");
    }
});

document.getElementById("btnCancelarAdmin").addEventListener("click", () => {
    document.getElementById("adminCard").classList.add("hidden");
    document.getElementById("adminForm").classList.add("hidden");
    document.getElementById("pinInput").value = "";
    if (localStorage.prode_ya_voto === "1") {
        document.getElementById("waitingCard").classList.remove("hidden");
    } else {
        document.getElementById("formCard").classList.remove("hidden");
    }
});

document.getElementById("pinInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        document.getElementById("btnPin").click();
    }
});

let sexoReal = null;
document.querySelectorAll("#toggleSexoReal .toggle").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#toggleSexoReal .toggle").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        sexoReal = btn.dataset.sexoReal;
    });
});

document.getElementById("btnGuardarReal").addEventListener("click", async () => {
    const fecha = document.getElementById("fechaReal").value;
    const hora = document.getElementById("horaReal").value;
    const peso = Number(document.getElementById("pesoReal").value);
    const altura = Number(document.getElementById("alturaReal").value);

    if (!sexoReal || !fecha || !hora || !peso || !altura) {
        alert("Completá todos los campos");
        return;
    }

    try {
        await setDoc(doc(db, "config", "resultado"), { sexo: sexoReal, fecha, hora, peso, altura });
        document.getElementById("adminCard").classList.add("hidden");
        await mostrarRevelacion();
        lanzarConfetti();
    } catch (e) {
        console.error(e);
        alert("Error al guardar");
    }
});

// ===== Mostrar revelación (podio + ranking + apuestas graciosas) =====
async function mostrarRevelacion() {
    const resultado = window._resultadoReal;
    if (!resultado) return;

    const snap = await getDocs(collection(db, "predicciones"));
    const votos = snap.docs.map(d => d.data());

    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("waitingCard").classList.add("hidden");
    document.getElementById("revealCard").classList.remove("hidden");

    document.getElementById("revealSexo").textContent =
        resultado.sexo === "Varón" ? "👦 ¡Es varón!" : "👧 ¡Es mujer!";
    document.getElementById("revealDetalle").textContent =
        `${new Date(resultado.fecha).toLocaleDateString("es-AR")} · ${resultado.hora}hs · ${resultado.peso}kg · ${resultado.altura}cm`;

    if (!votos.length) return;

    const scored = votos.map(v => ({ ...v, puntos: calcularPuntaje(v, resultado) }));
    const maxIdx = scored.reduce((best, v, i, arr) => v.puntos > arr[best].puntos ? i : best, 0);
    scored[maxIdx].puntos += 15; // bono al más preciso
    scored.sort((a, b) => b.puntos - a.puntos);

    const medallas = ["🥇", "🥈", "🥉"];
    const clases = ["p1", "p2", "p3"];
    document.getElementById("podio").innerHTML = scored.slice(0, 3).map((v, i) => `
    <div class="puesto ${clases[i]}">
      <div class="medal">${medallas[i]}</div>
      <div class="nombre">${v.nombre}</div>
      <div class="pts">${v.puntos.toFixed(0)} pts</div>
    </div>
  `).join("");

    document.getElementById("rankList").innerHTML = scored.map((v, i) => `
    <div class="rank-row">
      <span class="pos">${i + 1}°</span>
      <span class="name">${v.nombre}</span>
      <span class="score">${v.puntos.toFixed(0)} pts</span>
    </div>
  `).join("");

    function mayoria(campo) {
        const conteo = {};
        votos.forEach(v => { if (v[campo]) conteo[v[campo]] = (conteo[v[campo]] || 0) + 1; });
        const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        return entries.length ? `${entries[0][0]} (${entries[0][1]} de ${votos.length})` : "—";
    }

    document.getElementById("funFacts").innerHTML = `
    <div class="stat-row"><span>¿A quién se parece más?</span><b>${mayoria("parecido")}</b></div>
    <div class="stat-row"><span>¿Mucho pelo?</span><b>${mayoria("pelo")}</b></div>
  `;
}

// ===== Confetti =====
function lanzarConfetti() {
    const canvas = document.createElement("canvas");
    canvas.id = "confetti";
    canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:999;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#BE6A45", "#7C9473", "#E8B94D", "#E893A8", "#7FA8C9"];
    const particles = Array.from({ length: 130 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        r: 3 + Math.random() * 4,
        c: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 3,
        vx: -1 + Math.random() * 2,
        rot: Math.random() * 360
    }));

    let frames = 0;
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y += p.vy; p.x += p.vx; p.rot += 5;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
            ctx.restore();
        });
        frames++;
        if (frames < 220) requestAnimationFrame(tick);
        else canvas.remove();
    }
    tick();
}

// ===== Al cargar la página: ¿ya nació? =====
(async function initReveal() {
    const snap = await getDoc(doc(db, "config", "resultado"));
    if (snap.exists()) {
        window._resultadoReal = snap.data();
        await mostrarRevelacion();
    }
})();