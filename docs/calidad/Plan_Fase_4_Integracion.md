# Plan de pruebas integradas de MASA MOTOS

La matriz `04_Matriz_Pruebas.xlsx` contiene 12 casos manuales de caja negra, 8 casos de API para Postman y 5 casos E2E para Playwright. Cada caso tiene un SWR y un criterio de aceptación, datos de entrada, condiciones de ejecución y aserciones o resultados esperados. La ejecución requiere un ambiente autorizado. La matriz registra el estado de cada caso.

## Diagnóstico de Supabase

La rama verificada es `feature/pruebas-integracion-e2e`. La inspección de la configuración local identificó un proyecto alojado de Supabase, referencia abreviada `mrla…djru`. La URL de la aplicación y el pooler PostgreSQL de `.env.local` señalan al mismo proyecto. La configuración disponible no permite confirmar su finalidad ni quién usa sus datos. La revisión se hizo localmente y sin solicitudes al proyecto alojado.

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto que utilizan Next.js y los scripts. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública que identifica el proyecto en el cliente Supabase. El cliente del servidor usa además la sesión del usuario. `.env.local` tiene definida la primera. |
| `SUPABASE_SERVICE_ROLE_KEY` | Gestión de cuentas y preparación administrativa. Debe quedar en servidor o en el proceso de preparación, porque omite RLS. |
| `SUPABASE_DB_URL` | Conexión PostgreSQL para migraciones, comprobación de infraestructura y el guion E2E previo. La aplicación web funciona mediante el cliente Supabase. |

El servidor de Next.js usa las cookies de sesión con Supabase Auth y aplica autorización por función. Las políticas RLS y los permisos PostgreSQL se aplican en la Data API. Un login correcto también modifica los datos de autenticación y actualiza el último acceso. Las altas, ediciones, bajas, cargas de imágenes y cambios de usuarios o configuración pueden escribir. Las ventas, anulaciones y movimientos cambian existencias, registran movimientos y, para las ventas, avanzan el consecutivo de facturas. `db:setup` aplica migraciones, ajusta cuentas y siembra datos. Su variante de reinicio trunca tablas. El guion E2E previo escribe y limpia registros mediante PostgreSQL.

El repositorio tiene cuatro migraciones y una semilla. Solo se encontró `.env.local` además del ejemplo versionado. Hay Docker Desktop instalado, pero su motor no respondió a `docker ps`. No se detectó Supabase CLI ni `supabase/config.toml`. No se verificó una instancia local operativa ni otro entorno de pruebas.

## Ambiente recomendado

Usar un **proyecto alojado y dedicado a QA**, con Auth, PostgreSQL, Storage y RLS del mismo sistema. Permite ejecutar Next.js localmente sin depender de Docker. Supabase local con CLI y Docker es una alternativa cuando el motor esté operativo. PostgreSQL por sí solo dejaría fuera Auth y Storage, necesarios para verificar el flujo completo.

1. Tras la aprobación, crear o identificar un proyecto desechable y confirmar su referencia. Usar una copia de trabajo con variables de QA administradas fuera de Git. El arranque de la aplicación, los scripts y las suites deben cotejar la URL y el pooler con la referencia aprobada, y detenerse si apuntan al proyecto actual o si el destino no coincide.
2. Aplicar las migraciones 001 a 004 en orden. Configurar IVA del 19 %, efectivo activo y datos sintéticos. Preparar un administrador, vendedores activos y una cuenta inactiva. Crear cuentas confirmadas mediante Auth en QA y asignar roles y estado en los perfiles. Usar contraseñas exclusivas de QA y conservarlas en variables locales privadas o en un almacén de secretos. El script actual imprime credenciales de demostración. Para evidencias se prefiere preparar cuentas con valores propios y registrar solo IDs de fixtures y resultados depurados.
3. Identificar cada ejecución con un prefijo `QA-<runId>`. Asignar productos y clientes independientes a cada caso que escriba. Guardar la referencia del proyecto, el lote de datos, los IDs creados y los saldos iniciales. Evitar restaurar consecutivos o ejecutar truncados en un proyecto compartido.
4. Preferir reprovisionar el entorno desechable entre lotes. Si se reutiliza, limpiar solo IDs registrados para el lote, en orden compatible con claves foráneas y en una transacción. Verificar el destino antes de la limpieza y dejar registro de cualquier fallo. Los casos de solo lectura deben usar fixtures separados de los que consumen stock.

## Caja negra manual

Ejecutar los casos BB desde el navegador en QA como usuario final. Abrir una ventana privada o un perfil distinto para separar las sesiones de administrador, vendedor e invitado. Registrar versión, navegador, fecha y lote. Usar el menú, los formularios y la barra de direcciones según la matriz. Registrar el resultado observado y adjuntar captura de la pantalla pertinente con datos sintéticos. Para rechazos, capturar el mensaje y, cuando proceda, el saldo sin cambio en la vista de inventario. Evitar capturas con datos introducidos en campos de contraseña.

