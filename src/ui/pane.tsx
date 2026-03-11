import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IComponent } from "@mendix/extensions-api";
import { DatabaseExplorer } from "../components/database-explorer";
import "../main/style.css";

export const component: IComponent = {
    async loaded(componentContext) {
        
        createRoot(document.getElementById("root")!).render(
            <StrictMode>
                <DatabaseExplorer componentContext={componentContext} />
            </StrictMode>
        );
    },
};
