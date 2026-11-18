# API Testing de MASA MOTOS

Importe la colección y el entorno JSON incluidos en esta carpeta. El entorno exportado contiene nombres de variables y valores vacíos. La ejecución recomendada usa Newman y el mismo archivo de colección. El runner carga los valores en memoria, obtiene una sesión real de vendedor con el cliente SSR de Supabase para el endpoint de Next.js y escribe un reporte con estados HTTP y nombres de aserciones. Los cuerpos, encabezados de sesión y tokens quedan fuera del reporte.

## Repetición

1. Instale las dependencias del archivo de bloqueo y arranque la aplicación local de QA.
2. Configure `QA_SUPABASE_REF` con la referencia aprobada y `QA_APP_URL` con la URL local. Para preparar datos con PostgreSQL, defina `QA_DB_CA_FILE` con la CA oficial descargada. Use `npm run qa:check` para cotejar el destino y registrar el estado de solo lectura.
3. Con el alcance de escritura comunicado y revisado, defina `QA_ALLOW_WRITES=1`. Ejecute `npm run qa:prepare` para crear un lote nuevo. Cada repetición de la colección consume stock de ese lote.
4. Ejecute `npm run test:api:qa`. Revise los ocho casos en `resultados-newman.json` si la ejecución completa generó el informe. En un fallo anterior a las peticiones, use el diagnóstico de la etapa que imprime el runner.

Para ejecutar en Postman de escritorio, cargue las URLs, el prefijo y los IDs del lote en valores locales privados. Use la clave pública del proyecto y un vendedor de QA; API-01 obtiene el JWT de sesión. Para API-07 conserve la sesión de vendedor en un valor local privado y desactive el envío automático de cookies para la variante anónima. Los demás casos de Next.js quedan fuera de esta colección. Los datos administrativos de PostgreSQL y la clave de servicio se usan únicamente en la preparación.

## Cobertura

API-01 y API-02 verifican Supabase Auth. API-03 consulta las tres fronteras de stock. API-04 y API-05 contrastan el estado antes y después de un rechazo de la función de venta. API-06 verifica importes, saldo, movimiento y comprobante persistidos. API-07 verifica el 401 anónimo y el 403 de vendedor en el endpoint Next.js. API-08 genera dos ventas en su propio fixture y contrasta comprobantes, importes y líneas.

Los rechazos de API-04 y API-05 ocurren antes de escribir. La reversión posterior a una escritura se detalla en el procedimiento pendiente de revisión.
