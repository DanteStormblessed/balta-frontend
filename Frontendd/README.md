# Cuero Artesanal | Admin 

Frontend para el control simple de ingresos, egresos y reportes de una microempresa de artículos de cuero hechos a mano.

## Qué incluye
- Navegación lateral: Inicio, Ingresos, Egresos, Reportes.
- Páginas:
  - Inicio: resumen y movimientos recientes.
  - Ingresos: formulario deshabilitado + tabla de ejemplo.
  - Egresos: formulario deshabilitado + tabla de ejemplo.
  - Reportes: filtros deshabilitados + kpis y distribución por categoría.
- Tema visual inspirado en cuero (tonos marrones/cálidos).

## Ejecutar (desarrollo)
1. Instala dependencias.
2. Levanta el servidor de desarrollo.

```powershell
npm install
npm run dev
```

Luego abre la URL que te muestre (por defecto http://localhost:5173).

## Construir
```powershell
npm run build
npm run preview
```

## Configuración del backend (CUANDO ESTE EL BACKEND EN LA NUBE)

Definir la URL del backend con un archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=https://backend-url.com/api
```

Si no se define la variable, la aplicación usará `http://localhost:8080/api` como valor por defecto para entornos locales.
