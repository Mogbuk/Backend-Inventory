import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Warehouse} from "./Warehouse";

@Entity()
export class company {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    nit: string;

    @Column()
    address: string;

    @Column()
    phone?: string;

    @OneToMany(() => Warehouse, (warehouse) => warehouse.company)
    warehouses: Warehouses[];


}