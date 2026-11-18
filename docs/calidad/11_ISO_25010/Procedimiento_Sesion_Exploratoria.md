# Sesión exploratoria pendiente

**Estado PENDIENTE DE EJECUCIÓN.** Este documento prepara una actividad posterior. Los registros y tiempos descritos son campos a completar, sin resultados atribuidos.

## Exigencia exacta de la guía

El punto 15.1 se titula «Actividad obligatoria». Su segundo numeral dice exactamente:

> 2. Realicen además una sesión de pruebas aleatorias/exploratorias sobre toda la aplicación.

Los numerales siguientes piden registrar errores, comportamientos inesperados y mejoras, y relacionar cada hallazgo con la característica ISO afectada. La fuente es ProyectoFinalCalidad2026.docx, consultada en Downloads fuera del repositorio. Su SHA-256 consta en el manifiesto.

## Preparación

1. Acordar ejecutor, observador, fecha y ventana. Registrar commit probado, URL local, proyecto académico verificado, navegador, versión, tamaño de pantalla y roles. No registrar correos, contraseñas, UUID de usuarios ni tokens.
2. Revisar los pendientes D-01, D-04 y D-11. Los recorridos administrativos que dependan de la credencial rechazada deben quedar bloqueados hasta corregirla y verificarla. Registrar el impedimento, sin tratar de eludir permisos.
3. Revisar las siete capturas de BB-01, BB-02 y BB-03. Conservar los originales y aprobar únicamente una evidencia suficiente y apta para el dossier. Los estados de las matrices permanecen pendientes hasta esa revisión.
4. Preparar las sesiones de vendedor y administrador en perfiles de navegador separados. Reservar una ventana privada para invitado. Acordar el uso de datos académicos exclusivos. Consultar los saldos iniciales desde la interfaz y anotar las referencias que se emplearán.
5. Usar la guía de los 12 BB como fuente de sus datos exactos. Las operaciones adicionales de creación, venta, ajuste o anulación que surjan en la exploración necesitan autorización específica de alcance y datos. Una exploración inicialmente de consulta puede avanzar sin ellas.
6. Proponer dos bloques de 45 minutos para exploración y 15 minutos de revisión final. Es una organización sugerida del equipo. La guía no impone una duración. Registrar los tiempos realmente utilizados y las interrupciones.

## Orden coordinado con caja negra

Primero revisar BB-03, BB-02 y BB-01 ya reportados. Después ejecutar personalmente los nueve casos restantes en el orden BB-11, BB-06, BB-05, BB-04, BB-08, BB-09, BB-10, BB-07 y BB-12, siguiendo su guía. Registrar obtenido y evidencia de cada uno sin usar el código o Postman durante la ejecución de BB.

La exploración se registra por separado con identificadores EXP-01 en adelante. Se puede hacer inmediatamente después del BB relacionado para aprovechar la sesión y los datos. El resultado de un BB no sustituye el registro exploratorio. Si el tiempo acordado se consume, reprogramar los módulos faltantes y mantener abierta G-10.

## Recorridos exploratorios

