import { Notice } from "obsidian";
import { processBookmarksHTML } from "./parser";
import BookmarksImporterPlugin from "./main";

export function showFileInput(plugin: BookmarksImporterPlugin) {
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
				await processBookmarksHTML(plugin, content);
			} catch (error) {
				new Notice("Error processing file: " + error.message);
			}
		}
	};

	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
}
