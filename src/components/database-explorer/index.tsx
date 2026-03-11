import React, { useMemo, useState } from "react";
import { ComponentContext, getStudioProApi, Primitives } from "@mendix/extensions-api";
import "./database-explorer.css";
import { EntityTree } from "./entity-tree";
import { HeaderToolbar } from "./header-toolbar";
import { RenameRequest, ViewMode } from "./types";
import { useDatabaseStructure } from "./use-database-structure";

interface DatabaseExplorerProps {
    componentContext: ComponentContext;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ componentContext }) => {
    const studioPro = getStudioProApi(componentContext);
    const { modules, isLoading, error, reload } = useDatabaseStructure(componentContext);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [viewMode, setViewMode] = useState<ViewMode>("grouped");
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

    const handleRefresh = () => {
        void reload();
    };

    const toggleModule = (moduleName: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleName)) {
                next.delete(moduleName);
            } else {
                next.add(moduleName);
            }
            return next;
        });
    };

    const toggleEntity = (entityKey: string) => {
        setExpandedEntities(prev => {
            const next = new Set(prev);
            if (next.has(entityKey)) {
                next.delete(entityKey);
            } else {
                next.add(entityKey);
            }
            return next;
        });
    };

    const openDomainModel = async (domainModelId: string) => {
        if (domainModelId) {
            try {
                await studioPro.ui.editors.editDocument(domainModelId);
            } catch (err) {
                console.error("[DatabaseExplorer] Failed to open domain model:", err);
            }
        }
    };

    const expandAll = () => {
        const allModules = new Set(modules.map(m => m.moduleName));
        const allEntities = new Set<string>();
        modules.forEach(m => {
            m.entities.forEach(e => {
                allEntities.add(e.id);
            });
        });

        const areAllModulesExpanded = allModules.size > 0 && Array.from(allModules).every(moduleName => expandedModules.has(moduleName));

        if (!areAllModulesExpanded) {
            setExpandedModules(allModules);
            setExpandedEntities(new Set());
            return;
        }

        setExpandedEntities(allEntities);
    };

    const collapseAll = () => {
        if (expandedEntities.size > 0) {
            setExpandedEntities(new Set());
            return;
        }

        setExpandedModules(new Set());
    };

    const handleRenameRequest = async (request: RenameRequest, newName: string): Promise<boolean> => {
        try {
            const [domainModel] = await studioPro.app.model.domainModels.loadAll(
                (info: Primitives.UnitInfo) => info.moduleName === request.moduleName
            );

            if (!domainModel) {
                await studioPro.ui.messageBoxes.show("error", "Rename failed", "Could not load domain model.");
                return false;
            }

            const domainModelData = domainModel as any;

            if (request.kind === "entity") {
                const entity = (domainModelData.entities ?? []).find((candidate: any) => candidate.$ID === request.entityId);
                if (!entity) {
                    await studioPro.ui.messageBoxes.show("error", "Rename failed", "Entity not found in domain model.");
                    return false;
                }
                entity.name = newName;
            } else {
                const entity = (domainModelData.entities ?? []).find((candidate: any) => candidate.$ID === request.entityId);
                if (!entity) {
                    await studioPro.ui.messageBoxes.show("error", "Rename failed", "Entity for attribute not found.");
                    return false;
                }

                const attribute = (entity.attributes ?? []).find((candidate: any) => candidate.$ID === request.attributeId);
                if (!attribute) {
                    await studioPro.ui.messageBoxes.show("error", "Rename failed", "Attribute not found in domain model.");
                    return false;
                }
                attribute.name = newName;
            }

            await studioPro.app.model.domainModels.save(domainModel as any);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Rename failed.";
            await studioPro.ui.messageBoxes.show("error", "Rename failed", message);
            return false;
        }
    };

    const filteredModules = useMemo(() => {
        const query = searchQuery.toLowerCase();

        return modules
            .map(module => ({
                ...module,
                entities: module.entities.filter(entity => {
                    if (!query) return true;
                    if (entity.name.toLowerCase().includes(query)) return true;
                    if (entity.attributes.some(a => a.name.toLowerCase().includes(query))) return true;
                    if (entity.associations.some(a => a.name.toLowerCase().includes(query))) return true;
                    return false;
                })
            }))
            .filter(module => {
                if (!query) return module.entities.length > 0;
                if (module.moduleName.toLowerCase().includes(query)) return true;
                return module.entities.length > 0;
            });
    }, [modules, searchQuery]);

    const flatEntities = useMemo(
        () =>
            filteredModules
                .flatMap(module =>
                    module.entities.map(entity => ({
                        moduleName: module.moduleName,
                        domainModelId: module.domainModelId,
                        entity
                    }))
                )
                .sort((a, b) => {
                    const byEntityName = a.entity.name.localeCompare(b.entity.name);
                    if (byEntityName !== 0) {
                        return byEntityName;
                    }
                    return a.moduleName.localeCompare(b.moduleName);
                }),
        [filteredModules]
    );

    if (isLoading) {
        return (
            <div className="database-explorer">
                <div className="loading">Loading database structure...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="database-explorer">
                <div className="error">
                    <span>Error: {error}</span>
                    <button onClick={handleRefresh} className="refresh-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="database-explorer">
            <HeaderToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
                onToggleViewMode={() => setViewMode(prev => (prev === "grouped" ? "flat" : "grouped"))}
                onRefresh={handleRefresh}
                viewMode={viewMode}
            />
            <EntityTree
                viewMode={viewMode}
                filteredModules={filteredModules}
                flatEntities={flatEntities}
                expandedModules={expandedModules}
                expandedEntities={expandedEntities}
                onToggleModule={toggleModule}
                onToggleEntity={toggleEntity}
                onOpenDomainModel={openDomainModel}
                onRenameRequest={handleRenameRequest}
                searchQuery={searchQuery}
            />
        </div>
    );
};

export default DatabaseExplorer;
