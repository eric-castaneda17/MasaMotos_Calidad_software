# Guía de ejecución manual en navegador

**Consolidación manual del 18 de noviembre de 2026.** El usuario confirmó once casos completos satisfactorios, BB-01 a BB-11. La matriz registra once PASS por confirmación manual, con capturas de apoyo parciales identificadas y BB-12 PENDIENTE. El mínimo de diez queda cubierto por esa ejecución declarada, sin inventar capturas. No se ejecutaron casos manuales ni ventas por el agente en esta revisión.

La declaración del usuario y la revisión de archivos se conservan en [resultados-manuales.json](evidencias/resultados-manuales.json). Los originales no se modificaron. Las copias depuradas están en evidencias/depuradas/, con huellas y rectángulos ocultados. El respaldo es parcial: el archivo BB-05-01-filtros-combinados.png muestra filtros sin selección y no demuestra su combinación. BB-04, BB-07, BB-08, BB-09 y BB-10 no tienen capturas identificadas. Las confirmaciones manuales no se presentan como capturas.

La lectura auxiliar confirmó BB-09: factura MM-000095, cantidad 2, total 53.550 y movimiento 10 a 8. La primera lectura de BB-10 fue a las 17:09 Bogotá, antes de las ventas. Tras la aclaración del usuario se consultaron únicamente MM-000096 y MM-000097: emitidas a las 17:15 y 17:16, COMPLETED, 29.750 cada una, una unidad de BB_INVOICE y movimientos 4→3→2. El saldo actual es 2. Se utilizó Consumidor final en vez del cliente académico previsto; la variación no cambia los criterios de consecutivo comprobados. BB-07 completo fue confirmado por el usuario; no hay capturas del rechazo o de unicidad. La lectura SQL preliminar de una referencia equivalente se conserva solo como apoyo. Ver [lecturas y límites](../11_ISO_25010/evidencias/rendimiento/consolidacion-manual/Lecturas_y_Limites.json). Los pasos siguientes conservan el procedimiento original y no constituyen una nueva orden de ejecución.

## Antes de comenzar

1. Abra una instancia local de MASA MOTOS conectada al proyecto Supabase académico autorizado. Si ya tiene una compilación reciente, ejecute `npm run start -- --hostname localhost --port 3106` y abra <http://localhost:3106>. En su defecto, compile primero con `npm run build -- --webpack`. Use `localhost` para evitar el bucle de redirección observado en `127.0.0.1`. Las rutas de los casos se agregan a esta URL base.
2. Seleccione español. Use una ventana normal para el vendedor y un perfil separado para el administrador. Haga las comprobaciones sin sesión en una ventana privada. Cierre todas las ventanas privadas antes de abrir un contexto privado nuevo.
3. Valide en **Productos** los saldos exigidos antes de cada caso que los utiliza. Si un dato cambió, anote el impedimento y conserve el caso pendiente hasta disponer de un dato académico equivalente. Para referencias con guion bajo, use el fragmento de búsqueda indicado y compruebe el código completo en la fila o tarjeta. En **Nueva venta**, escriba sin pulsar **Enter** cuando solo esté consultando. **Enter** agrega el primer resultado al carrito.
4. Guarde cada PNG en `docs/calidad/05_Caja_Negra_Navegador/evidencias/` con los nombres indicados. Cree esa subcarpeta cuando tenga las primeras capturas. Recorte contraseñas, campos de credenciales y datos de terceros. En la hoja **Caja negra** de `04_Matriz_Pruebas.xlsx`, registre resultado observado, estado, fecha local de Bogotá y rutas de evidencia. Anote defecto y reejecución cuando corresponda. Use PASS solo si ejecutó todos los pasos del caso y obtuvo los resultados esperados. Si una precondición impide ejecutarlo, deje PENDIENTE.

**Orden recomendado** · BB-03 → BB-02 → BB-01 → BB-11 → BB-06 → BB-05 → BB-04 → BB-08 → BB-09 → BB-10 → BB-07 → BB-12. El recorrido aprovecha una sola sesión de vendedor y deja al final el bloque de administrador y cuenta inactiva.

