# Backend-PruebaTecnica

Mini-aplicación para la **gestión de inventario multicompañía**.

---

## Descripción

Inditecol SAS opera varias empresas que comparten una plataforma de gestión de inventario. Cada empresa tiene uno o más almacenes y en ellos mantiene productos con existencias (stock). Esta API permite:

- Administrar productos.
- Gestionar stock por almacén.
- Realizar transferencias de inventario entre almacenes de la **misma empresa**.
- Integración con frontend (Angular) para usuarios no técnicos.

---

## Tecnologías

- Node.js
- TypeScript
- Express
- TypeORM
- PostgreSQL
- Yarn
- dotenv

---

## Configuración

1. Clonar el repositorio:

```bash
git clone https://github.com/Mogbuk/Backend-Inventory
cd Backend-PruebaTecnica


## Instalar dependencias

2. yarn install

## Crear archivo .env en la raiz

3. DATABASE_URL=postgresql://usuario:password@host:puerto/base_de_datos
PORT=####

## Ejecutar servidor en modo desarrollo

4. yarn dev

## Entidades

Company: id, name, createdAt, updatedAt
Warehouse: id, name, companyId, createdAt, updatedAt
Product: id, name, brand, sku, price, status, createdAt, updatedAt
Stock: warehouseId, productId, quantity
Movement: id, warehouseId, productId, type (IN/OUT/TRANSFER), quantity, note, createdAt

## Endpoints principales


Empresas y Almacenes

GET /companies → Listado de empresas
GET /companies/:id/warehouses → Almacenes de una empresa
POST /companies → Crear empresa
POST /warehouses → Crear almacén


Productos

GET /companies/:companyId/products?page&limit&q&brand&status → Listado con filtros
GET /products/:id → Obtener producto
POST /companies/:companyId/products → Crear producto
PUT /products/:id → Actualizar producto
DELETE /products/:id → Soft delete (status → INACTIVE)


Stock

GET /warehouses/:warehouseId/stock?productId → Consultar stock
POST /warehouses/:warehouseId/stock/in → Entrada de stock
POST /warehouses/:warehouseId/stock/out → Salida de stock
POST /stock/transfer → Transferencia entre almacenes


## Validaciones

Status: solo "ACTIVE" o "INACTIVE"
Precio: > 0
Unicidad: (name + brand) única por empresa
SKU: único global
Cantidad de stock: ≥ 0

Errores con formato consistente:

{
  "error": {
    "message": "Descripción del error",
    "fields": {
      "campo": "detalle del error"
    }
  }
}

Códigos HTTP:

422 / 400: validaciones
404: recurso no encontrado
409: conflicto (unicidad, stock insuficiente)

## Notas importantes

Transacciones en movimientos y transferencias para mantener consistencia.
CORS habilitado para consumir desde el frontend.
Migraciones para versionar la base de datos.
El proyecto está listo para integrarse con un frontend Angular.