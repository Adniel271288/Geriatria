# GeriShift Lleida

App de guardias para el equipo de **Geriatría de Lleida** (Hospital Santa María · Planta y Arnau de Vilanova · Urgencias).

Es **una sola página web** (`index.html`). No hay que instalar ni compilar nada.

---

## ▶️ Probarla ahora mismo

Abre el archivo **`index.html`** con un doble clic (se abre en tu navegador) **o** publícala con un enlace (ver más abajo).

- Funciona **sin configurar nada** gracias al **modo demo**.
- En la pantalla de entrada, escribe **cualquier correo válido** y **cualquier contraseña**:
  - Como **administrador** (puede crear/editar todas las guardias): `adniel@ejemplo.com`
  - Como **residente** (solo ve lo público y sus guardias privadas): `toni@ejemplo.com`
- En **Perfil** puedes cambiar de identidad para ver cómo lo ve cada persona, y restablecer los datos.

> En modo demo los datos se guardan **solo en ese dispositivo** (en el navegador). Es perfecto para probar la app y enseñarla al equipo. Para datos **reales y compartidos** entre todos, activa Firebase (paso de abajo).

---

## 🌐 Ponerla online (un enlace para el equipo)

La forma más sencilla, **sin instalar nada**:

1. Entra en **https://app.netlify.com/drop**
2. **Arrastra el archivo `index.html`** a la página.
3. En segundos te da una URL pública (p. ej. `https://gerishift-lleida.netlify.app`). Ya está online.

Cada persona puede **añadirla a la pantalla de inicio** del móvil y usarla como una app.

> También puedes publicarla con **GitHub Pages** (ver `.github/workflows/deploy.yml`) o con **Firebase Hosting**. Todos los detalles están en **`GUIA-GeriShift.md`**.

---

## 🔐 Activar el modo real (datos compartidos entre todo el equipo)

Cuando quieras login de verdad, sincronización en vivo entre móviles y privacidad
garantizada por el servidor:

1. Crea un proyecto en **Firebase** (gratis) y pega tu configuración en `index.html`
   (busca el bloque `firebaseConfig`, arriba del script).
2. Pega `firestore.rules` en las reglas de Firestore.
3. Da de alta a las personas del equipo.

La web detecta sola la configuración y pasa del **modo demo** al **modo real**.
La guía paso a paso (sin conocimientos de programación) está en **`GUIA-GeriShift.md`**.

---

## 📁 Archivos del proyecto

| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa (demo + modo Firebase). Es lo que se publica. |
| `firestore.rules` | Reglas de seguridad para el modo real (se pegan en Firebase). |
| `GUIA-GeriShift.md` | Guía detallada de puesta en marcha y uso. |
| `GeriShift.jsx` | Prototipo original en React (referencia de diseño). |
