export class DimensionalParameterModel {
  paramId: string;
  paramName: string;
  referenceRange: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };

  constructor(payload: any) {
    this.paramId = payload?.paramId ?? "";
    this.paramName = payload?.paramName ?? "";
    this.referenceRange = {
      minValue: payload?.referenceRange?.minValue ?? null,
      maxValue: payload?.referenceRange?.maxValue ?? null,
      unit: payload?.referenceRange?.unit ?? null,
    };
  }

  get formattedRange(): string {
    const { minValue, maxValue, unit } = this.referenceRange;
    const unitSuffix = unit ? ` ${unit}` : "";

    if (minValue != null && maxValue != null) return `${minValue} - ${maxValue}${unitSuffix}`;
    if (minValue != null) return `>= ${minValue}${unitSuffix}`;
    if (maxValue != null) return `<= ${maxValue}${unitSuffix}`;
    return "N/A";
  }
}

export class DimensionalParametersListModel {
  motorType: string;
  parameters: DimensionalParameterModel[];

  constructor(payload: any) {
    this.motorType = payload?.motorType ?? "";
    this.parameters = Array.isArray(payload?.parameters)
      ? payload.parameters.map((item: any) => new DimensionalParameterModel(item))
      : [];
  }

  static fromApi(apiResponse: any): DimensionalParametersListModel {
    return new DimensionalParametersListModel(apiResponse?.data ?? {});
  }
}

export class SolidProcessItemModel {
  processId: string;
  processKey: string;
  label: string;
  description: string;

  constructor(payload: any) {
    this.processId = payload?.processId ?? "";
    this.processKey = payload?.processKey ?? "";
    this.label = payload?.label ?? "";
    this.description = payload?.description ?? "";
  }
}

export class SolidProcessesListModel {
  processes: SolidProcessItemModel[];

  constructor(payload: any) {
    this.processes = Array.isArray(payload?.processes)
      ? payload.processes.map((item: any) => new SolidProcessItemModel(item))
      : [];
  }

  static fromApi(apiResponse: any): SolidProcessesListModel {
    return new SolidProcessesListModel(apiResponse?.data ?? {});
  }
}