| ID previsto | Módulo y rol | Recorrido e ideas de variación | Qué observar | Preparación de la siguiente actividad |
| --- | --- | --- | --- | --- |
| EXP-01 | Acceso y sesión, invitado y vendedor | Abrir una ruta por URL, entrar, volver atrás, recargar y cerrar sesión. Usar una credencial incorrecta solo dentro de BB-02 para evitar intentos repetidos innecesarios. | Pantalla y URL coherentes con el estado de sesión. Mensaje comprensible y bloqueo de funciones protegidas. | Cerrar la ventana privada y mantener la sesión normal del vendedor. |
| EXP-02 | Dashboard, vendedor | Abrir enlaces, revisar tarjetas y fechas. Cambiar el tamaño de ventana y usar teclado para navegar. | Consistencia visual, contenido accesible y ausencia de enlaces rotos. Los indicadores se consideran datos académicos, no nuevas métricas de desempeño. | Volver al catálogo y limpiar filtros. |
| EXP-03 | Productos, vendedor | Alternar referencia, fragmentos, espacios, acentos y búsqueda inexistente. Probar cambios de filtro, orden y página en distintos órdenes. | Resultados, recuperación del estado vacío y combinación de filtros. Registrar los datos exactos que provocan un comportamiento inesperado. | Restaurar filtros y consulta. No modificar referencias de CA-15. |
| EXP-04 | Alta y edición de productos, administrador | Abrir formularios, recorrer campos por teclado, dejar campos obligatorios vacíos y cancelar. Las altas autorizadas se hacen con referencias académicas exclusivas. | Mensajes junto al campo, foco, tipos de dato, cancelación y coherencia del retorno. | Cancelar cambios no guardados y conservar las altas académicas identificadas. |
| EXP-05 | Categorías y proveedores, administrador | Buscar, paginar, abrir detalle o edición y cancelar. Variar nombres de búsqueda. | Estados vacíos, datos presentados y restricciones visibles. No eliminar registros ni guardar cambios compartidos. | Salir de la edición sin guardar. |
| EXP-06 | Clientes, vendedor y administrador | Buscar por fragmentos y documento académico, abrir detalle y recorrer sus relaciones. Cancelar cualquier edición no autorizada. | Coincidencia del cliente y claridad del historial. Evitar capturar datos de terceros. | Reservar el cliente académico de la venta prevista. |
| EXP-07 | Nueva venta, vendedor | Tras BB-08, variar cantidades, quitar y volver a agregar líneas, cambiar cliente y cancelar la venta antes de confirmar. Usar BB-09 para la venta exitosa planificada. | Controles al límite, totales, persistencia del carrito ante error y mensajes. Anotar consecuencias observadas sin inferir lo ocurrido en la base. | Vaciar carritos de exploración. Conservar número y datos de las ventas efectivamente autorizadas. |
| EXP-08 | Ventas y facturas, vendedor | Buscar por número conocido, alternar filtros, abrir detalle, volver y recargar. Preparar impresión en vista previa y cerrarla. | Correspondencia de detalle y totales, navegación y legibilidad. La emisión de BB-10 mantiene sus datos y resultados propios. | Cerrar vista previa y conservar comprobantes del lote. |
| EXP-09 | Inventario, administrador | Consultar detalle e historial del repuesto académico, abrir un movimiento y cancelar. Un ajuste o una anulación requiere una operación académica exclusiva aprobada. | Saldo e historial coherentes y advertencias antes de acciones con efectos. | Registrar saldo final. No restaurar datos mediante borrado masivo. |
| EXP-10 | Usuarios y perfil, administrador | Consultar roles y estados, abrir formularios y cancelar. Registrar el bloqueo D-01 si sigue vigente. No repetir cambios de contraseña como parte de la exploración. | Acciones por rol y mensajes, sin afirmar corrección del 401 ni de R-03. | Cerrar formularios y conservar las cuentas. |
| EXP-11 | Reportes, administrador | Consultar un intervalo académico conocido, variar fechas y comprobar un resultado vacío. Cualquier exportación debe depurarse antes de guardar evidencia. | Correspondencia de filtros, mensajes y columnas. No atribuir cumplimiento de tiempos sin medición. | Cerrar descargas privadas y restaurar filtros. |
| EXP-12 | Configuración, idiomas y ayuda visible, administrador | Consultar configuración, alternar idioma o tema del navegador si se permite, recorrer la interfaz y regresar a español. Cancelar formularios. | Labels, mensajes, consistencia y mecanismos visibles de prevención de errores. No guardar cambios globales. | Dejar el entorno en español y cerrar sesión al terminar. |

Los recorridos abarcan los módulos existentes. Si una pantalla resulta inaccesible, registrar el motivo y dejar su cobertura pendiente. Las ideas aleatorias son orientaciones para descubrir problemas, sin exigir que se ejecute cada combinación.

## Registro de la sesión

Crear después de la actividad un registro en `evidencias/exploratoria/<sesion>/Registro_Exploracion.md`. El identificador de sesión debe ser único. Para cada recorrido completar:

| Campo | Información que se debe registrar |
| --- | --- |
| Identificación | Sesión, EXP, fecha y hora de Bogotá, commit, navegador, rol y ejecutor por alias. |
| Propósito | Qué comportamiento se quiso explorar y qué módulo o SWR se relaciona. Si está fuera del MVP, declararlo. |
| Datos | Referencias académicas, valores y estado inicial relevantes. |
| Secuencia real | Acciones efectivamente realizadas, variaciones y cancelaciones. |
| Observación | Obtenido, esperado sustentado por SRS o guía y reproducción si existe problema. Si no hubo hallazgo, indicarlo sin afirmar ausencia de defectos. |
| Clasificación | Error, defecto, falla, incidente, riesgo o mejora. Asociar un ID nuevo y una característica ISO. |
| Evidencia | Captura o extracto depurado cuando aporte prueba. Archivo EXP-XX-01-descripcion.png o registro textual equivalente. |
| Estado | Ejecutado, bloqueado o pendiente. Tiempo real, interrupciones y módulos que faltan. |

## Cierre y actualización

1. Revisar hallazgos y descartar datos sensibles de las evidencias. Conservar todo resultado adverso y su historial.
2. Dar un ID a cada hallazgo nuevo. Relacionarlo con el registro y con el SWR original cuando corresponda.
3. Revisar el estado de inventario y los números de venta o factura que se hayan utilizado. Las verificaciones técnicas posteriores no se registran como pasos manuales BB.
4. Actualizar solo los BB realmente ejecutados y sustentados. Cerrar G-10 por exploración únicamente cuando todos los módulos tengan recorrido o exclusión aprobada.
5. Conservar NO EVALUADA para desempeño hasta medirlo. La exploración y CA-15 no comprueban disponibilidad sostenida, carga o accesibilidad completa.
