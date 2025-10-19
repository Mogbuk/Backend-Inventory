import { Request, Response, Router } from "express";
import { StockService } from "../services/stock.service";

const router = Router();
const stockService = new StockService();

//GET /warehouses/:warehouseId/stock?productId
router.get("/warehouses/:warehouseId/stock", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const productId = req.query.productId ? Number(req.query.productId) : undefined;

    //Validar formato de IDs
    if (isNaN(warehouseId)) {
      return res.status(400).json({
        error: { message: "Invalid warehouse ID format" },
      });
    }

    if (productId !== undefined && isNaN(productId)) {
      return res.status(400).json({
        error: { message: "Invalid product ID format" },
      });
    }

    //Obtener stock
    const stock = await stockService.getStock(warehouseId, productId);

    // Si no hay stock registrado
    if (!stock || (Array.isArray(stock) && stock.length === 0)) {
      return res.status(404).json({
        error: { message: "No stock found for the given criteria" },
      });
    }

    res.json(stock);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


// POST /warehouses/:warehouseId/stock/in
router.post("/warehouses/:warehouseId/stock/in", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const { productId, quantity, note } = req.body;

    // 🔍 Validaciones
    const errors: Record<string, string> = {};

    if (isNaN(warehouseId)) errors.warehouseId = "Invalid warehouse ID format";
    if (!productId || isNaN(Number(productId))) errors.productId = "Valid product ID is required";
    if (quantity == null || isNaN(quantity) || quantity <= 0)
      errors.quantity = "Quantity must be a positive number";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        error: { message: "Validation failed", fields: errors },
      });
    }

    // 💾 Ejecutar entrada de stock
    const result = await stockService.stockIn(warehouseId, Number(productId), Number(quantity), note);

    res.status(201).json({
      message: "Stock added successfully",
      data: result,
    });

  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: { message: error.message },
      });
    }

    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});

//POST /warehouses/:warehouseId/stock/out
router.post("/warehouses/:warehouseId/stock/out", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const { productId, quantity, note } = req.body;
    const result = await stockService.stockOut(warehouseId, productId, quantity, note);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//POST /stock/transfer
router.post("/stock/transfer", async (req: Request, res: Response) => {
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity, note } = req.body;
    const result = await stockService.transfer(fromWarehouseId, toWarehouseId, productId, quantity, note);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