Anotar PASS o FAIL solo después de comparar lo obtenido con todas las condiciones de aceptación de la fila. Si falta un fixture, documentar el bloqueo y conservar PENDIENTE. Postman, Playwright, el código y las consultas SQL quedan fuera de la ejecución manual de caja negra.

## API Testing con Postman

### Rutas y operaciones existentes

| Superficie | Entrada y comportamiento revisado en el repositorio |
| --- | --- |
| Next.js | `GET /api/products/{id}/image` requiere sesión. Se espera 400 para ID inválido con sesión, 404 sin imagen o sin objeto y 200 para una imagen disponible. Sin sesión devuelve 401. |
| Next.js | `GET /api/reports/export` acepta `type=sales\|top\|lowstock\|daily`. Devuelve 401 sin sesión, 403 con vendedor, 400 para tipo inválido con administrador y CSV con administrador autorizado y tipo válido. |
| Supabase Auth | `POST /auth/v1/token?grant_type=password` usa la autenticación por correo y contraseña. Es la superficie del proveedor. El formulario de MASA MOTOS añade la verificación del perfil y el manejo del mensaje. |
| Supabase Data API | `GET /rest/v1/products_view` consulta catálogo, existencias y estado. Las migraciones definen la vista con `security_invoker` y otorgan lectura a usuarios autenticados sujetos a políticas. |
| Supabase Data API | `POST /rest/v1/rpc/create_sale` corresponde a la función PostgreSQL que usa la Server Action. Aplica las reglas de la transacción de venta, calcula importes y registra stock, movimientos y factura. |
| Supabase Data API | `GET /rest/v1/sales`, `/sale_items`, `/invoices` e `/inventory_movements` bajo la misma base `/rest/v1` permiten verificar la persistencia con un usuario autorizado. |

Los recursos de Supabase se identifican por el cliente de la aplicación, las migraciones y el contrato documentado de la Data API. Su disponibilidad y permisos en un proyecto concreto quedan por confirmar al habilitar QA. Las rutas `/signin`, `/productos`, `/ventas/nueva` y `/facturas/{id}` sirven pantallas HTML. Las Server Actions de Next.js son el mecanismo de esas pantallas y no se usarán como contrato público en la colección.

### Diseño de la colección

Organizar los ocho casos de la matriz en las carpetas **Auth**, **Catálogo**, **Ventas e inventario**, **Permisos** y **Comprobantes**. Cinco casos validan reglas de dominio (API-03, API-04, API-05, API-06 y API-08). Cada carpeta puede incluir solicitudes auxiliares de preparación de sesión y de lectura antes y después. Contar los ocho casos por su objetivo de prueba, conservando aserciones en las respuestas de las solicitudes auxiliares que aporten evidencia. En cada caso, comprobar estado HTTP y contenido relevante, además del control de efectos persistentes cuando corresponda.

- Para Supabase usar `{{supabaseUrl}}`, la clave pública en `apikey` y el JWT de la cuenta de QA como `Authorization: Bearer` cuando aplique. Crear la sesión de cada rol en la ejecución y conservar el token solo durante ella. No usar la clave de servicio con Postman. Exportar la colección y el entorno con valores de sesión y credenciales vacíos. Variables de ejemplo adicionales: `{{appUrl}}`, `{{runId}}`, IDs de fixtures y datos de venta.
- Los casos de Next.js requieren la cookie de una sesión normal obtenida en el navegador de QA. Mantenerla en el almacén local de cookies de Postman para el host correspondiente. El caso anónimo usa el almacén limpio y el de vendedor usa una sesión de ese rol. No exportar cookies, capturas de tokens ni cuerpos de login en las evidencias.
- Para los rechazos de `create_sale`, verificar `P0001` y el mensaje de dominio, junto con el estado 400 documentado por PostgREST. API-04 y API-05 comprueban rechazo antes de escribir. Para demostrar reversión después de una escritura según CA-15 de `SWR-REL-001`, quedará pendiente acordar un fallo controlado en QA y observar los efectos transaccionales.

### Decisión sobre endpoints adicionales

**No se requieren endpoints nuevos para el diseño actual.** Postman puede comprobar la lógica persistente que ya usa Next.js mediante la Data API de Supabase y utilizar la ruta actual de reportes para verificar permisos de la aplicación. La validación de Server Actions y el comportamiento específico del login se cubren en la interfaz.

Si el docente llegara a exigir una API exclusivamente de Next.js, proponer para aprobación `GET /api/products` para búsqueda y saldo, `POST /api/sales` para confirmar una venta y `GET /api/invoices/{id}` para el comprobante. El diseño reutilizaría las consultas existentes y `getInvoice`, y compartiría la validación `saleSchema` y la llamada transaccional `create_sale` con la Server Action. Las rutas exigirían sesión y permisos `products.view`, `sales.create` o `invoices.view`, respectivamente. Mantendrían RLS y proyecciones mínimas de respuesta. Para la escritura con sesión por cookie, validarían el origen y el cuerpo JSON, y devolverían errores de dominio sin detalles internos. El acceso se obtendría con el login existente. Estas tres rutas quedan como alternativa de diseño.

## Playwright E2E

