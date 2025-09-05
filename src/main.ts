import { Plugin } from "obsidian";
import { BookmarksPluginSettings, DEFAULT_SETTINGS } from "./types";
import { BookmarksSettingTab } from "./settings";
import { showFileInput } from "./ui";

export default class BookmarksImporterPlugin extends Plugin {
	settings: BookmarksPluginSettings;

	async onload() {
		await this.loadSettings();

		// Comando para importar bookmarks
		this.addCommand({
			id: "import-bookmarks",
			name: "Import Bookmarks HTML",
			callback: () => {
				showFileInput(this);
			},
		});

		// Adicionar item no menu de contexto
		this.addRibbonIcon("bookmark", "Import Bookmarks", () => {
			showFileInput(this);
		});

		// Adicionar configurações
		this.addSettingTab(new BookmarksSettingTab(this.app, this));
	}

	onunload() {
		// Limpeza quando o plugin é descarregado
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
