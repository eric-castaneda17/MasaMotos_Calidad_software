# Escenarios de Shift Right y autorización de efectos

Los resultados reales locales y las pruebas con dependencias simuladas se registran por separado. Los casos SR no sustituyen los doce BB manuales, la sesión exploratoria ni las mediciones de rendimiento.

## Ejecución local sin escrituras en Supabase

1. Desde la raíz del repositorio, compilar con `npm run build -- --webpack`.
2. Ejecutar `node scripts/qa-shift-right-readonly.mjs`. El runner inicia su propio servidor de producción en `localhost:3116`, exige que el puerto esté disponible y lo cierra al terminar.
3. SR-00 observa APPLICATION_STARTED en el servidor real.
4. SR-02 solicita `/ventas/nueva` sin cookies y comprueba redirección a `/signin` más ACCESS_DENIED.
5. SR-06 envía un correo de formato inválido y un dato ficticio. La acción rechaza el formulario antes de crear el cliente Supabase y emite AUTH_VALIDATION_REJECTED.
6. Revisar `evidencias/resultados-locales.json` y `evidencias/eventos-reales-locales.jsonl`. Esas evidencias proceden del proceso Next.js compilado. El runner no autentica cuentas ni confirma ventas.

El runner usa Edge ya instalado y restringe las solicitudes del navegador a su servidor local. Su captura conserva únicamente líneas JSON del mecanismo estructurado. Si falla, conserva el resultado INCONCLUSO y los eventos observados. No ejecutarlo al mismo tiempo que otra instancia de ese runner ni mientras se compila.

## Pruebas automatizadas con dependencias simuladas

`node node_modules/vitest/vitest.mjs run --project observability` ejecuta el logger y las acciones reales con Supabase, navegación y caché sustituidos por mocks. Sus eventos se guardan en `evidencias/eventos-simulados.jsonl`, identificados como `simulated-dependencies`. Una venta simulada no acredita una venta en Supabase ni un escenario de operación real del punto 18.2.

## Procedimiento académico ejecutado y cierre

**EJECUTADO CON AUTORIZACIÓN EL 2026-11-18.** La sesión utilizó la aplicación compilada, el Supabase académico, un vendedor activo y el lote sintético exclusivo QA_SR-MWMKXTFW. Los pasos siguientes describen el procedimiento autorizado, no una solicitud de ejecución pendiente ni autorización para repetirlo.

| Caso | Operación propuesta | Evento y observación esperados |
| --- | --- | --- |
| SR-01 | Un único intento de login con la cuenta QA y contraseña incorrecta ficticia. | AUTH_LOGIN_FAILED / WARN, rechazo visible. |
| SR-07 | Login correcto con credenciales privadas, seguido del acceso al catálogo. | AUTH_LOGIN_SUCCEEDED / INFO y duración. |
| SR-03 | Confirmar una venta de una unidad de un repuesto reservado con stock suficiente. | SALE_CREATED / INFO con IDs técnicos y duración. Verificar venta, línea, movimiento, factura y saldo. |
| SR-04 | Con dos sesiones del mismo ambiente, preparar un carrito con una unidad reservada y consumirla mediante otra venta académica autorizada. Confirmar el carrito desactualizado. | SALE_STOCK_REJECTED / WARN y ACTION_REJECTED con la misma correlación, sin segunda venta parcial. |
| SR-05 | Provocar una interrupción de comunicación en una instancia local de prueba mediante un transporte o proxy controlado que bloquee el RPC antes de enviar la solicitud. | ACTION_ERROR / ERROR, operación createSale y respuesta genérica conservada. Debe demostrarse que la solicitud no llegó a Supabase. |

### Tablas y otros efectos que requieren autorización

