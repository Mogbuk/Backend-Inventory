import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Warehouse } from "./Warehouse";
import { Product } from "./Product";

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  nit: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phone?: string;

  @OneToMany(() => Warehouse, (warehouse) => warehouse.company)
  warehouses: Warehouse[];

  @OneToMany(() => Product, (product) => product.company)
  products: Product[];
}
