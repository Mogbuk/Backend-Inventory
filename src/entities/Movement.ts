import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Product } from "./Product";
import { Warehouse } from "./Warehouse";

@Entity()
export class Movement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // 'IN' o 'OUT'

  @Column()
  quantity: number;

    @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => Product, (product) => product.movements, { onDelete: "CASCADE" })
  product: Product;

  @ManyToOne(() => Warehouse, { onDelete: "CASCADE" })
  warehouse: Warehouse;
}
