// main.ts
import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	Notice,
} from "obsidian";

interface BookmarksPluginSettings {
	outputFileName: string;
	fileNamePattern: string;
	dateFormat: "YYYY-MM-DD" | "DD-MM-YYYY" | "MM-DD-YYYY" | "YYYY/MM/DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
	outputFolder: string;
	includeDescriptions: boolean;
	createFolderStructure: boolean;
	viewMode: "list" | "table" | "cards";
	screenshotService: "thum.io" | "api.thumbnail.ws" | "none";
	screenshotWidth: number;
	screenshotHeight: number;
}

const DEFAULT_SETTINGS: BookmarksPluginSettings = {
	outputFileName: "Bookmarks",
	fileNamePattern: "{title} {date}",
	dateFormat: "YYYY-MM-DD",
	outputFolder: "",
	includeDescriptions: true,
	createFolderStructure: true,
	viewMode: "cards",
	screenshotService: "thum.io",
	screenshotWidth: 1920,
	screenshotHeight: 1080,
};

interface Bookmark {
	title: string;
	url: string;
	description?: string;
	dateAdded?: string;
	children?: Bookmark[];
	isFolder: boolean;
}

export default class BookmarksImporterPlugin extends Plugin {
	settings: BookmarksPluginSettings;

	async onload() {
		await this.loadSettings();

		// Comando para importar bookmarks
		this.addCommand({
			id: "import-bookmarks",
			name: "Import Bookmarks HTML",
			callback: () => {
				this.showFileInput();
			},
		});

		// Adicionar item no menu de contexto
		this.addRibbonIcon("bookmark", "Import Bookmarks", () => {
			this.showFileInput();
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

	showFileInput() {
		// Criar input de arquivo
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".html";
		input.style.display = "none";

		input.onchange = async (e: Event) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];

			if (file) {
				try {
					const content = await file.text();
					await this.processBookmarksHTML(content);
				} catch (error) {
					new Notice("Error processing file: " + error.message);
				}
			}
		};

		document.body.appendChild(input);
		input.click();
		document.body.removeChild(input);
	}

	async processBookmarksHTML(htmlContent: string): Promise<void> {
		try {
			// Parse do HTML
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, "text/html");

			// Extract creation date from HTML
			const creationDate = this.extractCreationDate(doc, htmlContent);

			// Find bookmark structure
			const bookmarksList =
				doc.querySelector("dl") || doc.querySelector("DL");

			if (!bookmarksList) {
				throw new Error(
					"Bookmark structure not found in HTML file"
				);
			}

			// Extract bookmarks
			const bookmarks = this.parseBookmarksList(bookmarksList);

			// Generate markdown
			const markdown = this.generateMarkdown(bookmarks);

			// Create file in Obsidian
			await this.createBookmarksFile(markdown, creationDate);

			new Notice("Bookmarks imported successfully!");
		} catch (error) {
			console.error("Error processing bookmarks:", error);
			new Notice("Error importing bookmarks: " + error.message);
		}
	}

	parseBookmarksList(element: Element): Bookmark[] {
		const bookmarks: Bookmark[] = [];
		const children = Array.from(element.children);

		for (let i = 0; i < children.length; i++) {
			const child = children[i];

			if (child.tagName.toLowerCase() === "dt") {
				const bookmark = this.parseBookmarkItem(child);
				if (bookmark) {
					bookmarks.push(bookmark);
				}
			}
		}

		return bookmarks;
	}

	parseBookmarkItem(dtElement: Element): Bookmark | null {
		const h3 = dtElement.querySelector("h3");
		const a = dtElement.querySelector("a");
		const dl = dtElement.querySelector("dl");

		if (h3) {
			// It's a folder
			const folderName = h3.textContent?.trim() || "Untitled Folder";
			const children = dl ? this.parseBookmarksList(dl) : [];

			return {
				title: folderName,
				url: "",
				isFolder: true,
				children: children,
			};
		} else if (a) {
			// It's a bookmark
			const title = a.textContent?.trim() || "Untitled";
			const url = a.getAttribute("href") || "";
			const dateAdded = a.getAttribute("add_date");

			return {
				title: title,
				url: url,
				isFolder: false,
				dateAdded: dateAdded
					? new Date(parseInt(dateAdded) * 1000)
							.toISOString()
							.split("T")[0]
					: undefined,
			};
		}

		return null;
	}

	generateMarkdown(bookmarks: Bookmark[], level: number = 0): string {
		if (level === 0) {
			switch (this.settings.viewMode) {
				case "table":
					return this.generateTableMarkdown(bookmarks);
				case "cards":
					return this.generateCardsMarkdown(bookmarks);
				case "list":
				default:
					return this.generateListMarkdown(bookmarks, level);
			}
		} else {
			return this.generateListMarkdown(bookmarks, level);
		}
	}

