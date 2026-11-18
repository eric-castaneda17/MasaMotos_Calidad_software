# Pruebas unitarias de MASA MOTOS

Ejecutar desde la raíz del repositorio con las dependencias del archivo de bloqueo. La evidencia se obtuvo con Node.js 24.21.0 y Vitest 4.1.12.

```bash
npm ci
npm run test:unit
npm run test:unit:coverage
```

Para regenerar también el informe de casos en JSON:

```bash
npm run test:unit:coverage -- --reporter=default --reporter=json --outputFile.json=coverage/resultados-vitest.json
```

Vitest ejecuta tres archivos en el entorno Node. Cada caso prepara datos locales, llama a un módulo real y comprueba el resultado con Arrange–Act–Assert. La suite es independiente de Supabase y del navegador.

## Guion para la sustentación

| ID | SWR | Explicación |
| --- | --- | --- |
| UT-01 | SWR-VEN-003 | Tres unidades en dos líneas suman 50.000 COP. Se aplica primero el 10 % de descuento y luego el 19 % de IVA sobre 45.000 COP. El total esperado es 53.550 COP. |
| UT-02 | SWR-VEN-003 | Una venta de 50.000 COP tiene un descuento fijo de 10.000 COP. Aunque se recibe una tasa del 19 %, el IVA deshabilitado deja el total en 40.000 COP. |
| UT-03 | SWR-VEN-003 | Se intenta descontar 60.000 COP de un subtotal de 50.000 COP. La función limita el descuento a 50.000 COP y el total queda en cero. |
| UT-04 | SWR-VEN-003 | Un descuento negativo se trata como cero en la vista previa. El IVA se aplica sobre el subtotal completo y el total es 59.500 COP. |
| UT-05 | SWR-AUTH-006 | Un usuario sin rol no obtiene permiso para registrar ventas. |
| UT-06 | SWR-AUTH-006 | Un vendedor sí obtiene permiso para registrar ventas. |
| UT-07 | SWR-AUTH-006 | El vendedor no obtiene permiso para dar de alta productos. |
| UT-08 | SWR-AUTH-006 | El administrador sí obtiene el permiso que se denegó al vendedor en UT-07. |
| UT-09 | SWR-VEN-001 | Una sola línea de una unidad acepta el mínimo válido del esquema. Se comprueba además que el descuento omitido tome el valor cero. |
| UT-10 | SWR-VEN-001 | Un carrito vacío produce `emptyCart` en `items`. Comprobamos el lugar y el motivo del rechazo. |
| UT-11 | SWR-VEN-001 | Un carrito con una línea de cantidad cero produce `positive` en `items[0].quantity`. Así distinguimos una línea inválida de un carrito vacío. |

Para explicar un caso en vivo, mostrar primero sus datos, luego la llamada a la función y finalmente el valor de negocio que comprueba la aserción. Por ejemplo, UT-07 y UT-08 mantienen la misma operación y cambian el rol para demostrar ambos resultados de la autorización.

## Evidencia de ejecución

- [Resultados de Vitest por caso](resultados-vitest.json)
- [Resumen de cobertura por archivo](cobertura-v8-resumen.json)
- [Registro de comandos y salidas](comprobaciones.txt)
