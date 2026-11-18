# Mediciones de rendimiento y alcance comprobado

**MEDICIÓN PARCIAL.** Se archivaron nueve lecturas SQL reales, un cliente, TLS verificado y transacción READ ONLY con ROLLBACK, sobre 49 productos y 91 ventas. Las búsquedas con coincidencias tardaron 110,71–113,58 ms; sin coincidencias 111,19–113,42 ms; el agregado SQL de doce meses 111,00–114,34 ms. Son tiempos de consulta con ida/vuelta, no de interfaz. Caché no controlada.

Fuentes: evidencias/rendimiento/consolidacion-manual/Lecturas_y_Limites.json y Muestras.csv. El JSON incluye muestras, estadísticos, SQL, condiciones y el incidente DNS inicial del sandbox. Se reutilizaron logs históricos SALE_CREATED de Shift Right; sus tiempos de acción no corresponden a BB-09/10 ni al intervalo completo clic–acuse.

No se midió acuse–comprobante imprimible, interfaz de reporte, recursos, cinco usuarios ni volumen objetivo. PERF-001/002/004 quedan con apoyo parcial; PERF-003/005 NO EVALUADAS. No se generaron ventas adicionales. El diseño siguiente conserva las condiciones necesarias para interpretar o ampliar la medición, sin atribuir resultados inexistentes.

## Requisitos originales y alcance

La sección 8 del SRS v0.2, página 17, contiene los siguientes criterios. Son requisitos originales externos a los 15 SWR del MVP y se citan para fundamentar la evaluación.

| ID | Límite del SRS | Condición o capacidad |
| --- | --- | --- |
| SWR-PERF-001 | Búsqueda de repuestos en un máximo de 2 segundos. | Catálogo de hasta 10.000 repuestos y hasta 5 usuarios simultáneos. |
| SWR-PERF-002 | Confirmación de venta y actualización de existencias en un máximo de 3 segundos. | Registrar el ambiente y la carga de la medición. |
| SWR-PERF-003 | Comprobante listo para imprimir en un máximo de 3 segundos después de confirmar la venta. | Comprobante completo y datos disponibles para impresión. |
| SWR-PERF-004 | Reporte de ventas de hasta 12 meses en un máximo de 10 segundos. | Cobertura adicional al flujo principal. |
| SWR-PERF-005 | Soportar al menos 10.000 repuestos, 2.000 motocicletas y 50.000 ventas históricas sin incumplir los tiempos anteriores. | Requiere un conjunto de datos representativo y confirmar cómo se representa motocicleta en la arquitectura actual. |

Las primeras mediciones propuestas corresponden a búsquedas, venta y comprobante. Reportes y capacidad ampliada deben planificarse explícitamente para cubrir PERF-004 y PERF-005. No se amplían automáticamente los 15 SWR aprobados.

## Condiciones previas

1. Acordar responsable, fecha, ambiente, límites de carga y autorización para generar datos y ventas académicas. Preferir una copia de QA con el mismo código y esquema para una carga de gran volumen. Si se usa el proyecto académico actual, coordinar una ventana exclusiva y las cuotas del proveedor.
2. Resolver o delimitar los bloqueos de seguridad que afecten el ensayo. Las claves de servicio no se usan para simular un vendedor. Emplear sesiones de usuarios QA y los permisos normales del sistema.
3. Registrar commit, Node.js, navegador, sistema operativo, CPU/RAM del cliente y servidor accesibles, modo de despliegue, región de Supabase, tamaño de datos y características de red. Anotar limitaciones si no se dispone de métricas del proveedor.
4. Usar la compilación de producción. Verificar el resultado funcional antes de cronometrar. Un error 401, un login fallido, una respuesta vacía incorrecta o una venta rechazada no es una muestra exitosa de la operación.
5. Definir consultas académicas por referencia, nombre, coincidencia múltiple y sin coincidencias. La lista debe quedar fija en el protocolo. Reservar productos y clientes distintos para las ventas y conservar stock suficiente.
6. Antes de simular PERF-005, confirmar con el equipo el significado de las 2.000 motocicletas del SRS. La revisión actual no acredita una tabla ni un fixture equivalente. No crear estructuras o requisitos nuevos para completar el número.

## Herramientas previstas

| Herramienta | Uso propuesto | Límite de interpretación |
| --- | --- | --- |
| Playwright ya instalado | Cronometrar el flujo real con reloj monotónico y condiciones de interfaz significativas, usando la misma versión y entorno en cada corrida. | El timeout y la duración total del test no son el tiempo de la operación. Evitar pausas artificiales dentro del intervalo medido. |
| DevTools Network y Performance de Edge o Chrome | Diagnosticar red y renderizado y conservar un extracto mínimo depurado. | El tiempo HTTP no incluye toda la interacción. HAR depurado puede conservar cuerpos y URLs con datos sensibles. Debe revisarse antes de compartirlo. |
| k6, si el equipo autoriza su instalación o dispone de él | Carga controlada de lecturas HTTP con 1 y 5 usuarios virtuales. Sesiones fuera de los intervalos de consulta. | Una solicitud directa a Supabase no mide el recorrido de Next.js y navegador. Etiquetar cada objetivo y separar la medición API de la experiencia completa. |
| Performance Monitor o herramientas disponibles del host; métricas de Supabase accesibles | CPU, memoria, conexiones y posibles saturaciones durante la carga. | Describir únicamente métricas observadas. Sin umbral acordado no se declara cumplimiento de consumo de recursos. |

