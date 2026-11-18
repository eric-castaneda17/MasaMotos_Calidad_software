# Fase 6 · Shift Right y logs

**Fase 6 completada en el alcance de Shift Right, con limitaciones y pendientes conservados.** Rama local `feature/shift-right-observabilidad` desde 0dce1715. El mecanismo está implementado y se comprobó con pruebas aisladas y un servidor compilado local.

## Requisitos exactos del profesor

La guía ProyectoFinalCalidad2026.docx se consultó en Downloads. El punto 18 exige registros útiles del backend durante ejecución.

El punto 18.1 establece estos registros mínimos:

> • Inicio de la aplicación.
>
> • Inicio de sesión correcto y fallido sin registrar contraseñas.
>
> • Operación crítica del flujo principal.
>
> • Validación rechazada.
>
> • Excepción/error.
>
> • Duración o tiempo de una operación relevante, cuando sea posible.

Su regla de privacidad dice:

> Privacidad de logs. No registren contraseñas, tokens, secretos, tarjetas ni información sensible innecesaria.

El punto 18.2 indica:

> Desplieguen o ejecuten el MVP en un ambiente de prueba y realicen al menos cinco escenarios mientras revisan los logs.

La tabla señala flujo principal correcto, credencial incorrecta, dato inválido, error provocado/controlado y operación relevante con duración. También pide extractos depurados y una explicación de lo aprendido.

La matriz incluye esos objetivos y añade inicio y denegación de acceso. El rechazo por stock se conserva como escenario de dominio adicional.

## Entregables

- [Informe formal](Informe_Shift_Right.pdf).
- [Matriz de escenarios, catálogo y hallazgos](Matriz_Escenarios_Logs.xlsx).
- [Documentación técnica](Documentacion_Tecnica.md).
- [Procedimiento y autorización de escenarios](Procedimiento_Escenarios.md).
- [Incidentes y pendientes](Incidentes_y_Pendientes.md).
- [Resultados reales locales](evidencias/resultados-locales.json) y [eventos reales locales](evidencias/eventos-reales-locales.jsonl).
- [Resultados del mecanismo](evidencias/resultados-observabilidad.json) y [eventos con dependencias simuladas](evidencias/eventos-simulados.jsonl).
- [Compilación](evidencias/compilacion.txt), [comprobaciones](evidencias/comprobaciones.json) y [manifiesto](evidencias/Manifiesto_Shift_Right.json).

## Resultados y límites

La ejecución inicial sin escrituras comprobó APPLICATION_STARTED, ACCESS_DENIED y AUTH_VALIDATION_REJECTED en el servidor real local. Posteriormente, la sesión académica autorizada comprobó SR-01, SR-07, SR-03, SR-04 y SR-05 con el servidor de producción local y el Supabase académico. El runner de solo lectura conserva su alcance original.

Las 25 pruebas nuevas comprueban formato, privacidad, niveles, correlación y funcionamiento ante fallos del destino, además de las acciones reales con Supabase simulado. Una emisión simulada de SALE_CREATED no acredita una venta en el proyecto académico.

Las regresiones comprobaron 11 unitarias, 13 RTL y 15 simulaciones del controlador de reversión. ESLint, TypeScript y la compilación final finalizaron correctamente. La compilación inicial tuvo un EPERM de sandbox y se repitió con autorización de ejecución local.

Se completaron los cinco objetivos de 18.2: credencial incorrecta (SR-01), flujo principal (SR-03), dato inválido (SR-06), error controlado (SR-05) y duración de operación relevante (SR-03). También se observaron login correcto y rechazo por stock. Se crearon solo dos ventas autorizadas del lote QA_SR-MWMKXTFW: venta 94/factura MM-000093 y venta 95/factura MM-000094. La duración registrada de la primera acción fue 382.91 ms. No se repitieron CA-15 ni suites ajenas a esta actividad.

## Interpretación de los eventos observados

