import { Widget } from '..';
/**
 * Bookmarks widget is to save URL address for future reference
 */
export type TwBookmarks = Widget<TwBookmarksData>;

/**
 * Data level type to get the bookmarks data
 */
export type DataLevelType = 'agent' | 'orgunit' | 'agent_orgunit';

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
