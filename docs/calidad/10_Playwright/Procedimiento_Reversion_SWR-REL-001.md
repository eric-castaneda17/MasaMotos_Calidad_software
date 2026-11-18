# Verificación de reversión de SWR-REL-001

**CA-15 · PASS.** Se realizó una única ejecución el 18 de noviembre de 2026, de 12:40:34 a 12:40:40 p. m. (Bogotá). API-04, API-05 y E2E-04 cubren rechazos previos a la escritura. Este caso alcanzó el último paso de `public.create_sale`, después de insertar la venta y sus líneas, descontar existencias, registrar el movimiento e incrementar el consecutivo.

## Operación y ambiente

Ejecutar una venta válida de una unidad, con descuento cero, IVA vigente, Efectivo activo, vendedor QA activo y los datos sintéticos ya existentes de `QA_TEST-MWLP83ZG`. El repuesto y cliente de la venta son `QA_TEST-MWLP83ZG-API_LOW`. El repuesto debe conservar 3 unidades y un precio de 25.000 COP. Para provocar la colisión se reutiliza la factura académica de la observación `QA_TEST-MWLP83ZG-API08B`, emitida por el mismo vendedor QA. La observación del intento toma la forma `QA_TEST-MWLP83ZG-REL001-<ID>`.

El destino previsto es el Supabase académico actual, en una ventana exclusiva sin ventas, anulaciones, cambios de inventario, despliegues ni ediciones del lote. El controlador utiliza conexiones PostgreSQL con TLS verificado. Se abre una sesión de solo lectura antes, una para la transacción de la venta y otra nueva de solo lectura al final.

## Implementación preparada

El SQL completo está en [SWR-REL-001.sql](reversion/SWR-REL-001.sql). [qa-reversion.mjs](../../../scripts/qa-reversion.mjs) enlaza los parámetros, orquesta las sesiones e interpreta el error. Los bloques SQL deben ejecutarse con ese controlador, que conoce su orden y el manejo de errores.

| Bloque | Función |
| --- | --- |
| `beginRead`, `beginWrite`, `limits` | Abren transacciones explícitas. Las lecturas usan aislamiento repetible y modo de solo lectura. Cada sesión limita el bloqueo a 750 ms, las sentencias a 5 s y la inactividad en transacción a 5 s. |
| `structure`, `fixture`, `state` | Comparan la huella de estructura de Fase 4 y el cuerpo de la función con la migración. Validan el lote, el vendedor, el repuesto, cliente, Efectivo y factura de referencia, y capturan el estado pertinente. |
| `lockProduct`, `lockCounter`, `prepareCounter` | Bloquean primero el repuesto y luego la fila de configuración. Tras repetir la comprobación inicial, sustituyen temporalmente el consecutivo con comparación del valor anterior y el prefijo. |
| `savepoint`, `saleRole`, `saleIdentity`, `checkIdentity` | Crean el punto de restauración y fijan el rol y la identidad del vendedor solo dentro de la transacción. Verifican `auth.uid()`, el rol de base de datos y el permiso de aplicación. |
| `failSale`, `undoSale`, `rollback` | Invocan la función original, permiten capturar el error de PostgreSQL, deshacen la operación hasta el punto de restauración y finalmente revierten toda la preparación. |

El comando previsto, **solo después de la aprobación**, es `node scripts/qa-reversion.mjs --ejecutar`. Desde la raíz del repositorio, la sesión deberá disponer de `QA_REL_WINDOW=1`, un `QA_REL_RUN_ID` único, `QA_REL_SELLER_EMAIL` con el correo privado del vendedor que emitió API-08B, `QA_SUPABASE_REF` y `QA_DB_CA_FILE` con la CA verificada del proyecto. La configuración acepta únicamente la API HTTPS del proyecto académico fijado en el código y su conexión directa o su pooler académico en modo sesión, en el puerto 5432 y sobre la base `postgres`. Se descartan las opciones de consulta del DSN antes de construir el cliente TLS. Las variables de conexión y las credenciales quedan fuera de los reportes.

| Tabla | Operación que se comprobaría |
| --- | --- |
| `public.sales` | Inserción de la cabecera identificable por la observación. |
| `public.sale_items` | Inserción de una línea del repuesto reservado. |
| `public.products` | Descuento de una unidad y posible cambio de `updated_at`. |
| `public.inventory_movements` | Inserción de un movimiento de venta vinculado al repuesto. |
| `public.settings` | Preparación temporal e incremento de `next_invoice_number` en la fila `id=1`. |
| `public.invoices` | Intento final de insertar una factura con número duplicado. La factura académica que ya existe sirve de referencia. |