## BB-03 · Abrir una ruta protegida como invitado

- **Requisito** · SWR-AUTH-006 (CA-03).
- **Rol, pantalla y datos** · Invitado. Ventana privada nueva. Ruta `/ventas/nueva`.
- **Pasos** · Pegue la URL completa de la ruta en la barra, navegue y espere.
- **Esperado** · La URL termina en `/signin` y se ve **Iniciar sesión**. La pantalla de ventas queda inaccesible.
- **Evidencia** · URL y encabezado en `BB-03-01-redireccion.png`.
- **Preparación siguiente** · Mantenga esa ventana privada sin sesión para BB-02.

## BB-02 · Rechazar credenciales incorrectas

- **Requisito** · SWR-AUTH-002 (CA-01).
- **Rol, pantalla y datos** · Invitado en `/signin`. Variante A, correo del vendedor QA activo y texto de prueba `QA-BB02-NoValida-2026!` como contraseña incorrecta. Variante B, `qa-test-mwlp83zg-bb02-missing@example.test` y el mismo texto. Se comprobó que ese correo no existía en el proyecto.
- **Pasos** · Envíe A con **Ingresar**. Capture el aviso e intente abrir `/ventas/nueva` desde la barra. Al volver al formulario, reemplace ambos campos con B y repita.
- **Esperado** · Las dos variantes muestran «Correo o contraseña incorrectos.» y la ruta protegida termina en `/signin` después de cada intento.
- **Evidencia** · Aviso A en `BB-02-01-aviso-correo-existente.png` y su redirección en `BB-02-02-ruta-correo-existente.png`. Aviso B en `BB-02-03-aviso-correo-inexistente.png` y su redirección en `BB-02-04-ruta-correo-inexistente.png`. Encuadre aviso y URL con los campos de acceso fuera de la captura.
- **Preparación siguiente** · Cierre la ventana privada. Abra `/signin` en la ventana normal para BB-01.

## BB-01 · Ingresar con una cuenta activa

- **Requisito** · SWR-AUTH-004 (CA-02).
- **Rol, pantalla y datos** · Vendedor QA activo. `/signin`, luego panel y **Productos**. Use las credenciales válidas entregadas por el responsable de QA.
- **Pasos** · Escriba correo y contraseña, pulse **Ingresar**, espere el panel y abra **Productos** desde el menú.
- **Esperado** · Se abre primero el panel y luego el catálogo en `/productos`, con la sesión del vendedor activa.
- **Evidencia** · `BB-01-01-panel.png` y `BB-01-02-catalogo.png`. Incluya el encabezado o la URL de cada pantalla.
- **Preparación siguiente** · Mantenga la sesión y deje abierto **Productos**.

## BB-11 · Consultar productos sin permiso de alta

- **Requisito** · SWR-AUTH-006 (CA-03).
- **Rol, pantalla y datos** · El mismo vendedor activo. `/productos` y `/productos/nuevo`.
- **Pasos** · En el catálogo, observe el encabezado y sus acciones. Escriba la URL directa de alta en la barra. Después de la redirección, abra **Productos** desde el menú.
- **Esperado** · El catálogo está disponible antes y después. Falta la acción **Nuevo producto** y la URL directa redirige al panel `/` sin mostrar el formulario.
- **Evidencia** · Encabezado completo del catálogo en `BB-11-01-catalogo-vendedor.png` y panel con la URL tras el intento en `BB-11-02-acceso-denegado.png`.
- **Preparación siguiente** · Deje abierto **Productos**, con la búsqueda y los filtros limpios.

## BB-06 · Recuperarse de una búsqueda sin coincidencias

- **Requisito** · SWR-BUS-005 (CA-07).
- **Rol, pantalla y datos** · Vendedor activo. **Productos**. Búsqueda inexistente `QA-SIN-COINCIDENCIAS`. Búsqueda válida `MWLP83ZG-CAT`, con fila objetivo `QA_TEST-MWLP83ZG-CAT_AVAILABLE`.
- **Pasos** · Escriba la consulta inexistente y espere el resultado. Reemplácela por la válida y localice la fila con el código completo.
- **Esperado** · Se muestra «No se encontraron resultados para su búsqueda.» y luego desaparece al ver el producto válido.
- **Evidencia** · Buscador y aviso en `BB-06-01-sin-resultados.png`. Buscador y fila recuperada en `BB-06-02-resultado-valido.png`.
- **Preparación siguiente** · Deje `MWLP83ZG-CAT` escrito y los filtros de categoría y marca sin selección.

