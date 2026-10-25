/**
 * Application-level error carrying an HTTP status code.
 * Thrown by services and translated to a JSON response by the error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  /**
   * @param statusCode HTTP status code to respond with.
   * @param message Human-readable, client-safe error message.
   */
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export default AppError;
