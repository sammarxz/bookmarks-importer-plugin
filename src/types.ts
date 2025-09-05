
export interface BookmarksPluginSettings {
	outputFileName: string;
	fileNamePattern: string;
	dateFormat:
		| "YYYY-MM-DD"
		| "DD-MM-YYYY"
		| "MM-DD-YYYY"
		| "YYYY/MM/DD"
		| "DD/MM/YYYY"
		| "MM/DD/YYYY";
	outputFolder: string;
	includeDescriptions: boolean;
	createFolderStructure: boolean;
	viewMode: "list" | "table" | "cards";
	screenshotService: "thum.io" | "api.thumbnail.ws" | "none";
	screenshotWidth: number;
	screenshotHeight: number;
}

export const DEFAULT_SETTINGS: BookmarksPluginSettings = {
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

export interface Bookmark {
	title: string;
	url: string;
	description?: string;
	dateAdded?: string;
	children?: Bookmark[];
	isFolder: boolean;
}
