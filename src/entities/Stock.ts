import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Check } from "typeorm";
import { Warehouse } from "./Warehouse";
import { Product } from "./Product";

@Entity()
@Check(`"quantity" >= 0`)
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.stocks, { onDelete: "CASCADE" })
  warehouse: Warehouse;

  @ManyToOne(() => Product, (product) => product.stocks, { onDelete: "CASCADE" })
  product: Product;
}
