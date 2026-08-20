# Contexto: App "Prode del Bebé" (prode-bebe)

## Qué es
PWA/mini-app para que familia y amigos hagan predicciones sobre el nacimiento del bebé de Anto y Santi (sexo, fecha, hora, peso, altura + apuestas graciosas). Todo queda oculto hasta que los papás cargan el resultado real; ahí se revela un podio con puntaje.

## Stack
- HTML/CSS/JS vanilla, sin frameworks ni npm, `<script type="module">`
- Firebase Firestore (SIN Auth — app sin login, uso familiar informal)
- Imports de Firebase SIEMPRE con URL completa de gstatic (nunca estilo npm "firebase/app"), versión `10.12.2`
- Proyecto Firebase: `bebe-2f40d`

## Estado: las 3 piezas base están hechas
- `index.html` → esqueleto de toda la UI: formulario de predicción, tarjeta de espera, tarjeta de revelación, panel admin. Sin lógica.
- `css/styles.css` → paleta cálida (crema/terracota/salvia), variables en `:root` (`--bg`, `--card`, `--accent`, `--text-dim`, `--error`...), mismo criterio que cuentas-app.
- `js/firebase-config.js` → conexión a Firestore. Exporta `db`.
- `js/prode.js` → formulario de predicción: toggles (sexo/parecido/pelo), sliders (peso en kg, altura en cm), guarda en colección `predicciones` con `addDoc`, marca `localStorage.prode_ya_voto = "1"` para no votar dos veces desde el mismo dispositivo, muestra pantalla de espera.
- `js/reveal.js` → panel admin con PIN (`const PIN = "1234"`, ya cambiado en producción por el usuario), guarda resultado real en `config/resultado` (doc único), calcula puntaje y muestra podio + ranking + apuestas graciosas. Incluye confetti al revelar.

## Estructura de datos en Firestore
- Colección `predicciones` → un doc por persona: `{nombre, sexo, fecha, hora, peso, altura, parecido, pelo, creado}`
- Colección `config`, doc `resultado` → `{sexo, fecha, hora, peso, altura}` (se crea recién cuando nace el bebé)

## Reglas de Firestore (ya aplicadas)
Abiertas a propósito (sin auth): `allow read, write: if true;` tanto en `predicciones` como en `config`. El PIN del panel admin es la única traba — no es a prueba de mala intención, solo para uso familiar.

## Sistema de puntaje (sobre 100, en `calcularPuntaje()` de reveal.js)
- Sexo: 10 pts si acierta
- Fecha: hasta 20 pts, decrece a 0 con una diferencia de 10 días
- Hora: hasta 20 pts, decrece a 0 con una diferencia de 12 horas
- Peso: hasta 20 pts, decrece a 0 con una diferencia de 0.5 kg
- Altura: hasta 15 pts, decrece a 0 con una diferencia de 8 cm
- Bono: +15 pts extra para quien haya sacado el puntaje más alto (no es todo o nada, es distancia a lo real)

## Decisiones de diseño ya tomadas (no volver a preguntar)
- Peso se carga en **kilos con decimales** (ej. 3.30), no en gramos
- Nombres de los papás en el subtítulo: **Anto y Santi**
- Nada se muestra a nadie (ni resultados parciales ni quién votó qué) hasta que se carga el resultado real — es la gracia del juego
- Las apuestas "graciosas" (parecido, pelo) NO suman puntos, son solo para el resumen final
- Un voto por dispositivo vía `localStorage`, no hay validación más estricta

## Truco de testing agregado
En `js/prode.js`, entrar con `?reset=1` al final de la URL borra el `localStorage.prode_ya_voto` para poder volver a votar de prueba (útil en celular, donde no hay consola fácil). **Recordar sacar este bloque antes de que la app quede en manos de la familia**, para que nadie lo use para votar dos veces.

## Preferencias de trabajo del usuario
- Modo "principiante": indicar directamente qué cambiar, mínima explicación, un cambio a la vez, paso a paso
- Prefiere que le pase el código y él mismo cree/pegue los archivos (no hace falta que Claude use create_file para esto)
- Explicaciones breves, sin vueltas — prioriza ahorrar cuota del chat
- Trabaja en español
- Ya tiene experiencia con este stack (Firebase + vanilla JS + GitHub Pages) en otros proyectos propios (JOOLI CateringDesk, Redeterminaciones 800/16, cuentas-app)

## Próximos pasos posibles
- Sacar el bloque de `?reset=1` antes de compartir el link con la familia
- Deploy a GitHub Pages (repo todavía no mencionado/creado para este proyecto)
- Eventualmente: borrar predicciones/resultado de prueba en Firestore antes de que la familia empiece a votar en serio
