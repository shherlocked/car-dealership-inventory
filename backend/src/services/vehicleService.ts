import type { Vehicle } from '@prisma/client';
import type {
  CreateVehicleData,
  UpdateVehicleData,
  VehicleRepository,
  VehicleSearchFilters,
} from '../repositories/vehicleRepository';
import { AppError } from '../utils/AppError';

const VEHICLE_NOT_FOUND_MESSAGE = 'Vehicle not found';
const OUT_OF_STOCK_MESSAGE = 'Out of stock';

/**
 * Vehicle business logic: catalogue management and inventory operations.
 * Dependencies are injected to keep the service testable and decoupled.
 */
export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Adds a vehicle to the catalogue, defaulting quantity to 0 when omitted.
   *
   * @param data Vehicle fields to store.
   * @returns The created vehicle.
   */
  async addVehicle(data: Partial<CreateVehicleData> & Omit<CreateVehicleData, 'quantity'>): Promise<Vehicle> {
    return this.vehicleRepository.create({ ...data, quantity: data.quantity ?? 0 });
  }

  /**
   * Lists every vehicle, including out-of-stock ones.
   *
   * @returns All vehicles.
   */
  async listVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.findAll();
  }

  /**
   * Searches vehicles by optional filters.
   *
   * @param filters Optional make, model, category and inclusive price range.
   * @returns Matching vehicles.
   * @throws {AppError} 400 when minPrice is greater than maxPrice.
   */
  async searchVehicles(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    const { minPrice, maxPrice } = filters;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new AppError(400, 'minPrice cannot be greater than maxPrice');
    }

    return this.vehicleRepository.search(filters);
  }

  /**
   * Updates an existing vehicle.
   *
   * @param id Vehicle identifier.
   * @param data Fields to change.
   * @returns The updated vehicle.
   * @throws {AppError} 404 when the vehicle does not exist.
   */
  async updateVehicle(id: number, data: UpdateVehicleData): Promise<Vehicle> {
    await this.ensureVehicleExists(id);
    return this.vehicleRepository.update(id, data);
  }

  /**
   * Deletes an existing vehicle.
   *
   * @param id Vehicle identifier.
   * @throws {AppError} 404 when the vehicle does not exist.
   */
  async deleteVehicle(id: number): Promise<void> {
    await this.ensureVehicleExists(id);
    await this.vehicleRepository.delete(id);
  }

  /**
   * Purchases one unit, decrementing stock atomically.
   *
   * @param id Vehicle identifier.
   * @returns The vehicle with its updated stock.
   * @throws {AppError} 404 when the vehicle does not exist, 409 when out of stock.
   */
  async purchaseVehicle(id: number): Promise<Vehicle> {
    const updated = await this.vehicleRepository.decrementStockIfAvailable(id);
    if (updated) {
      return updated;
    }

    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new AppError(404, VEHICLE_NOT_FOUND_MESSAGE);
    }

    throw new AppError(409, OUT_OF_STOCK_MESSAGE);
  }

  /**
   * Restocks a vehicle by a positive amount.
   *
   * @param id Vehicle identifier.
   * @param amount Positive number of units to add.
   * @returns The vehicle with its updated stock.
   * @throws {AppError} 400 for a non-positive amount, 404 when the vehicle does not exist.
   */
  async restockVehicle(id: number, amount: number): Promise<Vehicle> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError(400, 'Restock amount must be a positive integer');
    }

    await this.ensureVehicleExists(id);
    return this.vehicleRepository.increaseStock(id, amount);
  }

  /**
   * Ensures a vehicle exists.
   *
   * @param id Vehicle identifier.
   * @throws {AppError} 404 when the vehicle does not exist.
   */
  private async ensureVehicleExists(id: number): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new AppError(404, VEHICLE_NOT_FOUND_MESSAGE);
    }
  }
}

export default VehicleService;
