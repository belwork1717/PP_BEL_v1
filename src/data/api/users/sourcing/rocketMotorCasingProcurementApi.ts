import { post, put } from "../../httpClient";
import { USER_ROCKET_MOTOR_CASING_ENDPOINTS } from "../../endPoints";

export const createRocketMotorCasingFormApi = async (payload: any) => {
  return await post(USER_ROCKET_MOTOR_CASING_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRocketMotorCasingFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_ROCKET_MOTOR_CASING_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRocketMotorCasingFormApi = async (payload: any) => {
  return await put(USER_ROCKET_MOTOR_CASING_ENDPOINTS.UPDATE_FORM, payload);
};
