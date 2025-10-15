import "reflect-metadata";
import { DataSource } from "typeorm";
import { Company } from "../entities/Company";
import { Warehouse } from "../entities/Warehouse";
import { Product } from "../entities/Product";
import { Stock } from "../entities/Stock";
import { Movement } from "../entities/Movement";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  synchronize: true,
  logging: true,
  entities: [Company, Warehouse, Product, Stock, Movement],
});