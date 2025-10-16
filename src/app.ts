import express from "express";
import cors from "cors";

import productRoutes from "./controllers/products.controller";
import stockRoutes from "./controllers/stock.controller";
import warehouseRoutes from "./controllers/warehouses.controller";
import movementRoutes from "./controllers/movement.controller";

const app = express();
app.use(cors());
app.use(express.json());

//Rutas
app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/movements", movementRoutes);

export default app;
