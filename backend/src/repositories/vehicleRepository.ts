import type { Prisma, Vehicle } from '@prisma/client';
import { prisma } from '../config/prisma';

/** Data required to persist a new vehicle. */
export interface CreateVehicleData {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** Fields that may be changed on an existing vehicle. */
export type UpdateVehicleData = Partial<CreateVehicleData>;

/** Filters accepted by the vehicle search. */
export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Data-access layer for vehicles.
 * Encapsulates all Prisma queries so services stay persistence-agnostic.
 */
export class VehicleRepository {
  /**
   * Persists a new vehicle.
   *
   * @param data Vehicle fields to store.
   * @returns The created vehicle record.
   */
  async create(data: CreateVehicleData): Promise<Vehicle> {
    return prisma.vehicle.create({ data });
  }

  /**
   * Lists every vehicle, including out-of-stock ones.
   *
   * @returns All vehicle records.
   */
  async findAll(): Promise<Vehicle[]> {
    return prisma.vehicle.findMany();
  }

  /**
   * Finds a vehicle by its id.
   *
   * @param id Vehicle identifier.
   * @returns The matching vehicle, or null when none exists.
   */
  async findById(id: number): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { id } });
  }

  /**
   * Searches vehicles by optional filters.
   * Make and model use case-insensitive `contains`; category is matched
   * case-insensitively in memory because SQLite rejects Prisma's `mode` option.
   *
   * @param filters Optional make, model, category and inclusive price range.
   * @returns Matching vehicle records.
   */
  async search(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    const where: Prisma.VehicleWhereInput = {};

    if (filters.make) {
      where.make = { contains: filters.make };
    }
    if (filters.model) {
      where.model = { contains: filters.model };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = { gte: filters.minPrice, lte: filters.maxPrice };
    }

    const vehicles = await prisma.vehicle.findMany({ where });
    return this.filterByCategory(vehicles, filters.category);
  }

  /**
   * Updates an existing vehicle.
   *
   * @param id Vehicle identifier.
   * @param data Fields to change.
   * @returns The updated vehicle record.
   */
  async update(id: number, data: UpdateVehicleData): Promise<Vehicle> {
    return prisma.vehicle.update({ where: { id }, data });
  }

  /**
   * Deletes a vehicle.
   *
   * @param id Vehicle identifier.
   * @returns The deleted vehicle record.
   */
  async delete(id: number): Promise<Vehicle> {
    return prisma.vehicle.delete({ where: { id } });
  }

  /**
   * Atomically decrements stock by one when at least one unit is available.
   * Uses a conditional `updateMany` so concurrent purchases cannot oversell.
   *
   * @param id Vehicle identifier.
   * @returns The updated vehicle, or null when it is missing or out of stock.
   */
  async decrementStockIfAvailable(id: number): Promise<Vehicle | null> {
    const { count } = await prisma.vehicle.updateMany({
      where: { id, quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });

    if (count === 0) {
      return null;
    }

    return prisma.vehicle.findUnique({ where: { id } });
  }

  /**
   * Atomically increases stock by the given amount.
   *
   * @param id Vehicle identifier.
   * @param amount Positive number of units to add.
   * @returns The updated vehicle record.
   */
  async increaseStock(id: number, amount: number): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: { quantity: { increment: amount } },
    });
  }

  /** Filters vehicles by category using a case-insensitive comparison. */
  private filterByCategory(vehicles: Vehicle[], category?: string): Vehicle[] {
    if (!category) {
      return vehicles;
    }

    const target = category.toLowerCase();
    return vehicles.filter((vehicle) => vehicle.category.toLowerCase() === target);
  }
}

export default VehicleRepository;
