import {
  fetchSubdepartmentBatchesApi,
  fetchMaterialsListApi,
  fetchMaterialSpecificationListApi,
  fetchDimensionalParametersListApi,
  fetchSolidProcessesListApi,
  fetchMotorsStageListApi,
  fetchApprovedMotorsListApi,
} from "../../data/api/users/operationsApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import {
  normalizeMaterialsListResponse,
  type MaterialsListItem,
  type MaterialsListRequest,
} from "../../data/models/user/MaterialsListModel";
import { MaterialSpecificationListModel } from "../../data/models/user/MaterialSpecificationModel";
import {
  DimensionalParametersListModel,
  MotorsStageListModel,
  AvailableMotorsListModel,
  SolidProcessesListModel,
} from "../../data/models/user/SubdepartmentCommonModel";

export type BatchListPayload = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  status?: string[];
  priority?: string[];
  search?: string;
};

export type MaterialSpecificationPayload = {
  materialCode: string;
};

export type DimensionalParametersPayload = {
  motorType: string;
};

export type SolidProcessesPayload = {
  materialType: string;
};

export const operationsController = {
  /**
   * Common API to fetch paginated batches dynamically based on subDepartmentId.
   */
  fetchSubdepartmentBatches: async (payload: BatchListPayload) => {
    try {
      const response = await fetchSubdepartmentBatchesApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to fetch subdepartment batches:", error);
      return new ApiResponseModel(error);
    }
  },

  /**
   * Fetch materials by type (SOLID | LIQUID) from subdepartment materials-list.
   */
  fetchMaterialsList: async (payload: MaterialsListRequest) => {
    try {
      const response = await fetchMaterialsListApi(payload);
      return new ApiResponseModel<MaterialsListItem[]>(response, (res) =>
        normalizeMaterialsListResponse(res?.data)
      );
    } catch (error) {
      console.error("Failed to fetch materials list:", error);
      return new ApiResponseModel(error);
    }
  },

  /**
   * Fetch solid + liquid materials and merge for dropdowns that need all types.
   */
  fetchAllMaterialsList: async () => {
    try {
      const [solidResponse, liquidResponse] = await Promise.all([
        fetchMaterialsListApi({ materialType: "SOLID" }),
        fetchMaterialsListApi({ materialType: "LIQUID" }),
      ]);

      const solidList =
        solidResponse?.success && Array.isArray(solidResponse.data)
          ? normalizeMaterialsListResponse(solidResponse.data)
          : [];
      const liquidList =
        liquidResponse?.success && Array.isArray(liquidResponse.data)
          ? normalizeMaterialsListResponse(liquidResponse.data)
          : [];
      const merged = [...solidList, ...liquidList];

      if (merged.length > 0) {
        return new ApiResponseModel<MaterialsListItem[]>({
          success: true,
          statusCode: 200,
          message: solidResponse?.message ?? liquidResponse?.message ?? "Materials fetched successfully",
          data: merged,
        });
      }

      const failedResponse = solidResponse?.success === false ? solidResponse : liquidResponse;
      return new ApiResponseModel<MaterialsListItem[]>(
        failedResponse ?? {
          success: false,
          statusCode: 500,
          message: "Failed to fetch materials",
          data: null,
        },
        (res) => normalizeMaterialsListResponse(res?.data)
      );
    } catch (error) {
      console.error("Failed to fetch all materials list:", error);
      return new ApiResponseModel(error);
    }
  },

  /**
   * Common API to fetch specification list for a material.
   */
  fetchMaterialSpecificationList: async (payload: MaterialSpecificationPayload) => {
    try {
      const response = await fetchMaterialSpecificationListApi(payload);
      return new ApiResponseModel<MaterialSpecificationListModel>(response, (res) =>
        MaterialSpecificationListModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch material specification list:", error);
      return new ApiResponseModel(error);
    }
  },

  /**
   * Common API to fetch dimensional parameters for a motor type.
   */
  fetchDimensionalParametersList: async (payload: DimensionalParametersPayload) => {
    try {
      const response = await fetchDimensionalParametersListApi(payload);
      return new ApiResponseModel<DimensionalParametersListModel>(response, (res) =>
        DimensionalParametersListModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch dimensional parameters:", error);
      return new ApiResponseModel(error);
    }
  },

  /**
   * Common API to fetch processes list for material type.
   */
  fetchSolidProcessesList: async (payload: SolidProcessesPayload) => {
    try {
      const response = await fetchSolidProcessesListApi(payload);
      return new ApiResponseModel<SolidProcessesListModel>(response, (res) =>
        SolidProcessesListModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch solid processes list:", error);
      return new ApiResponseModel(error);
    }
  },

  /**
   * Motor stages for batch create/edit (project-motor mapping).
   */
  fetchMotorsStageList: async (params?: { projectId?: string }) => {
    try {
      const response = await fetchMotorsStageListApi(params);
      return new ApiResponseModel<MotorsStageListModel>(response, (res) =>
        MotorsStageListModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch motors stage list:", error);
      return new ApiResponseModel(error);
    }
  },

  /** Approved motor casings for batch create (by project + motor stage). */
  fetchApprovedMotorsList: async (payload: { projectId: string; motorStage: string }) => {
    try {
      const response = await fetchApprovedMotorsListApi(payload);
      return new ApiResponseModel<AvailableMotorsListModel>(response, (res) =>
        AvailableMotorsListModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch approved motors list:", error);
      return new ApiResponseModel(error);
    }
  },
};