`customers`, `payment_methods` y el perfil QA se leen para validar los datos y la identidad. Se usarían solo registros académicos existentes y verificados.

## Estado inicial y provocación del fallo

1. **Verificar solo lectura.** Confirmar el proyecto, la definición desplegada de `create_sale`, que la inserción de factura siga al descuento y que exista la restricción única sobre `invoices.number`. Identificar una factura académica ya emitida cuyo número coincida exactamente con el prefijo actual y un sufijo que pueda generar la función. Confirmar que los datos de la venta están vigentes y que la observación de la prueba aún no existe.
2. **Registrar el estado inicial.** Guardar el saldo y `updated_at` del repuesto, las filas de ventas con la observación, las líneas y movimientos asociados al repuesto, las facturas asociadas a esas ventas, los datos de la factura de referencia y el prefijo y consecutivo de `settings.id=1`. Consultar los vínculos tanto por repuesto como por venta para detectar líneas o movimientos residuales. Verificar que el saldo permite la venta.
3. **Abrir una transacción explícita.** Aplicar tiempos de espera breves para bloqueo, sentencia y sesión inactiva en transacción. Bloquear primero la fila del repuesto y luego la fila de configuración, en el orden que usa la venta. Revalidar los datos bajo esos bloqueos. Conservar el prefijo. Solo en esta transacción, fijar el consecutivo al sufijo de la factura académica identificada y tomar una captura de ese valor temporal.
4. **Crear un punto de restauración y llamar la función.** Establecer el punto justo después de la preparación. Ejecutar la función como `authenticated` con la identidad del vendedor QA validada para `auth.uid()`, sin cambiar cuentas ni permisos persistentes. Confirmar que `is_staff()` reconoce esa identidad. Usar los datos válidos del paso 1. El número que construye la función ya existe y el último `INSERT` debe fallar con SQLSTATE `23505` en la restricción única de `invoices.number` (en la migración, `invoices_number_key`). Guardar código, restricción y contexto del error. Si la función devuelve éxito o el error surge en otra operación, cerrar con `ROLLBACK` y registrar que la prueba no demostró el fallo tardío.

## Comprobación y criterio de aceptación

