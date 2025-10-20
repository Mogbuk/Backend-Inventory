import { Request, Response, Router } from "express";
import { ProductService } from "../services/product.service";
import { AppDataSource } from "../config/datasource";
import { Company } from "../entities/Company";
import { Warehouse } from "../entities/Warehouse";
import { Product } from "../entities/Product";
const companyRepo = AppDataSource.getRepository(Company);

const router = Router();
const productService = new ProductService();
const productRepo = AppDataSource.getRepository(Product);

//GET /products
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      q: req.query.q as string,
      brand: req.query.brand as string,
      status: req.query.status as string,
    };

    //Validar status si viene en query
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


//GET /products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

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


// GET /api/products/companies/:companyId?page=1&limit=10&search=term&status=true
router.get("/companies/:companyId", async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string)?.trim();
    const brand = (req.query.brand as string)?.trim();
    const statusQuery = (req.query.status as string)?.trim();

    // Convertir status a booleano si viene definido
    let status: boolean | undefined;
    if (statusQuery === "true") status = true;
    else if (statusQuery === "false") status = false;

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

    // Construir query base
    const query = productRepo.createQueryBuilder("product")
      .leftJoinAndSelect("product.company", "company")
      .where("company.id = :companyId", { companyId });

    // Filtrar por status si viene
    if (status !== undefined) query.andWhere("product.status = :status", { status });

    // Filtrar por nombre o marca si viene search
    if (search) {
      query.andWhere(
        "(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.brand) LIKE LOWER(:search))",
        { search: `%${search}%` }
      );
    }

    // Filtrar por brand exacto si viene
    if (brand) query.andWhere("LOWER(product.brand) = LOWER(:brand)", { brand });

    // Paginación
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

//POST /api/products/companies/:companyId
router.post("/companies/:companyId", async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);
    let { name, sku, price, brand, status, description } = req.body;

    if (isNaN(companyId)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    const errors: Record<string, string> = {};
    if (!sku?.trim()) errors.sku = "SKU is required";
    if (!name?.trim()) errors.name = "Name is required";
    if (!brand?.trim()) errors.brand = "Brand is required";
    if (price == null || isNaN(price)) errors.price = "Valid price is required";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        error: { message: "Validation failed", fields: errors },
      });
    }

    const company = await companyRepo.findOneBy({ id: companyId });
    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    // Validar unicidad (nombre + marca dentro de la empresa)
    const existing = await productRepo.findOne({
      where: { name, brand, company: { id: companyId } },
    });

    if (existing) {
      return res.status(422).json({
        error: { message: "Product with same name and brand already exists" },
      });
    }

    // Convertir status a booleano si viene definido
    if (status !== undefined) {
      if (status === "true" || status === true) status = true;
      else if (status === "false" || status === false) status = false;
      else status = true; // default si viene valor inválido
    } else {
      status = true; // default si no viene
    }

    // Crear y guardar producto
    const product = productRepo.create({
      name,
      sku,
      price: Number(price),
      brand,
      status, // ahora booleano
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




// PUT /products/:id - Actualizar producto
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let { name, price, brand, status } = req.body;

    // Convertir status a booleano si viene definido
    if (status !== undefined) {
      if (status === "true" || status === true) status = true;
      else if (status === "false" || status === false) status = false;
      else status = undefined; // valor inválido se ignora
    }

    //Validar formato de ID
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid product ID format" },
      });
    }

    //Validar campos requeridos
    const errors: Record<string, string> = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!brand?.trim()) errors.brand = "Brand is required";
    if (price == null || isNaN(price)) errors.price = "Valid price is required";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        error: { message: "Validation failed", fields: errors },
      });
    }

    //Intentar actualizar el producto
    const updated = await productService.update(id, {
      name,
      price: Number(price),
      brand,
      ...(status !== undefined && { status }), // solo sobrescribe si viene status
    });

    if (!updated) {
      return res.status(404).json({
        error: { message: "Product not found" },
      });
    }

    res.json(updated);

  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});




//DELETE /api/products/:id - Soft delete (cambia status a INACTIVE)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid product ID format" },
      });
    }

    const product = await productRepo.findOneBy({ id });
    if (!product) {
      return res.status(404).json({
        error: { message: "Product not found" },
      });
    }

    //Validar si ya está inactivo
    if (product.status === "INACTIVE") {
      return res.status(422).json({
        error: { message: "Product is already inactive" },
      });
    }

    //Soft delete (actualizar status)
    product.status = "INACTIVE";
    await productRepo.save(product);

    res.json({
      message: "Product soft-deleted successfully",
      productId: product.id,
    });
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


export default router;
