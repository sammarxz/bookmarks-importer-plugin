import { App, PluginSettingTab, Setting } from "obsidian";
import BookmarksImporterPlugin from "./main";
import { BookmarksPluginSettings } from "./types";

export class BookmarksSettingTab extends PluginSettingTab {
	plugin: BookmarksImporterPlugin;

	constructor(app: App, plugin: BookmarksImporterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Bookmarks Importer Settings",
		});

		// File naming section
		containerEl.createEl("h3", { text: "File Settings" });

		new Setting(containerEl)
			.setName("Filename pattern")
			.setDesc(
				"Pattern for generated filenames. Use {title}, {date}, {timestamp}"
			)
			.addText((text) =>
				text
					.setPlaceholder("{title} {date}")
					.setValue(this.plugin.settings.fileNamePattern)
					.onChange(async (value) => {
						this.plugin.settings.fileNamePattern =
							value || "{title} {date}";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Base filename")
			.setDesc("Base name used in the {title} variable")
			.addText((text) =>
				text
					.setPlaceholder("Bookmarks")
					.setValue(this.plugin.settings.outputFileName)
					.onChange(async (value) => {
						this.plugin.settings.outputFileName =
							value || "Bookmarks";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Date format")
			.setDesc("Date format used in the {date} variable")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("YYYY-MM-DD", "2023-12-31")
					.addOption("DD-MM-YYYY", "31-12-2023")
					.addOption("MM-DD-YYYY", "12-31-2023")
					.addOption("YYYY/MM/DD", "2023/12/31")
					.addOption("DD/MM/YYYY", "31/12/2023")
					.addOption("MM/DD/YYYY", "12/31/2023")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(
						async (
							value: BookmarksPluginSettings["dateFormat"]
						) => {
							this.plugin.settings.dateFormat = value;
							await this.plugin.saveSettings();
						}
					)
			);

		new Setting(containerEl)
			.setName("Output folder")
			.setDesc(
				"Folder to save bookmark files (leave empty for vault root)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Bookmarks")
					.setValue(this.plugin.settings.outputFolder)
					.onChange(async (value) => {
						this.plugin.settings.outputFolder = value;
						await this.plugin.saveSettings();
					})
			);

		// Display section
		containerEl.createEl("h3", { text: "Display Settings" });

		new Setting(containerEl)
			.setName("View mode")
			.setDesc("Choose how to display imported bookmarks")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("cards", "Cards (visual with thumbnails)")
					.addOption("table", "Table (one bookmark per row)")
					.addOption("list", "List (folder hierarchy)")
					.setValue(this.plugin.settings.viewMode)
					.onChange(async (value: "list" | "table" | "cards") => {
						this.plugin.settings.viewMode = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
