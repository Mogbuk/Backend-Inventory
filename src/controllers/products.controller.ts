import { Request, Response, Router } from "express";
import { ProductService } from "../services/product.service";

const router = Router();
const productService = new ProductService();

// GET /products
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

// GET /products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await productService.getById(Number(req.params.id));
    res.json(product);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// POST /products
router.post("/", async (req: Request, res: Response) => {
  try {
    const newProduct = await productService.create(req.body);
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /products/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await productService.update(Number(req.params.id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /products/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.delete(Number(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
