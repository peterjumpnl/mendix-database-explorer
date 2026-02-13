import React, { useEffect, useState } from "react";
import { Primitives, ComponentContext, getStudioProApi } from "@mendix/extensions-api";
import "./database-explorer.css";

const TableIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="12" height="12" rx="1" stroke="#0066cc" strokeWidth="1.5" fill="none"/>
        <text x="8" y="11" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0066cc">E</text>
    </svg>
);

const AttributeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="7" cy="7" r="1.5" fill="#666"/>
    </svg>
);

const AssociationIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 10V6a2 2 0 012-2h4" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="2" cy="10" r="1.5" fill="#0066cc"/>
        <path d="M10 4l2 0M10 4l-2-2M10 4l-2 2" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ChevronIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

interface DatabaseExplorerProps {
    componentContext: ComponentContext;
}

interface EntityInfo {
    name: string;
    attributes: { name: string; type: string }[];
    associations: { name: string; target: string; type: string }[];
}

interface ModuleData {
    moduleName: string;
    entities: EntityInfo[];
    domainModelId: string;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ componentContext }) => {
    const studioPro = getStudioProApi(componentContext);
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadDatabaseStructure();
    }, []);

    const loadDatabaseStructure = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { domainModels, projects } = studioPro.app.model;
            const allModules = await projects.getModules();

            const moduleDataList: ModuleData[] = [];

            const sortedModules = [...allModules].sort((a, b) => a.name.localeCompare(b.name));

            for (const module of sortedModules) {
                if (module.fromAppStore || module.name === "System") continue;

                const [domainModel] = await domainModels.loadAll(
                    (info: Primitives.UnitInfo) => info.moduleName === module.name
                );

                if (!domainModel) continue;

                const domainModelData = domainModel as any;
                
                // Build entity ID to name mapping
                const entityIdToName: Record<string, string> = {};
                for (const entity of domainModelData.entities) {
                    entityIdToName[entity.$ID] = entity.name;
                }
                
                const extractAssociation = (assoc: any) => {
                    // Resolve parent/child GUIDs to entity names
                    let parentName = entityIdToName[assoc.parent] || assoc.parent;
                    let childName = entityIdToName[assoc.child] || assoc.child;
                    
                    // Handle cross-module associations (child may be "ModuleName.EntityName")
                    if (typeof assoc.child === "string" && assoc.child.includes(".")) {
                        childName = assoc.child;
                    }
                    
                    let assocType = "Reference";
                    if (typeof assoc.type === "string") {
                        assocType = assoc.type;
                    } else if (assoc.type?.$Type) {
                        assocType = String(assoc.type.$Type).includes("ReferenceSet") ? "ReferenceSet" : "Reference";
                    }
                    
                    return {
                        name: assoc.name,
                        parent: parentName,
                        child: childName,
                        type: assocType
                    };
                };
                
                const allAssociations = [
                    ...(domainModelData.associations || []).map(extractAssociation),
                    ...(domainModelData.crossAssociations || []).map(extractAssociation)
                ];

                const entities: EntityInfo[] = domainModelData.entities.map((entity: any) => {
                    const entityAssociations = allAssociations
                        .filter((a: any) => a.parent === entity.name)
                        .map((a: any) => ({
                            name: a.name,
                            target: a.child,
                            type: a.type
                        }));

                    return {
                        name: entity.name,
                        attributes: entity.attributes.map((attr: any) => {
                            let typeName = "Unknown";
                            if (typeof attr.type === "string") {
                                typeName = attr.type;
                            } else if (attr.type?.$Type) {
                                typeName = String(attr.type.$Type).split("$").pop() || "Unknown";
                            }
                            return { name: attr.name, type: typeName };
                        }),
                        associations: entityAssociations
                    };
                });

                if (entities.length > 0) {
                    moduleDataList.push({
                        moduleName: module.name,
                        entities,
                        domainModelId: domainModelData.$ID || ""
                    });
                }
            }

            setModules(moduleDataList);
        } catch (err: any) {
            setError(err.message || "Failed to load database structure");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        loadDatabaseStructure();
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
                allEntities.add(`${m.moduleName}.${e.name}`);
            });
        });
        setExpandedModules(allModules);
        setExpandedEntities(allEntities);
    };

    const collapseAll = () => {
        setExpandedModules(new Set());
        setExpandedEntities(new Set());
    };

    const filteredModules = modules.map(module => ({
        ...module,
        entities: module.entities.filter(entity => {
            const query = searchQuery.toLowerCase();
            if (!query) return true;
            if (entity.name.toLowerCase().includes(query)) return true;
            if (entity.attributes.some(a => a.name.toLowerCase().includes(query))) return true;
            if (entity.associations.some(a => a.name.toLowerCase().includes(query))) return true;
            return false;
        })
    })).filter(module => {
        const query = searchQuery.toLowerCase();
        if (!query) return module.entities.length > 0;
        if (module.moduleName.toLowerCase().includes(query)) return true;
        return module.entities.length > 0;
    });

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
            <div className="header">
                <div className="header-actions">
                    <button onClick={expandAll} className="icon-btn" title="Expand All">⊞</button>
                    <button onClick={collapseAll} className="icon-btn" title="Collapse All">⊟</button>
                </div>
                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button onClick={handleRefresh} className="icon-btn" title="Refresh">⟳</button>
            </div>
            <div className="tree-container">
                {filteredModules.map((module) => {
                    const isModuleExpanded = expandedModules.has(module.moduleName);
                    return (
                        <div key={module.moduleName} className="module-node">
                            <div 
                                className="module-header"
                                onClick={() => toggleModule(module.moduleName)}
                            >
                                <span className={`tree-chevron ${isModuleExpanded ? 'expanded' : ''}`}><ChevronIcon /></span>
                                <span className="module-name">{module.moduleName}</span>
                            </div>
                            {isModuleExpanded && (
                                <div className="module-children">
                                    {module.entities.map((entity) => {
                                        const entityKey = `${module.moduleName}.${entity.name}`;
                                        const isEntityExpanded = expandedEntities.has(entityKey);
                                        const hasChildren = entity.attributes.length > 0 || entity.associations.length > 0;
                                        return (
                                            <div key={entityKey} className="entity-node">
                                                <div 
                                                    className={`entity-header ${hasChildren ? 'expandable' : ''}`}
                                                    onClick={() => hasChildren && toggleEntity(entityKey)}
                                                    onDoubleClick={() => openDomainModel(module.domainModelId)}
                                                    title="Double-click to open Domain Model"
                                                >
                                                    {hasChildren && (
                                                        <span className={`tree-chevron ${isEntityExpanded ? 'expanded' : ''}`}><ChevronIcon /></span>
                                                    )}
                                                    <span className="entity-icon"><TableIcon /></span>
                                                    <span className="entity-name">{entity.name}</span>
                                                </div>
                                                {isEntityExpanded && (
                                                    <div className="entity-children">
                                                        {entity.attributes.map((attr) => (
                                                            <div 
                                                                key={`${entityKey}.attr.${attr.name}`}
                                                                className="attribute-row"
                                                            >
                                                                <span className="row-icon"><AttributeIcon /></span>
                                                                <span className="attr-name">{attr.name}</span>
                                                                <span className="attr-type">{attr.type}</span>
                                                            </div>
                                                        ))}
                                                        {entity.associations.map((assoc) => (
                                                            <div 
                                                                key={`${entityKey}.assoc.${assoc.name}`}
                                                                className="association-row"
                                                            >
                                                                <span className="row-icon"><AssociationIcon /></span>
                                                                <span className="assoc-name">{assoc.name}</span>
                                                                <span className="assoc-target">→ {assoc.target}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredModules.length === 0 && (
                    <div className="empty-state">
                        {searchQuery ? "No matches found." : "No entities found in the project."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseExplorer;
