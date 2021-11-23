import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { fuseAnimations } from '@fuse/animations';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AppUiService } from '@services/app-ui.service';
import { IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { BookmarkItem, IWidget } from 'app/interfaces';
import { orderBy } from 'lodash';

/**
 * Bookmarks Component
 */
@Component({
    selector: 'tw-bookmarks',
    templateUrl: './tw-bookmarks.component.html',
    styleUrls: ['./tw-bookmarks.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [appAnimations, fuseAnimations]
})
export class TwBookmarksComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Skelton loading flag
     */
    skeltonLoading: boolean;

    /**
     * progress loading flag
     */
    progressLoading: boolean;

    /**
     * User preferences API Urls
     */
    apiUrls: string[];

    /**
     * Tree control
     */
    treeControl: FlatTreeControl<any, any>;

    /**
     * Mat tree flattener
     */
    treeFlattener: MatTreeFlattener<any, any, any>;

    /**
     * Datasource for the mat tree
     */
    dataSource: MatTreeFlatDataSource<any, any, any>;

    /**
     * The selection for checklist
     */
    checklistSelection: SelectionModel<BookmarkFlatNode>;

    /**
     * Map from nested node to flattened node. This helps us to keep the same object for selection
     */
    nestedNodeMap: Map<BookmarkItem, BookmarkFlatNode>;

    /**
     * Map from flat node to nested node. This helps us finding the nested node to be modified
     */
    flatNodeMap: Map<any, any>;

    /**
     * Dummy skeleton list
     */
    skeletonList: number[];

    /**
     * To edit the bookmarks
     */
    editable: boolean;

    /**
     * To delete the selected bookmarks
     */
    deletable: boolean;

    /**
     * Search term
     */
    searchTerm: string;

    /**
     * Bookmark data ref
     */
    bookmarkData: BookmarkItem[];

    /**
     * Add bookmarks data dialog ref
     */
    addBookmarkDialogRef: MatDialogRef<any>;

    /**
     * Add data dialog
     */
    @ViewChild('addBookmarkDataDialog')
    addBookmarkDataDialog: TemplateRef<HTMLDivElement>;

    /**
     * Add bookmark data ref
     */
    addBookmarkData: AddBookmarkData;

    /**
     * Constructor
     */
    constructor(private _appUIService: AppUiService, private _matDialog: MatDialog) {
        super();

        this.treeControl = new FlatTreeControl<BookmarkFlatNode>(this.getLevel, this.isExpandable);

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);

        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this.checklistSelection = new SelectionModel<BookmarkFlatNode>(true /* multiple */);

        this.nestedNodeMap = new Map<BookmarkItem, BookmarkFlatNode>();

        this.flatNodeMap = new Map<BookmarkFlatNode, BookmarkItem>();

        this.skeletonList = [...Array(30).keys()].slice(1);

        this.bookmarkData = [];
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.apiUrls = this.data.Data.BookmarksApiUrls || [];
        this.getBookmarks();
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.addBookmarkDialogRef?.close();
    }

    /**
     * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
     */
    transformer = (node: BookmarkItem, level: number) => {
        const existingNode = this.nestedNodeMap.get(node);
        const flatNode = existingNode && existingNode.name === node.bookmarkName ? existingNode : new BookmarkFlatNode();
        flatNode.name = node.bookmarkName;
        flatNode.level = level;
        flatNode.id = node.id;
        flatNode.type = node.bookmarkType;
        flatNode.data = node.bookmarkData;
        flatNode.expandable = !!node.children?.length;
        flatNode.context = false;
        flatNode.children = node.children;

        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    };

    /**
     * To check if the node has child
     * @param _
     * @param node
     * @returns
     */
    hasChild = (_: number, node: BookmarkFlatNode) => node.expandable || node.type === 'folder';

    /**
     * To get the level from tree
     * @param node
     * @returns
     */
    getLevel = (node: BookmarkFlatNode) => node.level;

    /**
     * To check if expandable
     * @param node
     * @returns
     */
    isExpandable = (node: BookmarkFlatNode) => node.expandable;

    /**
     * To get children
     * @param node
     * @returns
     */
    getChildren = (node: BookmarkItem): BookmarkItem[] => node.children;

    /**
     * Whether all the descendants of the node are selected
     */
    descendantsAllSelected(node: BookmarkFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const descAllSelected =
            descendants.length > 0 &&
            descendants.every((child) => {
                return this.checklistSelection.isSelected(child);
            });
        return descAllSelected;
    }

    /**
     * Whether part of the descendants are selected
     */
    descendantsPartiallySelected(node: BookmarkFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some((child) => this.checklistSelection.isSelected(child));
        return result && !this.descendantsAllSelected(node);
    }

    /**
     * Toggle the to-do item selection. Select/deselect all the descendants node
     */
    todoItemSelectionToggle(node: BookmarkFlatNode): void {
        if (!this.editable) {
            this.treeControl.toggle(node);
            return;
        }
        this.checklistSelection.toggle(node);
        const descendants = this.treeControl.getDescendants(node);
        this.checklistSelection.isSelected(node) ? this.checklistSelection.select(...descendants) : this.checklistSelection.deselect(...descendants);

        // Force update for the parent
        descendants.forEach((child) => this.checklistSelection.isSelected(child));
        this.checkAllParentsSelection(node);
    }

    /**
     * Toggle a leaf to-do item selection. Check all the parents to see if they changed
     */
    todoLeafItemSelectionToggle(node: BookmarkFlatNode): void {
        this.checklistSelection.toggle(node);
        this.checkAllParentsSelection(node);
    }

    /**
     * Toggle tree node
     * @param node
     * @returns
     */
    toggleTreeNode(node: BookmarkFlatNode): void {
        if (!this.editable && node.expandable) {
            this.treeControl.toggle(node);
        }
    }

    /**
     * Checks all the parents when a leaf node is selected/unselected
     * @param node
     */
    checkAllParentsSelection(node: BookmarkFlatNode): void {
        let parent: BookmarkFlatNode | null = this.getParentNode(node);
        while (parent) {
            this.checkRootNodeSelection(parent);
            parent = this.getParentNode(parent);
        }

        this.deletable = this.checklistSelection.selected?.length > 0;
    }

    /**
     * Check root node checked state and change it accordingly
     */
    checkRootNodeSelection(node: BookmarkFlatNode): void {
        const nodeSelected = this.checklistSelection.isSelected(node);
        const descendants = this.treeControl.getDescendants(node);
        const descAllSelected =
            descendants.length > 0 &&
            descendants.every((child) => {
                return this.checklistSelection.isSelected(child);
            });
        if (nodeSelected && !descAllSelected) {
            this.checklistSelection.deselect(node);
        } else if (!nodeSelected && descAllSelected) {
            this.checklistSelection.select(node);
        }
    }

    /**
     * Get the parent node of a node
     * @param node
     * @returns
     */
    getParentNode(node: BookmarkFlatNode): BookmarkFlatNode | null {
        const currentLevel = this.getLevel(node);

        if (currentLevel < 1) {
            return null;
        }

        const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

        for (let i = startIndex; i >= 0; i--) {
            const currentNode = this.treeControl.dataNodes[i];

            if (this.getLevel(currentNode) < currentLevel) {
                return currentNode;
            }
        }
        return null;
    }

    /**
     * To get bookmarks
     * @returns
     */
    async getBookmarks(): Promise<void> {
        try {
            if (this.apiUrls.length === 0) {
                this._appUIService.showSnackbar('Unable to get data, API urls are not found!', 'failure');
                return;
            }

            this.skeltonLoading = true;

            // get the data from server
            const { response }: IResponse = await TUtils.HttpClient.sendRequest({
                urls: [...this.apiUrls],
                requestArgs: {
                    userId: SDKClient.getAgentData().agentId,
                    userType: 'agent',
                    bookmarkName: '',
                    bookmarkType: '',
                    bookmarkStatus: 1
                },
                header: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
                method: 'POST',
                log: true
            });

            this.skeltonLoading = false;

            // check for valid response from server
            if (!response) {
                this._appUIService.showSnackbar('Unable to get data, Data not found!', 'failure');
                return;
            }

            this.bookmarkData = response.response;

            this.formatBookmarkData();
        } catch (error) {
            console.error(error);
            this.skeltonLoading = false;
        }
    }

    /**
     * To format bookmark data
     */
    formatBookmarkData(): void {
        try {
            const bookmarkData = orderBy(this.bookmarkData, 'bookmarkName', 'asc');

            // Map element ID to data index
            const arrMap = bookmarkData.reduce((acc, el, i) => {
                acc[el.id] = i;
                return acc;
            }, {});

            const roots = [];

            bookmarkData.forEach((el: BookmarkItem) => {
                if (el.bookmarkType === 'folder') {
                    el.children = [];
                }
            });

            // Push each element to parent's children array
            bookmarkData.forEach((el: BookmarkItem) => {
                if (!el.parentId) {
                    roots.push(el);
                } else {
                    bookmarkData[arrMap[el.parentId]].children.push(el);
                    bookmarkData[arrMap[el.parentId]].children = orderBy(bookmarkData[arrMap[el.parentId]].children, 'bookmarkType', 'asc');
                }
            });

            this.dataSource.data = orderBy(roots, 'bookmarkType', 'asc');
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * To open a bookmark
     * @param url
     */
    openBookmark(node: BookmarkFlatNode): void {
        if (this.editable) {
            return;
        }

        if (node.data) {
            window.open(node.data);
        } else {
            this._appUIService.showSnackbar('Unable to open the link, Url not found!', 'failure');
        }
    }

    /**
     * To filter bookmarks
     */
    filterBookmarks(): void {}

    /**
     * To edit bookmarks
     * @param toggle
     */
    editBookmarks(toggle: boolean): void {
        this.editable = toggle;
        if (!toggle) {
            this.checklistSelection.clear();
            this.deletable = false;
        }
    }

    /**
     * To delete selected bookmarks
     */
    deleteSelectedBookmarks(): void {}

    /**
     * To delete bookmark
     * @param node
     */
    deleteBookmark(node: BookmarkFlatNode): void {}

    /**
     * Add/Update bookmark data dialog
     * @param { String } source
     * @param { 'folder' | 'url' } type
     * @param { BookmarkFlatNode } node
     */
    openAddUpdateDataDialog(source: string, type: 'folder' | 'url', node?: BookmarkFlatNode): void {
        // to add new bookmark/folder
        if (source === 'add') {
            // init add bookmark data
            this.addBookmarkData = {
                title: type === 'url' ? 'Add Bookmark' : 'Add Folder',
                id: node?.id ?? '',
                name: '',
                type,
                data: type === 'folder' ? 'folder' : '',
                source: 'add'
            };
        }
        // to update a bookmark/folder
        else {
            // init add bookmark data
            this.addBookmarkData = {
                title: type === 'url' ? 'Edit Bookmark' : 'Edit Folder',
                id: node.id,
                name: node.name,
                type,
                data: node.data,
                source: 'update'
            };
        }

        this._matDialog.open(this.addBookmarkDataDialog, {
            panelClass: 'add-bookmark-dialog',
            minWidth: '350px'
        });
    }

    /**
     * To add a bookmark data
     *
     * @returns
     */
    async saveBookmark(): Promise<void> {
        try {
            if (this.apiUrls.length === 0) {
                this._appUIService.showSnackbar(`Unable to add bookmark ${this.addBookmarkData.type}, API urls are not found!`, 'failure');
                return;
            }

            const userId = SDKClient.getAgentData().agentId;

            this._appUIService.showSnackbar(`Adding bookmark ${this.addBookmarkData.type}, please wait...`, 'loading');

            this.progressLoading = true;

            // get the data from server
            await TUtils.HttpClient.sendRequest({
                urls: [...this.apiUrls].map((m) => `${m}/create`),
                requestArgs: {
                    parentId: this.addBookmarkData?.id ?? null,
                    userId,
                    userType: 'agent',
                    bookmarkName: this.addBookmarkData.name,
                    bookmarkType: this.addBookmarkData.type,
                    bookmarkData: this.addBookmarkData.data,
                    bookmarkStatus: 1,
                    createdBy: userId
                },
                header: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
                method: 'POST',
                log: true
            });

            this.progressLoading = false;

            // add to the list and format
            this.bookmarkData.push({
                id: TUtils.Generic.uuid(),
                parentId: this.addBookmarkData.id ?? '',
                userId,
                userType: 'agent',
                bookmarkName: this.addBookmarkData.name,
                bookmarkType: this.addBookmarkData.type,
                bookmarkData: this.addBookmarkData.data,
                bookmarkStatus: 1
            });

            this.formatBookmarkData();

            this._appUIService.showSnackbar(`Bookmark ${this.addBookmarkData.type} added successfully`);
        } catch (error) {
            this._appUIService.showSnackbar(`Error in add bookmark ${this.addBookmarkData.type}`, 'failure');
            console.error(error);
        } finally {
            this.addBookmarkData = null;
            this.progressLoading = false;
        }
    }

    /**
     * To update a bookmark data
     *
     * @returns
     */
    async updateBookmark(): Promise<void> {
        try {
            if (this.apiUrls.length === 0) {
                this._appUIService.showSnackbar(`Unable to update bookmark ${this.addBookmarkData.type}, API urls are not found!`, 'failure');
                return;
            }

            const userId = SDKClient.getAgentData().agentId;

            this._appUIService.showSnackbar(`Updating bookmark ${this.addBookmarkData.type}, please wait...`, 'loading');

            this.progressLoading = true;

            // get the data from server
            await TUtils.HttpClient.sendRequest({
                urls: [...this.apiUrls].map((m) => `${m}/update`),
                requestArgs: {
                    ids: [this.addBookmarkData?.id ?? ''],
                    bookmarkName: this.addBookmarkData.name,
                    bookmarkData: this.addBookmarkData.data,
                    updatedBy: userId
                },
                header: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
                method: 'POST',
                log: true
            });

            this.progressLoading = false;

            // update the data
            this.bookmarkData.map((m) => {
                if (m.id === this.addBookmarkData.id) {
                    m.bookmarkName = this.addBookmarkData.name;
                    m.bookmarkData = this.addBookmarkData.data;
                }
            });

            this.formatBookmarkData();

            this._appUIService.showSnackbar(`Bookmark ${this.addBookmarkData.type} updated successfully`);
        } catch (error) {
            this._appUIService.showSnackbar(`Error in update bookmark ${this.addBookmarkData.type}`, 'failure');
            console.error(error);
        } finally {
            this.addBookmarkData = null;
            this.progressLoading = false;
            this.editable = false;
        }
    }
}

/**
 * Flat node with expandable and level information
 */
class BookmarkFlatNode {
    /**
     * Expandable flag
     */
    expandable: boolean;
    /**
     * Id of bookmark
     */
    id: string;
    /**
     * Name of bookmark
     */
    name: string;
    /**
     * Type of bookmark
     */
    type: string;
    /**
     * Data of bookmark
     */
    data: string;
    /**
     * Level of item in the tree
     */
    level: number;
    /**
     * Cotext opened flag
     */
    context: boolean;
    /**
     * Child nodes
     */
    children?: BookmarkItem[];
}

/**
 * Add bookmark data class
 */
class AddBookmarkData {
    /**
     * Title of add dialog
     */
    title: string;
    /**
     * Id of bookmark if any
     */
    id?: string;
    /**
     * Name of bookmark
     */
    name: string;
    /**
     * Type of bookmark
     */
    type: 'folder' | 'url';
    /**
     * Url link if the bookmarkType is "url". Keep it empty for the bookmarkType is "folder"
     */
    data: string;
    /**
     * List of folder structure
     */
    folderList?: string[];
    /**
     * Source of bookmark data
     */
    source: string;
}
