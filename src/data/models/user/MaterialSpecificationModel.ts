export type ReferenceRangeModel = {
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
};

export class MaterialSpecificationItemModel {
  specificationCode: string;
  specificationName: string;
  referenceRange: ReferenceRangeModel;

  constructor(payload: {
    specificationCode?: string;
    specificationName?: string;
    referenceRange?: Partial<ReferenceRangeModel>;
  }) {
    this.specificationCode = payload.specificationCode ?? "";
    this.specificationName = payload.specificationName ?? "";
    this.referenceRange = {
      minValue: payload.referenceRange?.minValue ?? null,
      maxValue: payload.referenceRange?.maxValue ?? null,
      unit: payload.referenceRange?.unit ?? null,
    };
  }

  get formattedReferenceRange(): string {
    const { minValue, maxValue, unit } = this.referenceRange;
    const unitSuffix = unit ? ` ${unit}` : "";

    if (minValue != null && maxValue != null) {
      return `${minValue} - ${maxValue}${unitSuffix}`;
    }

    if (minValue != null) {
      return `>= ${minValue}${unitSuffix}`;
    }

    if (maxValue != null) {
      return `<= ${maxValue}${unitSuffix}`;
    }

    return "N/A";
  }
}

export class MaterialSpecificationListModel {
  materialCode: string;
  specifications: MaterialSpecificationItemModel[];

  constructor(payload: { materialCode?: string; specifications?: MaterialSpecificationItemModel[] }) {
    this.materialCode = payload.materialCode ?? "";
    this.specifications = payload.specifications ?? [];
  }

  static fromApi(apiResponse: any): MaterialSpecificationListModel {
    const data = apiResponse?.data ?? {};
    const specs = Array.isArray(data?.specifications) ? data.specifications : [];

    return new MaterialSpecificationListModel({
      materialCode: data?.materialCode ?? "",
      specifications: specs.map((item: any) => new MaterialSpecificationItemModel(item)),
    });
  }
}
