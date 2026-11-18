# Referencias y evidencias

La guía original se encontró en Downloads, fuera del repositorio. Se revisaron sus puntos 15 a 17, 20 y 22. La huella de ese archivo externo permite identificar la versión consultada.

## Fuentes técnicas

- **N01** · ISO/IEC 25010:2023, segunda edición, noviembre de 2023. [ISO/IEC 25010:2023, segunda edición, noviembre de 2023](https://committee.iso.org/standard/78176.html)
- **N02** · Vista pública de la adopción GSO, que reproduce la edición ISO de 2023. [Vista pública de la adopción GSO, que reproduce la edición ISO de 2023](https://gso-sims-preview-doc-aws.s3-eu-west-1.amazonaws.com/gso-iso-iec-25010-2025-en.html)
- **N03** · Supabase Auth Admin y administración de usuarios. [Supabase Auth Admin y administración de usuarios](https://supabase.com/docs/guides/auth/users)
- **N04** · GitHub y retirada de secretos publicados. [GitHub y retirada de secretos publicados](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

La ficha ISO confirma la edición y las nueve características. La vista GSO adopta la edición ISO de 2023 y permite contrastar su terminología. Las definiciones aquí son resúmenes y las evaluaciones son juicios del proyecto.

## Fuentes del proyecto

| ID | Fuente | Ruta o documento | Alcance |
| --- | --- | --- | --- |
| E01 | SRS original v0.2 | [docs/calidad/SRS_Masa_Motos_v0.2.pdf](../SRS_Masa_Motos_v0.2.pdf) | Identificadores y texto de los requisitos. El alcance conserva 15 SWR. |
| E02 | Alcance y matriz maestra | [docs/calidad/01_Alcance_y_Trazabilidad.xlsx](../01_Alcance_y_Trazabilidad.xlsx) | Cadenas originales y propuestas. Se conserva la condición Propuesta de los vínculos inferidos. |
| E03 | Unitarias | [docs/calidad/06_Pruebas_Unitarias/resultados-vitest.json](../06_Pruebas_Unitarias/resultados-vitest.json) | 11 casos PASS históricos. Cálculos, permisos y validación del carrito. |
| E04 | Caja blanca y cobertura | [docs/calidad/07_Caja_Blanca/Analisis_Caja_Blanca.md](../07_Caja_Blanca/Analisis_Caja_Blanca.md) | Tres bloques. Cobertura acotada al código instrumentado, con fronteras pendientes. |
| E05 | RTL | [docs/calidad/08_RTL/resultados-vitest.json](../08_RTL/resultados-vitest.json) | 13 casos PASS históricos con acciones de servidor simuladas. |
| E06 | Postman/Newman | [docs/calidad/09_Postman/resultados-newman.json](../09_Postman/resultados-newman.json) | 8 casos PASS, 63 aserciones en 31 solicitudes. Incluye controles persistentes. |
| E07 | Playwright | [docs/calidad/10_Playwright/resultados-playwright.json](../10_Playwright/resultados-playwright.json) | 5 escenarios PASS tras re-tests. El navegador configurado es Edge. |
| E08 | Reversión CA-15 | [docs/calidad/10_Playwright/evidencias-reversion/CA15-20261118174028/REL-001-05-resumen.json](../10_Playwright/evidencias-reversion/CA15-20261118174028/REL-001-05-resumen.json) | Ejecución real única. Error final 23505 y estado inicial/final idéntico. Cinco JSON originales. |
| E09 | Incidencias de Fase 4 | [docs/calidad/10_Playwright/Registro_Fase_4.md](../10_Playwright/Registro_Fase_4.md) | QA-F4-01 a QA-F4-04 y retirada de contraseñas. El historial se conserva. |
| E10 | Actualización de usuarios | [src/lib/actions/users.ts](../../../src/lib/actions/users.ts) | Auth se actualiza antes del perfil. No existe transacción conjunta de ambos servicios. |
| E11 | Errores del servidor | [src/lib/actions/helpers.ts](../../../src/lib/actions/helpers.ts) | Mensaje genérico y salida de errores no reconocidos. No demuestra filtración real. |
| E12 | Preparación de Supabase | [scripts/supabase-setup.mjs](../../../scripts/supabase-setup.mjs) | TLS con rejectUnauthorized=false en el script heredado. Inspección estática. |
| E13 | Consultas paginadas | [src/lib/data/products.ts](../../../src/lib/data/products.ts) | Paginación, orden y filtros. PAGE_SIZE=10 en pagination.ts. No hay mediciones de carga. |
| E14 | Credenciales privadas | [scripts/lib/qa-credentials.mjs](../../../scripts/lib/qa-credentials.mjs) | Variables requeridas por rol. Retirada de valores literales en 713b04e. Rotación pendiente. |
| E15 | Guía del profesor externa | Fuera del repositorio / Downloads / ProyectoFinalCalidad2026.docx | Localizada fuera del repositorio. Puntos 15 a 17, 20 y 22 aplicables a esta entrega. |
| E16 | Diagnóstico previo de Auth Admin | [docs/calidad/11_ISO_25010/evidencias/Diagnostico_Auth_Admin_2026-11-18.json](evidencias/Diagnostico_Auth_Admin_2026-11-18.json) | Transcripción depurada del resultado real de lectura de esta sesión. No es una nueva ejecución. |
| E17 | Punto de venta | [src/components/pos/PosScreen.tsx](../../../src/components/pos/PosScreen.tsx) | Límite de cantidades, avisos, confirmación y conservación del carrito ante rechazo. |
| E18 | Formulario de usuarios | [src/components/users/UserManager.tsx](../../../src/components/users/UserManager.tsx) | Campo de contraseña opcional en edición. Validación en schemas.ts. |
| E19 | Comprobaciones Fase 4 | [docs/calidad/10_Playwright/comprobaciones.txt](../10_Playwright/comprobaciones.txt) | Salidas archivadas de unitarias, RTL, lint, TypeScript y compilación. Resultados históricos. |
| E20 | Caja negra pendiente | [docs/calidad/04_Matriz_Pruebas.xlsx](../04_Matriz_Pruebas.xlsx) | 12 casos pendientes en matriz. Tres reportados por el usuario con capturas aún sin aprobación. |
| E21 | Seguridad y transacción | [supabase/migrations/003_functions.sql](../../../supabase/migrations/003_functions.sql) | create_sale y guardas de inventario. RLS y autorización en 002_security.sql. |

## Interpretación de la evidencia

- Los resultados de las suites conservan sus ejecuciones anteriores. Esta fase no generó nuevos resultados de pruebas funcionales.
- E16 registra el GET administrativo que devolvió 401 en el diagnóstico previo. El resultado original proviene de la conversación y fue transcrito con su procedencia. No representa una captura de red ni un nuevo re-test.
- El mensaje al guardar contraseña fue reportado por el usuario. Su transformación a errors.generic se confirmó en código. No se demostró que el intento de escritura completara una actualización parcial.
- La recuperación de ventas CA-15 y el riesgo Auth/perfil pertenecen a operaciones diferentes. CA-15 mantiene PASS.
- La inspección de las fuentes no se contabiliza como la sesión exploratoria requerida por el profesor.
- Las tres pruebas manuales reportadas y las nueve pendientes conservan PENDIENTE en la matriz hasta revisar o completar su evidencia.
- Las mediciones de carga, accesibilidad, disponibilidad y resistencia no se ejecutaron. NO EVALUADA no significa un resultado de desempeño desfavorable.

El manifiesto registra SHA-256 de las fuentes revisadas. Se excluyen archivos privados, valores de entorno y las capturas manuales.

## Preparación del cierre parcial

- [Revisión documental y transcripción de la guía](Revision_Cierre_Documental.md).
- [Sesión exploratoria pendiente](Procedimiento_Sesion_Exploratoria.md).
- [Mediciones pendientes](Procedimiento_Mediciones_Rendimiento.md).

Los procedimientos son planes para actividades futuras. Sus recorridos, tamaños de muestra y nombres de archivo no representan ejecuciones ni resultados.

Las referencias técnicas del procedimiento de rendimiento se consultaron el 18 de noviembre de 2026. La documentación de k6 permite distinguir las métricas HTTP de los intervalos completos del navegador. La documentación de DevTools describe la exportación HAR depurada, que aun así exige revisar cuerpos y URLs antes de incluirla en el dossier.

- [Grafana k6, métricas integradas](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/).
- [Grafana k6, umbrales](https://grafana.com/docs/k6/latest/using-k6/thresholds/).
- [Chrome DevTools, registros de red](https://developer.chrome.com/docs/devtools/network/reference/).
