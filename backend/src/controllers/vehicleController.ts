import type { NextFunction, Request, Response } from 'express';
import type { VehicleService } from '../services/vehicleService';
import {
  createVehicleSchema,
  restockVehicleSchema,
  searchVehiclesQuerySchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from '../utils/validation';

/**
 * Thin HTTP layer for vehicles.
 * Parses input, delegates to the service and shapes the response.
 */
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  /**
   * Handles POST /api/vehicles.
   * Responds 201 with the created vehicle.
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createVehicleSchema.parse(req.body);
      const vehicle = await this.vehicleService.addVehicle(data);
      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/vehicles.
   * Responds 200 with every vehicle.
   */
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicles = await this.vehicleService.listVehicles();
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/vehicles/search.
   * Responds 200 with the matching vehicles.
   */
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = searchVehiclesQuerySchema.parse(req.query);
      const vehicles = await this.vehicleService.searchVehicles(filters);
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT /api/vehicles/:id.
   * Responds 200 with the updated vehicle.
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = vehicleIdParamSchema.parse(req.params);
      const data = updateVehicleSchema.parse(req.body);
      const vehicle = await this.vehicleService.updateVehicle(id, data);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/vehicles/:id.
   * Responds 204 with no body.
   */
  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = vehicleIdParamSchema.parse(req.params);
      await this.vehicleService.deleteVehicle(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/vehicles/:id/purchase.
   * Responds 200 with the vehicle after its stock is decremented.
   */
  purchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = vehicleIdParamSchema.parse(req.params);
      const vehicle = await this.vehicleService.purchaseVehicle(id);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/vehicles/:id/restock.
   * Responds 200 with the vehicle after its stock is increased.
   */
  restock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = vehicleIdParamSchema.parse(req.params);
      const { quantity } = restockVehicleSchema.parse(req.body);
      const vehicle = await this.vehicleService.restockVehicle(id, quantity);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  };
}

export default VehicleController;
