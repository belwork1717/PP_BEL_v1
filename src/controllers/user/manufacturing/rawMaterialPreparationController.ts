import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RawMaterialPreparationDetailsModel,
  RawMaterialPreparationSubmitResponseModel,
} from "../../../data/models/user/RawMaterialPreparationModel";
import {
  createRawMaterialPreparationFormApi,
  fetchRawMaterialPreparationFormDetailsApi,
  updateRawMaterialPreparationFormApi,
} from "../../../data/api/users/manufacturing/rawMaterialPreparationApi";
import { fetchRawMaterialProcessingSchemaApi } from "../../../data/api/users/manufacturing/rawMaterialProcessingSchemaApi";
import { normalizeRawMaterialProcessingSchema } from "../../../data/models/user/RawMaterialProcessingSchemaModel";
import type { RawMaterialProcessingSchema } from "../../../data/models/user/rawMaterialProcessingSchema.types";

export type RawMaterialPreparationCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  materialTypes: Array<"solid" | "liquid" | "linear">;
  solidPreparation?: {
    instances: Array<{
      processId: string;
      data: any;
    }>;
  };
  liquidPreparation?: {
    partA: {
      jacketTemp: string | number;
      rpm: string | number;
      time: string | number;
    };
    partB: {
      rows: Array<{
        materialCode: string;
        percentage: string | number;
        weightKg: string | number;
        lotNo: string;
        dateTime: string;
        remarks: string;
      }>;
    };
  };
  linearPreparation?: {
    premix: {
      timeA: string | number;
      remarksA: string;
      timeB: string | number;
      remarksB: string;
      timeC: string | number;
      remarksC: string;
    };
    finalMix: {
      timeA: string | number;
      remarksA: string;
      timeB: string | number;
      remarksB: string;
    };
  };
};

export type RawMaterialPreparationUpdatePayload = Omit<RawMaterialPreparationCreatePayload, "batchId" | "formSubmissionType"> & {
  formId: string;
  formSubmissionType: "DRAFT" | "UPDATE";
};

export type RawMaterialPreparationDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export type RawMaterialProcessingSchemaPayload = {
  materialCode: string;
};

export const rawMaterialPreparationController = {
  createForm: async (payload: RawMaterialPreparationCreatePayload) => {
    try {
      const response = await createRawMaterialPreparationFormApi(payload);
      return new ApiResponseModel<RawMaterialPreparationSubmitResponseModel>(response, (res) =>
        RawMaterialPreparationSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create raw material preparation form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: RawMaterialPreparationDetailsPayload) => {
    try {
      const response = await fetchRawMaterialPreparationFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) =>
        RawMaterialPreparationDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material preparation form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RawMaterialPreparationUpdatePayload) => {
    try {
      const response = await updateRawMaterialPreparationFormApi(payload);
      return new ApiResponseModel<RawMaterialPreparationSubmitResponseModel>(response, (res) =>
        RawMaterialPreparationSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update raw material preparation form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchProcessingSchema: async (payload: RawMaterialProcessingSchemaPayload) => {
    try {
      const response = await fetchRawMaterialProcessingSchemaApi(payload);
      return new ApiResponseModel<RawMaterialProcessingSchema | null>(response, (res) =>
        normalizeRawMaterialProcessingSchema(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material processing schema:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialPreparationController;
