import { ComponentContext, getStudioProApi } from "@mendix/extensions-api";
import { useCallback, useEffect, useState } from "react";
import { loadModulesData, ModelApi } from "./data-loader";
import { ModuleData } from "./types";

interface UseDatabaseStructureResult {
    modules: ModuleData[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export const useDatabaseStructure = (componentContext: ComponentContext): UseDatabaseStructureResult => {
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const studioPro = getStudioProApi(componentContext) as unknown as ModelApi;
            const moduleDataList = await loadModulesData(studioPro);
            setModules(moduleDataList);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load database structure";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [componentContext]);

    useEffect(() => {
        void reload();
    }, [reload]);

    return {
        modules,
        isLoading,
        error,
        reload
    };
};
