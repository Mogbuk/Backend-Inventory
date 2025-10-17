import express from "express";
import cors from "cors";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

import productRoutes from "./controllers/products.controller";
import stockRoutes from "./controllers/stock.controller";
import warehouseRoutes from "./controllers/warehouses.controller";
import movementRoutes from "./controllers/movement.controller";
import companyRoutes from "./controllers/companies.controller";
import { errorHandler } from "./middlewares/errorHandler";

const swaggerFilePath = path.join(__dirname, "../swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, "utf8"));


const app = express();
app.use(cors());
app.use(express.json());

//Rutas
app.use("/api/products", productRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/movements", movementRoutes);
app.use("/api", stockRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

export default app;
