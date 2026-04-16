import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RocketMotorCasingDetailsModel,
  RocketMotorCasingSubmitResponseModel,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import {
  createRocketMotorCasingFormApi,
  fetchRocketMotorCasingFormDetailsApi,
  updateRocketMotorCasingFormApi,
} from "../../../data/api/users/sourcing/rocketMotorCasingProcurementApi";

export type RocketMotorCasingCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  casingDetails: Record<string, any>;
};

export type RocketMotorCasingUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  casingDetails: Record<string, any>;
};

export type RocketMotorCasingDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const rocketMotorCasingController = {
  createForm: async (payload: RocketMotorCasingCreatePayload) => {
    try {
      const response = await createRocketMotorCasingFormApi(payload);
      return new ApiResponseModel<RocketMotorCasingSubmitResponseModel>(response, (res) =>
        RocketMotorCasingSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create rocket motor casing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: RocketMotorCasingDetailsPayload) => {
    try {
      const response = await fetchRocketMotorCasingFormDetailsApi(payload);
      return new ApiResponseModel<RocketMotorCasingDetailsModel>(response, (res) =>
        RocketMotorCasingDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch rocket motor casing form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RocketMotorCasingUpdatePayload) => {
    try {
      const response = await updateRocketMotorCasingFormApi(payload);
      return new ApiResponseModel<RocketMotorCasingSubmitResponseModel>(response, (res) =>
        RocketMotorCasingSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update rocket motor casing form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rocketMotorCasingController;