- Los logins pueden crear o renovar sesiones y registros internos de Supabase Auth. El login correcto también llama a `touch_last_login` y puede actualizar `public.profiles`.
- SR-03 y la venta de preparación de SR-04 generan registros en `sales`, `sale_items`, `inventory_movements` e `invoices`, descuentan `products.stock` e incrementan `settings.next_invoice_number`.
- Preparar datos exclusivos puede insertar productos, clientes o categorías y movimientos de stock inicial. Se propone conservar los registros académicos identificados después de la sesión. No se contempla borrar masivamente ni alterar el esquema.
- SR-05 debe fallar antes del envío del RPC. Interrumpir la conexión después del envío introduce incertidumbre sobre una venta que podría haberse confirmado. En ese caso se debe detener la sesión y consultar el resultado por el identificador académico antes de cualquier repetición.

### Controles aplicados a la sesión

1. Corregir o delimitar los pendientes de credenciales que impidan el escenario. Las claves administrativas permanecen fuera de la sesión de vendedor. No cambiar contraseñas automáticamente.
2. Confirmar destino académico, ventana exclusiva y datos iniciales mediante lectura. Reservar un producto que no sea el fixture de CA-15 ni el de los BB pendientes.
3. Aprobar el número exacto de ventas de preparación y ejecución. La propuesta implica una venta de SR-03 y una venta adicional de preparación de SR-04. El intento rechazado y el fallo previo al envío no deben crear ventas.
4. Acordar la implementación concreta del fallo controlado de SR-05 antes de usarlo. No cambiar funciones SQL, triggers, RLS ni variables privadas. No introducir un endpoint público para provocar errores.
5. Capturar los logs del servidor y los resultados visibles, filtrar datos sensibles y relacionar evento, correlación y operación. Las credenciales se introducen de forma privada.
6. Registrar estado final y efectos por cada venta. Conservar errores y resultados adversos. Un resultado inesperado obliga a detenerse antes de repetir una operación.
7. Actualizar la matriz SR solo con la ejecución observada. Las filas simuladas conservan su procedencia aunque luego exista una verificación real.

Los cinco objetivos del punto 18.2 quedaron comprobados: flujo principal y duración en SR-03, credencial incorrecta en SR-01, dato inválido en SR-06 y error controlado en SR-05. Se observaron además SR-07 y SR-04.

### Resultado definitivo y límites

- Venta 94/factura MM-000093 para SR-03 y venta 95/factura MM-000094 para preparar SR-04. Ambas de una unidad y total 29750.00. El lote terminó con stock SALE=1 y RACE=0, dos ventas, dos líneas, dos movimientos SALE y dos facturas. Datos sintéticos conservados.
- SR-01: rechazo visible y AUTH_LOGIN_FAILED/WARN. Se corrigió el selector del verificador a la alerta del formulario por la coincidencia adicional de next-route-announcer.
- SR-04: stock 0 y WARN correlacionados, sin tercera venta. La aserción visual del toast expiró y no se acredita; el alcance de observabilidad se comprobó mediante logs y consulta de solo lectura. No se repitió la operación.
- SR-05: se interceptó fetch solo en el servidor temporal y únicamente para /rest/v1/rpc/create_sale. Ante una bandera local, se registró forwarded=false y se lanzó TypeError antes del fetch original. Hubo un único bloqueo, ACTION_ERROR y mensaje visible. La bandera se retiró y el servidor se cerró. No se añadió un endpoint ni se alteró Supabase.
- Antes y después del bloqueo coincidieron stock, ventas, líneas, movimientos, facturas y consecutivo 95. Los productos reservados y la estructura se comprobaron sin cambios en la sesión final. El fallo previo al envío no demuestra reversión de escrituras ni sustituye CA-15.
- Los resultados, correlaciones, extractos reales y diagnósticos se conservan en evidencias/resultados-locales.json y eventos-reales-locales.jsonl. executionHistory conserva las interrupciones; consolidatedResults resume la verificación definitiva.

Los pendientes de seguridad, pruebas manuales, sesión exploratoria y rendimiento permanecen abiertos en sus instrumentos. No se requiere repetir esta sesión para el cierre documental.
