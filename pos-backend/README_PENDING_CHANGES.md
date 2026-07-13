# Cambios pendientes de subir a GitHub - Backend

Este documento resume los cambios locales no subidos a GitHub en `pos-backend`.
El objetivo principal de estos cambios es agregar el modulo de movimientos de
inventario como fuente de auditoria para los cambios de stock de productos.

## Resumen general

Se agrego un nuevo feature:

`com.angelica.pos.inventory.movement`

El modulo permite:

- Registrar entradas manuales de inventario.
- Registrar salidas manuales de inventario.
- Consultar un movimiento por id.
- Consultar historial paginado de movimientos.
- Consultar historial paginado por producto.
- Auditar el stock inicial al crear productos.
- Evitar que `PUT /api/products/{id}` modifique directamente el stock.
- Controlar concurrencia con bloqueo pesimista sobre la fila del producto.

Tambien se agrego la migracion Flyway:

`src/main/resources/db/migration/V5__create_inventory_movements.sql`

No se modificaron migraciones anteriores.

## Arquitectura agregada

La estructura nueva sigue la arquitectura por feature usada en el backend:

```text
src/main/java/com/angelica/pos/inventory/movement
├── controller
├── dto
├── entity
├── exception
├── mapper
├── repository
└── service
```

El controlador no accede a repositories. La logica de negocio vive en el
servicio. El mapper es MapStruct. Las respuestas HTTP usan DTOs, no entidades.

## Flujo de negocio

### Entrada manual

1. El frontend envia `productId`, `quantity` y `description`.
2. El backend obtiene el usuario autenticado desde el JWT.
3. El servicio busca al usuario activo.
4. El servicio obtiene el producto activo con bloqueo pesimista.
5. Lee `Product.currentStock` como `previousStock`.
6. Calcula `newStock = previousStock + quantity`.
7. Actualiza `Product.currentStock`.
8. Guarda un `InventoryMovement` con:
   - `direction = IN`
   - `type = MANUAL_ENTRY`
   - `sourceType = null`
   - `sourceId = null`
9. Todo ocurre dentro de una transaccion.

### Salida manual

1. El frontend envia `productId`, `quantity` y `description`.
2. El backend obtiene el usuario autenticado desde el JWT.
3. El servicio busca al usuario activo.
4. El servicio obtiene el producto activo con bloqueo pesimista.
5. Lee `Product.currentStock` como `previousStock`.
6. Valida que exista stock suficiente.
7. Calcula `newStock = previousStock - quantity`.
8. Actualiza `Product.currentStock`.
9. Guarda un `InventoryMovement` con:
   - `direction = OUT`
   - `type = MANUAL_EXIT`
   - `sourceType = null`
   - `sourceId = null`
10. Todo ocurre dentro de una transaccion.

### Stock inicial al crear producto

1. `ProductRequest.currentStock` se conserva como stock inicial.
2. El producto se guarda inicialmente con stock cero.
3. Si el stock inicial es mayor que cero, se llama al servicio de inventario.
4. Se registra un movimiento:
   - `direction = IN`
   - `type = INITIAL_STOCK`
   - `description = Stock inicial del producto`
   - `sourceType = PRODUCT_CREATION`
   - `sourceId = id del producto`
5. El stock final del producto se actualiza mediante la logica central de
   inventario.

Esto garantiza que una creacion de producto con existencias tambien quede
auditada.

## Endpoints agregados

Todos quedan bajo `/api`:

```text
POST /api/inventory-movements/entries
POST /api/inventory-movements/exits
GET  /api/inventory-movements/{id}
GET  /api/inventory-movements
GET  /api/products/{productId}/inventory-movements
```

Todos son exclusivos para usuarios `ADMIN`.

## Filtros del historial general

`GET /api/inventory-movements` acepta:

- `search`: nombre o codigo de barras del producto.
- `productId`: id del producto.
- `direction`: `IN` u `OUT`.
- `type`: `INITIAL_STOCK`, `MANUAL_ENTRY`, `MANUAL_EXIT`, `SALE` o `RETURN`.
- `from`: fecha inicial en formato ISO date-time.
- `to`: fecha final en formato ISO date-time.
- `page`, `size`, `sort`: paginacion Spring.

