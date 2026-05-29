export type RawMaterialProcessingField = {
  key: string;
  label: string;
  type: string;
  unit?: string;
};

export type RawMaterialProcessingColumn = {
  key: string;
  label: string;
  type: string;
  readonly?: boolean;
  unit?: string;
};

export type RawMaterialProcessingSection = {
  sectionId: string;
  title: string;
  type: "dynamic-group" | "table" | string;
  addRowAllowed?: boolean;
  fields?: RawMaterialProcessingField[];
  columns?: RawMaterialProcessingColumn[];
  defaultRows?: Record<string, unknown>[];
};

export type RawMaterialGrade = {
  gradeId: number;
  gradeCode: string;
  gradeName: string;
};

export type RawMaterialProcessingSchema = {
  rawMaterialDetails: {
    rawMaterialId?: number;
    materialCode: string;
    materialName: string;
    availableGrades?: RawMaterialGrade[];
  };
  screen?: string;
  module?: string;
  sections: RawMaterialProcessingSection[];
};

export type SchemaDrivenSolidPayload = {
  materialCode: string;
  gradeCode: string;
  sectionData: Record<string, Record<string, unknown>[]>;
};