ACCESS_DENIED se produjo con redirección HTTP 307 a signin y motivo técnico unauthorized. El evento confirma la ejecución del control del proxy sin incluir ruta, cookie ni cuenta.

AUTH_VALIDATION_REJECTED confirmó que un formulario inválido terminó en la validación local de servidor. Su duración corresponde a ese rechazo, sin atribuir tiempos de consulta ni de venta.

SALE_STOCK_REJECTED y ACTION_REJECTED reales comparten correlación y disponibilidad 0. La consulta final encontró únicamente las dos ventas autorizadas, con dos líneas, dos movimientos SALE y dos facturas. La aserción visual del toast de SR-04 expiró por buscar role=alert en un contenedor role=status; el resultado de observabilidad se validó mediante logs y datos, sin repetir ventas.

SR-05 bloqueó localmente una solicitud create_sale antes del envío y produjo ACTION_ERROR/ERROR y mensaje visible. El stock, ventas, líneas, movimientos, facturas y consecutivo 95 coincidieron antes y después del bloqueo. No se provocó una caída remota ni se acreditan métricas estadísticas de rendimiento.

El fallo inicial de SR-01 estaba en el selector global role=alert, que coincidía con el formulario y next-route-announcer. Se limitó al formulario. También se corrigieron únicamente en el verificador temporal la búsqueda sintética con guion bajo y el selector del toast. Los intentos interrumpidos se conservan en executionHistory; consolidatedResults contiene el resultado definitivo.

## Historial y privacidad

CA-15 mantiene PASS. Los datos sintéticos creados se conservaron; los productos reservados se verificaron sin cambios en la sesión final. No se modificaron funciones SQL, políticas, esquema ni contraseñas. El bloqueo local se retiró y el servidor temporal se cerró. Los manuales, exploración y rendimiento conservan sus pendientes. Los hallazgos administrativos y de TLS siguen abiertos. R-12 se mitiga únicamente en runAction y no se declara resuelto globalmente.

La hoja original de la matriz maestra se conserva y se añade un anexo Shift Right. Los manifiestos de Fase 5 son fotografías de sus versiones de fuente revisadas. El nuevo manifiesto identifica las fuentes modificadas para Fase 6.

Los reportes excluyen valores de entorno, cuentas, cuerpos, contraseñas, tokens y cookies. Las correlaciones UUID se generan por operación y no identifican a una persona. Las siete capturas manuales continúan fuera de esta entrega.

## Archivos de implementación y pruebas

| Archivo | Cambio |
| --- | --- |
| src/lib/observability/logger.ts | Catálogo, selección de metadatos, correlación, duración y destino tolerante a fallos. |
| src/instrumentation.ts | Inicio de instancia y hook de errores de servidor de Next.js. |
| src/lib/actions/auth.ts | Eventos de login, validación, cuenta inactiva y error. |
| src/lib/actions/sales.ts | Eventos de validación, stock insuficiente y éxito del RPC con duración. |
| src/lib/actions/helpers.ts | Eventos controlados y sustitución de la salida de errores completos de runAction. |
| src/lib/actions/users.ts | Estado técnico depurado del rechazo administrativo, conservando respuesta pública. |
| src/lib/auth/dal.ts | Denegación de acceso y contexto compartido cuando lo proporciona la acción. |
| src/proxy.ts | Denegación de ruta sin sesión. |
| vitest.config.mts | Proyecto observability separado de las 11 unitarias y 13 RTL. |
| docs/calidad/12_Shift_Right/logger.test.ts | 14 pruebas del mecanismo y su privacidad. |
| docs/calidad/12_Shift_Right/actions.test.ts | 11 pruebas de acciones con dependencias simuladas. |
| docs/calidad/12_Shift_Right/server-only.ts | Marca de prueba para importar módulos de servidor en Node. |
| scripts/qa-shift-right-readonly.mjs | Runner de los tres escenarios reales locales sin cuentas ni ventas. |
| docs/calidad/Matriz_Maestra_Trazabilidad.xlsx | Anexo Shift Right, con hojas previas conservadas. |
