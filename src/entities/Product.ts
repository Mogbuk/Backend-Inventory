import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn,  UpdateDateColumn, Check, Index, ManyToOne } from "typeorm";
import { Company } from "./Company";
import { Movement } from "./Movement";
import { Stock } from "./Stock";

@Entity()
@Check(`"price" > 0`)
@Index(["name", "brand", "company"], { unique: true })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ default: "active" })
  status: string;

  @ManyToOne(() => Company, (company) => company.products, { onDelete: "CASCADE" })
  company: Company;

  @OneToMany(() => Movement, (movement) => movement.product)
  movements: Movement[];

  @OneToMany(() => Stock, (stock) => stock.product)
  stocks: Stock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