1. Después del error esperado, ejecutar `ROLLBACK TO SAVEPOINT` para recuperar la sesión y consultar el estado dentro de la transacción de preparación. El saldo y `updated_at` deben coincidir con los iniciales. La venta de prueba, sus líneas, su movimiento y su factura deben estar ausentes. Los registros previos y la factura usada para la colisión deben conservarse. El contador debe haber vuelto al **valor temporal de preparación**, lo que comprueba que el incremento de la venta también se revirtió. [PostgreSQL · ROLLBACK TO SAVEPOINT](https://www.postgresql.org/docs/18/sql-rollback-to.html)
2. El controlador exige confirmación de `BEGIN` antes de continuar. Si el cliente se conectó, el bloque `finally` intenta `ROLLBACK` aunque haya fallado una consulta o se haya reportado un error de conexión. Las demás consultas se detienen ante ese error. Se guarda por separado si el servidor confirmó la reversión y qué falló durante la operación, la conexión, el rollback o el cierre. Si la conexión se pierde, PostgreSQL aborta la transacción abierta al cerrar la sesión. Para declarar PASS se requieren sesiones sin errores de conexión o de cierre y una confirmación de `ROLLBACK`. Con una conexión nueva de solo lectura, se repiten las consultas iniciales. El consecutivo debe ser ahora el **valor original** y el resto del estado debe coincidir con la captura inicial.
3. Registrar PASS para CA-15 únicamente si el contexto confirma la falla en la factura y coinciden ambas verificaciones. La comparación intermedia permite demostrar la reversión de la venta antes de deshacer la preparación.

## Riesgos y evidencias

- La fila de configuración es compartida y su bloqueo puede retrasar otras ventas. Cancelar ante actividad concurrente, fallo de TLS, proyecto distinto, datos o estructura incompatibles, falta de acceso con el vendedor QA, tiempos agotados o imposibilidad de obtener los bloqueos. El controlador no envía `COMMIT` ni ejecuta cambios de funciones, triggers, restricciones, RLS o Auth. Un error distinto al duplicado esperado o un éxito inesperado dejan el intento inconcluso.
- Los identificadores internos generados por secuencias de PostgreSQL pueden dejar saltos aunque se reviertan todas las filas. El consecutivo comercial se almacena en `settings` y sí se compara antes, durante y después. Si esos saltos internos son inaceptables, usar la copia aislada.
- El controlador generará un directorio por intento en `docs/calidad/10_Playwright/evidencias-reversion/<ID>/` y guardará únicamente los archivos que correspondan a etapas realmente alcanzadas. Las marcas de tiempo se almacenan en UTC con la referencia a la zona de Bogotá.

| Evidencia | Contenido |
| --- | --- |
| `REL-001-01-estado-inicial.json` | Estado de solo lectura y huella de estructura. |
| `REL-001-02-error-factura.json` | SQLSTATE, restricción, contexto filtrado de la sentencia y coincidencia del número duplicado. |
| `REL-001-03-tras-savepoint.json` | Estado tras revertir la venta y consecutivo temporal esperado. |
| `REL-001-04-estado-final.json` | Estado y huella de estructura desde una conexión nueva. |
| `REL-001-05-resumen.json` | Observación, fechas, huella del SQL, comparaciones, confirmación del rollback y resultado. |

## Revisión de seguridad del 18 de noviembre de 2026

- **Pruebas locales** · `node --test scripts/qa-reversion.test.mjs` obtuvo **15 aprobadas y 0 fallidas**. Simuló rechazo y pérdida de conexión, respuesta inesperada a `BEGIN`, fallos al consultar, revertir o cerrar, colisión equivocada, venta que retorna éxito, diferencias en la lectura final y cambios en la huella, la función o la identidad.
- **Comprobaciones estáticas** · `node --check`, ESLint y `git diff --check` finalizaron con código 0. Se revisó el enlace de parámetros en los 16 bloques SQL mediante el cliente simulado, la ausencia de comandos de confirmación y el orden de escritura en la migración. El informe histórico registra el lote, la huella estructural y las tres unidades de `API_LOW`, sin ventas ni movimientos de venta para ese producto. La comparación del despliegue y la validación de los datos vigentes se harán en la primera sesión de solo lectura de la ejecución autorizada.
- **Datos de evidencia** · Las lecturas registran referencias del lote, saldos, contadores, identificadores de filas relacionadas y los campos de movimiento necesarios para comparar el estado. Se excluyen correos, nombres, documentos, UUID de usuario, motivos de inventario y mensajes de error en bruto. Los metadatos de estructura se procesan en memoria y en el reporte solo queda la huella. La salida diagnóstica de factura se limita al código, la restricción, la sentencia, el número de línea y el número académico coincidente.

La revisión de seguridad solo leyó la configuración local y utilizó clientes simulados. La ejecución real se documenta a continuación.

## Resultado de la ejecución autorizada

La comprobación previa de solo lectura validó TLS, la estructura desplegada, la función, el vendedor y los datos académicos. En dos observaciones se registraron cero sesiones activas o inactivas en transacción fuera del preflight, sin sesiones con estado oculto. El consecutivo se mantuvo estable.

| Comprobación | Resultado observado |
| --- | --- |
| Fallo tardío | PostgreSQL devolvió `23505` en `invoices_number_key`, al intentar insertar `MM-000085` en `public.invoices`. El contexto identificó la escritura final de `create_sale`. |
| Tras el punto de restauración | El repuesto conservó sus 3 unidades y su fecha de actualización. No quedaron ventas, líneas, facturas ni movimientos de la operación. Se conservaron el ajuste inicial del repuesto y la factura de referencia. El consecutivo volvió al valor temporal 85. |
| Tras el rollback exterior | PostgreSQL confirmó `ROLLBACK`. Una conexión nueva de solo lectura encontró el estado del caso idéntico al inicial, con el consecutivo original 93 y la misma huella de estructura. |

La comprobación cubrió los registros relacionados y la huella de estructura. No se midió el avance de las secuencias internas, que pueden dejar saltos tras una reversión.

- [Estado inicial](evidencias-reversion/CA15-20261118174028/REL-001-01-estado-inicial.json)
- [Error de factura](evidencias-reversion/CA15-20261118174028/REL-001-02-error-factura.json)
- [Estado después del SAVEPOINT](evidencias-reversion/CA15-20261118174028/REL-001-03-tras-savepoint.json)
- [Estado final de solo lectura](evidencias-reversion/CA15-20261118174028/REL-001-04-estado-final.json)
- [Resumen de la ejecución](evidencias-reversion/CA15-20261118174028/REL-001-05-resumen.json)
