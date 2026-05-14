import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RawMaterialCreateFormPayload,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRequest,
  RawMaterialLotUpdatePayload,
  RawMaterialProcurementDetailsModel,
  RawMaterialProcurementSubmitResponseModel,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  createRawMaterialProcurementFormApi,
  fetchRawMaterialLotListApi,
  fetchRawMaterialProcurementFormDetailsApi,
  updateRawMaterialProcurementFormApi,
} from "../../../data/api/users/sourcing/rawMaterialProcurementApi";

export type RawMaterialDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export type RawMaterialLotDetailsPayload = {
  lotId: string;
};

export const rawMaterialProcurementController = {
  fetchLotList: async (payload: RawMaterialLotListRequest) => {
    try {
      const response = await fetchRawMaterialLotListApi(payload as unknown as Record<string, unknown>);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to fetch raw material lot list:", error);
      return new ApiResponseModel(error);
    }
  },

  createForm: async (payload: RawMaterialCreateFormPayload) => {
    try {
      const response = await createRawMaterialProcurementFormApi(payload as unknown as Record<string, unknown>);
      return new ApiResponseModel<RawMaterialProcurementSubmitResponseModel>(response, (res) =>
        RawMaterialProcurementSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create raw material procurement form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchLotDetails: async (payload: RawMaterialLotDetailsPayload) => {
    try {
      const response = await fetchRawMaterialProcurementFormDetailsApi({ lotId: payload.lotId });
      return new ApiResponseModel<RawMaterialLotDetailsModel>(response, (res) =>
        RawMaterialLotDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material lot details:", error);
      return new ApiResponseModel(error);
    }
  },

  /** Legacy: formId + subDepartmentId (e.g. approver) */
  fetchFormDetails: async (payload: RawMaterialDetailsPayload) => {
    try {
      const response = await fetchRawMaterialProcurementFormDetailsApi(payload);
      return new ApiResponseModel<RawMaterialProcurementDetailsModel>(response, (res) =>
        RawMaterialProcurementDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material procurement form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RawMaterialLotUpdatePayload) => {
    try {
      const response = await updateRawMaterialProcurementFormApi(payload as unknown as Record<string, unknown>);
      return new ApiResponseModel<RawMaterialProcurementSubmitResponseModel>(response, (res) =>
        RawMaterialProcurementSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update raw material procurement form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialProcurementController;
