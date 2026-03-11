export type EntityType = "persistable" | "non-persistable" | "view" | "external";
export type ViewMode = "grouped" | "flat";

export interface AttributeInfo {
    id: string;
    name: string;
    type: string;
}

export interface AssociationInfo {
    name: string;
    target: string;
    type: string;
}

export interface EntityInfo {
    id: string;
    name: string;
    entityType: EntityType;
    attributes: AttributeInfo[];
    associations: AssociationInfo[];
}

export interface ModuleData {
    moduleName: string;
    entities: EntityInfo[];
    domainModelId: string;
}

export interface FlatEntityRow {
    moduleName: string;
    domainModelId: string;
    entity: EntityInfo;
}

export type RenameRequest =
    | {
          kind: "entity";
          moduleName: string;
          entityId: string;
          currentName: string;
      }
    | {
          kind: "attribute";
          moduleName: string;
          entityId: string;
          attributeId: string;
          currentName: string;
      };
