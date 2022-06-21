import { Widget } from '..';
/**
 * Bookmarks widget is to save URL address for future reference
 */
export interface TwBookmarks extends Widget<TwBookmarksData> {}

/**
 * Data level type to get the bookmarks data
 */
export type DataLevelType = 'agent' | 'orgunit' | 'agent_orgunit';

/**
 * Bookmark widget's Data config
 */
export interface TwBookmarksData {
    /**
     * Bookmarks API urls
     * @type {String[]}
     * @required
     */
    BookmarksApiUrls: string[];
    /**
     * Option to get the bookmark level
     * @type {DataLevelType}
     * @default 'agent'
     */
    DataLevel: DataLevelType;
}
