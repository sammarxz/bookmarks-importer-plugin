import { Notice, TFile } from "obsidian";
import { generateMarkdown } from "./markdown";
import { extractCreationDate, generateFileName } from "./utils";
import { Bookmark } from "./types";
import BookmarksImporterPlugin from "./main";

export async function processBookmarksHTML(plugin: BookmarksImporterPlugin, htmlContent: string): Promise<void> {
	try {
		// Parse do HTML
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlContent, "text/html");

		// Extract creation date from HTML
		const creationDate = extractCreationDate(doc, htmlContent, plugin.settings);

		// Find bookmark structure
		const bookmarksList =
			doc.querySelector("dl") || doc.querySelector("DL");

		if (!bookmarksList) {
			throw new Error("Bookmark structure not found in HTML file");
		}

		// Extract bookmarks
		const bookmarks = parseBookmarksList(bookmarksList);

		// Generate markdown
		const markdown = generateMarkdown(plugin.settings, bookmarks);

		// Create file in Obsidian
		await createBookmarksFile(plugin, markdown, creationDate);

		new Notice("Bookmarks imported successfully!");
	} catch (error) {
		console.error("Error processing bookmarks:", error);
		new Notice("Error importing bookmarks: " + error.message);
	}
}

function parseBookmarksList(element: Element): Bookmark[] {
	const bookmarks: Bookmark[] = [];
	const children = Array.from(element.children);

	for (let i = 0; i < children.length; i++) {
		const child = children[i];

		if (child.tagName.toLowerCase() === "dt") {
			const bookmark = parseBookmarkItem(child);
			if (bookmark) {
				bookmarks.push(bookmark);
			}
		}
	}

	return bookmarks;
}

function parseBookmarkItem(dtElement: Element): Bookmark | null {
	const h3 = dtElement.querySelector("h3");
	const a = dtElement.querySelector("a");
	const dl = dtElement.querySelector("dl");

	if (h3) {
		// It's a folder
		const folderName = h3.textContent?.trim() || "Untitled Folder";
		const children = dl ? parseBookmarksList(dl) : [];

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


async function createBookmarksFile(
	plugin: BookmarksImporterPlugin,
	markdown: string,
	creationDate: string
): Promise<void> {
	const baseFileName = generateFileName(plugin.settings, creationDate);
	const fileName = `${baseFileName}.md`;

	// Build full file path with output folder
	let filePath = fileName;
	if (plugin.settings.outputFolder.trim()) {
		// Ensure folder exists
		const folderPath = plugin.settings.outputFolder.trim();
		try {
			await plugin.app.vault.createFolder(folderPath);
		} catch (error) {
			// Folder might already exist, that's fine
		}
		filePath = `${folderPath}/${fileName}`;
	}

	// Add header
	const header = `# Bookmarks\n\n*Imported on: ${
		new Date().toISOString().split("T")[0]
	}*\n*Creation date: ${creationDate}*\n\n---\n\n`;
	const fullContent = header + markdown;

	// Check if file already exists
	const existingFile = plugin.app.vault.getAbstractFileByPath(filePath);

	if (existingFile instanceof TFile) {
		// File exists, ask if user wants to overwrite
		const shouldOverwrite = confirm(
			`The file "${fileName}" already exists. Do you want to overwrite it?`
		);
		if (shouldOverwrite) {
			await plugin.app.vault.modify(existingFile, fullContent);
		} else {
			const timestampFileName = generateFileName(
				plugin.settings,
				creationDate
			).replace("{timestamp}", Date.now().toString());
			const newFilePath = plugin.settings.outputFolder.trim()
				? `${plugin.settings.outputFolder.trim()}/${timestampFileName}.md`
				: `${timestampFileName}.md`;
			await plugin.app.vault.create(newFilePath, fullContent);
		}
	} else {
		// Create new file
		await plugin.app.vault.create(filePath, fullContent);
	}
}