El tamano maximo de pagina se limita a 50 registros.

## Archivos creados

### `src/main/java/com/angelica/pos/inventory/movement/controller/InventoryMovementController.java`

Controlador REST del modulo.

Responsabilidades:

- Expone los endpoints de entradas, salidas e historial.
- Recibe `AuthenticatedUser` con `@AuthenticationPrincipal`.
- Valida request body con `@Valid`.
- Valida ids positivos con `@Positive`.
- Aplica paginacion con `Pageable`.
- Aplica fechas con `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)`.
- Construye el header `Location` al crear movimientos.
- Devuelve `PageResponse<InventoryMovementResponse>` en consultas paginadas.

No contiene logica de stock ni acceso directo a repositories.

### `src/main/java/com/angelica/pos/inventory/movement/dto/ManualInventoryMovementRequest.java`

DTO de entrada para movimientos manuales.

Campos permitidos:

- `productId`
- `quantity`
- `description`

Validaciones:

- `productId` obligatorio y positivo.
- `quantity` obligatoria.
- `quantity >= 0.01`.
- Maximo 8 enteros y 2 decimales con `@Digits(integer = 8, fraction = 2)`.
- `description` obligatoria, no vacia y maximo 255 caracteres.

Este DTO no permite enviar usuario, direccion, tipo, stock anterior, stock
posterior, fecha, `sourceType` ni `sourceId`. Esos valores los controla el
backend.

### `src/main/java/com/angelica/pos/inventory/movement/dto/InventoryMovementResponse.java`

DTO de salida para exponer movimientos sin devolver entidades completas.

Campos expuestos:

- Datos basicos del movimiento.
- Datos no sensibles del producto: id, codigo, nombre y unidad.
- Datos no sensibles del usuario: id y username.
- Stock anterior y posterior.
- Origen del movimiento cuando exista.
- Fecha de creacion.

No expone `passwordHash` ni entidades anidadas.

### `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovement.java`

Entidad JPA que representa la tabla `inventory_movements`.

Campos principales:

- `id`
- `product`
- `createdBy`
- `direction`
- `type`
- `quantity`
- `previousStock`
- `newStock`
- `description`
- `sourceType`
- `sourceId`
- `createdAt`

Detalles importantes:

- `product` usa `@ManyToOne(fetch = FetchType.LAZY, optional = false)`.
- `createdBy` usa `@ManyToOne(fetch = FetchType.LAZY, optional = false)`.
- `direction` y `type` usan `@Enumerated(EnumType.STRING)`.
- Los valores numericos usan `BigDecimal` con precision 10 y escala 2.
- `@PrePersist` asigna `OffsetDateTime.now()` si `createdAt` viene nulo.
- Usa Lombok segun el estilo del proyecto.

Los movimientos son registros de auditoria. No se agregaron endpoints para
editar ni eliminar.

### `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovementDirection.java`

Enum de direccion del movimiento:

- `IN`: entra stock.
- `OUT`: sale stock.

La direccion permite saber el signo operativo del movimiento y simplifica
consultas futuras.

### `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovementType.java`

Enum de tipo de movimiento:

- `INITIAL_STOCK`
- `MANUAL_ENTRY`
- `MANUAL_EXIT`
- `SALE`
- `RETURN`

En esta fase solo se crean manualmente `MANUAL_ENTRY` y `MANUAL_EXIT`. El tipo
`INITIAL_STOCK` se usa internamente al crear productos con stock inicial. Los
tipos `SALE` y `RETURN` quedan preparados para fases futuras, pero no se
implementaron ventas ni devoluciones.

### `src/main/java/com/angelica/pos/inventory/movement/exception/InsufficientStockException.java`

Excepcion de negocio para impedir salidas mayores al stock disponible.

Mensaje:

```text
Stock insuficiente para el producto {producto}. Disponible: {stock}, solicitado: {cantidad}
```

Se mapea a HTTP `409 CONFLICT` desde `GlobalExceptionHandler`.

### `src/main/java/com/angelica/pos/inventory/movement/exception/InventoryMovementNotFoundException.java`

