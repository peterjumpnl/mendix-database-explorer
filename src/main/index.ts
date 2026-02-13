import { IComponent, getStudioProApi } from "@mendix/extensions-api";

export const component: IComponent = {
    async loaded(componentContext) {
        const studioPro = getStudioProApi(componentContext);

        // Register the pane
        const paneHandle = await studioPro.ui.panes.register(
            { title: "Database Explorer", initialPosition: "right" },
            { componentName: "extension/database-explorer", uiEntrypoint: "pane" }
        );

        // Add menu item with action (11.6+ API - no more addEventListener)
        await studioPro.ui.extensionsMenu.add({
            menuId: "database-explorer.MainMenu",
            caption: "Database Explorer",
            action: async () => {
                studioPro.ui.panes.open(paneHandle);
            }
        });

        // Auto-open the pane on load
        setTimeout(() => {
            studioPro.ui.panes.open(paneHandle);
        }, 1000);
    }
}
