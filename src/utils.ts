import { BookmarksPluginSettings, Bookmark } from "./types";

export function flattenBookmarks(
	bookmarks: Bookmark[],
	currentFolder = ""
): Array<Bookmark & { folder: string }> {
	const flattened: Array<Bookmark & { folder: string }> = [];

	for (const bookmark of bookmarks) {
		if (bookmark.isFolder) {
			const folderPath = currentFolder
				? `${currentFolder} > ${bookmark.title}`
				: bookmark.title;
			if (bookmark.children) {
				flattened.push(
					...flattenBookmarks(bookmark.children, folderPath)
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

export function generateScreenshotUrl(settings: BookmarksPluginSettings, url: string): string {
	const width = settings.screenshotWidth;
	const height = settings.screenshotHeight;

	if (!url || settings.screenshotService === "none") {
		return generatePlaceholderUrl(width, height);
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
		return generatePlaceholderUrl(width, height);
	}

	try {
		const cleanUrl = encodeURIComponent(url);

		switch (settings.screenshotService) {
			case "thum.io":
				return `https://image.thum.io/get/width/${width}/crop/${height}/${url}`;

			case "api.thumbnail.ws":
				return `https://api.thumbnail.ws/api/free/thumbnail/get?url=${cleanUrl}&width=${width}&height=${height}`;

			default:
				return generatePlaceholderUrl(width, height);
		}
	} catch (error) {
		console.error("Error generating screenshot URL:", error);
		return generatePlaceholderUrl(width, height);
	}
}

export function generatePlaceholderUrl(width: number, height: number): string {
	// Usar placeholder.com para gerar imagem de fallback
	const backgroundColor = "cccccc";
	const textColor = "666666";
	return `https://via.placeholder.com/${width}x${height}/${backgroundColor}/${textColor}?text=Website+Preview`;
}

export function extractCreationDate(doc: Document, htmlContent: string, settings: BookmarksPluginSettings): string {
	let extractedDate: Date | null = null;

	// Try to extract date from HTML comments (common in bookmark files)
	const commentMatches = htmlContent.match(
		/<!--.*?(\d{4}-\d{2}-\d{2}).*?-->/
	);
	if (commentMatches) {
		extractedDate = new Date(commentMatches[1]);
	}

	// Try to extract date from title or meta tags
	if (!extractedDate) {
		const title = doc.querySelector("title")?.textContent;
		if (title) {
			const titleDateMatch = title.match(/(\d{4}-\d{2}-\d{2})/);
			if (titleDateMatch) {
				extractedDate = new Date(titleDateMatch[1]);
			}
		}
	}

	// Try to find date in first bookmark
	if (!extractedDate) {
		const firstBookmark = doc.querySelector("a[add_date]");
		if (firstBookmark) {
			const timestamp = firstBookmark.getAttribute("add_date");
			if (timestamp) {
				extractedDate = new Date(parseInt(timestamp) * 1000);
			}
		}
	}

	// Fallback to current date
	if (!extractedDate) {
		extractedDate = new Date();
	}

	// Format the date according to user's preference
	return formatDateForFilename(
		extractedDate,
		settings.dateFormat
	);
}

export function escapeMarkdown(text: string): string {
	return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function getDomainFromUrl(url: string): string {
	if (!url) return "";
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace("www.", "");
	} catch {
		return url.split("/")[2] || url;
	}
}

export function formatDateForFilename(date: Date, format: string): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return format
		.replace("YYYY", year.toString())
		.replace("MM", month)
		.replace("DD", day);
}

export function generateFileName(settings: BookmarksPluginSettings, creationDate: string): string {
	const pattern = settings.fileNamePattern || "{title} {date}";
	const title = settings.outputFileName || "Bookmarks";

	return pattern
		.replace("{title}", title)
		.replace("{date}", creationDate)
		.replace("{timestamp}", Date.now().toString());
}
