# Guía de usuario

Esta guía explica las funciones disponibles en la versión actual de NovaPOS. No reemplaza capacitación operativa ni define políticas comerciales; explica cómo usar los flujos implementados.

## Iniciar sesión

1. Abre NovaPOS en la URL configurada.
2. Ingresa usuario y contraseña.
3. Si el sistema solicita cambio de contraseña, completa el formulario antes de continuar.

El sistema maneja dos roles:

| Rol | Uso principal |
| --- | --- |
| `ADMIN` | Configura catálogos, usuarios, proveedores, inventario, reportes y revisiones administrativas. |
| `CASHIER` | Opera caja, ventas, clientes y consultas permitidas. |

## Dashboard

Al entrar, NovaPOS muestra un dashboard. El contenido depende del rol:

- `ADMIN`: resumen general, ventas del día, cuentas por cobrar, productos bajos de stock, cajas abiertas y ventas recientes.
- `CASHIER`: información enfocada en su operación y caja actual.

## Abrir caja

1. Entra a `Caja` o a la pantalla de apertura cuando el sistema la solicite.
2. Captura el monto inicial.
3. Confirma la apertura.

Una caja abierta es necesaria para ventas de contado, movimientos de caja, abonos y operaciones que impliquen efectivo.

## Registrar productos

Flujo disponible para `ADMIN`:

1. Entra a `Catálogo > Productos`.
2. Crea o edita un producto.
3. Captura nombre, código de barras, categoría, unidad, precios, stock mínimo y proveedor si aplica.
4. Guarda.

Los productos pueden desactivarse en lugar de eliminarse. Esto conserva históricos de ventas e inventario.

## Registrar categorías

Flujo disponible para `ADMIN`:

1. Entra a `Catálogo > Categorías`.
2. Crea, edita o desactiva categorías.

Los cajeros pueden consultar categorías como apoyo a ventas y catálogo.

## Registrar clientes

1. Entra a `Clientes`.
2. Crea o actualiza el cliente.
3. Usa el cliente en ventas fiadas o seguimiento de cuentas por cobrar.

`ADMIN` puede desactivar clientes. El backend impide desactivar clientes con saldo pendiente.

## Registrar proveedores

Flujo disponible para `ADMIN`:

1. Entra a `Catálogo > Proveedores`.
2. Crea o edita proveedor.
3. Asocia productos al proveedor desde el catálogo de productos.

Los proveedores se usan para inventario inicial, registro de mercancía y cortes.

## Inventario inicial por proveedor

Flujo disponible para `ADMIN`:

1. Entra a `Proveedores`.
2. Abre la acción de inventario inicial del proveedor.
3. Captura cantidades y valores de los productos del proveedor.
4. Guarda.

El inventario inicial sirve como base para el primer corte de proveedor.

## Registrar mercancía

Flujo disponible para `ADMIN`:

1. Entra a `Inventario > Registrar mercancía`.
2. Selecciona proveedor.
3. Agrega productos del proveedor.
4. Captura cantidades, costos y precios de venta cuando aplique.
5. Guarda la entrada.

El sistema actualiza stock, registra la entrada histórica y crea movimientos de inventario.

## Movimientos manuales de inventario

Flujo disponible para `ADMIN`:

1. Entra a `Inventario > Movimientos de inventario`.
2. Registra entrada o salida manual.
3. Selecciona producto, cantidad y descripción.
4. Confirma.

Las salidas validan stock suficiente. Todos los movimientos quedan registrados con stock anterior y nuevo.

## Registrar una venta

1. Asegúrate de tener caja abierta.
2. Entra a `Ventas > Nueva venta`.
3. Busca productos por código de barras o selector.
4. Ajusta cantidades.
5. Selecciona venta de contado o fiada.
6. Para venta de contado, captura efectivo recibido.
7. Para venta fiada, selecciona cliente.
8. Confirma la venta.

El sistema calcula totales, valida stock y registra inventario, caja o cuenta por cobrar según el tipo de venta.

## Venta fiada

Una venta fiada requiere cliente. Al confirmarla:

- se registra la venta;
- se descuenta inventario;
- se crea una cuenta por cobrar;
- no se permite capturar efectivo recibido en la venta.

## Cuentas por cobrar

Flujo administrativo:

1. Entra a `Ventas > Cuentas por cobrar`.
2. Consulta clientes con saldos pendientes.
3. Abre la cuenta del cliente.
4. Revisa ventas fiadas, productos y pagos.

Los cajeros pueden consultar cuentas de clientes desde flujos permitidos por ventas y clientes.

## Registrar abonos

1. Abre la cuenta por cobrar del cliente.
2. Selecciona registrar abono.
3. Captura el monto.
4. Confirma.

El abono requiere caja abierta, no puede superar el saldo pendiente y genera movimiento de caja.

## Historial de ventas

1. Entra a `Ventas > Historial de ventas`.
2. Filtra o consulta ventas.
3. Abre el detalle de una venta.

`ADMIN` puede consultar historial general. `CASHIER` accede a ventas permitidas por las reglas del sistema.

## Cancelaciones

Desde el detalle de venta:

1. Selecciona cancelar venta.
2. Captura motivo.
3. Confirma.

La cancelación:

- no elimina la venta;
- restaura inventario;
- ajusta caja si fue venta de contado;
- cancela la cuenta por cobrar si fue fiada y no tiene pagos;
- no se permite en ventas ya canceladas ni ventas con devoluciones.

## Devoluciones

Desde el detalle de venta:

1. Selecciona devolver productos.
2. Captura cantidades a devolver y motivo.
3. Confirma.

La devolución valida cantidades disponibles para devolver, restaura inventario y ajusta efectivo o saldo por cobrar según el tipo de venta.

## Movimientos de caja

1. Entra a `Caja > Movimientos`.
2. Registra entrada o salida manual.
3. Captura monto y descripción.
4. Confirma.

La pantalla también permite consultar movimientos de la caja actual y resumen.

## Cerrar caja

1. Entra a la pantalla de caja.
2. Revisa el resumen o vista previa del cierre.
3. Captura efectivo contado.
4. Agrega notas si aplica.
5. Confirma cierre.

El cierre conserva un resumen histórico de totales, diferencia, ventas, abonos, entradas, salidas, devoluciones y cancelaciones procesadas.

## Cortes de proveedor

Flujo disponible para `ADMIN`:

1. Entra a `Inventario > Corte por proveedor`.
2. Selecciona proveedor y fecha de corte.
3. Crea el corte.
4. Captura inventario final, importes entregados y notas.
5. Guarda borrador o finaliza.

Un corte finalizado no se puede editar. La exportación Excel está disponible para cortes finalizados.

## Reportes

Flujo disponible para `ADMIN`:

1. Entra a `Reportes`.
2. Consulta el resumen operativo.

El reporte muestra el resumen operativo calculado por el sistema para ventas, caja, inventario, cuentas por cobrar y actividad reciente.

## Límites operativos actuales

- No hay modo offline de navegador.
- No hay pruebas end-to-end automatizadas.
- La importación histórica no es una pantalla de usuario; se ejecuta con un perfil backend dedicado.
- Los scripts de instalación, respaldo y restauración están pensados para Windows con Docker Desktop.
