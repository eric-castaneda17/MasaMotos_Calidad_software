# Fase 5 · Evaluación ISO/IEC 25010:2023

**Evaluación actualizada con confirmaciones manuales y lecturas reales.** La revisión inicial de Fase 5 se conserva en su historial. Esta consolidación se realiza en feature/continuous-quality, sin commit ni ejecución manual por el agente.

## Entregables

- [Informe formal en PDF](Informe_Evaluacion_ISO25010.pdf): fotografía de la revisión inicial de Fase 5, conservada sin regenerar por instrucción del usuario. Los resultados actuales están en las matrices XLSX, este README y las evidencias E22/E23.
- [Matriz de evaluación](12_ISO25010.xlsx), con las seis columnas solicitadas en el punto 15.2 y hojas de criterios, método, evidencias, guía y referencias.
- [Registro de hallazgos](11_Errores_Defectos_Fallas_Incidentes.xlsx), con 12 registros, clasificación causal, reproducción, severidad, prioridad, estado y re-test.
- [Matriz maestra](../Matriz_Maestra_Trazabilidad.xlsx), con un anexo Evaluación ISO asociado a los 15 SWR. La hoja original conserva todas sus celdas y resultados.
- [Fuentes y límites de la evidencia](Referencias_y_Evidencias.md) y [manifiesto de huellas](evidencias/Manifiesto_Evidencias.json).
- [Revisión de cierre documental](Revision_Cierre_Documental.md), con rutas finales y transcripción exacta de la guía.
- [Procedimiento y confirmación exploratoria](Procedimiento_Sesion_Exploratoria.md), coordinado con los BB restantes.
- [Procedimiento de rendimiento pendiente](Procedimiento_Mediciones_Rendimiento.md), con métricas, máximos del SRS y evidencias futuras.

Los nombres 11_Errores_Defectos_Fallas_Incidentes.xlsx y 12_ISO25010.xlsx proceden de la estructura recomendada del profesor. Se ubican en la carpeta de Fase 5 solicitada por el usuario.

## Resultado de las nueve características

| Característica | Resultado |
| --- | --- |
| Adecuación funcional / Functional suitability | PARCIAL |
| Eficiencia de desempeño / Performance efficiency | PARCIAL |
| Compatibilidad / Compatibility | PARCIAL |
| Capacidad de interacción / Interaction capability | PARCIAL |
| Fiabilidad / Reliability | PARCIAL |
| Seguridad / Security | FALLA |
| Mantenibilidad / Maintainability | PARCIAL |
| Flexibilidad / Flexibility | PARCIAL |
| Seguridad frente a daños / Safety | PARCIAL |

La escala categórica usa CUMPLE, PARCIAL, FALLA y NO EVALUADA, con NO APLICA solo para criterios excluidos y justificados. No se calcula una nota global. Ocho características son parciales y seguridad conserva FALLA. Desempeño pasa a PARCIAL por mediciones SQL y logs de acción acotados; no se aprueban los tiempos completos de interfaz ni la capacidad del SRS.

Los mecanismos de cada característica están identificados, aunque su existencia no prueba por sí sola un nivel de calidad. El SRS incluye límites de búsqueda y venta en SWR-PERF-001/002/003, fuera de los 15 seleccionados. Se citan como referencia: SQL y acción de servidor tienen apoyo parcial; faltan intervalos UI, comprobante imprimible, carga y recursos.

## Defectos y riesgos abiertos

- D-01 y D-02 documentan el 401 de Auth Admin y el mensaje genérico del formulario. SWR-USR-006 pertenece al SRS original y queda fuera de los 15 SWR seleccionados.
- R-03 identifica la posible actualización parcial Auth/perfil mediante inspección. No se afirma que sucediera en el incidente.
- D-04 conserva la exposición histórica y su mitigación en código. QA_ADMIN_PASSWORD y QA_SELLER_PASSWORD siguen pendientes de rotación.
- D-11 registra rejectUnauthorized=false en el script heredado de preparación. Los runners de CA-15 sí verifican TLS. La corrección no se implementó en esta fase.
- R-12 registra el riesgo de incluir datos innecesarios en errores de consola, sin afirmar una filtración observada.
- D-05, D-06 e I-08 conservan los re-tests automatizados aprobados. I-07 sigue mitigado con localhost y con causa raíz pendiente.

## Pendientes para el cierre

1. Corregir SUPABASE_SERVICE_ROLE_KEY y rotar las dos contraseñas QA cuando el responsable retome la revisión de seguridad. El aplazamiento fue indicado expresamente por el usuario.
2. Se confirmaron once casos satisfactorios. Once PASS consolidados por confirmación completa del usuario. BB-09 y BB-10 contrastados mediante lecturas; BB-10 usó Consumidor final. La primera lectura era anterior a esas ventas. BB-12 pendiente. Capturas y confirmaciones están diferenciadas en resultados-manuales.json.
3. La sesión exploratoria fue confirmada por el usuario sin nuevos errores observados. Duración, entorno exacto y detalle por módulo no fueron proporcionados. Conservar esa limitación, sin repetir la sesión ni inventar registros.
4. Revisar las recomendaciones de carga, navegadores, accesibilidad y recuperación sin atribuirles resultados inexistentes.
5. Confirmar con el docente la correspondencia de la arquitectura autorizada Next.js/Supabase con la arquitectura trabajada citada en el punto 6. La lectura literal de esa frase presenta NestJS/Prisma como referencia de clase, sin imponerlos expresamente ni declararlos recomendaciones opcionales. La revisión de cierre conserva la transcripción.
6. Shift Right tiene evidencia real archivada. Continuous Quality aprobó localmente 64 pruebas y build; GitHub Actions remoto permanece PENDIENTE. Publicación y seguridad siguen sujetas a revisión.

## Registro de la sesión exploratoria confirmada

El equipo debe recorrer acceso y cierre de sesión, usuarios, productos, categorías, clientes, proveedores, venta, factura, inventario, reportes y configuración. Para cada módulo debe registrar rutas visitadas, datos académicos usados, comportamiento observado y hallazgo o ausencia de hallazgo. Las operaciones con efectos necesitan una autorización y una ventana propias. El usuario confirmó la sesión, pero no individualizó sus recorridos. El agente no los ejecutó.

## Alcance de esta entrega

Se reutilizaron evidencias y confirmaciones del usuario. CA-15 mantiene PASS. Se efectuaron únicamente lecturas SQL para contrastar datos y medir consultas; no hubo escrituras, ventas nuevas, cambios de credenciales ni modificaciones funcionales. Los originales de capturas se conservaron y se depuraron copias. No se generaron PDF ni se realizaron commits, push o Pull Requests.
