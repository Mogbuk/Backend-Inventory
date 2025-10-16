import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Company } from "./Company";
import { Stock } from "./Stock";

@Entity()
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  location: string;

  @ManyToOne(() => Company, (company) => company.warehouses, { onDelete: "CASCADE" })
  company: Company;

  @OneToMany(() => Stock, (stock) => stock.warehouse)
  stocks: Stock[];
}
