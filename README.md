# 🎨 MyWhiteboard UI - Cliente de Pizarra

Interfaz de usuario interactiva desarrollada en Angular para la creación y colaboración en pizarras digitales en tiempo real. Este cliente se enfoca en proporcionar una experiencia de dibujo fluida, permitiendo el trabajo colaborativo simultáneo con una arquitectura reactiva.

## 🛠️ Stack Tecnológico
* **Framework:** Angular 17/18.
* **Componentes de UI:** **Angular Material** para una experiencia de usuario limpia y profesional.
* **Gestión Asíncrona:** **RxJS** para el manejo de flujos de datos en tiempo real provenientes de WebSockets.
* **Gráficos:** HTML5 **Canvas API** con lógica de transformación matricial para soporte de Zoom y Desplazamiento.
* **Comunicación:** **StompJS** y **SockJS** para la conexión persistente con el backend.
* **Despliegue:** Render Static Site con configuración de Single Page Application (SPA).

## ✨ Características de la Interfaz
* **Lienzo Infinito:** Implementación de un sistema de coordenadas dinámico que permite realizar Zoom (con rueda del mouse) y Desplazamiento (Pan) sin límites.
* **Colaboración Visual:** Visualización en vivo de cursores remotos identificados por nombre de usuario, permitiendo saber exactamente quién está dibujando.
* **Dashboard de Gestión:** Organización de pizarras mediante categorías: "Mis Pizarras" y "Compartidas conmigo".
* **Herramientas de Edición:** Selector de colores, control de grosor de trazo, borrador y función de limpieza total de pizarra.
* **Exportación de Proyectos:** Capacidad para descargar el contenido del lienzo directamente como un archivo de imagen (PNG).
* **Miniaturas Dinámicas:** Generación y envío automático de capturas de la pizarra al backend para previsualización en el Home.

## ⚙️ Configuración para Desarrollo
1.  **Clonar el repositorio:** `git clone https://github.com/tu-usuario/mywhiteboard-frontend.git`
2.  **Instalar dependencias:** `npm install`
3.  **Configurar entorno:** Editar `src/environments/environment.ts` con la URL de tu API de Render.
4.  **Ejecutar localmente:** `ng serve`