Excepcion de negocio para cuando no existe un movimiento solicitado por id.

Se mapea a HTTP `404 NOT FOUND` desde `GlobalExceptionHandler`.

### `src/main/java/com/angelica/pos/inventory/movement/mapper/InventoryMovementMapper.java`

Mapper MapStruct del modulo.

Responsabilidades:

- Convertir `ManualInventoryMovementRequest` a entidad ignorando campos
  controlados por backend.
- Convertir `InventoryMovement` a `InventoryMovementResponse`.
- Mapear campos anidados:
  - `product.id` -> `productId`
  - `product.barcode` -> `productBarcode`
  - `product.name` -> `productName`
  - `product.unit` -> `productUnit`
  - `createdBy.id` -> `createdById`
  - `createdBy.username` -> `createdByUsername`
- Convertir listas de movimientos a listas de responses.

El mapper no accede a repositories.

### `src/main/java/com/angelica/pos/inventory/movement/repository/InventoryMovementRepository.java`

Repositorio JPA del modulo.

Extiende:

- `JpaRepository<InventoryMovement, Long>`
- `JpaSpecificationExecutor<InventoryMovement>`

Metodos:

- `findByIdWithDetails(Long id)`: consulta por id con `JOIN FETCH` de producto
  y usuario.
- `findAll(Specification<InventoryMovement>, Pageable)`: consulta paginada con
  `@EntityGraph(attributePaths = {"product", "createdBy"})` para evitar carga
  perezosa innecesaria.
- `findByProductIdWithDetails(Long productId, Pageable)`: historial paginado
  de un producto con `JOIN FETCH`.

El historial general usa `Specification` para construir solo los filtros que
realmente tienen valor. Esto evita errores de PostgreSQL con parametros nulos
en JPQL, como:

```text
function lower(bytea) does not exist
could not determine data type of parameter
```

### `src/main/java/com/angelica/pos/inventory/movement/service/InventoryMovementService.java`

Interfaz del servicio.

Metodos expuestos:

- `registerManualEntry(...)`
- `registerManualExit(...)`
- `registerInitialStock(...)`
- `registerStockMovement(...)`
- `findById(...)`
- `findAll(...)`
- `findByProduct(...)`

`registerStockMovement(...)` es la logica central reutilizable para cambios de
stock. Queda lista para que ventas y devoluciones la usen en el futuro sin
duplicar reglas.

### `src/main/java/com/angelica/pos/inventory/movement/service/InventoryMovementServiceImpl.java`

Implementacion principal de negocio.

Responsabilidades:

- Validar requests manuales.
- Validar cantidad mayor que cero.
- Validar maximo dos decimales.
- Validar maximo 8 digitos enteros.
- Validar descripcion obligatoria y maximo 255 caracteres.
- Validar coherencia entre tipo y direccion.
- Validar coherencia de `sourceType` y `sourceId`.
- Evitar que movimientos manuales tengan origen externo.
- Obtener usuario activo.
- Obtener producto activo con bloqueo pesimista.
- Calcular stock anterior y posterior.
- Impedir stock negativo.
- Guardar movimiento y stock en la misma transaccion.
- Consultar movimientos paginados.
- Validar que `from` no sea posterior a `to`.
- Limitar pagina a maximo 50 registros.
- Normalizar busquedas vacias a `null`.

La funcion clave es `registerStockMovement(...)`. Todas las entradas, salidas y
stock inicial pasan por ahi.

## Migracion creada

### `src/main/resources/db/migration/V5__create_inventory_movements.sql`

Crea la tabla:

`inventory_movements`

Columnas:

- `id`
- `product_id`
- `created_by_user_id`
- `direction`
- `type`
- `quantity`
- `previous_stock`
- `new_stock`
- `description`
- `source_type`
- `source_id`
- `created_at`

Llaves foraneas:

- `product_id` referencia `products(id)`.
- `created_by_user_id` referencia `users(id)`.
- Ambas usan `ON UPDATE RESTRICT` y `ON DELETE RESTRICT`.

Restricciones:

