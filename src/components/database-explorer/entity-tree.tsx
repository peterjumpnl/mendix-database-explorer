import React, { useEffect, useMemo, useState } from "react";
import { AssociationIcon, AttributeIcon, ChevronIcon, TableIcon } from "./icons";
import { EntityInfo, FlatEntityRow, ModuleData, RenameRequest, ViewMode } from "./types";

const NAME_PATTERN = /^[a-zA-Z0-9]+$/;

interface EntityTreeProps {
    viewMode: ViewMode;
    filteredModules: ModuleData[];
    flatEntities: FlatEntityRow[];
    expandedModules: Set<string>;
    expandedEntities: Set<string>;
    onToggleModule: (moduleName: string) => void;
    onToggleEntity: (entityId: string) => void;
    onOpenDomainModel: (domainModelId: string) => void;
    onRenameRequest: (request: RenameRequest, newName: string) => Promise<boolean>;
    searchQuery: string;
}

const getEntityItemKey = (entityId: string): string => `entity:${entityId}`;
const getAttributeItemKey = (attributeId: string): string => `attribute:${attributeId}`;

const EntityNode: React.FC<{
    entity: EntityInfo;
    moduleName: string;
    domainModelId: string;
    isExpanded: boolean;
    selectedItemKey: string | null;
    editingItemKey: string | null;
    editingValue: string;
    isSavingRename: boolean;
    onSelectItem: (itemKey: string) => void;
    onEditingValueChange: (value: string) => void;
    onCommitEditing: () => void;
    onCancelEditing: () => void;
    onToggleEntity: (entityId: string) => void;
    onOpenDomainModel: (domainModelId: string) => void;
    getEntityDisplayName: (entity: EntityInfo) => string;
    getAttributeDisplayName: (attributeId: string, fallbackName: string) => string;
    showModuleName?: boolean;
}> = ({
    entity,
    moduleName,
    domainModelId,
    isExpanded,
    selectedItemKey,
    editingItemKey,
    editingValue,
    isSavingRename,
    onSelectItem,
    onEditingValueChange,
    onCommitEditing,
    onCancelEditing,
    onToggleEntity,
    onOpenDomainModel,
    getEntityDisplayName,
    getAttributeDisplayName,
    showModuleName
}) => {
    const entityItemKey = getEntityItemKey(entity.id);
    const hasChildren = entity.attributes.length > 0 || entity.associations.length > 0;

    return (
        <div key={entity.id} className="entity-node">
            <div
                className={`entity-header ${hasChildren ? "expandable" : ""} ${selectedItemKey === entityItemKey ? "is-selected" : ""}`}
                onClick={() => {
                    onSelectItem(entityItemKey);
                    if (hasChildren) {
                        onToggleEntity(entity.id);
                    }
                }}
                onDoubleClick={() => onOpenDomainModel(domainModelId)}
                title="Double-click to open Domain Model"
            >
                {hasChildren && <span className={`tree-chevron ${isExpanded ? "expanded" : ""}`}><ChevronIcon /></span>}
                <span className="entity-icon"><TableIcon entityType={entity.entityType} /></span>
                {editingItemKey === entityItemKey ? (
                    isSavingRename ? (
                        <span className="entity-name">{editingValue}</span>
                    ) : (
                        <input
                            className="inline-rename-input"
                            value={editingValue}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            onChange={e => onEditingValueChange(e.target.value)}
                            onBlur={onCommitEditing}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    void onCommitEditing();
                                }
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    onCancelEditing();
                                }
                            }}
                        />
                    )
                ) : (
                    <span className="entity-name">{getEntityDisplayName(entity)}</span>
                )}
                {editingItemKey === entityItemKey && isSavingRename && <span className="inline-rename-spinner" aria-hidden="true" />}
                {showModuleName && <span className="entity-module-name">[{moduleName}]</span>}
            </div>
            {isExpanded && (
                <div className="entity-children">
                    {entity.attributes.map(attr => {
                        const attrItemKey = getAttributeItemKey(attr.id);
                        return (
                            <div
                                key={attr.id}
                                className={`attribute-row ${selectedItemKey === attrItemKey ? "is-selected" : ""}`}
                                onClick={() => onSelectItem(attrItemKey)}
                            >
                                <span className="row-icon"><AttributeIcon /></span>
                                {editingItemKey === attrItemKey ? (
                                    isSavingRename ? (
                                        <span className="attr-name">{editingValue}</span>
                                    ) : (
                                        <input
                                            className="inline-rename-input"
                                            value={editingValue}
                                            autoFocus
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => onEditingValueChange(e.target.value)}
                                            onBlur={onCommitEditing}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    void onCommitEditing();
                                                }
                                                if (e.key === "Escape") {
                                                    e.preventDefault();
                                                    onCancelEditing();
                                                }
                                            }}
                                        />
                                    )
                                ) : (
                                    <span className="attr-name">{getAttributeDisplayName(attr.id, attr.name)}</span>
                                )}
                                {editingItemKey === attrItemKey && isSavingRename && <span className="inline-rename-spinner" aria-hidden="true" />}
                                <span className="attr-type">{attr.type}</span>
                            </div>
                        );
                    })}
                    {entity.associations.map((assoc, index) => {
                        const assocKey = `${entity.id}.assoc.${index}`;
                        const targetParts = assoc.target.split(".");
                        const targetEntityName = targetParts.pop() || assoc.target;
                        const targetModuleName = targetParts.length > 0 ? targetParts.join(".") : "";

                        return (
                            <div
                                key={assocKey}
                                className={`association-row ${selectedItemKey === assocKey ? "is-selected" : ""}`}
                                onClick={() => onSelectItem(assocKey)}
                            >
                                <span className="row-icon"><AssociationIcon /></span>
                                <span className="assoc-name">{assoc.name}</span>
                                <span className="assoc-target" title={assoc.target}>
                                    <span className="assoc-target-arrow">→</span>
                                    {targetModuleName && <span className="assoc-target-module">{targetModuleName}.</span>}
                                    <span className="assoc-target-entity">{targetEntityName}</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const EntityTree: React.FC<EntityTreeProps> = ({
    viewMode,
    filteredModules,
    flatEntities,
    expandedModules,
    expandedEntities,
    onToggleModule,
    onToggleEntity,
    onOpenDomainModel,
    onRenameRequest,
    searchQuery
}) => {
    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
    const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>("");
    const [isSavingRename, setIsSavingRename] = useState<boolean>(false);
    const [entityNameOverrides, setEntityNameOverrides] = useState<Record<string, string>>({});
    const [attributeNameOverrides, setAttributeNameOverrides] = useState<Record<string, string>>({});

    const renamableItems = useMemo(() => {
        const items = new Map<string, RenameRequest>();

        filteredModules.forEach(module => {
            module.entities.forEach(entity => {
                items.set(getEntityItemKey(entity.id), {
                    kind: "entity",
                    moduleName: module.moduleName,
                    entityId: entity.id,
                    currentName: entityNameOverrides[entity.id] ?? entity.name
                });

                entity.attributes.forEach(attribute => {
                    items.set(getAttributeItemKey(attribute.id), {
                        kind: "attribute",
                        moduleName: module.moduleName,
                        entityId: entity.id,
                        attributeId: attribute.id,
                        currentName: attributeNameOverrides[attribute.id] ?? attribute.name
                    });
                });
            });
        });

        return items;
    }, [filteredModules, entityNameOverrides, attributeNameOverrides]);

    const commitEditing = async () => {
        if (!editingItemKey || isSavingRename) {
            return;
        }

        const renameRequest = renamableItems.get(editingItemKey);
        if (!renameRequest) {
            setEditingItemKey(null);
            setEditingValue("");
            return;
        }

        const nextValue = editingValue.trim();
        if (nextValue.length === 0) {
            setEditingItemKey(null);
            setEditingValue("");
            return;
        }

        if (!NAME_PATTERN.test(nextValue)) {
            return;
        }

        if (nextValue === renameRequest.currentName) {
            setEditingItemKey(null);
            setEditingValue("");
            return;
        }

        setIsSavingRename(true);
        const success = await onRenameRequest(renameRequest, nextValue);
        setIsSavingRename(false);

        if (!success) {
            return;
        }

        if (renameRequest.kind === "entity") {
            setEntityNameOverrides(prev => ({ ...prev, [renameRequest.entityId]: nextValue }));
        } else {
            setAttributeNameOverrides(prev => ({ ...prev, [renameRequest.attributeId]: nextValue }));
        }

        setEditingItemKey(null);
        setEditingValue("");
    };

    const cancelEditing = () => {
        setEditingItemKey(null);
        setEditingValue("");
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "F2" || !selectedItemKey || editingItemKey) {
                return;
            }

            const renameRequest = renamableItems.get(selectedItemKey);
            if (!renameRequest) {
                return;
            }

            event.preventDefault();
            setEditingItemKey(selectedItemKey);
            setEditingValue(renameRequest.currentName);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedItemKey, editingItemKey, renamableItems]);

    return (
        <div className="tree-container">
            {viewMode === "grouped" && filteredModules.map(module => {
                const isModuleExpanded = expandedModules.has(module.moduleName);
                const moduleItemKey = `module:${module.moduleName}`;

                return (
                    <div key={module.moduleName} className="module-node">
                        <div
                            className={`module-header ${isModuleExpanded ? "expanded" : ""} ${selectedItemKey === moduleItemKey ? "is-selected" : ""}`}
                            onClick={() => {
                                setSelectedItemKey(moduleItemKey);
                                onToggleModule(module.moduleName);
                            }}
                        >
                            <span className={`tree-chevron ${isModuleExpanded ? "expanded" : ""}`}><ChevronIcon /></span>
                            <span className="module-name">{module.moduleName}</span>
                        </div>

                        {isModuleExpanded && (
                            <div className="module-children">
                                {module.entities.map(entity => (
                                    <EntityNode
                                        key={entity.id}
                                        entity={entity}
                                        moduleName={module.moduleName}
                                        domainModelId={module.domainModelId}
                                        isExpanded={expandedEntities.has(entity.id)}
                                        selectedItemKey={selectedItemKey}
                                        editingItemKey={editingItemKey}
                                        editingValue={editingValue}
                                        isSavingRename={isSavingRename}
                                        onSelectItem={setSelectedItemKey}
                                        onEditingValueChange={value => {
                                            if (!/^[a-zA-Z0-9]*$/.test(value)) {
                                                return;
                                            }
                                            setEditingValue(value);
                                        }}
                                        onCommitEditing={commitEditing}
                                        onCancelEditing={cancelEditing}
                                        onToggleEntity={onToggleEntity}
                                        onOpenDomainModel={onOpenDomainModel}
                                        getEntityDisplayName={entityNode => entityNameOverrides[entityNode.id] ?? entityNode.name}
                                        getAttributeDisplayName={(attributeId, fallbackName) =>
                                            attributeNameOverrides[attributeId] ?? fallbackName
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {viewMode === "flat" && flatEntities.map(({ moduleName, domainModelId, entity }) => (
                <EntityNode
                    key={entity.id}
                    entity={entity}
                    moduleName={moduleName}
                    domainModelId={domainModelId}
                    isExpanded={expandedEntities.has(entity.id)}
                    selectedItemKey={selectedItemKey}
                    editingItemKey={editingItemKey}
                    editingValue={editingValue}
                    isSavingRename={isSavingRename}
                    onSelectItem={setSelectedItemKey}
                    onEditingValueChange={value => {
                        if (!/^[a-zA-Z0-9]*$/.test(value)) {
                            return;
                        }
                        setEditingValue(value);
                    }}
                    onCommitEditing={commitEditing}
                    onCancelEditing={cancelEditing}
                    onToggleEntity={onToggleEntity}
                    onOpenDomainModel={onOpenDomainModel}
                    getEntityDisplayName={entityNode => entityNameOverrides[entityNode.id] ?? entityNode.name}
                    getAttributeDisplayName={(attributeId, fallbackName) =>
                        attributeNameOverrides[attributeId] ?? fallbackName
                    }
                    showModuleName
                />
            ))}

            {((viewMode === "grouped" && filteredModules.length === 0) ||
                (viewMode === "flat" && flatEntities.length === 0)) && (
                <div className="empty-state">{searchQuery ? "No matches found." : "No entities found in the project."}</div>
            )}
        </div>
    );
};