	generateTableMarkdown(bookmarks: Bookmark[]): string {
		let markdown = "";
		const flatBookmarks = this.flattenBookmarks(bookmarks);

		if (flatBookmarks.length === 0) {
			return "No bookmarks found.\n\n";
		}

		// Simplified table header (Screenshot and Site only)
		markdown += "| Screenshot | Site |\n";
		markdown += "|------------|------|\n";

		// Add each bookmark
		for (const bookmark of flatBookmarks) {
			const screenshot = this.generateScreenshotUrl(bookmark.url);
			const screenshotCell = `![Screenshot](${screenshot})`;
			// Combine title and URL in a single cell
			const siteCell = `[${this.escapeMarkdown(bookmark.title)}](${bookmark.url})`;

			markdown += `| ${screenshotCell} | ${siteCell} |\n`;
		}

		return markdown + "\n";
	}

	generateCardsMarkdown(bookmarks: Bookmark[]): string {
		let markdown = "";
		const flatBookmarks = this.flattenBookmarks(bookmarks);

		if (flatBookmarks.length === 0) {
			return "No bookmarks found.\n\n";
		}

		// Add container div for cards
		markdown += '<div class="bookmarks-cards">\n\n';

		// Add each bookmark as a card
		for (const bookmark of flatBookmarks) {
			const screenshot = this.generateScreenshotUrl(bookmark.url);
			const title = this.escapeMarkdown(bookmark.title);
			
			markdown += `<div class="bookmark-card">\n`;
			markdown += `  <a href="${bookmark.url}" class="bookmark-card-link">\n`;
			markdown += `    <div class="bookmark-card-image">\n`;
			markdown += `      <img src="${screenshot}" alt="${title}" loading="lazy">\n`;
			markdown += `    </div>\n`;
			markdown += `    <div class="bookmark-card-content">\n`;
			markdown += `      <h3 class="bookmark-card-title">${title}</h3>\n`;
			markdown += `      <p class="bookmark-card-url">${this.getDomainFromUrl(bookmark.url)}</p>\n`;
			markdown += `    </div>\n`;
			markdown += `  </a>\n`;
			markdown += `</div>\n\n`;
		}

		markdown += '</div>\n\n';
		return markdown;
	}

	generateListMarkdown(bookmarks: Bookmark[], level: number = 0): string {
		let markdown = "";

		for (const bookmark of bookmarks) {
			const indent = "  ".repeat(level);

			if (bookmark.isFolder) {
				// Pasta
				const headerLevel = Math.min(level + 1, 6);
				const header = "#".repeat(headerLevel);
				markdown += `${header} ${bookmark.title}\n\n`;

				if (bookmark.children && bookmark.children.length > 0) {
					markdown += this.generateListMarkdown(
						bookmark.children,
						level + 1
					);
				}
			} else {
				// Bookmark
				const dateInfo =
					bookmark.dateAdded && this.settings.includeDescriptions
						? ` *(Added on: ${bookmark.dateAdded})*`
						: "";

				if (level === 0) {
					markdown += `- [${bookmark.title}](${bookmark.url})${dateInfo}\n`;
				} else {
					markdown += `${indent}- [${bookmark.title}](${bookmark.url})${dateInfo}\n`;
				}
			}
		}

		return markdown;
	}

	flattenBookmarks(
		bookmarks: Bookmark[],
		currentFolder: string = ""
	): Array<Bookmark & { folder: string }> {
		const flattened: Array<Bookmark & { folder: string }> = [];

		for (const bookmark of bookmarks) {
			if (bookmark.isFolder) {
				const folderPath = currentFolder
					? `${currentFolder} > ${bookmark.title}`
					: bookmark.title;
				if (bookmark.children) {
					flattened.push(
						...this.flattenBookmarks(bookmark.children, folderPath)
					);
				}
			} else {
				flattened.push({
					...bookmark,
					folder: currentFolder || "Root",
				});
			}
		}

		return flattened;
	}

	generateScreenshotUrl(url: string): string {
		const width = this.settings.screenshotWidth;
		const height = this.settings.screenshotHeight;

		if (!url || this.settings.screenshotService === "none") {
			return this.generatePlaceholderUrl(width, height);
		}

		// Verificar se é uma URL válida para screenshot
		if (
			url.includes("localhost") ||
			url.includes("127.0.0.1") ||
			url.includes("192.168.") ||
			url.includes("10.0.") ||
			url.startsWith("file://") ||
			url.startsWith("chrome://") ||
			url.startsWith("about:") ||
			!url.startsWith("http")
		) {
			return this.generatePlaceholderUrl(width, height);
		}

		try {
			const cleanUrl = encodeURIComponent(url);

			switch (this.settings.screenshotService) {
				case "thum.io":
					return `https://image.thum.io/get/width/${width}/crop/${height}/${url}`;

				case "api.thumbnail.ws":
					return `https://api.thumbnail.ws/api/free/thumbnail/get?url=${cleanUrl}&width=${width}&height=${height}`;

				default:
					return this.generatePlaceholderUrl(width, height);
			}
		} catch (error) {
			console.error("Error generating screenshot URL:", error);
			return this.generatePlaceholderUrl(width, height);
		}
	}

