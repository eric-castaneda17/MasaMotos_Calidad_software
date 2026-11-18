# Registro estructurado del servidor

## Reutilización y alcance

Se reutilizan las acciones existentes de login y venta, la autorización DAL/proxy, `runAction` y el ciclo de inicio de Next.js. No se añaden servicios externos, tablas, dependencias ni endpoints. La configuración de Vitest incorpora el proyecto observability para pruebas aisladas.

El archivo `src/instrumentation.ts` usa `register` y `onRequestError`, según la documentación incluida en Next.js 16.3.4. El registro de inicio se emite cuando se inicializa la instancia de servidor. La disponibilidad HTTP se comprueba por separado mediante el runner local.

## Contrato

`src/lib/observability/logger.ts` concentra catálogo, formato y destino. Cada línea contiene JSON con `timestamp` UTC, `level`, `event`, `module`, `operation`, `result`, `correlationId` y `metadata`. El mensaje semántico se expresa mediante el identificador fijo de evento.

El catálogo fija niveles, módulos, operaciones y resultados. Los campos técnicos permitidos son duración no negativa en milisegundos, estado HTTP numérico, IDs numéricos de venta y factura, número de líneas y disponibilidad numérica. Las razones y operaciones adicionales se validan contra listas cerradas.

Los textos recibidos, errores originales, cuentas, referencias libres, direcciones, cookies, tokens, documentos, contraseñas y cuerpos completos quedan fuera de la selección. Los getters se leen una sola vez. Datos malformados o un fallo durante la serialización detienen solo ese registro.

## Eventos

| Evento | Nivel | Punto de emisión |
| --- | --- | --- |
| APPLICATION_STARTED | INFO | register en la inicialización Node.js. |
| AUTH_LOGIN_SUCCEEDED | INFO | Credencial válida y perfil activo, antes de redirigir. |
| AUTH_LOGIN_FAILED | WARN | Rechazo de credenciales según la respuesta del proveedor. |
| AUTH_LOGIN_INACTIVE | WARN | Perfil sin acceso activo. |
| AUTH_VALIDATION_REJECTED | WARN | Formato de formulario de login inválido antes de consultar Supabase. |
| AUTH_ERROR | ERROR | Error de comunicación o respuesta 5xx durante login. |
| ADMIN_AUTH_ERROR | ERROR | Rechazo de una llamada Auth Admin con estado técnico acotado. |
| ACCESS_DENIED | WARN | Proxy o DAL rechazan ausencia de sesión o permiso. |
| SALE_VALIDATION_REJECTED | WARN | Esquema de venta inválido antes del RPC. |
| SALE_STOCK_REJECTED | WARN | create_sale devuelve insuficiencia de stock. |
| SALE_CREATED | INFO | El RPC devuelve éxito, antes de invalidar la caché. |
| ACTION_REJECTED | WARN | Rechazo controlado de autorización o dominio en runAction. |
| ACTION_ERROR | ERROR | Error interno o rechazo genérico del proveedor en runAction. |
| REQUEST_ERROR | ERROR | Error del servidor capturado por Next.js. |

## Correlación y duración

Una llamada a createSaleAction comparte contexto con requireActionUser y runAction. De esta forma se puede correlacionar el rechazo de stock con el resultado controlado de la acción. Los contextos del proxy, la página, el hook del framework y la administración de usuarios son independientes. No se promete correlación distribuida entre procesos o servicios.

`elapsed` usa el reloj monotónico del proceso. Las duraciones observadas en mocks describen únicamente esa ejecución de prueba. Las duraciones reales cubren el rechazo de formato, los logins y las acciones de venta. SR-03 registró 382.91 ms en SALE_CREATED. Ninguno de esos valores constituye una medición de carga o un PASS para SWR-PERF.

## Comportamiento ante fallos del logger

logEvent protege selección, serialización y escritura mediante captura de errores y devuelve false cuando falla. Los llamadores conservan el comportamiento de negocio. Si falla la creación de contexto, se usa un identificador de reserva y se omite una duración no fiable. El identificador de reserva no permite correlación única.

No se implementa almacenamiento persistente ni reenvío automático. Si la consola falla, el registro puede perderse. Para el dossier, el runner captura las líneas emitidas y las guarda fuera del código funcional.

## Manejo de errores y límites

La salida en bruto de runAction fue sustituida por ACTION_ERROR. Las respuestas públicas de autorización, validación y error genérico se conservan. Auth Admin registra su estado, sin cambiar la clave configurada ni los mensajes públicos. Los controles de venta, RPC y caché mantienen su orden salvo que el evento de éxito se emite inmediatamente tras el éxito del RPC para distinguir una venta persistida de un posible fallo posterior al refrescar la vista.

R-12 queda mitigado y probado para runAction. Otras salidas preexistentes, como la carga de imágenes y el error de PDF del cliente, permanecen fuera de esta corrección y requieren revisión. D-01, D-02, D-04, D-11 y R-03 no se cierran por añadir telemetría.

## Verificación local

El proyecto Vitest observability incluye el logger y acciones con dependencias simuladas. Una marca server-only de prueba permite importar las acciones dentro de Node sin añadir paquetes. El runner de producción real se limita a inicio, denegación sin sesión y formato inválido. Las suites unitarias, RTL y de reversión siguen siendo independientes.

La sesión real autorizada posterior utilizó Edge, el servidor compilado local y Supabase académico con TLS verificado. Conservó un lote sintético exclusivo y creó dos ventas. Los logs, correlaciones, estados y continuaciones dirigidas están en evidencias/resultados-locales.json y eventos-reales-locales.jsonl. El verificador de ejecución fue temporal: no constituye un runner de escrituras publicable ni una funcionalidad del producto.

Se corrigieron sus selectores: alerta limitada al formulario para evitar next-route-announcer, consultas por el sufijo sintético sin guion bajo y toast con role=status. El bloqueo local de create_sale lanzó un error antes del fetch original y registró forwarded=false. Se retiró después de un único bloqueo. Ninguna modificación permanente fue necesaria en la aplicación para estas correcciones.

SR-04 se confirmó por WARN correlacionados y consulta final sin tercera venta; su aserción visual del toast no se aprobó. SR-05 mostró el mensaje y conservó el estado previo, incluido el consecutivo. Este fallo previo al envío no sustituye la reversión transaccional ya comprobada por CA-15.
