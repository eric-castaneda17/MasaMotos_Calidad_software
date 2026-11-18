# Pruebas de frontend de MASA MOTOS

Ejecutar desde la raíz del repositorio con las dependencias del archivo de bloqueo. La evidencia se obtuvo con Node.js 24.21.0 y Vitest 4.1.12.

```bash
npm ci
npm run test:rtl
npm run test:unit
```

Para regenerar el informe JSON de la fase:

```bash
npm run test:rtl -- --reporter=verbose --reporter=json --outputFile.json=docs/calidad/08_RTL/resultados-vitest.json
```

La suite monta el formulario de acceso y la pantalla del punto de venta, incluidos sus componentes hijos, con las traducciones en español y el proveedor de avisos de la aplicación. jsdom aloja el DOM. Las acciones de servidor y la navegación se simulan, por lo que las pruebas comprueban la respuesta visible de la interfaz a cada escenario. La persistencia, Supabase Auth y la apertura real de rutas se comprobarán en fases posteriores.

| Caso | SWR y criterio | Comportamiento visible |
| --- | --- | --- |
| RTL-01 | SWR-AUTH-002 · CA-01 | El error de formato queda asociado al campo y se conserva el correo digitado. |
| RTL-02 | SWR-AUTH-002 · CA-01 | El formulario muestra un rechazo genérico y no señala un campo concreto. |
| RTL-03 | SWR-AUTH-004 · CA-02 | Una respuesta de cuenta inactiva muestra el aviso correspondiente. |
| RTL-04 | SWR-AUTH-002 · CA-01 | Mientras se procesa el envío, aparece el estado de carga y el botón bloquea un segundo envío. |
| RTL-05 | SWR-BUS-005 · CA-07 | Una referencia sin coincidencias sustituye el resultado anterior por un aviso. |
| RTL-06 | SWR-BUS-003 · CA-05 | El resultado muestra los seis datos exigidos y un repuesto agotado no se puede agregar. |
| RTL-07 | SWR-VEN-001 · CA-08 | El carrito vacío tiene un estado visible y no permite confirmar. |
| RTL-08 | SWR-VEN-001 · CA-08 | Se agregan dos repuestos y se puede cambiar la cantidad de uno sin alterar la del otro. |
| RTL-09 | SWR-VEN-002 · CA-09 | Al escribir cuatro con saldo tres, se limita la cantidad y se informa la disponibilidad. |
| RTL-10 | SWR-VEN-002 · CA-09 | Al llegar al límite se bloquean los controles y al disminuir la cantidad se habilitan de nuevo. |
| RTL-11 | SWR-VEN-003 · CA-10 | Dos unidades con descuento del 10 % e IVA del 19 % muestran un total de 53.550 COP. |
| RTL-12 | SWR-CPB-001 · CA-12 | Una confirmación exitosa muestra el número de factura y habilita la acción para abrirla. |
| RTL-13 | SWR-VEN-002 · CA-09 | Un rechazo simulado por stock insuficiente muestra el saldo informado y conserva el carrito. |

### Evidencia y sustentación

- [Resultados JSON de Vitest](resultados-vitest.json)
- [Comandos y salidas de verificación](comprobaciones.txt)
- [Explicación línea por línea de tres casos](Sustentacion_RTL.md)
