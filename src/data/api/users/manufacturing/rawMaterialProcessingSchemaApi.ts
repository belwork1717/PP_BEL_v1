import { post } from "../../httpClient";
import { USER_RAW_MATERIAL_PREPARATION_ENDPOINTS } from "../../endPoints";

export const fetchRawMaterialProcessingSchemaApi = async (payload: { materialCode: string }) => {
  return await post(USER_RAW_MATERIAL_PREPARATION_ENDPOINTS.PROCESSING_SCHEMA, payload);
};
