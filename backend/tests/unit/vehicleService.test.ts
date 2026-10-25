import { VehicleService } from '../../src/services/vehicleService';
import { VehicleRepository } from '../../src/repositories/vehicleRepository';
import { AppError } from '../../src/utils/AppError';

jest.mock('../../src/repositories/vehicleRepository');

type MockedVehicleRepository = jest.Mocked<VehicleRepository>;

interface VehicleRecord {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const buildVehicle = (overrides: Partial<VehicleRecord> = {}): VehicleRecord => ({
  id: 1,
  make: 'Toyota',
  model: 'Corolla',
  category: 'Sedan',
  price: 20000,
  quantity: 5,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('VehicleService', () => {
  let vehicleRepository: MockedVehicleRepository;
  let vehicleService: VehicleService;

  beforeEach(() => {
    vehicleRepository = new VehicleRepository() as MockedVehicleRepository;
    vehicleService = new VehicleService(vehicleRepository);
  });

  describe('addVehicle', () => {
    it('delegates to the repository and returns the created vehicle', async () => {
      // Arrange
      const data = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000, quantity: 3 };
      const created = buildVehicle({ id: 10, ...data });
      vehicleRepository.create.mockResolvedValue(created);

      // Act
      const result = await vehicleService.addVehicle(data);

      // Assert
      expect(vehicleRepository.create).toHaveBeenCalledTimes(1);
      expect(vehicleRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(created);
    });

    it('defaults quantity to 0 when it is omitted', async () => {
      // Arrange
      const data = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000 };
      vehicleRepository.create.mockResolvedValue(buildVehicle({ id: 11, quantity: 0 }));

      // Act
      await vehicleService.addVehicle(data);

      // Assert
      expect(vehicleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 0 }),
      );
    });
  });

  describe('listVehicles', () => {
    it('returns every vehicle from the repository, including out-of-stock ones', async () => {
      // Arrange
      const vehicles = [
        buildVehicle({ id: 1, quantity: 4 }),
        buildVehicle({ id: 2, quantity: 0 }),
      ];
      vehicleRepository.findAll.mockResolvedValue(vehicles);

      // Act
      const result = await vehicleService.listVehicles();

      // Assert
      expect(vehicleRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(vehicles);
      expect(result).toHaveLength(2);
    });
  });

  describe('searchVehicles', () => {
    it('forwards the filters to the repository and returns the matches', async () => {
      // Arrange
      const filters = { make: 'toy', category: 'Sedan', minPrice: 10000, maxPrice: 30000 };
      const matches = [buildVehicle({ id: 3 })];
      vehicleRepository.search.mockResolvedValue(matches);

      // Act
      const result = await vehicleService.searchVehicles(filters);

      // Assert
      expect(vehicleRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(matches);
    });

    it('throws an AppError with status 400 when minPrice is greater than maxPrice', async () => {
      // Arrange
      const filters = { minPrice: 50000, maxPrice: 10000 };

      // Act
      const action = vehicleService.searchVehicles(filters);

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 400 });
      expect(vehicleRepository.search).not.toHaveBeenCalled();
    });

    it('allows minPrice equal to maxPrice', async () => {
      // Arrange
      const filters = { minPrice: 20000, maxPrice: 20000 };
      vehicleRepository.search.mockResolvedValue([buildVehicle()]);

      // Act
      const result = await vehicleService.searchVehicles(filters);

      // Assert
      expect(vehicleRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('updateVehicle', () => {
    it('updates an existing vehicle and returns the updated record', async () => {
      // Arrange
      const existing = buildVehicle({ id: 5 });
      const updated = buildVehicle({ id: 5, price: 25000 });
      vehicleRepository.findById.mockResolvedValue(existing);
      vehicleRepository.update.mockResolvedValue(updated);

      // Act
      const result = await vehicleService.updateVehicle(5, { price: 25000 });

      // Assert
      expect(vehicleRepository.update).toHaveBeenCalledWith(5, { price: 25000 });
      expect(result).toEqual(updated);
    });

    it('throws an AppError with status 404 when the vehicle does not exist', async () => {
      // Arrange
      vehicleRepository.findById.mockResolvedValue(null);

      // Act
      const action = vehicleService.updateVehicle(999, { price: 25000 });

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 404 });
      expect(vehicleRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteVehicle', () => {
    it('deletes an existing vehicle', async () => {
      // Arrange
      vehicleRepository.findById.mockResolvedValue(buildVehicle({ id: 6 }));
      vehicleRepository.delete.mockResolvedValue(buildVehicle({ id: 6 }));

      // Act
      await vehicleService.deleteVehicle(6);

      // Assert
      expect(vehicleRepository.delete).toHaveBeenCalledWith(6);
    });

    it('throws an AppError with status 404 when the vehicle does not exist', async () => {
      // Arrange
      vehicleRepository.findById.mockResolvedValue(null);

      // Act
      const action = vehicleService.deleteVehicle(999);

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 404 });
      expect(vehicleRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('purchaseVehicle', () => {
    it('decrements stock atomically and returns the updated vehicle', async () => {
      // Arrange
      const decremented = buildVehicle({ id: 7, quantity: 2 });
      vehicleRepository.decrementStockIfAvailable.mockResolvedValue(decremented);

      // Act
      const result = await vehicleService.purchaseVehicle(7);

      // Assert
      expect(vehicleRepository.decrementStockIfAvailable).toHaveBeenCalledWith(7);
      expect(result).toEqual(decremented);
    });

    it('throws an AppError with status 404 when the vehicle does not exist', async () => {
      // Arrange
      vehicleRepository.decrementStockIfAvailable.mockResolvedValue(null);
      vehicleRepository.findById.mockResolvedValue(null);

      // Act
      const action = vehicleService.purchaseVehicle(999);

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws an AppError with status 409 and message "Out of stock" when quantity is 0', async () => {
      // Arrange
      vehicleRepository.decrementStockIfAvailable.mockResolvedValue(null);
      vehicleRepository.findById.mockResolvedValue(buildVehicle({ id: 8, quantity: 0 }));

      // Act
      const action = vehicleService.purchaseVehicle(8);

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 409, message: 'Out of stock' });
    });
  });

  describe('restockVehicle', () => {
    it('increases stock by the given amount and returns the updated vehicle', async () => {
      // Arrange
      const restocked = buildVehicle({ id: 9, quantity: 15 });
      vehicleRepository.findById.mockResolvedValue(buildVehicle({ id: 9, quantity: 5 }));
      vehicleRepository.increaseStock.mockResolvedValue(restocked);

      // Act
      const result = await vehicleService.restockVehicle(9, 10);

      // Assert
      expect(vehicleRepository.increaseStock).toHaveBeenCalledWith(9, 10);
      expect(result).toEqual(restocked);
    });

    it('throws an AppError with status 404 when the vehicle does not exist', async () => {
      // Arrange
      vehicleRepository.findById.mockResolvedValue(null);

      // Act
      const action = vehicleService.restockVehicle(999, 10);

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 404 });
      expect(vehicleRepository.increaseStock).not.toHaveBeenCalled();
    });

    it('throws an AppError with status 400 when the amount is not a positive integer', async () => {
      // Arrange
      vehicleRepository.findById.mockResolvedValue(buildVehicle({ id: 9 }));

      // Act
      const action = vehicleService.restockVehicle(9, 0);

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 400 });
      expect(vehicleRepository.increaseStock).not.toHaveBeenCalled();
    });
  });
});