## BB-05 · Aplicar y limpiar filtros

- **Requisito** · SWR-BUS-004 (CA-06).
- **Rol, pantalla y datos** · Vendedor activo. **Productos**. Búsqueda `MWLP83ZG-CAT`, categoría `QA_TEST-MWLP83ZG-A` y marca `Yamaha`.
- **Pasos** · Aplique solo la categoría A. Después vuelva a **Todas las categorías** y aplique solo Yamaha. Con Yamaha seleccionado, vuelva a aplicar A. Pulse **Limpiar filtros** y restablezca únicamente la búsqueda `MWLP83ZG-CAT`.
- **Esperado** · Entre las tres referencias de comprobación, A deja `CAT_AVAILABLE` y `CAT_LOW`. Yamaha deja `CAT_AVAILABLE` y `CAT_ZERO`. La combinación deja solo `CAT_AVAILABLE`. Al restablecer la búsqueda sin filtros vuelven las tres.
- **Evidencia** · Filtros visibles y filas en `BB-05-01-categoria.png`, `BB-05-02-marca.png`, `BB-05-03-interseccion.png` y `BB-05-04-sin-filtros.png`.
- **Preparación siguiente** · Mantenga la búsqueda base y los filtros sin seleccionar.

## BB-04 · Comparar los datos de un repuesto en dos pantallas

- **Requisito** · SWR-BUS-003 (CA-05).
- **Rol, pantalla y datos** · Vendedor activo. **Productos** y **Nueva venta**. Busque `MWLP83ZG-CAT` y localice `QA_TEST-MWLP83ZG-CAT_LOW`. El nombre es idéntico a la referencia, la marca es **Honda**, el precio es 25.000 COP, hay 2 unidades y el mínimo registrado es 2. La marca Yamaha que figura en la matriz es una discrepancia del dato de prueba. El requisito y el criterio se conservan.
- **Pasos** · Lea los datos en la fila de **Productos**. Abra **Nueva venta** y escriba la misma búsqueda en **Buscar producto**. Localice la tarjeta sin seleccionarla.
- **Esperado** · En ambas pantallas coinciden nombre, referencia, marca Honda, precio, existencias y estado **Stock bajo**.
- **Evidencia** · Fila completa en `BB-04-01-catalogo.png` y tarjeta de búsqueda en `BB-04-02-punto-de-venta.png`.
- **Preparación siguiente** · Deje **Nueva venta** abierta con el carrito vacío y borre la búsqueda.

## BB-08 · Alcanzar y liberar el límite del carrito

- **Requisitos** · SWR-VEN-002 y SWR-INV-006 (CA-09 y CA-14).
- **Rol, pantalla y datos** · Vendedor activo. **Nueva venta** y **Productos**. Busque `MWLP83ZG-BB` y elija `QA_TEST-MWLP83ZG-BB_BOUNDARY`, con saldo 3. Cantidades del caso 1 → 4 solicitada → 3 limitada → 2.
- **Pasos** · Agregue una unidad. Seleccione el valor del campo **Cantidad** y escriba `4`. Capture el aviso al aparecer y observe el estado del botón **Aumentar cantidad** y de la tarjeta. Pulse **Disminuir cantidad** una vez y observe los mismos controles. Vacíe el carrito sin confirmar la venta y consulte la referencia en **Productos**.
- **Esperado** · El aviso indica que solo hay 3 unidades. La cantidad se limita a 3, se deshabilita el aumento y la tarjeta muestra **Límite de existencias alcanzado en el carrito**. Al bajar a 2 se puede agregar de nuevo y la tarjeta indica que queda 1 unidad por agregar. En el catálogo siguen disponibles 3.
- **Evidencia** · `BB-08-01-aviso-y-limite.png`, `BB-08-02-cantidad-dos.png` y `BB-08-03-stock-sin-venta.png`. Capture el aviso de inmediato y, si desaparece antes de encuadrar los controles, use otra imagen `BB-08-04-controles-al-limite.png`.
- **Preparación siguiente** · Desde **Productos**, compruebe el saldo 10 de `QA_TEST-MWLP83ZG-BB_SALE` y abra una nueva venta vacía.

