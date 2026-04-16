import { get, post } from "../httpClient";
import { USER_OPERATIONS_ENDPOINTS } from "../endPoints";

export const fetchSubdepartmentBatchesApi = async (payload: any) => {
  return await post(USER_OPERATIONS_ENDPOINTS.BATCH_LIST, payload);
};

export const fetchMaterialsListApi = async () => {
  return await get(USER_OPERATIONS_ENDPOINTS.MATERIALS_LIST);
};

export const fetchMaterialSpecificationListApi = async (payload: { materialCode: string }) => {
  return await post(USER_OPERATIONS_ENDPOINTS.MATERIAL_SPECIFICATION_LIST, payload);
};

export const fetchDimensionalParametersListApi = async (payload: { motorType: string }) => {
  return await post(USER_OPERATIONS_ENDPOINTS.DIMENSIONAL_PARAMETERS_LIST, payload);
};

export const fetchSolidProcessesListApi = async (payload: { materialType: string }) => {
  return await post(USER_OPERATIONS_ENDPOINTS.SOLID_PROCESSES_LIST, payload);
};