- `quantity > 0`
- `previous_stock >= 0`
- `new_stock >= 0`
- `description` no puede quedar en blanco.
- `direction` solo acepta `IN` u `OUT`.
- `type` solo acepta los valores definidos por el enum.
- Cada tipo tiene una direccion valida:
  - `INITIAL_STOCK` -> `IN`
  - `MANUAL_ENTRY` -> `IN`
  - `MANUAL_EXIT` -> `OUT`
  - `SALE` -> `OUT`
  - `RETURN` -> `IN`
- La matematica de stock se valida en base de datos:
  - `IN`: `new_stock = previous_stock + quantity`
  - `OUT`: `new_stock = previous_stock - quantity`
- `source_type` y `source_id` deben venir ambos nulos o ambos con valor.
- Movimientos manuales deben tener origen nulo.

Indices:

- `product_id`
- `created_by_user_id`
- `created_at`
- `direction`
- `type`
- `(source_type, source_id)`

No hay indice unico para origen, porque una operacion futura podria generar
varios movimientos validos.

## Archivos modificados

### `src/main/java/com/angelica/pos/catalog/product/controller/ProductController.java`

Cambio realizado:

- `create(...)` ahora recibe `@AuthenticationPrincipal AuthenticatedUser`.
- Llama a `productService.create(request, authenticatedUser)`.

Motivo:

- El stock inicial se registra como movimiento de inventario y necesita saber
  que usuario autenticado creo el producto.

### `src/main/java/com/angelica/pos/catalog/product/dto/ProductUpdateRequest.java`

Cambio realizado:

- Se elimino `currentStock` del DTO de actualizacion.

Motivo:

- La actualizacion normal de producto ya no debe modificar existencias.
- El stock solo debe cambiar mediante movimientos de inventario.

### `src/main/java/com/angelica/pos/catalog/product/mapper/ProductMapper.java`

Cambio realizado:

- `updateEntityFromRequest(...)` ahora ignora `currentStock`.

Motivo:

- Defensa adicional para que aunque el mapper reciba una entidad con stock, el
  stock existente se conserve.

### `src/main/java/com/angelica/pos/catalog/product/repository/ProductRepository.java`

Cambio realizado:

- Se agrego `findByIdAndActiveTrueForUpdate(Long id)` con
  `@Lock(LockModeType.PESSIMISTIC_WRITE)`.

Motivo:

- Evitar condiciones de carrera cuando dos operaciones intentan descontar stock
  al mismo tiempo.
- El bloqueo se hace en base de datos, por lo que funciona aun con varias
  instancias del backend.

### `src/main/java/com/angelica/pos/catalog/product/service/ProductService.java`

Cambio realizado:

- `create(ProductRequest request)` cambio a
  `create(ProductRequest request, AuthenticatedUser authenticatedUser)`.

Motivo:

- El servicio de producto necesita pasar el usuario autenticado al servicio de
  inventario cuando crea un movimiento de stock inicial.

### `src/main/java/com/angelica/pos/catalog/product/service/ProductServiceImpl.java`

Cambios realizados:

- Inyecta `InventoryMovementService`.
- En creacion, conserva temporalmente el stock enviado como `initialStock`.
- Guarda el producto inicialmente con `currentStock = BigDecimal.ZERO`.
- Si `initialStock > 0`, llama a
  `inventoryMovementService.registerInitialStock(...)`.

Motivo:

- El stock inicial queda auditado como movimiento `INITIAL_STOCK`.
- Si falla el movimiento inicial, la transaccion revierte tambien la creacion
  del producto.

### `src/main/java/com/angelica/pos/security/SecurityConfig.java`

Cambios realizados:

- Se agregaron reglas ADMIN para:
  - `POST /api/inventory-movements/entries`
  - `POST /api/inventory-movements/exits`
  - `GET /api/inventory-movements`
  - `GET /api/inventory-movements/**`
  - `GET /api/products/*/inventory-movements`

Motivo:

- En esta fase solo ADMIN puede registrar y consultar movimientos de
  inventario.
- CASHIER no tiene acceso administrativo al historial ni puede registrar
  entradas/salidas.

### `src/main/java/com/angelica/pos/shared/exception/GlobalExceptionHandler.java`

