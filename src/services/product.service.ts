import { AppDataSource } from "../config/datasource";
import { Product } from "../entities/Product";
import { Repository } from "typeorm";

export class ProductService {
  private productRepo: Repository<Product>;

  constructor() {
    this.productRepo = AppDataSource.getRepository(Product);
  }

  // Obtener todos los productos
  async getAll(filters?: { q?: string; brand?: string; status?: string }) {
    const query = this.productRepo.createQueryBuilder("product");

    if (filters?.q) {
      query.andWhere("LOWER(product.name) LIKE LOWER(:q)", {
        q: `%${filters.q}%`,
      });
    }

    if (filters?.brand) {
      query.andWhere("product.brand = :brand", { brand: filters.brand });
    }

    if (filters?.status) {
      query.andWhere("product.status = :status", { status: filters.status });
    }

    return query.getMany();
  }

  // Obtener un producto por ID
  async getById(id: number) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) throw new Error("Product not found");
    return product;
  }

  // Crear producto nuevo
  async create(data: Partial<Product>) {
    // Validaciones de unicidad
    const existing = await this.productRepo.findOne({
      where: [{ sku: data.sku }],
    });

    if (existing) throw new Error("SKU already exists");

    const newProduct = this.productRepo.create(data);
    return this.productRepo.save(newProduct);
  }

  // Actualizar producto
  async update(id: number, data: Partial<Product>) {
    const product = await this.getById(id);
    Object.assign(product, data);
    return this.productRepo.save(product);
  }

  // Eliminar producto (soft delete)
  async delete(id: number) {
    const product = await this.getById(id);
    await this.productRepo.remove(product);
    return { message: "Product deleted successfully" };
  }
}