## BB-09 · Confirmar una venta y verificar el descuento de existencias

- **Requisitos** · SWR-VEN-001, SWR-VEN-003 y SWR-VEN-009 (CA-08, CA-10 y CA-11).
- **Rol, pantalla y datos** · Vendedor activo. **Nueva venta** y **Productos**. Repuesto `QA_TEST-MWLP83ZG-BB_SALE`, stock inicial 10, precio unitario 25.000 COP, cantidad 2. Cliente `QA_TEST-MWLP83ZG-BB`, documento `QA-MWLP83ZG-BB`. Descuento 10 %, IVA 19 %, **Efectivo** recibido `60000`. Observación `QA_TEST-MWLP83ZG-BB09`.
- **Pasos** · Busque `MWLP83ZG-BB` y seleccione el repuesto indicado. Use **Aumentar cantidad** para llegar a 2. En **Cliente**, pulse **Cambiar**, busque el documento y seleccione el nombre exacto. Indique pago, descuento y observación. Capture el resumen. Pulse **Confirmar venta** y repita en el diálogo. Anote el número de factura y consulte el mismo repuesto en **Productos**.
- **Esperado** · Subtotal 50.000, descuento 5.000, IVA 8.550, total 53.550 y cambio 6.450 COP. Aparece **¡Venta registrada!** con el número de factura. El saldo baja de 10 a 8.
- **Evidencia** · `BB-09-01-stock-inicial.png`, `BB-09-02-resumen.png`, `BB-09-03-confirmacion.png` y `BB-09-04-stock-final.png`. Deje visible la referencia para ambas capturas de saldo y el número en la confirmación.
- **Preparación siguiente** · Conserve la venta académica y su número. Para BB-10 abra una nueva venta vacía y confirme que puede completar las dos ventas seguidas sin otra emisión entre ellas.

## BB-10 · Verificar dos facturas consecutivas

- **Requisitos** · SWR-CPB-001 y SWR-CPB-002 (CA-12 y CA-13).
- **Rol, pantalla y datos** · Vendedor activo. **Nueva venta** y **Facturas**. Repuesto `QA_TEST-MWLP83ZG-BB_INVOICE`, stock inicial 4, 1 unidad por venta a 25.000 COP. Cliente `QA_TEST-MWLP83ZG-BB_INVOICE`, documento `QA-MWLP83ZG-BB-INVOICE`. Descuento 0, IVA 19 %, **Efectivo** recibido `30000` en cada venta. Observaciones `QA_TEST-MWLP83ZG-BB10A` y `QA_TEST-MWLP83ZG-BB10B`.
- **Pasos** · Confirme la primera venta con los datos indicados y anote su número. Pulse **Nueva venta** en el diálogo de éxito. Confirme la segunda de inmediato, con la segunda observación, y anote el nuevo número. En **Facturas**, busque el número completo de la primera, abra su detalle y vuelva a la lista para repetir con la segunda. Observe el prefijo, el número, la fecha, la hora, **Atendido por**, el medio de pago y los datos del repuesto.
- **Esperado** · Números distintos con el mismo prefijo y sufijo numérico que aumenta en 1. En ambas facturas figura el repuesto correcto, cantidad 1, unitario y subtotal 25.000, IVA 4.750, total 29.750 COP, el vendedor QA, la fecha y hora de la operación y Efectivo. Si se confirma una venta ajena entre las dos, registre la interferencia y repita en una ventana coordinada antes de evaluar el consecutivo.
- **Evidencia** · Detalles con encabezado, datos y totales en `BB-10-01-factura-A.png` y `BB-10-02-factura-B.png`.
- **Preparación siguiente** · Conserve las ventas y facturas. Deje la sesión del vendedor para consulta. Use el perfil separado de administrador para BB-07.

