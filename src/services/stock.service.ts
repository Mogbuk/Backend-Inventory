import { AppDataSource } from "../config/datasource";
import { Repository } from "typeorm";
import { Stock } from "../entities/Stock";
import { Product } from "../entities/Product";
import { Warehouse } from "../entities/Warehouse";
import { Movement } from "../entities/Movement";

export class StockService {
  private stockRepo: Repository<Stock>;
  private productRepo: Repository<Product>;
  private warehouseRepo: Repository<Warehouse>;
  private movementRepo: Repository<Movement>;

  constructor() {
    this.stockRepo = AppDataSource.getRepository(Stock);
    this.productRepo = AppDataSource.getRepository(Product);
    this.warehouseRepo = AppDataSource.getRepository(Warehouse);
    this.movementRepo = AppDataSource.getRepository(Movement);
  }

  //Consultar stock en un almacén
  async getStock(warehouseId: number, productId?: number) {
    const warehouse = await this.warehouseRepo.findOne({
      where: { id: warehouseId },
      relations: ["company"],
    });
    if (!warehouse) throw new Error("Warehouse not found");

    const query = this.stockRepo
      .createQueryBuilder("stock")
      .leftJoinAndSelect("stock.product", "product")
      .where("stock.warehouseId = :warehouseId", { warehouseId });

    if (productId) query.andWhere("stock.productId = :productId", { productId });

    const stocks = await query.getMany();
    return stocks;
  }

  //Entrada de stock
  async stockIn(warehouseId: number, productId: number, quantity: number, note?: string) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");

    return AppDataSource.transaction(async (manager) => {
      const warehouse = await manager.findOne(Warehouse, {
        where: { id: warehouseId },
        relations: ["company"],
      });
      if (!warehouse) throw new Error("Warehouse not found");

      const product = await manager.findOne(Product, {
        where: { id: productId },
        relations: ["company"],
      });
      if (!product) throw new Error("Product not found");

      // Validar que el producto pertenezca a la misma empresa
      if (product.company.id !== warehouse.company.id) {
        throw new Error("Product and warehouse belong to different companies");
      }

      let stock = await manager.findOne(Stock, {
        where: { warehouse: { id: warehouseId }, product: { id: productId } },
        relations: ["warehouse", "product"],
      });

      if (!stock) {
        stock = manager.create(Stock, { warehouse, product, quantity: 0 });
      }

      stock.quantity += quantity;
      await manager.save(stock);

      //Registrar movimiento
      const movement = manager.create(Movement, {
        type: "IN",
        quantity,
        warehouse,
        product,
      });
      await manager.save(movement);

      return { message: "Stock added successfully", stock };
    });
  }

  //Salida de stock
  async stockOut(warehouseId: number, productId: number, quantity: number, note?: string) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");

    return AppDataSource.transaction(async (manager) => {
      const stock = await manager.findOne(Stock, {
        where: { warehouse: { id: warehouseId }, product: { id: productId } },
        relations: ["warehouse", "warehouse.company", "product", "product.company"],
      });
      if (!stock) throw new Error("Stock record not found");

      if (stock.product.company.id !== stock.warehouse.company.id) {
        throw new Error("Product and warehouse belong to different companies");
      }

      if (stock.quantity < quantity) throw new Error("Insufficient stock");

      stock.quantity -= quantity;
      await manager.save(stock);

      // Registrar movimiento
      const movement = manager.create(Movement, {
        type: "OUT",
        quantity,
        warehouse: stock.warehouse,
        product: stock.product,
      });
      await manager.save(movement);

      return { message: "Stock removed successfully", stock };
    });
  }

  //Transferencia de stock entre almacenes
  async transfer(fromWarehouseId: number, toWarehouseId: number, productId: number, quantity: number, note?: string) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");
    if (fromWarehouseId === toWarehouseId) throw new Error("Cannot transfer to the same warehouse");

    return AppDataSource.transaction(async (manager) => {
      const from = await manager.findOne(Warehouse, {
        where: { id: fromWarehouseId },
        relations: ["company"],
      });
      const to = await manager.findOne(Warehouse, {
        where: { id: toWarehouseId },
        relations: ["company"],
      });
      const product = await manager.findOne(Product, {
        where: { id: productId },
        relations: ["company"],
      });

      if (!from || !to) throw new Error("Warehouse not found");
      if (!product) throw new Error("Product not found");

      // Validar empresa
      if (from.company.id !== to.company.id || from.company.id !== product.company.id) {
        throw new Error("Warehouses and product must belong to the same company");
      }

      // Restar stock en origen
      let stockFrom = await manager.findOne(Stock, {
        where: { warehouse: { id: fromWarehouseId }, product: { id: productId } },
        relations: ["warehouse", "product"],
      });
      if (!stockFrom || stockFrom.quantity < quantity) {
        throw new Error("Insufficient stock in source warehouse");
      }
      stockFrom.quantity -= quantity;
      await manager.save(stockFrom);

      // Sumar stock en destino
      let stockTo = await manager.findOne(Stock, {
        where: { warehouse: { id: toWarehouseId }, product: { id: productId } },
        relations: ["warehouse", "product"],
      });
      if (!stockTo) {
        stockTo = manager.create(Stock, { warehouse: to, product, quantity: 0 });
      }
      stockTo.quantity += quantity;
      await manager.save(stockTo);

      //Registrar movimientos
      const outMovement = manager.create(Movement, {
        type: "OUT",
        quantity,
        warehouse: from,
        product,
      });
      const inMovement = manager.create(Movement, {
        type: "IN",
        quantity,
        warehouse: to,
        product,
      });
      await manager.save([outMovement, inMovement]);

      return { message: "Stock transferred successfully" };
    });
  }
}
