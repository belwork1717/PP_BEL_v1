import { post, put } from "../../httpClient";
import { USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS } from "../../endPoints";

export const createRawMaterialProcurementFormApi = async (payload: any) => {
  return await post(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRawMaterialProcurementFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRawMaterialProcurementFormApi = async (payload: any) => {
  return await put(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.UPDATE_FORM, payload);
};
