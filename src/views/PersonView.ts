import { ItemView } from "obsidian";
import { Person } from "src/data/Person";
import PersonViewComponent from "../components/PersonViewComponent.svelte";
export const VIEW_TYPE_PERSON = "person-view";

export class PersonView extends ItemView {
    component: PersonViewComponent;
    
    getViewType(): string {
        return VIEW_TYPE_PERSON;
    }

    getDisplayText(): string {
        return "People";
    }

    getIcon(): string {
        return "contact";
    }

    async onOpen() {
        this.component = new PersonViewComponent({
            target: this.contentEl
        });
        this.redraw = this.redraw.bind(this);
        this.redraw();

        this.app.workspace.on("layout-change", this.redraw);
        this.registerEvent(this.app.metadataCache.on('resolved', this.redraw));
        this.registerEvent(this.app.metadataCache.on('changed', this.redraw));
    }

    public async redraw(): Promise<void> {
        const file = this.app.workspace.getActiveFile();
        this.component?.$set({ person: Person.fromFile(file, this.app) });
    }

    async onClose() {
        this.app.workspace.off("layout-change", this.redraw)
        this.component.$destroy();
    }
}
