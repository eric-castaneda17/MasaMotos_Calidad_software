# Revisión de cierre documental de Fase 5

Revisión del 18 de noviembre de 2026. Rama local `feature/evaluacion-iso25010`, basada en `713b04e`. Los entregables se encuentran físicamente dentro del repositorio `MasaMotos-Calidad`. Las carpetas temporales se utilizaron para generar y revisar vistas previas.

## Archivos finales y ubicación

Las rutas siguientes son relativas a la raíz del repositorio.

| Entregable | Ubicación |
| --- | --- |
| Informe formal | `docs/calidad/11_ISO_25010/Informe_Evaluacion_ISO25010.pdf` |
| Matriz ISO | `docs/calidad/11_ISO_25010/12_ISO25010.xlsx` |
| Registro de hallazgos | `docs/calidad/11_ISO_25010/11_Errores_Defectos_Fallas_Incidentes.xlsx` |
| Matriz maestra | `docs/calidad/Matriz_Maestra_Trazabilidad.xlsx` |
| Resumen de resultados | `docs/calidad/11_ISO_25010/README.md` |
| Referencias y evidencias | `docs/calidad/11_ISO_25010/Referencias_y_Evidencias.md` |
| Manifiesto SHA-256 | `docs/calidad/11_ISO_25010/evidencias/Manifiesto_Evidencias.json` |
| Diagnóstico administrativo previo | `docs/calidad/11_ISO_25010/evidencias/Diagnostico_Auth_Admin_2026-11-18.json` |
| Procedimiento exploratorio pendiente | `docs/calidad/11_ISO_25010/Procedimiento_Sesion_Exploratoria.md` |
| Procedimiento de mediciones pendiente | `docs/calidad/11_ISO_25010/Procedimiento_Mediciones_Rendimiento.md` |
| Esta revisión | `docs/calidad/11_ISO_25010/Revision_Cierre_Documental.md` |

## Transcripción exacta de la referencia de arquitectura

La guía original se consultó en `Downloads/ProyectoFinalCalidad2026.docx`, fuera del repositorio. La búsqueda en su texto encontró una única mención de NestJS y una única mención de Prisma, ambas en el mismo párrafo del punto 6.

> 6. Desarrollo con Vibe Coding
>
> • Arquitectura trabajada: Next.js + React + TypeScript en frontend; NestJS en backend; Prisma; PostgreSQL/Supabase.

Los párrafos inmediatamente siguientes dicen:

> • El frontend no debe conectarse directamente a la base de datos.
>
> • Usen variables de entorno y no suban secrets al repositorio.

**Interpretación textual.** NestJS y Prisma aparecen como referencia de la arquitectura trabajada en clase. La frase no contiene una imposición expresa como «deben usar NestJS y Prisma» ni los identifica como recomendaciones opcionales. Las restricciones siguientes sí usan formulaciones imperativas. Esta lectura no constituye una autorización docente de equivalencia arquitectónica. La correspondencia de Next.js con Server Actions y Supabase debe confirmarse con el profesor si es un criterio de aceptación del curso. Se conserva la arquitectura actual por instrucción del usuario.

## Exigencia exacta de exploración

En «15.1 Actividad obligatoria», el segundo numeral establece:

> 2. Realicen además una sesión de pruebas aleatorias/exploratorias sobre toda la aplicación.

La palabra «además» exige una actividad adicional a las pruebas planificadas. Toda la aplicación incluye los módulos que queden fuera del flujo principal. Debe registrarse el recorrido realizado y sus observaciones, con errores, comportamientos inesperados y mejoras vinculados a ISO conforme a los numerales 3 y 4. La inspección estática y los resultados de las suites no sustituyen esa sesión.

El [procedimiento exploratorio](Procedimiento_Sesion_Exploratoria.md) organiza doce recorridos por módulo, roles, datos, restricciones, evidencias y cierre. Coordina su ejecución posterior con los nueve BB restantes, manteniendo registros separados.

## Mediciones pendientes

El [procedimiento de rendimiento](Procedimiento_Mediciones_Rendimiento.md) define herramientas, límites de cada intervalo, muestreo propuesto, volumen y concurrencia, métricas y evidencias. Conserva los máximos del SRS para PERF-001 a PERF-005 y distingue el resultado de una muestra de una garantía global. La representación de las 2.000 motocicletas exige aclaración antes de declarar cobertura de capacidad.

Las propuestas de duración y muestreo no son mínimos del profesor. Los límites de aceptación proceden del SRS. La consolidación actual aporta confirmaciones manuales y lecturas SQL acotadas; no aprueba tiempos completos de UI ni carga.

## Consistencia y pendientes conservados

- Actualización de consolidación manual: ocho características PARCIAL y seguridad FALLA. Desempeño tiene medición SQL acotada, sin aprobar máximos UI ni capacidad. El PDF conserva la revisión inicial y no se regeneró.
- El registro mantiene 12 hallazgos. D-01 conserva la credencial administrativa rechazada; D-04 conserva la rotación de contraseñas históricas pendiente; D-11 conserva la verificación TLS desactivada del script heredado. Sus estados no se cierran por completar documentación.
- R-03 se conserva como riesgo Auth/perfil observado por inspección. No se declara una actualización parcial reproducida.
- CA-15 mantiene PASS y sus cinco evidencias reales. El anexo ISO de la matriz maestra no altera la hoja original ni sus cadenas BR - STK - SYS - SWR.
- Once casos completos satisfactorios fueron confirmados por el usuario. Once PASS con capturas parciales; BB-09/10 contrastados en lectura. BB-10 usó Consumidor final y BB-12 sigue pendiente. La exploración fue confirmada sin nuevos errores y sin detalle individualizado. Ver E22/E23.
- Los resultados históricos se conservan como 11 unitarias, 13 RTL, 8 API y 5 E2E aprobadas. Las 15 simulaciones del controlador se documentaron en la revisión anterior. No se reejecutaron suites contra Supabase.
- El diagnóstico E16 sigue identificado como una transcripción depurada de la consulta previa. No se realizó una nueva verificación remota.
- Las siete capturas originales continúan fuera de la selección documental y permanecen en el equipo.

## Decisión de cierre parcial

La parte documental puede guardarse mediante un commit local después de revisar su selección explícita. La revisión histórica se conserva en Git. Shift Right y CI local ya se completaron en sus respectivos alcances. Shift Right y CI local ya tienen sus evidencias. GitHub Actions remoto, seguridad y las limitaciones prácticas de E22/E23 siguen visibles.

El cierre integral queda condicionado a resolver o aceptar expresamente las limitaciones de metadatos exploratorios, evaluación y evidencia. Un commit documental no representa el cumplimiento de esas actividades.
