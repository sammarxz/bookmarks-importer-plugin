import { BookmarksPluginSettings, Bookmark } from "./types";
import { flattenBookmarks, generateScreenshotUrl, escapeMarkdown, getDomainFromUrl } from "./utils";

export function generateMarkdown(settings: BookmarksPluginSettings, bookmarks: Bookmark[], level = 0): string {
	if (level === 0) {
		switch (settings.viewMode) {
			case "table":
				return generateTableMarkdown(settings, bookmarks);
			case "cards":
				return generateCardsMarkdown(settings, bookmarks);
			case "list":
			default:
				return generateListMarkdown(settings, bookmarks, level);
		}
	} else {
		return generateListMarkdown(settings, bookmarks, level);
	}
}

function generateTableMarkdown(settings: BookmarksPluginSettings, bookmarks: Bookmark[]): string {
	let markdown = "";
	const flatBookmarks = flattenBookmarks(bookmarks);

	if (flatBookmarks.length === 0) {
		return "No bookmarks found.\n\n";
	}

	// Simplified table header (Screenshot and Site only)
	markdown += "| Screenshot | Site |\n";
	markdown += "|------------|------|\n";

	// Add each bookmark
	for (const bookmark of flatBookmarks) {
		const screenshot = generateScreenshotUrl(settings, bookmark.url);
		const screenshotCell = `![Screenshot](${screenshot})`;
		// Combine title and URL in a single cell
		const siteCell = `[${escapeMarkdown(bookmark.title)}](${bookmark.url
			})`;

		markdown += `| ${screenshotCell} | ${siteCell} |\n`;
	}

	return markdown + "\n";
}

function generateCardsMarkdown(settings: BookmarksPluginSettings, bookmarks: Bookmark[]): string {
	let markdown = "";
	const flatBookmarks = flattenBookmarks(bookmarks);

	if (flatBookmarks.length === 0) {
		return "No bookmarks found.\n\n";
	}

	// Add container div for cards
	markdown += '<div class="bookmarks-cards">\n\n';

	// Add each bookmark as a card
	for (const bookmark of flatBookmarks) {
		const screenshot = generateScreenshotUrl(settings, bookmark.url);
		const title = escapeMarkdown(bookmark.title);

		markdown += `<div class="bookmark-card">\n`;
		markdown += `  <a href="${bookmark.url}" class="bookmark-card-link">\n`;
		markdown += `    <div class="bookmark-card-image">\n`;
		markdown += `      <img src="${screenshot}" alt="${title}" loading="lazy">\n`;
		markdown += `    </div>\n`;
		markdown += `    <div class="bookmark-card-content">\n`;
		markdown += `      <h3 class="bookmark-card-title">${title}</h3>\n`;
		markdown += `      <p class="bookmark-card-url">${getDomainFromUrl(
				bookmark.url
			)}</p>\n`;
		markdown += `    </div>\n`;
		markdown += `  </a>\n`;
		markdown += `</div>\n\n`;
	}

	markdown += "</div>\n\n";
	return markdown;
}

function generateListMarkdown(settings: BookmarksPluginSettings, bookmarks: Bookmark[], level = 0): string {
	let markdown = "";

	for (const bookmark of bookmarks) {
		const indent = "  ".repeat(level);

		if (bookmark.isFolder) {
			// Pasta
			const headerLevel = Math.min(level + 1, 6);
			const header = "#".repeat(headerLevel);
			markdown += `${header} ${bookmark.title}\n\n`;

			if (bookmark.children && bookmark.children.length > 0) {
				markdown += generateListMarkdown(
					settings,
					bookmark.children,
					level + 1
				);
			}
		} else {
			// Bookmark
			const dateInfo =
				bookmark.dateAdded && settings.includeDescriptions
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
