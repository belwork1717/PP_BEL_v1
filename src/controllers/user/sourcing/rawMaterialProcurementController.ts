import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RawMaterialProcurementDetailsModel,
  RawMaterialProcurementSubmitResponseModel,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  createRawMaterialProcurementFormApi,
  fetchRawMaterialProcurementFormDetailsApi,
  updateRawMaterialProcurementFormApi,
} from "../../../data/api/users/sourcing/rawMaterialProcurementApi";

export type RawMaterialCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  materials: Array<{
    materialCode: string;
    lotNo: string;
    specifications: Array<{
      specificationCode: string;
      analysedResult: number | null;
      remarks: string;
    }>;
  }>;
};

export type RawMaterialUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  materials: Array<{
    materialCode: string;
    lotNo: string;
    specifications: Array<{
      specificationCode: string;
      analysedResult: number | null;
      remarks: string;
    }>;
  }>;
};

export type RawMaterialDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const rawMaterialProcurementController = {
  createForm: async (payload: RawMaterialCreatePayload) => {
    try {
      const response = await createRawMaterialProcurementFormApi(payload);
      return new ApiResponseModel<RawMaterialProcurementSubmitResponseModel>(response, (res) =>
        RawMaterialProcurementSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create raw material procurement form:", error);
      return new ApiResponseModel(error);
    }
  },

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

  updateForm: async (payload: RawMaterialUpdatePayload) => {
    try {
      const response = await updateRawMaterialProcurementFormApi(payload);
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
