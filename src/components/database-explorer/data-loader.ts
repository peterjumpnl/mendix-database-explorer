import { Primitives } from "@mendix/extensions-api";
import { EntityInfo, EntityType, ModuleData } from "./types";

type RawGeneralization = {
    $Type?: string;
    persistable?: boolean;
    generalization?: string;
};

type RawEntity = {
    $ID?: string;
    name?: string;
    source?: { $Type?: string };
    generalization?: RawGeneralization;
    attributes?: Array<{ $ID?: string; name?: string; type?: string | { $Type?: string } }>;
};

type RawAssociation = {
    name?: string;
    parent?: string;
    child?: string;
    type?: string | { $Type?: string };
};

type RawDomainModel = {
    $ID?: string;
    entities?: RawEntity[];
    associations?: RawAssociation[];
    crossAssociations?: RawAssociation[];
};

export type ModelApi = {
    app: {
        model: {
            projects: {
                getModules: () => Promise<Array<{ name: string; fromAppStore?: boolean }>>;
            };
            domainModels: {
                loadAll: (predicate: (info: Primitives.UnitInfo) => boolean) => Promise<unknown[]>;
            };
        };
    };
};

const toAssociationType = (type: RawAssociation["type"]): string => {
    if (typeof type === "string") {
        return type;
    }

    if (type?.$Type) {
        return String(type.$Type).includes("ReferenceSet") ? "ReferenceSet" : "Reference";
    }

    return "Reference";
};

const toAttributeType = (type: string | { $Type?: string } | undefined): string => {
    if (typeof type === "string") {
        return type;
    }

    if (type?.$Type) {
        const rawTypeName = String(type.$Type).split("$").pop() || "Unknown";
        return rawTypeName.replace(/AttributeType$/, "");
    }

    return "Unknown";
};

const determineEntityType = (entity: RawEntity, entitiesByName: Map<string, RawEntity>): EntityType => {
    const sourceType = entity.source?.$Type;

    if (sourceType === "DomainModels$QueryBasedRemoteEntitySource") {
        return "external";
    }

    if (sourceType === "DomainModels$OqlViewEntitySource") {
        return "view";
    }

    const isPersistable = (currentEntity: RawEntity, visited = new Set<string>()): boolean => {
        const generalization = currentEntity.generalization;

        if (generalization?.$Type === "DomainModels$NoGeneralization") {
            return generalization.persistable !== false;
        }

        if (generalization?.$Type === "DomainModels$Generalization") {
            const parentRef = generalization.generalization;
            if (typeof parentRef !== "string") {
                return true;
            }

            const parentName = parentRef.includes(".") ? parentRef.split(".").pop() ?? parentRef : parentRef;

            if (visited.has(parentName)) {
                return true;
            }

            visited.add(parentName);
            const parentEntity = entitiesByName.get(parentName);
            if (!parentEntity) {
                return true;
            }

            return isPersistable(parentEntity, visited);
        }

        return true;
    };

    return isPersistable(entity) ? "persistable" : "non-persistable";
};

const buildModuleData = (moduleName: string, domainModel: RawDomainModel): ModuleData | null => {
    const entities = domainModel.entities ?? [];

    const entityIdToName = new Map<string, string>();
    entities.forEach(entity => {
        if (entity.$ID && entity.name) {
            entityIdToName.set(entity.$ID, entity.name);
        }
    });

    const allAssociations = [...(domainModel.associations ?? []), ...(domainModel.crossAssociations ?? [])];

    const normalizedAssociations = allAssociations.map(assoc => {
        const parent = assoc.parent ?? "";
        const child = assoc.child ?? "";

        return {
            name: assoc.name ?? "",
            parent: entityIdToName.get(parent) ?? parent,
            child: typeof child === "string" && child.includes(".") ? child : entityIdToName.get(child) ?? child,
            type: toAssociationType(assoc.type)
        };
    });

    const entitiesByName = new Map<string, RawEntity>();
    entities.forEach(entity => {
        if (entity.name) {
            entitiesByName.set(entity.name, entity);
        }
    });

    const mappedEntities: EntityInfo[] = entities
        .filter((entity): entity is RawEntity & { name: string } => Boolean(entity.name))
        .map(entity => ({
            id: entity.$ID ?? `${moduleName}.${entity.name}`,
            name: entity.name,
            entityType: determineEntityType(entity, entitiesByName),
            attributes: (entity.attributes ?? []).map(attr => ({
                id: attr.$ID ?? `${entity.$ID ?? entity.name}.${attr.name ?? ""}`,
                name: attr.name ?? "",
                type: toAttributeType(attr.type)
            })),
            associations: normalizedAssociations
                .filter(assoc => assoc.parent === entity.name)
                .map(assoc => ({
                    name: assoc.name,
                    target: assoc.child,
                    type: assoc.type
                }))
        }));

    if (mappedEntities.length === 0) {
        return null;
    }

    return {
        moduleName,
        entities: mappedEntities,
        domainModelId: domainModel.$ID ?? ""
    };
};

export const loadModulesData = async (studioPro: ModelApi): Promise<ModuleData[]> => {
    const { domainModels, projects } = studioPro.app.model;
    const allModules = await projects.getModules();

    const candidateModules = allModules
        .filter(module => !module.fromAppStore && module.name !== "System")
        .sort((a, b) => a.name.localeCompare(b.name));

    const loadedModules = await Promise.all(
        candidateModules.map(async module => {
            const [domainModel] = await domainModels.loadAll(
                (info: Primitives.UnitInfo) => info.moduleName === module.name
            );

            if (!domainModel) {
                return null;
            }

            return buildModuleData(module.name, domainModel as RawDomainModel);
        })
    );

    return loadedModules.filter((module): module is ModuleData => module !== null);
};
