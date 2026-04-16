import { STRINGS } from "../../../app/config/strings";

/**
 * Standardized wrapper for all incoming API data or intercepted AppErrors.
 * Ensures that controllers return a robust interface to Redux/Hooks instead of throwing.
 */
export class ApiResponseModel<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  errorCode: string | null;
  timestamp?: string;
  data: T | null;

  constructor(apiResponse: any, dataModeler?: (data: any) => T) {
    if (!apiResponse) {
      this.success = false;
      this.statusCode = 500;
      this.message = STRINGS.SYSTEM.SERVER_ERROR;
      this.errorCode = "UNKNOWN_ERROR";
      this.data = null;
      return;
    }

    // Check if it's an AppError (from errorMapper) or an Error object that was thrown.
    if (apiResponse instanceof Error || (apiResponse.status !== undefined && apiResponse.message)) {
      this.success = false;
      this.statusCode = apiResponse.status || apiResponse.statusCode || 500;
      this.message = apiResponse.message || STRINGS.SYSTEM.SERVER_ERROR;
      this.errorCode = apiResponse.details?.errorCode || apiResponse.details || "INTERNAL_SERVER_ERROR";
      this.data = null;
    } else {
      // Direct API response
      this.success = apiResponse.success ?? false;
      this.statusCode = apiResponse.statusCode ?? (this.success ? 200 : 400);
      this.message = apiResponse.message ?? (this.success ? "Success" : "Failed");
      this.errorCode = apiResponse.error ?? null;
      this.timestamp = apiResponse.timestamp ?? undefined;
      
      let parsedData = apiResponse.data ?? null;
      if (this.success && parsedData && dataModeler) {
        try {
          parsedData = dataModeler(apiResponse); // We pass the full response so `UserModel.fromApi` which expects `{ data: { user, token } }` works
        } catch (e) {
          console.error("Error modeling data", e);
          parsedData = null;
        }
      }
      this.data = parsedData;
    }
  }
}
