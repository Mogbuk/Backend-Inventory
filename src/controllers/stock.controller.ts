import { Request, Response, Router } from "express";
import { StockService } from "../services/stock.service";

const router = Router();
const stockService = new StockService();

//GET /warehouses/:warehouseId/stock?productId
router.get("/warehouses/:warehouseId/stock", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const stock = await stockService.getStock(warehouseId, productId);
    res.json(stock);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//POST /warehouses/:warehouseId/stock/in
router.post("/warehouses/:warehouseId/stock/in", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const { productId, quantity, note } = req.body;
    const result = await stockService.stockIn(warehouseId, productId, quantity, note);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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
