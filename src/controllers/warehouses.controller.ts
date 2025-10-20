import { Request, Response, Router } from "express";
import { AppDataSource } from "../config/datasource";
import { Warehouse } from "../entities/Warehouse";
import { Company } from "../entities/Company";

const router = Router();
const warehouseRepo = AppDataSource.getRepository(Warehouse);
const companyRepo = AppDataSource.getRepository(Company);

//POST /api/warehouses - Crear almacén (requiere companyId)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, location, companyId } = req.body;

    // Validaciones básicas
    if (!name?.trim() || !companyId) {
      return res.status(422).json({
        error: {
          message: "Validation failed",
          fields: {
            name: !name?.trim() ? "Name is required" : undefined,
            companyId: !companyId ? "Company ID is required" : undefined,
          },
        },
      });
    }

    const company = await companyRepo.findOneBy({ id: Number(companyId) });
    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    const warehouse = warehouseRepo.create({ name, location, company });
    const saved = await warehouseRepo.save(warehouse);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


//GET /api/companies/:companyId/warehouses - Listar todos los almacenes de una compañía
router.get("/companies/:companyId/warehouses", async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.companyId);

    if (isNaN(companyId)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    const company = await companyRepo.findOneBy({ id: companyId });
    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    const warehouses = await warehouseRepo.find({
      where: { company: { id: companyId } },
      relations: ["company"],
    });

    if (!warehouses.length) {
      return res.status(404).json({
        error: { message: "No warehouses found for this company" },
      });
    }

    res.json(warehouses);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});



//GET /api/warehouses - Listar todos los almacenes
router.get("/", async (_req: Request, res: Response) => {
  try {
    const warehouses = await warehouseRepo.find({ relations: ["company"] });

    if (!warehouses.length) {
      return res.status(404).json({
        error: { message: "No warehouses found" },
      });
    }

    res.json(warehouses);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});



//GET /api/warehouses/:id - Obtener almacén por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Validar ID
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid warehouse ID format" },
      });
    }

    const warehouse = await warehouseRepo.findOne({
      where: { id },
      relations: ["company", "stocks"],
    });

    if (!warehouse) {
      return res.status(404).json({
        error: { message: "Warehouse not found" },
      });
    }

    res.json(warehouse);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


//PUT /api/warehouses/:id - Actualizar almacén
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid warehouse ID format" },
      });
    }

    const warehouse = await warehouseRepo.findOne({
      where: { id },
      relations: ["company"],
    });

    if (!warehouse) {
      return res.status(404).json({
        error: { message: "Warehouse not found" },
      });
    }

    const { name, location } = req.body;

    if (!name?.trim()) {
      return res.status(422).json({
        error: { message: "Validation error", fields: { name: "Name is required" } },
      });
    }

    Object.assign(warehouse, { name, location });
    const updated = await warehouseRepo.save(warehouse);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});

// DELETE /api/warehouses/:id - Eliminar almacén
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid warehouse ID format" },
      });
    }

    const warehouse = await warehouseRepo.findOneBy({ id });
    if (!warehouse) {
      return res.status(404).json({
        error: { message: "Warehouse not found" },
      });
    }

    await warehouseRepo.remove(warehouse);
    res.json({ message: "Warehouse deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


export default router;
