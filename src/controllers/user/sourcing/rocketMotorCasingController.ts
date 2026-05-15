import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RocketMotorCasingDetailsModel,
  RocketMotorCasingSubmitResponseModel,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import {
  createRocketMotorCasingFormApi,
  fetchRocketMotorCasingFormDetailsApi,
  fetchRocketMotorCasingListApi,
  type RocketMotorCasingListRequest,
  updateRocketMotorCasingFormApi,
} from "../../../data/api/users/sourcing/rocketMotorCasingProcurementApi";

export type RocketMotorCasingCreatePayload = {
  subDepartmentId: number;
  motorStage: string;
  motorNo: string;
  motorCasingId: string;
  formSubmissionType: "DRAFT" | "SUBMIT";
  sections: Record<string, unknown>;
};

export type RocketMotorCasingUpdatePayload = RocketMotorCasingCreatePayload;

export type RocketMotorCasingDetailsPayload = {
  motorCasingId: string;
};

export const rocketMotorCasingController = {
  fetchCasingList: async (payload: RocketMotorCasingListRequest) => {
    try {
      const response = await fetchRocketMotorCasingListApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to fetch rocket motor casing list:", error);
      return new ApiResponseModel(error);
    }
  },

  createForm: async (payload: RocketMotorCasingCreatePayload) => {
    try {
      const response = await createRocketMotorCasingFormApi(payload as unknown as Record<string, unknown>);
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
      const response = await updateRocketMotorCasingFormApi(payload as unknown as Record<string, unknown>);
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
