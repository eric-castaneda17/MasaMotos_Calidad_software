# Playwright E2E de MASA MOTOS

## Repetición

Instale las dependencias del archivo de bloqueo, tenga Microsoft Edge disponible y ejecute `npm run start -- --hostname localhost --port 3106`. Configure `QA_APP_URL=http://localhost:3106` y `QA_SUPABASE_REF` con el ambiente autorizado. Para preparar el lote, defina `QA_DB_CA_FILE` con la CA descargada del proveedor y use `npm run qa:check`. Tras delimitar las escrituras, configure `QA_ALLOW_WRITES=1` y ejecute `npm run qa:prepare` para disponer de datos frescos.

Los usuarios se pueden indicar mediante `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_SELLER_EMAIL` y `QA_SELLER_PASSWORD`. Si no se definen, el runner usa las cuentas de demostración ya configuradas por el guion anterior. Mantenga los valores fuera del historial y del dossier. Ejecute `npm run test:e2e:qa`. Para repetir un caso específico, use `npm run test:e2e:qa -- --grep E2E-02` con un fixture sin consumir de un lote nuevo.

Para renovar únicamente los fixtures E2E de un lote ya utilizado, ejecute `node scripts/qa-fixtures.mjs retest-e2e` con las mismas variables de preparación. Añade dos repuestos y cuatro clientes sintéticos y conserva los registros de los intentos previos.

Playwright genera HTML en `playwright-report/qa/` y JSON local en `.qa/playwright-resultados.json`. Las trazas de fallo para los dos recorridos principales quedan en `test-results/qa/`. Se inician después del acceso, con capturas y sin snapshots de red ni código adjunto. Antes de compartir un reporte o una traza, revise sus datos y conserve únicamente evidencia que no contenga secretos.

## Sustentación

### E2E-02 Venta de vendedor y movimiento visible

1. `signIn` abre el formulario real y espera que la ruta vuelva al panel. El acceso se realiza antes de iniciar la traza.
2. `selectCustomer` y `addProduct` encuentran al cliente y repuesto del caso por su identificación visible. La búsqueda usa el rol `searchbox` y el botón de resultado contiene la referencia.
3. El botón de aumento lleva la cantidad a 2 y el campo Porcentaje aplica el 10 %. La aserción de total espera 53.550 COP, resultado de 50.000 menos 5.000 más 8.550 de IVA.
4. `confirm` limita el segundo clic al diálogo. `invoice` lee el número de la confirmación, pulsa Ver factura y espera el encabezado con el mismo número.
5. El catálogo muestra saldo 8. El detalle del producto presenta una fila de movimiento vinculada al comprobante, de tipo Venta y por −2 unidades. Las aserciones esperan la actualización de la interfaz.

### E2E-03 Alta, duplicado y venta del stock exacto

1. El caso obtiene una sesión de administrador y construye una referencia del lote específica de esa ejecución.
2. `createProduct` localiza los campos por su etiqueta y selecciona la categoría del lote. Guarda con saldo 2 y espera el detalle identificado por el nombre del producto.
3. El mismo formulario se envía de nuevo con la misma referencia. La aserción espera el aviso de duplicado.
4. La venta agrega las dos unidades, comprueba la cantidad e invoca el mismo diálogo de confirmación. El detalle del comprobante se comprueba por su fila, precio unitario, fecha, vendedor, medio y total.
5. El catálogo presenta una sola referencia, saldo 0 y estado Agotado. La referencia exclusiva permite separar los datos de este caso de los otros recorridos.
