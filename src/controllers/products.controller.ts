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

// GET /products
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      q: req.query.q as string,
      brand: req.query.brand as string,
      status: req.query.status as string,
    };

    // Validar status si viene en query
    if (filters.status && !["active", "inactive"].includes(filters.status.toLowerCase())) {
      return res.status(422).json({
        error: {
          message: "Validation failed",
          fields: { status: "Status must be 'active' or 'inactive'" },
        },
      });
    }

    const products = await productService.getAll(filters);

    if (!products.length) {
      return res.status(404).json({
        error: { message: "No products found matching filters" },
      });
    }

    res.json(products);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


// GET /products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Validar formato de ID
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid product ID format" },
      });
    }

    const product = await productService.getById(id);

    if (!product) {
      return res.status(404).json({
        error: { message: "Product not found" },
      });
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


// GET /api/companies/:companyId/products?page&limit&q&brand&status
router.get("/companies/:companyId/products", async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { q, brand, status } = req.query;

    // Validaciones básicas
    if (isNaN(companyId)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    if (page <= 0 || limit <= 0) {
      return res.status(400).json({
        error: { message: "Page and limit must be positive numbers" },
      });
    }

    const query = productRepo.createQueryBuilder("product")
      .leftJoinAndSelect("product.company", "company")
      .where("company.id = :companyId", { companyId });

    if (q) query.andWhere("LOWER(product.name) LIKE LOWER(:q)", { q: `%${q}%` });
    if (brand) query.andWhere("LOWER(product.brand) LIKE LOWER(:brand)", { brand: `%${brand}%` });
    if (status) query.andWhere("product.status = :status", { status });

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});



// POST /api/companies/:companyId/products
router.post("/companies/:companyId/products", async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const { name, sku, price, brand, status, description } = req.body;

    // 🔹 Validar formato de companyId
    if (isNaN(companyId)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    // 🔹 Validar campos requeridos
    const errors: Record<string, string> = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!brand?.trim()) errors.brand = "Brand is required";
    if (price == null || isNaN(price)) errors.price = "Valid price is required";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        error: { message: "Validation failed", fields: errors },
      });
    }

    // 🔹 Verificar que la compañía exista
    const company = await AppDataSource.getRepository(Company).findOneBy({ id: companyId });
    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    // 🔹 Validar unicidad (nombre + marca dentro de la empresa)
    const existing = await productRepo.findOne({
      where: { name, brand, company: { id: companyId } },
    });

    if (existing) {
      return res.status(422).json({
        error: { message: "Product with same name and brand already exists" },
      });
    }

    // 🔹 Crear y guardar producto
    const product = productRepo.create({
      name,
      sku,
      price: Number(price),
      brand,
      status: status || "ACTIVE",
      description,
      company,
    });

    const saved = await productRepo.save(product);
    res.status(201).json(saved);

  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
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
