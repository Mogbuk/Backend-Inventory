import { Request, Response, Router } from "express";
import { AppDataSource } from "../config/datasource";
import { Company } from "../entities/Company";

const router = Router();
const companyRepo = AppDataSource.getRepository(Company);

// 🔹 POST /api/companies - Crear empresa
router.post("/", async (req: Request, res: Response) => {
  try {
    const company = companyRepo.create(req.body);
    const saved = await companyRepo.save(company);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 🔹 GET /api/companies - Obtener todas las empresas
router.get("/", async (_req: Request, res: Response) => {
  try {
    const companies = await companyRepo.find({ relations: ["warehouses"] });
    res.json(companies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 GET /api/companies/:id - Obtener empresa por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: ["warehouses"],
    });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 PUT /api/companies/:id - Actualizar empresa
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyRepo.findOneBy({ id: Number(req.params.id) });
    if (!company) return res.status(404).json({ error: "Company not found" });

    Object.assign(company, req.body);
    const updated = await companyRepo.save(company);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 🔹 DELETE /api/companies/:id - Eliminar empresa
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyRepo.findOneBy({ id: Number(req.params.id) });
    if (!company) return res.status(404).json({ error: "Company not found" });

    await companyRepo.remove(company);
    res.json({ message: "Company deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
