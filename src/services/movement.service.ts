import { AppDataSource } from "../config/datasource";
import { Repository } from "typeorm";
import { Movement } from "../entities/Movement";
import { Warehouse } from "../entities/Warehouse";
import { Product } from "../entities/Product";
import { Stock } from "../entities/Stock";

export class MovementService {
  private movementRepo: Repository<Movement>;
  private warehouseRepo: Repository<Warehouse>;
  private productRepo: Repository<Product>;
  private stockRepo: Repository<Stock>;

  constructor() {
    this.movementRepo = AppDataSource.getRepository(Movement);
    this.warehouseRepo = AppDataSource.getRepository(Warehouse);
    this.productRepo = AppDataSource.getRepository(Product);
    this.stockRepo = AppDataSource.getRepository(Stock);
  }

  //Listar movimientos (por empresa, almacén o producto)
  async getAll(filters?: { warehouseId?: number; productId?: number }) {
    const query = this.movementRepo
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.warehouse", "warehouse")
      .leftJoinAndSelect("movement.product", "product")
      .orderBy("movement.createdAt", "DESC");

    if (filters?.warehouseId)
      query.andWhere("movement.warehouseId = :warehouseId", { warehouseId: filters.warehouseId });

    if (filters?.productId)
      query.andWhere("movement.productId = :productId", { productId: filters.productId });

    return query.getMany();
  }

  //Registrar entrada manual
  async createIn(warehouseId: number, productId: number, quantity: number, note?: string) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");

    return AppDataSource.transaction(async (manager) => {
      const warehouse = await manager.findOne(Warehouse, { where: { id: warehouseId }, relations: ["company"] });
      const product = await manager.findOne(Product, { where: { id: productId }, relations: ["company"] });
      if (!warehouse || !product) throw new Error("Warehouse or product not found");
      if (warehouse.company.id !== product.company.id) throw new Error("Different companies");

      let stock = await manager.findOne(Stock, {
        where: { warehouse: { id: warehouseId }, product: { id: productId } },
      });

      if (!stock) stock = manager.create(Stock, { warehouse, product, quantity: 0 });
      stock.quantity += quantity;
      await manager.save(stock);

      const movement = manager.create(Movement, {
        type: "IN",
        quantity,
        warehouse,
        product,
        note,
      });
      await manager.save(movement);

      return { message: "Movement registered successfully", movement };
    });
  }

  //Registrar salida manual
  async createOut(warehouseId: number, productId: number, quantity: number, note?: string) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");

    return AppDataSource.transaction(async (manager) => {
      const stock = await manager.findOne(Stock, {
        where: { warehouse: { id: warehouseId }, product: { id: productId } },
        relations: ["warehouse", "warehouse.company", "product", "product.company"],
      });

      if (!stock) throw new Error("Stock not found");
      if (stock.quantity < quantity) throw new Error("Insufficient stock");
      if (stock.product.company.id !== stock.warehouse.company.id)
        throw new Error("Different companies");

      stock.quantity -= quantity;
      await manager.save(stock);

      const movement = manager.create(Movement, {
        type: "OUT",
        quantity,
        warehouse: stock.warehouse,
        product: stock.product,
        note,
      });
      await manager.save(movement);

      return { message: "Movement registered successfully", movement };
    });
  }
}