[Métricas de k6](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/) y [criterios de k6](https://grafana.com/docs/k6/latest/using-k6/thresholds/). [Exportación de registros Network de Chrome](https://developer.chrome.com/docs/devtools/network/reference/).

## Definición del intervalo medido

| Medición | Inicio | Fin | Verificación funcional adicional |
| --- | --- | --- | --- |
| M-PERF-01 búsqueda UI | Última entrada del término de búsqueda que dispara la consulta. Incluye el debounce de la interfaz. | Resultado correcto o mensaje vacío esperado visible, sin carga pendiente. | Confirmar las referencias esperadas. Conservar el número de repuestos y usuarios activos. |
| M-PERF-02 venta | Clic de confirmación final en el diálogo, con formulario y cliente preparados. | Acuse de venta exitosa visible tras la respuesta de create_sale. | Consultar después stock, venta, líneas, movimiento y comprobante. La respuesta de la función debe corresponder a una operación persistida. Esa lectura posterior no se suma a la duración. |
| M-PERF-03 comprobante | Acuse de confirmación de la venta. | Comprobante con detalle y totales listo en su vista imprimible. | Abrirlo inmediatamente, sin introducir espera humana. Documentar fuentes e imágenes que condicionan la impresión. No sumar M-PERF-02 a este intervalo. |
| M-PERF-04 reporte | Solicitud del reporte con el intervalo ya seleccionado. | Resultado o archivo de reporte completo disponible. | Contrastar el período de hasta 12 meses y los datos esperados. |
| M-PERF-05 capacidad | Escenario de las mediciones anteriores sobre el volumen objetivo. | Fin de cada operación correspondiente. | Comprobar que el conjunto realmente contiene los tamaños del SRS y que conserva integridad. |

Guardar tiempos en milisegundos. El intervalo de búsqueda UI incluye red y renderizado. El tiempo de confirmación acota la operación transaccional por su acuse exitoso. No inferir tiempos internos exactos de PostgreSQL a partir del reloj del navegador.

## Diseño de las corridas

1. Proponer una corrida de referencia con un usuario y el lote actual. Su resultado solo describe ese tamaño.
2. Preparar, tras autorización, los datos necesarios para el volumen objetivo. Documentar su tamaño real y distribución. No emplear el lote pequeño como evidencia de capacidad de 10.000 repuestos.
3. Para búsquedas, proponer 30 muestras por tipo de consulta y nivel de concurrencia de 1 y 5 usuarios. Son decisiones de muestreo propuestas por el equipo, no mínimos impuestos por la guía.
4. Registrar las primeras respuestas con caché fría por separado. Si se hacen calentamientos, conservar su número y resultados y justificar por qué se separan. Registrar las muestras calientes sin ocultar resultados lentos.
5. Para ventas y comprobantes, proponer inicialmente 10 operaciones válidas con productos reservados y datos independientes. Una posterior prueba concurrente de ventas requiere nuevo diseño y autorización, porque genera transacciones y números de factura.
6. Mantener un identificador único de corrida. Sin reintentos que sustituyan muestras fallidas. Un re-test será una corrida nueva que conserva el resultado anterior.
7. Detenerse ante inconsistencias, errores de autorización, stock inesperado, operaciones ajenas, límites del proveedor o saturación que comprometa el ambiente. Registrar cuántas muestras se completaron.

## Métricas y aceptación

- Conservar cada duración y resultado funcional. Calcular mínimo, mediana, p95, máximo y cantidad de errores. Registrar solicitudes por segundo cuando la herramienta realmente lo mida.
- El SRS expresa tiempos máximos. Para el alcance de la corrida, exigir que **todas las muestras válidas** cumplan el máximo aplicable, incluidos los casos fríos si están dentro de las condiciones declaradas. Un p95 favorable no compensa una muestra que exceda ese máximo.
- Para PERF-001 el máximo observado debe ser menor o igual a 2.000 ms. Para PERF-002 y PERF-003 debe ser menor o igual a 3.000 ms en sus intervalos separados. Para PERF-004 debe ser menor o igual a 10.000 ms.
- Como criterio adicional propuesto, exigir cero errores funcionales inesperados y correspondencia de los efectos persistidos. Los errores de escenarios negativos intencionales se registran en una serie separada.
- Si faltan el volumen objetivo, concurrencia o representación de motocicletas, declarar **cobertura parcial** o **NO EVALUADA** para ese requisito. La evidencia de una corrida es una muestra bajo condiciones documentadas, no una garantía sobre todas las cargas futuras.
- CPU, memoria y conexiones se informarán con valores observados. La aceptación de recursos o disponibilidad sigue pendiente de umbrales específicos.

## Evidencias futuras

Guardar únicamente después de ejecutar, en `evidencias/rendimiento/<corrida>/`:

| Archivo | Contenido |
| --- | --- |
| Protocolo_Ambiente.md | Commit, versiones, equipo, red, escenario, criterios, datos y condiciones de caché. |
| Inventario_Datos.json | Conteos y referencias académicas necesarias, sin información personal ni credenciales. |
| Muestras.csv | Medición, muestra, usuarios, tipo de consulta, inicio/fin o duración, validez funcional y error depurado. |
| Resumen.json | Número de muestras, errores, mediana, p95, máximo y decisión por criterio. |
| Diagnostico_Depurado.md | Tiempos de red/renderizado o métricas del host que expliquen un resultado. |
| Comparacion_Integridad.json | Para ventas autorizadas, evidencia de saldos y vínculos después de cada operación. |

Los originales de HAR o trazas que contengan cuerpos de login, cookies, encabezados, tokens o datos de terceros quedan fuera del repositorio. Solo guardar una copia mínima revisada cuando aporte evidencia. Después de analizar los resultados se podrá actualizar ISO-02, G-10 y los enlaces de trazabilidad, conservando las mediciones previas.
