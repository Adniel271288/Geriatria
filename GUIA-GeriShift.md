# GeriShift Lleida — Guía para publicarla como página web

Esta guía te lleva, paso a paso y sin asumir conocimientos de programación, desde cero hasta una web con enlace que tu equipo puede usar desde el móvil. Tienes tres archivos:

- **index.html** → la aplicación completa (todo en un solo archivo).
- **firestore.rules** → las reglas de seguridad de la base de datos.
- **GUIA-GeriShift.md** → esta guía.

Tiempo aproximado de puesta en marcha: **30–45 minutos** la primera vez.

---

## 1. Recomendación técnica final

**Recomiendo Firebase (Authentication + Cloud Firestore) como base, con la app en un único archivo `index.html`, publicado en una web estática.**

Por qué esta combinación:

- **Sin instalar ni compilar nada.** La app es un solo `index.html`. No hay que instalar dependencias, ni Node, ni "compilar" un proyecto React. Eso es justo lo que te resultaba complicado.
- **Login real y multiusuario.** Firebase Authentication da correo + contraseña de verdad.
- **Datos compartidos y en vivo.** Firestore actualiza el calendario en todos los móviles al instante cuando alguien añade o cambia una guardia.
- **Seguridad real.** Las reglas (`firestore.rules`) garantizan, *en el servidor*, que las guardias privadas de Urgencias del Arnau solo las vea su residente.
- **Gratis** para un equipo de este tamaño (el plan gratuito de Firebase sobra).

Comparado con las otras opciones que planteabas: Supabase + Vercel es igual de válido, pero te obligaría a manejar repositorios de GitHub y SQL; y un React "puro" exige compilar. La opción de archivo único + Firebase es la más sencilla manteniendo login real, datos compartidos y seguridad.

> La app carga dos librerías pequeñas (Preact y htm) desde un CDN y Firebase desde Google. No necesitas saber qué son; solo ten conexión a internet al abrir la web.

---

## 2. Pasos generales

1. Crear un proyecto en Firebase.
2. Activar el login por correo y contraseña.
3. Crear la base de datos (Firestore).
4. Copiar la configuración del proyecto y pegarla en `index.html`.
5. Pegar las reglas de seguridad.
6. Publicar el `index.html` para obtener un enlace.
7. Dar de alta a los usuarios del equipo.
8. Compartir el enlace.

---

## 3. Archivos del proyecto

| Archivo | Qué es | Dónde se usa |
|---|---|---|
| `index.html` | La aplicación entera (pantallas, calendario, login, edición). | Lo publicas como web. |
| `firestore.rules` | Reglas de seguridad de la base de datos. | Se pegan en la consola de Firebase. |
| `GUIA-GeriShift.md` | Esta guía. | Solo para ti. |

No hay más archivos: todo el código (HTML, estilos y lógica) está dentro de `index.html`.

---

## 4. Código completo

El código completo ya está en **`index.html`** y **`firestore.rules`** (los archivos que te entrego). No tienes que escribir nada de código; solo:

- pegar **tu configuración de Firebase** en la parte de arriba de `index.html` (está señalado con un bloque grande de comentario que dice *"PEGA AQUÍ TU CONFIGURACIÓN"*), y
- pegar el contenido de `firestore.rules` en la consola de Firebase.

Más abajo se explica exactamente cómo.

---

## 5. Configuración de base de datos y autenticación (Firebase)

### 5.1. Crear el proyecto
1. Entra en **https://console.firebase.google.com** con tu cuenta de Google.
2. **Agregar proyecto** → nombre: `GeriShift` → puedes desactivar Google Analytics → **Crear proyecto**.

### 5.2. Activar el login por correo y contraseña
1. En el menú lateral: **Compilación (Build) → Authentication → Comenzar**.
2. Pestaña **Sign-in method** → **Correo electrónico/contraseña** → actívalo (**Habilitar**) → **Guardar**.

### 5.3. Crear la base de datos
1. **Compilación → Firestore Database → Crear base de datos**.
2. Elige **modo de producción** (más seguro; las reglas las pondremos nosotros).
3. Ubicación: elige una europea, p. ej. **eur3 (europe-west)** → **Habilitar**.

### 5.4. Obtener tu configuración y pegarla en `index.html`
1. Arriba a la izquierda, icono ⚙️ → **Configuración del proyecto**.
2. Baja hasta **Tus apps** → pulsa el icono **Web** `</>`.
3. Apodo de la app: `GeriShift Web` → **Registrar app**.
4. Verás un bloque parecido a este:
   ```js
   const firebaseConfig = {
     apiKey: "AIza........",
     authDomain: "gerishift-xxxx.firebaseapp.com",
     projectId: "gerishift-xxxx",
     storageBucket: "gerishift-xxxx.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef......"
   };
   ```
