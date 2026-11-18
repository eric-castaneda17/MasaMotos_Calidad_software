# Registro de ejecución de la Fase 4

Se utilizó el Supabase existente autorizado para datos académicos y la compilación de producción local con `localhost`. El lote `QA_TEST-MWLP83ZG` agregó productos, categorías y clientes sintéticos. Los movimientos iniciales, ventas, líneas y comprobantes que se generaron para la ejecución y los re-tests permanecen identificados. El acceso normal usa las sesiones de Auth y puede actualizar la fecha de último acceso en el perfil. Se conservaron las ventas ya confirmadas en intentos que después fallaron por una aserción de la suite.

| Incidencia | Observación | Ajuste y re-test |
| --- | --- | --- |
| QA-F4-01 · Acceso en producción local | Con el servidor iniciado en `127.0.0.1`, `/signin` se redirigía repetidamente y Playwright no podía acceder. | Se inició la misma compilación con `--hostname localhost`. `/signin` devolvió 200 y E2E-01 y E2E-05 pasaron en esa configuración. No se cambió el proxy ni el control de acceso. |
| QA-F4-02 · Locators y textos de la suite | El catálogo tenía dos buscadores; el botón real de alta dice «Nuevo producto». En los re-tests el aviso de referencia duplicada apareció en dos lugares, y la suite esperaba textos distintos para facturas vacías y el vendedor del comprobante. | Se acotó el buscador por su nombre, se usó el botón real, se comprobó la descripción accesible del campo Código y se usaron los textos «No hay facturas para los filtros seleccionados» y «Atendido por». E2E-02, E2E-03 y E2E-04 pasaron en sus respectivos re-tests. |
| QA-F4-03 · Preparación de cuenta inactiva | Supabase Auth Admin devolvió 401 al intentar crear la cuenta sintética. El intento no creó una cuenta ni cambió credenciales. | BB-12 permanece pendiente. La preparación admite una contraseña en un entorno privado y la vía de sembrado de una nueva cuenta sintética. Esa vía no formó parte de la ejecución registrada. |
| QA-F4-04 · Infraestructura de suites | La primera carga Playwright de un módulo ESM y la primera asociación de eventos de Newman fallaron antes de completar los casos. | La suite usa `.spec.mts`; el runner identifica las solicitudes por ID de caso. La evidencia final corresponde a casos realmente ejecutados. |

La ejecución de Postman y la preparación de datos usaron el mismo destino aprobado. Se verificó el pooler mediante TLS y la CA de Supabase. Los reportes depurados de Postman y Playwright se vinculan por ID de caso en la matriz. La huella de políticas, funciones, triggers y objetos de datos se compara en los registros de estado inicial y final.

La huella fue idéntica. Los conteos fuera del lote se mantuvieron en 29 productos y 78 ventas. El comparativo muestra 10 comprobantes de QA y 27 movimientos adicionales, incluidos los movimientos iniciales de los repuestos sintéticos. El consecutivo avanzó de 83 a 93. La revisión de los reportes y las trazas seleccionadas no encontró contraseñas, claves, cadenas de conexión ni JWT.

## Resultados y trazas

- [Caja negra manual](../05_Caja_Negra_Navegador/README.md). Se reportó la ejecución de BB-01, BB-02 y BB-03. Sus estados siguen pendientes de evidencia apta para el dossier. Los nueve casos restantes se reservan para la etapa final y solo podrán registrarse como PASS tras su ejecución en navegador y verificación de evidencia.
- [Postman](../09_Postman/resultados-newman.json). Resultados de Newman con HTTP y aserciones depuradas.
- [Playwright](resultados-playwright.json). Último resultado por caso e historial de las corridas; las aprobaciones se obtuvieron entre la corrida completa y los re-tests individuales.
- [SWR-REL-001 / CA-15](Procedimiento_Reversion_SWR-REL-001.md#resultado-de-la-ejecución-autorizada). **PASS** en la única ejecución autorizada. La reversión ante un número de factura duplicado conservó el stock y el consecutivo, sin registros parciales en el alcance comprobado.
- [Corrida completa](reportes/corrida-completa/index.html), [re-test de cantidad y comprobante](reportes/retest-stock/index.html) y [re-test final de alta y venta](reportes/retest-alta/index.html). Los reportes HTML son los generados por Playwright.
- [Estado inicial](estado-inicial.json), [estado final](estado-final.json) y [comprobaciones](comprobaciones.txt).

La traza E2E-02 del locator ambiguo y la traza E2E-03 de la etiqueta del comprobante se conservan en `trazas/`. Una traza de un intento que agotó el tiempo quedó incompleta. El resultado correspondiente está en el historial de ejecución.

## Retirada de contraseñas antes del cierre parcial

El 18 de noviembre de 2026 se retiraron dos contraseñas incrustadas en el README, las utilidades de navegador y el script de preparación. Esos valores se pasaban a la creación de cuentas Auth y al inicio de sesión de pruebas. Se consideran potencialmente vigentes para las cuentas QA de administrador y vendedor. El responsable debe rotar `QA_ADMIN_PASSWORD` y `QA_SELLER_PASSWORD` si las cuentas todavía usan los valores del historial. Esta revisión se realizó mediante inspección local del código.

Los consumidores ahora obtienen sus credenciales del entorno privado mediante `scripts/lib/qa-credentials.mjs`. La plantilla `.env.example` documenta las cuatro variables de cuenta con valores vacíos. El script de preparación valida las cuentas antes de conectarse y sus mensajes omiten las contraseñas.

Las comprobaciones locales aprobaron 11 pruebas unitarias, 13 RTL y 15 simulaciones de reversión. También se verificaron variables ausentes, lectura de credenciales ficticias por rol y compatibilidad de los consumidores, sin red. El escaneo de los archivos previstos para publicación, incluido el contenido XML de las matrices, no encontró los valores antiguos ni coincidencias con secretos locales. Las siete capturas manuales originales se conservan fuera de la selección prevista para el commit. CA-15 conserva PASS y los casos manuales siguen pendientes en las matrices.
