import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Stock } from "./Stock";
import { Movement } from "./Movement";

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
  description?: string;

  @OneToMany(() => Stock, (stock) => stock.product)
  stock: Stock[];

  @OneToMany(() => Movement, (movement) => movement.product)
  movements: Movement[];
}
