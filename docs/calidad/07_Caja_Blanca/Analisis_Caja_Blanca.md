# Análisis de caja blanca de MASA MOTOS

Los 11 casos se ejecutaron con Vitest y pasaron. Se revisaron las decisiones del código y se contrastaron con la [ejecución por caso](../06_Pruebas_Unitarias/resultados-vitest.json) y el [resumen de cobertura V8](../06_Pruebas_Unitarias/cobertura-v8-resumen.json).

## 1. Cálculo de totales

`calculateTotals` en `src/lib/sale-calc.ts` respalda **SWR-VEN-003**. La función acumula el importe de cada línea, normaliza el descuento, elige el cálculo porcentual o fijo y aplica el IVA sobre el subtotal descontado cuando está habilitado.

| Decisión | Entrada y camino ejecutado | Resultado comprobado | Prueba |
| --- | --- | --- | --- |
| Usar un descuento positivo o sustituirlo por cero | Descuentos finitos y positivos de 10 %, 10.000 y 60.000 COP. Descuento de −10 % para recorrer el camino que usa cero. | Se usa el valor positivo según su modalidad. El valor negativo no incrementa el total. | UT-01 a UT-04 |
| Calcular por porcentaje o por importe fijo | Porcentaje en UT-01 y UT-04. Importe fijo en UT-02 y UT-03. | Descuento porcentual sobre el subtotal o descuento fijo en centavos. | UT-01 a UT-04 |
| Limitar el importe al subtotal | Subtotal de 50.000 COP con descuento de 10.000 o 60.000 COP. | En el segundo caso, el descuento se limita a 50.000 COP y el total es cero. | UT-02 y UT-03 |
| Aplicar IVA según configuración | Tasa de 19 % con IVA activo o inactivo. | Con IVA activo se calcula sobre el importe descontado. Con IVA inactivo, la tasa aplicada y el impuesto son cero. | UT-01 a UT-04 |

**Fronteras.** UT-04 recorre la normalización de un valor inferior a cero. UT-03 cruza el límite del subtotal y comprueba que el total quede en cero. Quedan pendientes el descuento exactamente cero, el importe fijo exactamente igual al subtotal, el porcentaje en 100 y por encima de 100, `NaN`, `Infinity` y los casos con fracciones de centavo.

**Cobertura observada.** V8 registró **8/8 ramas y 8/8 líneas** en el archivo. Los límites de `Math.min` se razonan por casos, ya que el contador no mide las decisiones internas de esa función. El cortocircuito por entrada no finita sigue sin ejercitarse aunque estén cubiertas ambas salidas del ternario. Probar solo la venta con descuento ordinario podría ocultar descuentos mayores que el subtotal o la aplicación de IVA cuando está deshabilitado.

## 2. Autorización por rol

`can` en `src/lib/permissions.ts` respalda **SWR-AUTH-006**. El primer control deniega si falta el rol. Con un rol presente, el resultado depende de su pertenencia a la lista de la operación.

| Decisión | Entrada y camino ejecutado | Resultado comprobado | Prueba |
| --- | --- | --- | --- |
| Rol ausente | `null` y `sales.create` | Denegado antes de consultar permisos. | UT-05 |
| Rol presente y autorizado | `SELLER` y `sales.create` | Permitido para vender. | UT-06 |
| Rol presente y excluido | `SELLER` y `products.manage` | Denegado para dar de alta un producto. | UT-07 |
| Otro rol autorizado para la misma función | `ADMIN` y `products.manage` | Permitido para dar de alta un producto. | UT-08 |

**Frontera.** UT-05 contrasta el rol ausente con los roles presentes. UT-07 y UT-08 cruzan la frontera de inclusión usando la misma operación. Pendientes el valor `undefined` como segunda representación de rol ausente y el resto de la tabla de permisos.

**Cobertura observada.** V8 registró **2/2 ramas y 3/3 líneas**. El guard de rol ausente se ejecutó una vez y el camino con rol presente se ejecutó tres veces. Los resultados verdadero y falso de `includes` se comprobaron por aserción. Un caso exitoso por sí solo podría ocultar que el vendedor recibe permisos de administración. La cobertura de este bloque no comprueba las rutas, las acciones del servidor ni RLS.

## 3. Validación del carrito

`saleSchema` en `src/lib/validation/schemas.ts` respalda **SWR-VEN-001**. La cantidad de líneas debe estar entre 1 y 200 y cada cantidad entre 1 y 1.000.000, como entero. Las decisiones se declaran en Zod y los casos observan la salida de `safeParse`.

| Decisión | Entrada y camino ejecutado | Resultado comprobado | Prueba |
| --- | --- | --- | --- |
| Aceptar el mínimo de líneas y unidades | Una línea con cantidad 1 y descuento omitido. | Acepta el objeto y asigna descuento cero. | UT-09 |
| Rechazar un carrito por debajo del mínimo de líneas | Cero líneas. | Error `emptyCart` en `items`. | UT-10 |
| Rechazar una línea por debajo del mínimo de unidades | Una línea con cantidad cero. | Error `positive` en `items[0].quantity`. | UT-11 |

**Fronteras.** Se probaron 0 y 1 tanto para líneas como para unidades. Quedan pendientes 200/201 líneas y 1.000.000/1.000.001 unidades, cantidades fraccionarias y entradas inválidas para otros campos.

**Cobertura observada.** Los tres caminos de la tabla pasaron. V8 registró **2/15 ramas y 30/42 líneas en el archivo completo**, que contiene otros esquemas y utilidades. La validación interna de Zod no figura como ramas de `saleSchema` en ese porcentaje. Probar únicamente el carrito válido podría ocultar que se acepte una venta vacía o una línea sin unidades. La interfaz del carrito y la persistencia de una venta se verificarán en sus fases.
