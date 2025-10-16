import express from "express";
import cors from "cors";
import productRoutes from "./controllers/products.controller";
import stockRoutes from "./controllers/stock.controller";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);


export default app;
