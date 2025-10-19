import { Router, Request, Response } from "express";
import { MovementService } from "../services/movement.service";

const router = Router();
const movementService = new MovementService();

//GET /api/movements
router.get("/", async (req: Request, res: Response) => {
  try {
    const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;

    //Validaciones simples
    if ((warehouseId && isNaN(warehouseId)) || (productId && isNaN(productId))) {
      return res.status(400).json({
        error: { message: "Invalid query parameter format" },
      });
    }

    const movements = await movementService.getAll({ warehouseId, productId });

    if (!movements || movements.length === 0) {
      return res.status(404).json({
        error: { message: "No movements found for the given criteria" },
      });
    }

    res.json(movements);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});

//POST /api/movements/in
router.post("/in", async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId, quantity, note } = req.body;

    if (
      !warehouseId || isNaN(Number(warehouseId)) ||
      !productId || isNaN(Number(productId)) ||
      quantity == null || isNaN(quantity) || quantity <= 0
    ) {
      return res.status(422).json({ error: "Invalid input data" });
    }

    const result = await movementService.createIn(
      Number(warehouseId),
      Number(productId),
      Number(quantity),
      note
    );

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes("not found"))
      return res.status(404).json({ error: error.message });

    res.status(500).json({ error: error.message });
  }
});


//POST /api/movements/out
router.post("/out", async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId, quantity, note } = req.body;

    if (
      !warehouseId || isNaN(Number(warehouseId)) ||
      !productId || isNaN(Number(productId)) ||
      quantity == null || isNaN(quantity) || quantity <= 0
    ) {
      return res.status(422).json({ error: "Invalid input data" });
    }

    const result = await movementService.createOut(
      Number(warehouseId),
      Number(productId),
      Number(quantity),
      note
    );

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes("not found"))
      return res.status(404).json({ error: error.message });

    if (error.message.includes("insufficient stock"))
      return res.status(409).json({ error: "Insufficient stock" });

    res.status(500).json({ error: error.message });
  }
});


export default router;
