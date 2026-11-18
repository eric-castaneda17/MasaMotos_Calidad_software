# Sustentación de pruebas de frontend

## Qué monta el entorno

En [renderApp.tsx](renderApp.tsx), la línea 1 importa `render` de RTL. La 2 carga el proveedor de traducciones, la 3 tipa el componente que se monta, la 4 importa el proveedor real de avisos y la 5 carga los textos en español. La línea 7 declara el helper, la 8 llama a `render`, la 9 fija el idioma y la zona horaria, y la 10 monta el componente dentro de `ToastProvider`. [setup.ts](setup.ts) agrega los *matchers* de jest-dom y limpia el DOM después de cada caso. La configuración RTL sustituye los SVG decorativos por componentes vacíos.

## RTL-02 Rechazo genérico de credenciales

[Archivo del formulario de acceso](sign-in.test.tsx). Requisito `SWR-AUTH-002`, criterio `CA-01`.

| Línea | Qué hace |
| --- | --- |
| 1 | Importa `screen` para consultar el DOM y `act` para resolver una respuesta controlada en el caso de carga RTL-04. |
| 2 | Importa `userEvent` para simular escritura y clics. |
| 3 | Importa los organizadores y las aserciones de Vitest. `vi` crea la simulación y `beforeEach` la reinicia. |
| 4 | Importa el componente real `SignInForm`. |
| 5 | Importa el tipo de respuesta para el caso de carga del mismo archivo. |
| 6 | Importa la acción del formulario que Vitest sustituye durante las pruebas. |
| 7 | Importa el montaje con traducciones y avisos. |
| 9 | Sustituye la acción completa de login por `vi.fn()`. Así el formulario recibe el mismo tipo de respuesta sin acceder a Supabase. |
| 11 | `vi.mocked` da acceso tipado a la simulación. |
| 13–16 | El helper busca el correo por rol y nombre, y la contraseña por etiqueta. `user.type` introduce ambos valores, tal como lo haría la persona que usa el formulario. |
| 18–20 | Reinicia la simulación entre casos para evitar que se reutilice una respuesta anterior. |
| 42 | Declara el caso y su requisito. |
| 43 | Prepara el rechazo genérico `errors.invalidCredentials`. |
| 44 | Crea una sesión independiente de `userEvent`. |
| 45 | Monta el formulario de acceso con sus proveedores reales. |
| 47 | Escribe un correo de ejemplo y una contraseña. |
| 48 | Encuentra el botón por rol y nombre y lo pulsa. |
| 50 | `findByRole` espera la alerta. `expect` comprueba el mensaje genérico en español. |
| 51 | Verifica que el encabezado del inicio de sesión permanece visible. |
| 52 | Comprueba que el aviso general no marca el correo como inválido. |

Este caso demuestra cómo se presenta un rechazo de credenciales. La comprobación de credenciales y de rutas protegidas se realizará en otro nivel de prueba.

## RTL-09 Exceso de cantidad

[Archivo del punto de venta](point-of-sale.test.tsx). Requisito `SWR-VEN-002`, criterio `CA-09`.

| Línea | Qué hace |
| --- | --- |
| 1 | Importa `screen` y `within` para consultar todo el DOM o una región determinada. |
| 2 | Importa `userEvent`, que simula los clics y la edición de la cantidad. |
| 3 | Importa las funciones de Vitest para declarar casos, reiniciar simulaciones y comprobar resultados. |
| 4 | Importa `PosScreen`, la pantalla que controla el carrito real. |
| 5 | Importa el tipo del repuesto y la acción de búsqueda. |
| 6 | Importa la acción de venta, sustituida durante la suite. |
| 7 | Importa el helper que monta la pantalla con traducciones y avisos. |
| 9 | Simula la búsqueda para entregar un catálogo conocido. |
| 10 | Simula la venta para que ningún caso escriba en la base. |
| 11–14 | Simula la búsqueda y el alta de clientes, dependencias del selector de cliente. |
| 15 | Simula el router. Su `push` se usa en RTL-12. |
| 17–19 | Obtiene las dos funciones simuladas con tipos y crea el espía de navegación. |
| 21–31 | Define el repuesto REP-011 con tres unidades disponibles. |
| 49–65 | `showSale` monta la pantalla real con un cliente de ejemplo, efectivo e IVA del 19 %. |
| 73–78 | Cada caso parte de un catálogo simulado conocido y de espías reiniciados. |
| 137 | Declara el caso del límite de existencias. |
| 138 | Crea una sesión de interacción. |
| 139 | Monta el punto de venta. |
| 140 | Espera que aparezca el resultado REP-011 y pulsa su botón para agregar una unidad. |
| 142 | Localiza el control numérico por rol `spinbutton` y nombre «Cantidad». |
| 143 | Sustituye el dígito seleccionado por cuatro, que supera las tres unidades disponibles. |
| 145 | Comprueba que el valor quede en tres. |
| 146 | Comprueba que el control comunique las existencias mediante su descripción accesible. |
| 147 | Espera el aviso y verifica que esté visible y que identifique el saldo y el repuesto. |
| 148 | Comprueba que el botón de aumento quede deshabilitado. |

## RTL-12 Confirmación y acceso a la factura

[Archivo del punto de venta](point-of-sale.test.tsx). Requisito `SWR-CPB-001`, criterio `CA-12`. Usa los imports y mocks de las líneas 1 a 19 descritos en RTL-09. Aquí se usan `createSale` como respuesta controlada y `push` para registrar la ruta solicitada.

| Línea | Qué hace |
| --- | --- |
| 67 | Define el helper de confirmación que recibe la misma sesión de `userEvent`. |
| 68 | Pulsa «Confirmar venta» en la pantalla. |
| 69 | Espera el diálogo por su rol `alertdialog` y su título accesible. |
| 70 | Busca dentro de ese diálogo el segundo botón «Confirmar venta» y lo pulsa. |
| 185 | Declara el caso que verifica la confirmación visible y el acceso al comprobante. |
| 186 | Configura la respuesta de la acción simulada. |
| 187 | Indica que la operación fue exitosa. |
| 188 | Aporta la clave del mensaje traducido de éxito. |
| 189 | Define los datos devueltos por el servidor, incluido el ID y el número de factura. |
| 190 | Cierra el objeto de respuesta que entregará el mock. |
| 191 | Crea la sesión para reproducir las interacciones. |
| 192 | Monta el POS real mediante `showSale`. |
| 193 | Espera el resultado de búsqueda y agrega el repuesto. |
| 195 | Confirma desde la pantalla y desde el diálogo. |
| 197 | Espera el encabezado de éxito y comprueba que sea visible. |
| 198 | Comprueba que la pantalla muestre el número exacto recibido. |
| 199 | Busca el aviso de estado por su rol `status` y verifica el texto de éxito. |
| 200 | Pulsa «Ver factura» por su nombre accesible. |
| 201 | Comprueba que el router recibió la ruta con el ID de factura esperado. |

El caso comprueba la confirmación visible, el número presentado y la intención de navegación. El contenido del comprobante y la persistencia de la venta se verificarán con el flujo integrado.
