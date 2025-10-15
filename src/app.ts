import express from "express";
import cors from "cors";
import productRoutes from "./controllers/products.controller";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);

export default app;
