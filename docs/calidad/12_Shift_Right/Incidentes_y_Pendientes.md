# Hallazgos y pendientes de Fase 6

Este registro complementa los 12 hallazgos de Fase 5. Sus estados históricos se conservan en el commit 0dce1715. Los cambios siguientes se refieren únicamente al alcance comprobado en esta fase.

| ID | Situación y clasificación | Estado y evidencia | Acción |
| --- | --- | --- | --- |
| R-12 | Riesgo de registrar errores completos en runAction. | MITIGACIÓN PARCIAL VERIFICADA. runAction ahora emite ACTION_ERROR con campos acotados. LOG-05 y SIM-07/SIM-10 comprobaron ausencia de datos ficticios sensibles en los registros. | Mantener pendiente la revisión de otras salidas preexistentes, como la carga de imágenes y el error de PDF del cliente. |
| D-01 | Credencial administrativa rechazada. | ABIERTO / APLAZADO. ADMIN_AUTH_ERROR agrega estado técnico cuando la operación se ejecuta, pero no corrige la clave. No se realizó una llamada real a Auth Admin en esta fase. | Corrección privada por el responsable y re-test autorizado posterior. |
| D-02 | Mensaje genérico del módulo Usuarios. | ABIERTO. Se mejora la señal del servidor, conservando el mensaje público y sin atribuir un re-test de actualización de contraseña. | Revisar por separado la comunicación al usuario. |
| D-04 | Contraseñas históricas en Git. | ROTACIÓN PENDIENTE. Se mantiene el uso de variables privadas. | Rotar manualmente antes de publicar según la revisión de seguridad acordada. |
| D-11 | TLS desactivado en script heredado. | ABIERTO. No se ejecutó ni corrigió supabase-setup.mjs en esta fase. | Corregir posteriormente con CA verificada. |
| R-03 | Posible actualización parcial Auth/perfil. | RIESGO ABIERTO. No se reprodujo ni se modificó el diseño de esa operación. | Diseñar recuperación en una actividad posterior. |
| SR-I-01 | TypeScript detectó que error.status podía estar ausente. Defecto de implementación detectado durante desarrollo. | CORREGIDO / RE-TEST. Se normalizó el valor ausente. Compilación y TypeScript finales aprobaron. | Conservar el guard y su tipado. |
| SR-I-02 | La primera compilación falló con EPERM al crear tipos en .next. Incidente de ejecución local. | RESUELTO PARA LA COMPROBACIÓN. La compilación autorizada fuera del sandbox finalizó con código 0. No fue una falla funcional de MASA MOTOS. | Conservar la salida final y la limitación del ambiente. |
| SR-P-01 | Escenarios reales con sesión y venta. | COMPLETADO EN ALCANCE AUTORIZADO. Cinco objetivos de 18.2 comprobados, con dos ventas del lote QA_SR-MWMKXTFW y un bloqueo local anterior al envío. | Conservar logs, resultados consolidados y estados. No repetir operaciones confirmadas. |
| SR-I-03 | Fallos del verificador del navegador. | DIAGNOSTICADOS. SR-01: alerta global ambigua con next-route-announcer. Búsqueda sintética: normalización del guion bajo. Toast: role=status. Correcciones solo en el verificador temporal. | Conservar intentos interrumpidos. SR-04 se validó por logs y datos; su aserción visual sigue sin acreditarse. |

La sesión académica autorizada posterior completó los cinco objetivos de operación requeridos por la guía. El fallo controlado se bloqueó antes del envío y no representa una caída de Supabase ni una nueva prueba de atomicidad. CA-15 conserva PASS. Los datos de prueba creados se conservaron y los reservados se verificaron sin cambios en la sesión final. La sesión exploratoria, los manuales y el rendimiento siguen pendientes en sus instrumentos originales.
