# Fase 5 · Evaluación ISO/IEC 25010:2023

**Estado documental preparado para revisión.** El cumplimiento integral de la actividad permanece pendiente de la sesión exploratoria y de las comprobaciones manuales. La rama local feature/evaluacion-iso25010 parte de 713b04e.

## Entregables

- [Informe formal en PDF](Informe_Evaluacion_ISO25010.pdf), con nueve características, criterios, mecanismos, evidencias, resultados, limitaciones y recomendaciones.
- [Matriz de evaluación](12_ISO25010.xlsx), con las seis columnas solicitadas en el punto 15.2 y hojas de criterios, método, evidencias, guía y referencias.
- [Registro de hallazgos](11_Errores_Defectos_Fallas_Incidentes.xlsx), con 12 registros, clasificación causal, reproducción, severidad, prioridad, estado y re-test.
- [Matriz maestra](../Matriz_Maestra_Trazabilidad.xlsx), con un anexo Evaluación ISO asociado a los 15 SWR. La hoja original conserva todas sus celdas y resultados.
- [Fuentes y límites de la evidencia](Referencias_y_Evidencias.md) y [manifiesto de huellas](evidencias/Manifiesto_Evidencias.json).
- [Revisión de cierre documental](Revision_Cierre_Documental.md), con rutas finales y transcripción exacta de la guía.
- [Procedimiento exploratorio pendiente](Procedimiento_Sesion_Exploratoria.md), coordinado con los BB restantes.
- [Procedimiento de rendimiento pendiente](Procedimiento_Mediciones_Rendimiento.md), con métricas, máximos del SRS y evidencias futuras.

Los nombres 11_Errores_Defectos_Fallas_Incidentes.xlsx y 12_ISO25010.xlsx proceden de la estructura recomendada del profesor. Se ubican en la carpeta de Fase 5 solicitada por el usuario.

## Resultado de las nueve características

| Característica | Resultado |
| --- | --- |
| Adecuación funcional / Functional suitability | PARCIAL |
| Eficiencia de desempeño / Performance efficiency | NO EVALUADA |
| Compatibilidad / Compatibility | PARCIAL |
| Capacidad de interacción / Interaction capability | PARCIAL |
| Fiabilidad / Reliability | PARCIAL |
| Seguridad / Security | FALLA |
| Mantenibilidad / Maintainability | PARCIAL |
| Flexibilidad / Flexibility | PARCIAL |
| Seguridad frente a daños / Safety | PARCIAL |

La escala categórica usa CUMPLE, PARCIAL, FALLA y NO EVALUADA, con NO APLICA solo para criterios excluidos y justificados. No se calcula una nota global. Siete características son parciales, una tiene falla en criterios de seguridad y una queda sin evaluar por falta de medición.

Los mecanismos de cada característica están identificados, aunque su existencia no prueba por sí sola un nivel de calidad. El SRS incluye límites de búsqueda y venta en SWR-PERF-001/002/003, fuera de los 15 seleccionados. Se citan como referencia y quedan pendientes de medición.

## Defectos y riesgos abiertos

- D-01 y D-02 documentan el 401 de Auth Admin y el mensaje genérico del formulario. SWR-USR-006 pertenece al SRS original y queda fuera de los 15 SWR seleccionados.
- R-03 identifica la posible actualización parcial Auth/perfil mediante inspección. No se afirma que sucediera en el incidente.
- D-04 conserva la exposición histórica y su mitigación en código. QA_ADMIN_PASSWORD y QA_SELLER_PASSWORD siguen pendientes de rotación.
- D-11 registra rejectUnauthorized=false en el script heredado de preparación. Los runners de CA-15 sí verifican TLS. La corrección no se implementó en esta fase.
- R-12 registra el riesgo de incluir datos innecesarios en errores de consola, sin afirmar una filtración observada.
- D-05, D-06 e I-08 conservan los re-tests automatizados aprobados. I-07 sigue mitigado con localhost y con causa raíz pendiente.

## Pendientes para el cierre

1. Corregir SUPABASE_SERVICE_ROLE_KEY y rotar las dos contraseñas QA cuando el responsable retome la revisión de seguridad. El aplazamiento fue indicado expresamente por el usuario.
2. Revisar evidencia de BB-01, BB-02 y BB-03. Ejecutar personalmente los nueve casos restantes en la etapa final.
3. Realizar y documentar una sesión exploratoria sobre toda la aplicación, exigida por el punto 15.1.2. Registrar duración real, ambiente, recorridos, datos y hallazgos. Mantenerla diferenciada de los casos BB.
4. Revisar las recomendaciones de carga, navegadores, accesibilidad y recuperación sin atribuirles resultados inexistentes.
5. Confirmar con el docente la correspondencia de la arquitectura autorizada Next.js/Supabase con la arquitectura trabajada citada en el punto 6. La lectura literal de esa frase presenta NestJS/Prisma como referencia de clase, sin imponerlos expresamente ni declararlos recomendaciones opcionales. La revisión de cierre conserva la transcripción.
6. Conservar pendientes el push y el Pull Request de Fase 4. Shift Right y GitHub Actions se abordarán en fases posteriores.

## Preparación de la sesión exploratoria pendiente

El equipo debe recorrer acceso y cierre de sesión, usuarios, productos, categorías, clientes, proveedores, venta, factura, inventario, reportes y configuración. Para cada módulo debe registrar rutas visitadas, datos académicos usados, comportamiento observado y hallazgo o ausencia de hallazgo. Las operaciones con efectos necesitan una autorización y una ventana propias. La presente revisión no ejecutó esos recorridos.

## Alcance de esta entrega

Se utilizaron fuentes ya existentes y revisión estática. CA-15 mantiene PASS. Las 12 filas manuales siguen PENDIENTE. Se conservaron las siete capturas originales fuera de esta carpeta. No hubo conexiones ni escrituras en Supabase, cambios de credenciales, modificaciones funcionales, commits, push ni Pull Requests.
