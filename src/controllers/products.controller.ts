import { Request, Response, Router } from "express";
import { ProductService } from "../services/product.service";
import { AppDataSource } from "../config/datasource";
import { Company } from "../entities/Company";
import { Warehouse } from "../entities/Warehouse";
import { Product } from "../entities/Product";

const router = Router();
const productService = new ProductService();
const companyRepo = AppDataSource.getRepository(Company);
const warehouseRepo = AppDataSource.getRepository(Warehouse);
const productRepo = AppDataSource.getRepository(Product);

//GET /products
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      q: req.query.q as string,
      brand: req.query.brand as string,
      status: req.query.status as string,
    };
    const products = await productService.getAll(filters);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

//GET /products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await productService.getById(Number(req.params.id));
    res.json(product);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

//GET /api/companies/:companyId/products?page&limit&q&brand&status
router.get("/companies/:companyId/products", async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const { page = 1, limit = 10, q, brand, status } = req.query;

    const query = productRepo.createQueryBuilder("product")
      .leftJoinAndSelect("product.company", "company")
      .where("company.id = :companyId", { companyId });

    if (q) query.andWhere("product.name ILIKE :q", { q: `%${q}%` });
    if (brand) query.andWhere("product.brand ILIKE :brand", { brand: `%${brand}%` });
    if (status) query.andWhere("product.status = :status", { status });

    const [data, total] = await query
      .skip((+page - 1) * +limit)
      .take(+limit)
      .getManyAndCount();

    res.json({
      data,
      total,
      page: +page,
      totalPages: Math.ceil(total / +limit),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


//POST /api/companies/:companyId/products
router.post("/companies/:companyId/products", async (req: Request, res: Response) => {
  try {
    const { name, sku, price, brand, status, description } = req.body;
    const companyId = Number(req.params.companyId);

    const company = await AppDataSource.getRepository(Company).findOneBy({ id: companyId });
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Validar unicidad nombre + marca dentro de la empresa
    const existing = await productRepo.findOne({
      where: { name, brand, company: { id: companyId } },
    });
    if (existing) return res.status(400).json({ error: "Product with same name and brand already exists" });

    const product = productRepo.create({ name, sku, price, brand, status, description, company });
    const saved = await productRepo.save(product);

    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


//PUT /products/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await productService.update(Number(req.params.id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//DELETE /api/products/:id (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const product = await productRepo.findOneBy({ id: Number(req.params.id) });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.status === "INACTIVE")
      return res.status(400).json({ error: "Product already inactive" });

    product.status = "INACTIVE";
    await productRepo.save(product);

    res.json({ message: "Product soft-deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
