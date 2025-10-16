import { Request, Response, Router } from "express";
import { AppDataSource } from "../config/datasource";
import { Warehouse } from "../entities/Warehouse";
import { Company } from "../entities/Company";

const router = Router();
const warehouseRepo = AppDataSource.getRepository(Warehouse);
const companyRepo = AppDataSource.getRepository(Company);

// 🔹 POST /api/warehouses - Crear almacén (requiere companyId)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, location, companyId } = req.body;

    const company = await companyRepo.findOneBy({ id: companyId });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const warehouse = warehouseRepo.create({ name, location, company });
    const saved = await warehouseRepo.save(warehouse);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 🔹 GET /api/warehouses - Listar todos los almacenes
router.get("/", async (_req: Request, res: Response) => {
  try {
    const warehouses = await warehouseRepo.find({ relations: ["company"] });
    res.json(warehouses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 GET /api/companies/:companyId/warehouses - Listar almacenes de una empresa
router.get("/company/:companyId", async (req: Request, res: Response) => {
  try {
    const warehouses = await warehouseRepo.find({
      where: { company: { id: Number(req.params.companyId) } },
      relations: ["company"],
    });
    res.json(warehouses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 GET /api/warehouses/:id - Obtener almacén por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const warehouse = await warehouseRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: ["company", "stock"],
    });
    if (!warehouse) return res.status(404).json({ error: "Warehouse not found" });
    res.json(warehouse);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 PUT /api/warehouses/:id - Actualizar almacén
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const warehouse = await warehouseRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: ["company"],
    });
    if (!warehouse) return res.status(404).json({ error: "Warehouse not found" });

    Object.assign(warehouse, req.body);
    const updated = await warehouseRepo.save(warehouse);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 🔹 DELETE /api/warehouses/:id - Eliminar almacén
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const warehouse = await warehouseRepo.findOneBy({ id: Number(req.params.id) });
    if (!warehouse) return res.status(404).json({ error: "Warehouse not found" });

    await warehouseRepo.remove(warehouse);
    res.json({ message: "Warehouse deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