	generatePlaceholderUrl(width: number, height: number): string {
		// Usar placeholder.com para gerar imagem de fallback
		const backgroundColor = "cccccc";
		const textColor = "666666";
		return `https://via.placeholder.com/${width}x${height}/${backgroundColor}/${textColor}?text=Website+Preview`;
	}

	extractCreationDate(doc: Document, htmlContent: string): string {
		// Tentar extrair data de comentários HTML (comum em arquivos de bookmark)
		const commentMatches = htmlContent.match(/<!--.*?(\d{4}-\d{2}-\d{2}).*?-->/);
		if (commentMatches) {
			return commentMatches[1];
		}

		// Tentar extrair data do título ou meta tags
		const title = doc.querySelector("title")?.textContent;
		if (title) {
			const titleDateMatch = title.match(/(\d{4}-\d{2}-\d{2})/);
			if (titleDateMatch) {
				return titleDateMatch[1];
			}
		}

		// Tentar encontrar data no primeiro bookmark
		const firstBookmark = doc.querySelector("a[add_date]");
		if (firstBookmark) {
			const timestamp = firstBookmark.getAttribute("add_date");
			if (timestamp) {
				const date = new Date(parseInt(timestamp) * 1000);
				return date.toISOString().split("T")[0];
			}
		}

		// Fallback para data atual
		return new Date().toISOString().split("T")[0];
	}

	escapeMarkdown(text: string): string {
		return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
	}

	truncateUrl(url: string, maxLength: number = 40): string {
		if (!url) return "";
		return url.length > maxLength ? url.slice(0, maxLength) + "..." : url;
	}

	getDomainFromUrl(url: string): string {
		if (!url) return "";
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace("www.", "");
		} catch {
			return url.split("/")[2] || url;
		}
	}

	formatDateForFilename(date: Date, format: string): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		
		return format
			.replace('YYYY', year.toString())
			.replace('MM', month)
			.replace('DD', day);
	}

	generateFileName(creationDate: string): string {
		const pattern = this.settings.fileNamePattern || "{title} {date}";
		const title = this.settings.outputFileName || "Bookmarks";
		
		return pattern
			.replace('{title}', title)
			.replace('{date}', creationDate)
			.replace('{timestamp}', Date.now().toString());
	}

	async createBookmarksFile(markdown: string, creationDate: string): Promise<void> {
		const baseFileName = this.generateFileName(creationDate);
		const fileName = `${baseFileName}.md`;
		
		// Build full file path with output folder
		let filePath = fileName;
		if (this.settings.outputFolder.trim()) {
			// Ensure folder exists
			const folderPath = this.settings.outputFolder.trim();
			try {
				await this.app.vault.createFolder(folderPath);
			} catch (error) {
				// Folder might already exist, that's fine
			}
			filePath = `${folderPath}/${fileName}`;
		}

		// Add header
		const header = `# Bookmarks\n\n*Imported on: ${new Date().toISOString().split("T")[0]}*\n*Creation date: ${creationDate}*\n\n---\n\n`;
		const fullContent = header + markdown;

		// Check if file already exists
		const existingFile = this.app.vault.getAbstractFileByPath(filePath);

		if (existingFile instanceof TFile) {
			// File exists, ask if user wants to overwrite
			const shouldOverwrite = confirm(
				`The file "${fileName}" already exists. Do you want to overwrite it?`
			);
			if (shouldOverwrite) {
				await this.app.vault.modify(existingFile, fullContent);
			} else {
				const timestampFileName = this.generateFileName(creationDate).replace('{timestamp}', Date.now().toString());
				const newFilePath = this.settings.outputFolder.trim() 
					? `${this.settings.outputFolder.trim()}/${timestampFileName}.md`
					: `${timestampFileName}.md`;
				await this.app.vault.create(newFilePath, fullContent);
			}
		} else {
			// Create new file
			await this.app.vault.create(filePath, fullContent);
		}
	}
}

// Configurações do plugin
class BookmarksSettingTab extends PluginSettingTab {
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
			.setDesc("Pattern for generated filenames. Use {title}, {date}, {timestamp}")
			.addText((text) =>
				text
					.setPlaceholder("{title} {date}")
					.setValue(this.plugin.settings.fileNamePattern)
					.onChange(async (value) => {
						this.plugin.settings.fileNamePattern = value || "{title} {date}";
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
						this.plugin.settings.outputFileName = value || "Bookmarks";
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
					.onChange(async (value: "YYYY-MM-DD" | "DD-MM-YYYY" | "MM-DD-YYYY" | "YYYY/MM/DD" | "DD/MM/YYYY" | "MM/DD/YYYY") => {
						this.plugin.settings.dateFormat = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Output folder")
			.setDesc("Folder to save bookmark files (leave empty for vault root)")
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
