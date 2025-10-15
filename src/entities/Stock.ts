import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Warehouse } from "./Warehouse";
import { Product } from "./Product";

@Entity()
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.stock, { onDelete: "CASCADE" })
  warehouse: Warehouse;

  @ManyToOne(() => Product, (product) => product.stock, { onDelete: "CASCADE" })
  product: Product;
}
