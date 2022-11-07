import { Plugin } from 'obsidian';
import { PersonView, VIEW_TYPE_PERSON } from 'src/views/personView';


export default class PeoplePlugin extends Plugin {

	async onload() {
		this.registerView(
			VIEW_TYPE_PERSON,
			(leaf) => new PersonView(leaf)
		  );

		this.addRibbonIcon("contact", "People Details", () => {
			this.activateView();
		});
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PERSON);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_PERSON,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_PERSON)[0]
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PERSON);
	}
}