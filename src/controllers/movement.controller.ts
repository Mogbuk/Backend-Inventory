import { Router, Request, Response } from "express";
import { MovementService } from "../services/movement.service";

const router = Router();
const movementService = new MovementService();

//GET /api/movements
router.get("/", async (req: Request, res: Response) => {
  try {
    const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const movements = await movementService.getAll({ warehouseId, productId });
    res.json(movements);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//POST /api/movements/in
router.post("/in", async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId, quantity, note } = req.body;
    const result = await movementService.createIn(warehouseId, productId, quantity, note);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//POST /api/movements/out
router.post("/out", async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId, quantity, note } = req.body;
    const result = await movementService.createOut(warehouseId, productId, quantity, note);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
