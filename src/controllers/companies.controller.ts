import { Request, Response, Router } from "express";
import { AppDataSource } from "../config/datasource";
import { Company } from "../entities/Company";
import { Warehouse } from "../entities/Warehouse";


const router = Router();
const companyRepo = AppDataSource.getRepository(Company);

//POST /api/companies - Crear empresa
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, isActive } = req.body;
    if (!name?.trim()) {
      return res.status(422).json({
        error: {
          message: "Validation failed",
          fields: { name: "Name is required" },
        },
      });
    }

    if (isActive) {
      await companyRepo.update({ isActive: true }, { isActive: false });
    }

    const company = companyRepo.create(req.body);
    const saved = await companyRepo.save(company);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


//GET /api/companies - Obtener todas las empresas
router.get("/", async (_req: Request, res: Response) => {
  try {
    const companies = await companyRepo.find({ relations: ["warehouses"] });

    if (!companies.length) {
      return res.status(404).json({
        error: { message: "No companies found" },
      });
    }

    res.json(companies);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});

//GET /api/companies/:id - Obtener empresa por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    const company = await companyRepo.findOne({
      where: { id },
      relations: ["warehouses"],
    });

    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    res.json(company);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});

//GET /api/companies/:id/warehouses
router.get("/:id/warehouses", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    const company = await companyRepo.findOneBy({ id });
    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    const warehouses = await AppDataSource.getRepository(Warehouse).find({
      where: { company: { id } },
      relations: ["company"],
    });

    res.json(warehouses);
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


//PUT /api/companies/:id - Actualizar empresa
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: { message: "Invalid company ID format" } });
    }

    const company = await companyRepo.findOneBy({ id });
    if (!company) {
      return res.status(404).json({ error: { message: "Company not found" } });
    }

    if (!req.body.name?.trim()) {
      return res.status(422).json({
        error: { message: "Validation error", fields: { name: "Name is required" } },
      });
    }

    // --- Manejar activación/desactivación ---
    if (req.body.isActive === true) {
      // Desactivar cualquier otra empresa activa
      const activeCompany = await companyRepo.findOne({ where: { isActive: true } });
      if (activeCompany && activeCompany.id !== company.id) {
        activeCompany.isActive = false;
        await companyRepo.save(activeCompany);
      }
      company.isActive = true;
    } else if (req.body.isActive === false) {
      company.isActive = false;
    }

    // --- Actualizar otros campos ---
    if (req.body.name) company.name = req.body.name;
    // Aquí puedes agregar otros campos que quieras actualizar, por ejemplo dirección, teléfono, etc.

    const updated = await companyRepo.save(company);
    res.json(updated);

  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});




//DELETE /api/companies/:id - Eliminar empresa
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: "Invalid company ID format" },
      });
    }

    const company = await companyRepo.findOneBy({ id });
    if (!company) {
      return res.status(404).json({
        error: { message: "Company not found" },
      });
    }

    await companyRepo.remove(company);
    res.json({ message: "Company deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      error: { message: "Internal server error", details: error.message },
    });
  }
});


export default router;
