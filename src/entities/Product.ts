import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Movement } from "./Movement";
import { Stock } from "./Stock";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  sku: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  // ✅ Nuevo campo: Marca
  @Column({ nullable: true })
  brand: string;

  // ✅ Nuevo campo: Estado (por defecto “active”)
  @Column({ default: "active" })
  status: string;

  @OneToMany(() => Movement, (movement) => movement.product)
  movements: Movement[];

  @OneToMany(() => Stock, (stock) => stock.product)
  stocks: Stock[];
}
