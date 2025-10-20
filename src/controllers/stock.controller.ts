import { Request, Response, Router } from "express";
import { StockService } from "../services/stock.service";
import { AppDataSource } from "../config/datasource";
import { Product } from "../entities/Product";

const router = Router();
const stockService = new StockService();

//GET /warehouses/:warehouseId/stock?productId
router.get("/warehouses/:warehouseId/stock", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const productId = req.query.productId ? Number(req.query.productId) : undefined;

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
    let stock = await stockService.getStock(warehouseId, productId);

    //Si no hay stock registrado, devolver quantity 0 en lugar de error
    if (!stock || (Array.isArray(stock) && stock.length === 0)) {
      // Traer productos según productId o todos si no hay
      const products = productId
        ? await AppDataSource.getRepository(Product).find({ where: { id: productId } })
        : await AppDataSource.getRepository(Product).find();

      stock = products.map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: 0,
      }));
    }

    res.json(stock);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});



//POST /warehouses/:warehouseId/stock/in
router.post("/warehouses/:warehouseId/stock/in", async (req: Request, res: Response) => {
  try {
    const warehouseId = Number(req.params.warehouseId);
    const { productId, quantity, note } = req.body;

    //Validaciones
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

    //Ejecutar entrada de stock
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

    //Validaciones
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

    //Ejecutar salida de stock
    const result = await stockService.stockOut(warehouseId, Number(productId), Number(quantity), note);

    res.status(201).json({
      message: "Stock removed successfully",
      data: result,
    });

  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: { message: error.message },
      });
    }

    if (error.message.includes("insufficient stock")) {
      return res.status(409).json({
        error: { message: "Insufficient stock to perform this operation" },
      });
    }

    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


//POST /stock/transfer - Transferir stock entre almacenes
router.post("/stock/transfer", async (req: Request, res: Response) => {
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity, note } = req.body;

    //Validaciones
    const errors: Record<string, string> = {};

    if (!fromWarehouseId || isNaN(Number(fromWarehouseId)))
      errors.fromWarehouseId = "Valid source warehouse ID is required";

    if (!toWarehouseId || isNaN(Number(toWarehouseId)))
      errors.toWarehouseId = "Valid destination warehouse ID is required";

    if (Number(fromWarehouseId) === Number(toWarehouseId))
      errors.sameWarehouse = "Source and destination warehouses must be different";

    if (!productId || isNaN(Number(productId)))
      errors.productId = "Valid product ID is required";

    if (quantity == null || isNaN(quantity) || quantity <= 0)
      errors.quantity = "Quantity must be a positive number";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        error: { message: "Validation failed", fields: errors },
      });
    }

    //Ejecutar transferencia
    const result = await stockService.transfer(
      Number(fromWarehouseId),
      Number(toWarehouseId),
      Number(productId),
      Number(quantity),
      note
    );

    res.status(201).json({
      message: "Stock transferred successfully",
      data: result,
    });

  } catch (error: any) {
    //Errores específicos esperables
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: { message: error.message },
      });
    }

    if (error.message.includes("insufficient stock")) {
      return res.status(409).json({
        error: { message: "Insufficient stock in source warehouse" },
      });
    }

    //Error general
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});

export default router;
