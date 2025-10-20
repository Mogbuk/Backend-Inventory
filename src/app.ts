import express from "express";
import cors from "cors";
import "dotenv/config";

import productRoutes from "./controllers/products.controller";
import stockRoutes from "./controllers/stock.controller";
import warehouseRoutes from "./controllers/warehouses.controller";
import movementRoutes from "./controllers/movement.controller";
import companyRoutes from "./controllers/companies.controller";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

//Rutas
app.use("/api/products", productRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/movements", movementRoutes);
app.use("/api", stockRoutes);

app.use(errorHandler);

export default app;