Cambios realizados:

- Maneja `InventoryMovementNotFoundException` con `404 NOT_FOUND`.
- Maneja `InsufficientStockException` con `409 CONFLICT`.
- Maneja `MethodArgumentTypeMismatchException` con `400 BAD_REQUEST`.

Motivo:

- Evitar respuestas 500 para errores esperados de negocio o parametros
  invalidos.
- No exponer mensajes internos de Hibernate/PostgreSQL al cliente.

## Pruebas creadas

### `src/test/java/com/angelica/pos/inventory/movement/service/InventoryMovementServiceImplTest.java`

Prueba la logica de servicio:

- Entrada manual aumenta stock.
- Salida manual disminuye stock.
- Guarda `previousStock` y `newStock`.
- Asigna usuario autenticado.
- Asigna `MANUAL_ENTRY` + `IN`.
- Asigna `MANUAL_EXIT` + `OUT`.
- Limpia descripcion con `trim()`.
- Rechaza cantidad cero.
- Rechaza cantidad negativa.
- Rechaza descripcion vacia.
- Rechaza mas de dos decimales.
- Rechaza producto inexistente o inactivo.
- Rechaza salida mayor al stock disponible.
- No deja stock negativo.
- Registra stock inicial con origen `PRODUCT_CREATION`.
- Consulta movimientos paginados.
- Rechaza paginas mayores a 50.

### `src/test/java/com/angelica/pos/inventory/movement/controller/InventoryMovementControllerTest.java`

Prueba el controlador:

- Entrada valida devuelve `201 CREATED`.
- Salida valida devuelve `201 CREATED`.
- Se genera header `Location`.
- El historial general devuelve `PageResponse`.

### `src/test/java/com/angelica/pos/inventory/movement/dto/ManualInventoryMovementRequestValidationTest.java`

Prueba Bean Validation del request:

- Request valido sin violaciones.
- Rechaza cantidad cero.
- Rechaza descripcion en blanco.
- Rechaza mas de dos decimales.

### `src/test/java/com/angelica/pos/catalog/product/service/ProductServiceImplTest.java`

Prueba la integracion con producto:

- Crear producto con stock inicial mayor a cero guarda producto en cero y
  registra movimiento inicial.
- Crear producto con stock cero no registra movimiento de cantidad cero.
- Actualizar producto conserva el `currentStock` existente.

## Reglas de seguridad

- Solo ADMIN puede registrar entradas manuales.
- Solo ADMIN puede registrar salidas manuales.
- Solo ADMIN puede consultar historial.
- El usuario se toma del JWT con `AuthenticatedUser`.
- No se recibe `userId` desde el frontend.
- No se requiere sesion de caja para inventario.
- Se conservan las reglas existentes de JWT, CORS y cambio obligatorio de
  password.

## Reglas de negocio implementadas

- Producto debe existir y estar activo.
- Usuario autenticado debe existir y estar activo.
- Cantidad debe ser mayor que cero.
- Cantidad solo puede tener hasta dos decimales.
- Cantidad solo puede tener hasta ocho digitos enteros.
- Descripcion es obligatoria.
- Descripcion se guarda con `trim()`.
- Entrada aumenta stock.
- Salida disminuye stock.
- No se permite salida mayor al stock disponible.
- Stock nunca puede quedar negativo.
- Backend calcula stock anterior y posterior.
- Backend asigna fecha de creacion.
- Movimientos manuales no pueden tener origen.
- `INITIAL_STOCK` solo se crea internamente desde creacion de producto.
- No se implementaron endpoints de edicion o eliminacion de movimientos.
- No se implementaron ventas ni devoluciones.

## Estrategia de concurrencia