## BB-07 · Rechazar el alta de una referencia duplicada

- **Requisito** · SWR-REP-003 (CA-04).
- **Rol, pantalla y datos** · Administrador QA activo. **Productos → Nuevo producto**. Código `qa_test-mwlp83zg-cat_available`, nombre `QA_TEST-MWLP83ZG-BB07-DUPLICADO`, marca `Yamaha`, categoría `QA_TEST-MWLP83ZG-A`, compra `10000`, venta `25000`, stock inicial `1`, stock mínimo `2`, repuesto activo. La referencia original es `QA_TEST-MWLP83ZG-CAT_AVAILABLE`.
- **Pasos** · Complete el formulario y pulse **Guardar**. Observe el mensaje del código. Vuelva a **Productos**, busque `MWLP83ZG-CAT` y cuente las filas que coincidan exactamente con la referencia, ignorando mayúsculas y minúsculas.
- **Esperado** · El formulario avisa «Ya existe un producto con este código.» y queda una sola fila de esa referencia. Si el alta llegara a completarse, registre el defecto y conserve los datos para su revisión.
- **Evidencia** · Código y aviso en `BB-07-01-duplicado.png`. Resultado del catálogo en `BB-07-02-referencia-unica.png`.
- **Preparación siguiente** · Conserve la sesión de administrador si hace falta preparar BB-12. No reactive otras cuentas.

## BB-12 · Rechazar el ingreso de una cuenta inactiva

- **Requisito** · SWR-AUTH-004 (CA-02).
- **Rol, pantalla y datos** · Invitado en una ventana privada nueva. Cuenta académica `qa_test-mwlp83zg-inactive@example.test`, vendedor inactivo en MASA MOTOS con correo confirmado en Supabase Auth, sin bloqueo de Auth y con contraseña válida entregada por el administrador.
- **Pasos** · Abra `/signin`, ingrese las credenciales correctas y pulse **Ingresar**. Capture el aviso. Escriba después la URL directa de `/productos`.
- **Esperado** · Aparece «Su usuario está desactivado. Contacte al administrador.» y la ruta protegida devuelve a `/signin` sin mostrar el catálogo.
- **Evidencia** · Mensaje en `BB-12-01-cuenta-inactiva.png` y URL más encabezado de inicio en `BB-12-02-redireccion.png`. Mantenga los campos de acceso fuera del encuadre.
- **Preparación siguiente** · Cierre la ventana privada. Deje la cuenta académica inactiva para una eventual reejecución.

### Preparar la cuenta de BB-12

El HTTP 401 anterior vino del endpoint administrativo que intentó crear la cuenta. La consulta actual confirmó que la cuenta propuesta todavía no existe. El código disponible no permite distinguir si la clave de ese intento era inválida, carecía de privilegios o correspondía a otro proyecto.

1. Con una sesión administrativa del proyecto académico en el **Dashboard de Supabase**, abra **Authentication → Users → Add user** y elija la opción de crear el usuario directamente. Use `qa_test-mwlp83zg-inactive@example.test`, una contraseña única guardada de forma privada y la opción de confirmar el correo al crear. El trigger existente genera por defecto un perfil `SELLER` con `active=false` si no se proporcionan metadatos administrativos.
2. Verifique que el usuario está confirmado y sin bloqueo en Auth. En el listado de **Usuarios** de MASA MOTOS, compruebe que ese correo aparece como vendedor inactivo. Como alternativa de verificación, consulte únicamente ese perfil por su UUID en **Table Editor → profiles**. Si el estado difiere, deje BB-12 pendiente y pida revisión del perfil.
3. Entregue la contraseña al ejecutor por el canal privado acordado. Evite crear la cuenta como inactiva desde el formulario de MASA MOTOS. Ese formulario también la bloquea en Auth, lo que haría que aparezca el rechazo genérico antes de que la aplicación pueda comprobar el perfil.

[Documentación de administración de usuarios de Supabase](https://supabase.com/docs/guides/auth/users) · [Creación administrativa y confirmación de correo](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