El repositorio usa `playwright-core` con Chrome o Edge instalados. `scripts/e2e-smoke.mjs` agrupa muchos escenarios en un mismo proceso y combina navegador con acceso directo a la base. Tiene dependencias entre pasos, esperas fijas, `networkidle` y limpieza por SQL. No se encontró configuración del runner Playwright Test, reporte HTML ni trazas configuradas. El guion existente se conserva y sirve de referencia de los recorridos.

Diseñar los cinco casos como pruebas independientes del runner `@playwright/test`, con una futura instalación aprobada y sin depender de la ejecución previa de otra prueba. Usar `getByRole` y `getByLabel`, con locators descendientes para delimitar filas y diálogos. Usar `expect(locator)` y `expect(page).toHaveURL` con auto-waiting. Reservar identificadores de prueba existentes para elementos sin nombre accesible adecuado. Ejecutar inicialmente con un solo worker para controlar el ambiente y los consecutivos, sin usar esperas fijas.

- **E2E-02**, para sustentación. Explicar el login de vendedor, selección del repuesto por referencia, cantidades, confirmación mediante el diálogo, captura del número mostrado, y aserciones sobre el comprobante, el stock de 10 a 8 y el movimiento visible para administrador.
- **E2E-03**, para sustentación. Explicar la creación de una referencia única, el alta desde el formulario real, la compra del stock exacto y la comprobación de cero existencias y del detalle del comprobante. Mostrar cómo el fixture se identifica y limpia de forma independiente.
- Guardar el reporte HTML en `docs/calidad/10_Playwright/reportes/` y trazas relevantes en `docs/calidad/10_Playwright/trazas/`. Configurar `trace: "retain-on-failure"` y salida separada por caso. Los archivos de sesión y las trazas crudas pueden contener cabeceras u otros datos sensibles. Conservar los originales únicamente en almacenamiento local restringido y revisar el contenido antes de adjuntar una evidencia depurada al dossier.

## Riesgos y controles

| Riesgo identificado | Control propuesto |
| --- | --- |
| Escribir en el proyecto alojado actual | Aprobación de la referencia QA, confirmación del destino en aplicación, Postman y scripts, y bloqueo previo si no coincide. |
| Consumo o limpieza de datos de otro caso | Fixtures exclusivos, registro de IDs, limpieza por IDs y verificación de saldo inicial. Una ejecución abortada puede consumir el consecutivo. |
| Aceptar como funcional un resultado parcial | Mantener los resultados de caja negra, API y E2E como PENDIENTE. Diferenciar validación previa de reversión tras una escritura y sesión de proveedor de la autenticación de la aplicación. |
| Exponer contraseñas, tokens, cookies o datos sensibles | Usar datos sintéticos, eliminar secretos de exportaciones y revisar reportes, capturas y trazas antes de compartirlos. |
| Falsos resultados por esperas o carreras | Auto-waiting y separación de fixtures. El caso concurrente usa dos contextos y espera que termine la primera venta antes de enviar el carrito que quedó desactualizado. |

## Archivos y orden de implementación

1. **Aprobar el diseño y el entorno.** Confirmar el proyecto aislado, el uso de APIs existentes para Postman y la estrategia de fixtures.
2. **Preparar QA.** Crear un procedimiento de preparación y limpieza en `scripts/qa-fixtures.mjs` o equivalente y documentar variables sin valores en un ejemplo específico de QA, si se necesita. Conservar las migraciones y la semilla originales. Verificar roles y saldos antes de cada corrida.
3. **Ejecutar caja negra manual.** Registrar observaciones y evidencias en `docs/calidad/05_Caja_Negra_Navegador/`, actualizar las filas BB y enlazar los resultados comprobados.
4. **Implementar y ejecutar Postman.** Guardar colección, entorno sin secretos y reporte en `docs/calidad/09_Postman/`. Usar primero los casos de lectura y permisos, y después las operaciones que escriben.
5. **Implementar y ejecutar Playwright.** Crear `playwright.config.ts` y casos en `docs/calidad/10_Playwright/`. Si se aprueba la instalación, actualizar el manifiesto y su archivo de bloqueo para incorporar el runner. Conservar `scripts/e2e-smoke.mjs` y recoger el reporte HTML, evidencias depuradas y la explicación de E2E-02 y E2E-03.
6. **Cerrar la trazabilidad de ejecución.** Actualizar la matriz de pruebas y la matriz maestra con resultados y evidencias reales. Los resultados de unitarias y RTL se conservan.

La etapa de diseño preparó este plan y `04_Matriz_Pruebas.xlsx` antes de ejecutar casos. El usuario confirmó posteriormente que el proyecto alojado actual es académico y autorizó allí los registros de prueba. Consulte la matriz y los reportes en `09_Postman` y `10_Playwright` para el estado de ejecución.

## Referencias

- [Data API de Supabase](https://supabase.com/docs/guides/api)
- [Seguridad de acceso a la Data API](https://supabase.com/docs/guides/database/secure-data)
- [Estados de error en PostgREST](https://docs.postgrest.org/en/v14/references/errors.html)
- [Opciones de prueba y trazas de Playwright](https://playwright.dev/docs/test-use-options)
