import { Plugin, TFile } from 'obsidian';
import { Person } from 'src/data/Person';
import { importContact } from 'src/utils/vcsImporter';
import { PersonView, VIEW_TYPE_PERSON } from 'src/views/PersonView';
import vCard from 'vcf';


export default class PeoplePlugin extends Plugin {

	async onload() {
		this.registerView(
			VIEW_TYPE_PERSON,
			(leaf) => new PersonView(leaf)
		  );

		this.addRibbonIcon("contact", "People Details", () => {
			this.activateView();
		});
		this.registerImportMenu();

		this.addCommand({
			id: 'import-contact',
			name: 'Import contact',
			callback: () => {
				importContact();
			}
		});
	}

	private registerImportMenu() {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!file.path.endsWith("vcf")){
					return;
				}

				menu.addItem((item) => {
					item
						.setTitle("Import as contact")
						.setIcon("document")
						.onClick(async () => {
							file.vault.read(file as TFile)
							.then(t => {
								let card = new vCard().parse(t);
								let person = new Person(this.app);
								person.importVCard(card)
								person.save()
							})
						});
				});
			})
		);
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