La concurrencia se controla con bloqueo pesimista:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Product> findByIdAndActiveTrueForUpdate(Long id);
```

Cada movimiento:

1. Inicia una transaccion.
2. Bloquea la fila del producto.
3. Lee el stock actual.
4. Calcula el nuevo stock.
5. Actualiza el producto.
6. Guarda el movimiento.
7. Confirma ambos cambios juntos.

Esto evita que dos salidas simultaneas lean el mismo stock y dejen inventario
negativo.

## Error 500 corregido en historial

Durante la integracion aparecio un error al consultar:

```text
GET /api/inventory-movements?page=0&size=10&sort=createdAt,DESC
```

El problema venia de filtros opcionales en JPQL con parametros nulos. PostgreSQL
intentaba resolver funciones como `lower(...)` sobre parametros sin tipo claro,
provocando errores como:

```text
ERROR: function lower(bytea) does not exist
ERROR: could not determine data type of parameter
```

La solucion aplicada fue reemplazar la consulta con condiciones opcionales por
`JpaSpecificationExecutor` y construir predicados dinamicos solo cuando el
filtro existe. Asi no se envia a PostgreSQL una condicion innecesaria con
parametros nulos.

## Lo que NO se implemento

Estos cambios no agregan:

- Ventas.
- Devoluciones.
- Compras.
- Proveedores.
- Cierre de caja.
- Reportes.
- Frontend.
- Movimientos de efectivo.
- Dependencia con `CashSession`.
- Edicion de movimientos.
- Eliminacion de movimientos.
- Cambio directo de stock desde actualizacion de producto.

## Verificacion conocida

En el entorno Docker del proyecto se compilo el backend durante la construccion
de imagen con Maven y termino correctamente.

Tambien se ejecuto `npm run build` y `npm run lint` en el frontend durante la
integracion visual del modulo, pero este README documenta solamente los cambios
pendientes dentro de `pos-backend`.

Nota: en el entorno local de IntelliJ puede aparecer:

```text
Web server failed to start. Port 8080 was already in use.
```

Eso no es un error del codigo de inventario. Significa que ya hay otro proceso
escuchando en el puerto 8080, por ejemplo un backend levantado en Docker o una
ejecucion anterior de Spring Boot.

## Lista de archivos pendientes segun Git

Archivos modificados:

- `src/main/java/com/angelica/pos/catalog/product/controller/ProductController.java`
- `src/main/java/com/angelica/pos/catalog/product/dto/ProductUpdateRequest.java`
- `src/main/java/com/angelica/pos/catalog/product/mapper/ProductMapper.java`
- `src/main/java/com/angelica/pos/catalog/product/repository/ProductRepository.java`
- `src/main/java/com/angelica/pos/catalog/product/service/ProductService.java`
- `src/main/java/com/angelica/pos/catalog/product/service/ProductServiceImpl.java`
- `src/main/java/com/angelica/pos/security/SecurityConfig.java`
- `src/main/java/com/angelica/pos/shared/exception/GlobalExceptionHandler.java`

Archivos nuevos:

- `src/main/java/com/angelica/pos/inventory/movement/controller/InventoryMovementController.java`
- `src/main/java/com/angelica/pos/inventory/movement/dto/InventoryMovementResponse.java`
- `src/main/java/com/angelica/pos/inventory/movement/dto/ManualInventoryMovementRequest.java`
- `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovement.java`
- `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovementDirection.java`
- `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovementType.java`
- `src/main/java/com/angelica/pos/inventory/movement/exception/InsufficientStockException.java`
- `src/main/java/com/angelica/pos/inventory/movement/exception/InventoryMovementNotFoundException.java`
- `src/main/java/com/angelica/pos/inventory/movement/mapper/InventoryMovementMapper.java`
- `src/main/java/com/angelica/pos/inventory/movement/repository/InventoryMovementRepository.java`
- `src/main/java/com/angelica/pos/inventory/movement/service/InventoryMovementService.java`
- `src/main/java/com/angelica/pos/inventory/movement/service/InventoryMovementServiceImpl.java`
- `src/main/resources/db/migration/V5__create_inventory_movements.sql`
- `src/test/java/com/angelica/pos/catalog/product/service/ProductServiceImplTest.java`
- `src/test/java/com/angelica/pos/inventory/movement/controller/InventoryMovementControllerTest.java`
- `src/test/java/com/angelica/pos/inventory/movement/dto/ManualInventoryMovementRequestValidationTest.java`
- `src/test/java/com/angelica/pos/inventory/movement/service/InventoryMovementServiceImplTest.java`
- `README_PENDING_CHANGES.md`