5. Abre `index.html` con cualquier editor de texto (Bloc de notas, TextEdit, VS Code…), busca el bloque **firebaseConfig** del principio y **sustituye** los valores `PON_AQUI...` por los tuyos. Guarda el archivo.

> **¿Es seguro que la `apiKey` esté en el archivo?** Sí. En Firebase web la `apiKey` **no es un secreto**: solo identifica tu proyecto. Quien protege los datos son el login y las reglas de seguridad.

---

## 6. Reglas de seguridad

1. En Firebase: **Firestore Database → pestaña Reglas (Rules)**.
2. Borra lo que haya y **pega el contenido completo de `firestore.rules`**.
3. Pulsa **Publicar**.

Qué garantizan estas reglas:

1. Cualquier usuario con sesión puede leer el listado del equipo.
2. Cualquier usuario con sesión puede leer las guardias **públicas**.
3. Las guardias **privadas** solo las lee su dueño (o el administrador).
4. Un usuario normal solo puede crear o modificar **sus** guardias privadas.
5. Las guardias privadas **no son visibles** para el resto del equipo.
6. Existe un **rol de administrador** (campo `admin: true`) que gestiona todo el cuadrante.

> No tienes que crear ningún "índice" a mano: la app está hecha para no necesitarlos.

---

## 7. Despliegue (publicar la web y obtener el enlace)

Tienes dos rutas. La **Ruta A no requiere instalar nada** y es la recomendada para ti.

### Ruta A — Netlify Drop (recomendada, sin instalar nada)
1. Asegúrate de haber pegado tu `firebaseConfig` en `index.html` (paso 5.4).
2. Entra en **https://app.netlify.com/drop**.
3. **Arrastra `index.html`** (o una carpeta que lo contenga) a la zona de la página.
4. En segundos te da una URL pública, p. ej. `https://nombre-al-azar-123.netlify.app`. **Ya está online.**
5. *(Recomendado)* Crea una cuenta gratuita de Netlify para conservar el sitio y ponerle un nombre bonito: en el panel del sitio, **Site configuration → Change site name** → `gerishift-lleida` → quedará `https://gerishift-lleida.netlify.app`.
6. *(Recomendado)* En Firebase → **Authentication → Settings → Authorized domains → Add domain** → añade tu dominio `....netlify.app`. (Con login de correo suele funcionar igualmente, pero así evitas sorpresas.)
7. **Para actualizar la web** en el futuro (si te doy una versión nueva del `index.html`): vuelve a arrastrar el archivo nuevo en **Deploys** del mismo sitio.

### Ruta B — Firebase Hosting (todo en Firebase, requiere terminal)
1. Instala **Node.js** (versión LTS) desde **https://nodejs.org**.
2. Abre una terminal y ejecuta: `npm install -g firebase-tools`
3. `firebase login` (se abre el navegador para iniciar sesión).
4. En una carpeta que contenga tu `index.html`: `firebase init hosting`
   - Elige tu proyecto GeriShift.
   - *Public directory*: escribe `.` (un punto).
   - *Single-page app*: responde **No**.
   - *Overwrite index.html*: responde **No**.
5. `firebase deploy`
6. Te dará un enlace `https://TU-PROYECTO.web.app`. Con esta ruta el dominio ya está autorizado automáticamente.

---

## 8. Cómo invitar usuarios

Hay **dos partes** por cada persona: crear su acceso (correo + contraseña) y darla de alta en el listado. El paso clave es **copiar el UID** del usuario y usarlo como identificador en el listado.

### 8.1. Crear el acceso (correo + contraseña)
1. Firebase → **Authentication → Users → Add user**.
2. Escribe el correo y una **contraseña temporal** → **Add user**.
3. Repite para cada miembro del equipo.
4. Cada usuario creado muestra un **User UID** (una cadena larga). Tendrás que copiarlo en el siguiente paso.

### 8.2. Darla de alta en el listado (colección `users_public`)
1. Firebase → **Firestore Database → Data**.
2. La primera vez: **Start collection** → ID de la colección: `users_public`.
3. Para cada persona, **Add document**:
   - **Document ID** = pega el **UID** de esa persona (el del paso 8.1). *Esto es lo que enlaza su login con su ficha.*
   - Añade estos campos:
     - `nombre` (string)
     - `rol` (string): `adjunto` o `residente`
     - `nivel` (string): `R2` / `R3` / `R4` — para adjuntos déjalo vacío
     - `orden` (number): para ordenarlos en la lista
     - `email` (string): el mismo correo del login
     - `admin` (boolean): `true` solo para quien gestiona el cuadrante; el resto `false`

### 8.3. Listado inicial sugerido
Usa **correos de ejemplo** y cámbialos por los reales del equipo. He marcado a Adniel como administrador; cámbialo si prefieres a otra persona.

| nombre | rol | nivel | orden | email (CÁMBIALO) | admin |
|---|---|---|---|---|---|
| Dr. de Miguel | adjunto | *(vacío)* | 1 | demiguel@ejemplo.com | false |
| Dr. Arias | adjunto | *(vacío)* | 2 | arias@ejemplo.com | false |
| Dra. Blasco | adjunto | *(vacío)* | 3 | blasco@ejemplo.com | false |
| Adniel García Cruz | residente | R3 | 4 | adniel@ejemplo.com | **true** |
| Toni | residente | R3 | 5 | toni@ejemplo.com | false |
| Andrea | residente | R4 | 6 | andrea@ejemplo.com | false |
| Lucero | residente | R4 | 7 | lucero@ejemplo.com | false |
| Cata | residente | R2 | 8 | cata@ejemplo.com | false |
| Lino | residente | R2 | 9 | lino@ejemplo.com | false |

> **Importante:** el `email` y la `contraseña` con los que cada persona inicia sesión se definen en **Authentication** (paso 8.1). El campo `email` del listado es solo informativo. Si cambias un correo, hazlo en los dos sitios.

### 8.4. (Opcional) Cargar unas guardias de prueba a mano
Puedes esperar y crearlas desde la app, o añadir un par a mano para probar:
- **Pública** (colección `shifts_public`, *Add document*, ID automático):
  `dayId: "2026-10-01"`, `mes: "2026-10"`, `uid: <UID del Dr. de Miguel>`, `hospital: "HUSM"`, `horario: "15:00 – 08:00"`, `overnight: true`
- **Privada** (colección `shifts_private`):
  `dayId: "2026-10-01"`, `mes: "2026-10"`, `uid: <UID de Adniel>`, `hospital: "HUAV"`, `horario: "15:00 – 08:00"`, `overnight: true`

(El campo `mes` debe ser los 7 primeros caracteres de `dayId`. La app lo rellena sola cuando creas guardias desde dentro.)

---

## 9. Cómo usar la web una vez publicada

- **Entrar:** abre el enlace → introduce correo y contraseña.
- **Calendario:** cada día muestra puntos de color (azul = Santa María, rojo = Arnau · Urgencias). Cambia de mes con las flechas.
- **Mis guardias:** el botón de arriba atenúa los días que no son tuyos.
- **Ver el detalle:** toca un día y se abre el panel agrupado por hospital con nombres y horarios.
- **Añadir / editar / borrar (administrador):** toca un día → *Añadir guardia*, o toca una guardia existente para editarla o eliminarla. Puedes elegir a cualquier persona; si es un residente en Urgencias del Arnau, la guardia se guarda **privada** automáticamente (el propio formulario te avisa).
- **Residentes (no administradores):** ven el calendario y pueden registrar **sus** guardias privadas de Urgencias del Arnau.
- **Privacidad en acción:** una guardia privada de un residente solo aparece cuando esa persona inicia sesión. El administrador, además, las ve todas para poder gestionar el cuadrante.
- **Alertas:** cada usuario activa/desactiva sus avisos (se guardan en su cuenta). El envío real de notificaciones llega en la fase 2.
- **Instalar como app en el móvil:** en iPhone (Safari) → Compartir → *Añadir a pantalla de inicio*; en Android (Chrome) → menú ⋮ → *Añadir a pantalla de inicio*. Quedará con icono, como una app.

### Cómo compartir el enlace con el equipo
Envía por WhatsApp o correo: **el enlace** + **el correo y la contraseña temporal de cada uno**. Sugiéreles que la añadan a la pantalla de inicio.

---

## 10. Próximas mejoras (fase 2)

- **Importación automática desde Excel** del cuadrante (tu Fase 4/5), con validación de cuotas R1–R4.
- **Notificaciones push reales** (Firebase Cloud Messaging) y recordatorios 24 h / 2 h en segundo plano.
- **Sincronización con Google Calendar / Apple Calendar** ("Sincronizar esta guardia").
- **Restablecer contraseña por correo** (autoservicio) y alta de usuarios por invitación, sin tocar la consola.
- **Panel de administración** dentro de la app para editar el listado del equipo y las guardias privadas de otros sin entrar a Firebase.
- **Icono propio e instalación como PWA** (funcionamiento sin conexión).
- **Dominio propio** (p. ej. `gerishift.cat`).
- **Registro de cambios (auditoría)**: quién modificó qué y cuándo.
- **Endurecer la `apiKey`** restringiéndola por dominio en Google Cloud.

---

### Resumen de la decisión
Una sola página web (`index.html`) + Firebase (login + base de datos + reglas), publicada arrastrando un archivo a Netlify. Sin instalar nada, con datos compartidos en vivo y la privacidad de las guardias garantizada por el servidor. Cuando quieras dar el salto a Excel automático o notificaciones, partimos de aquí.
