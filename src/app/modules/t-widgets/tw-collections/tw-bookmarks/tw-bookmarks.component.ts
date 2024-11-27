import { TwBookmarks } from '@ad/types';
import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { fuseAnimations } from '@fuse/animations';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AppUiService } from '@services/app-ui.service';
import { IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { BookmarkItem } from 'app/interfaces';
import { orderBy } from 'lodash';
import { TranslocoService } from '@jsverse/transloco';

const regexEscapeCharacters = {
    "\\": "\\\\",
    "[": "\\]",
    "]": "\\]",
    "$": "\\$",
    "(": "\\(",
    ")": "\\)",
    "{": "\\{",
    "}": "\\}",
    "*": "\\*",
    "&": "\\&",
    ",": "\\,",
    "|": "\\|",
    "?": "\\?",
    "+": "\\+",
    ".": "\\.",
    "^": "\\^"
};

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
    @Input() data: TwBookmarks;

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
     * Bookmark load data level
     */
    dataLevel: 'agent' | 'orgunit' | 'agent_orgunit';

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
     * Searchable flag
     */
    searchable: boolean;

    /**
     * Search input children ref
     */
    @ViewChild('searchField')
    searchField: ElementRef<HTMLInputElement>;

    /**
     * Bookmark data ref
     */
    bookmarkData: BookmarkItem[];

    /**
     * Bookmark search data
     */
    serachData: BookmarkItem[];

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
     * Confirm dialog ref
     */
    dialogRef: MatDialogRef<any, any>;

    /**
     * Constructor
     */
    constructor(private _appUIService: AppUiService, private _matDialog: MatDialog, private translocoService: TranslocoService) {
        super('TwBookmarksComponent');

        this.treeControl = new FlatTreeControl<BookmarkFlatNode>(this.getLevel, this.isExpandable);

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);

        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this.checklistSelection = new SelectionModel<BookmarkFlatNode>(true /* multiple */);

        this.nestedNodeMap = new Map<BookmarkItem, BookmarkFlatNode>();

        this.flatNodeMap = new Map<BookmarkFlatNode, BookmarkItem>();

        this.skeletonList = [...Array(30).keys()].slice(1);

        this.bookmarkData = [];

        this.serachData = [];
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.apiUrls = this.data.Data.BookmarksApiUrls || [];
        this.dataLevel = this.data.Data.DataLevel || 'agent';
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
        flatNode.team = node.userType === 'orgunit';
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
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.bookmarks.getDataFailed'), 'failure');
                return;
            }

            this.skeltonLoading = true;

            let userId = SDKClient.getAgentData().agentId;

            if (this.dataLevel === 'orgunit') {
                userId = SDKClient.getAgentData().teamId;
            } else if (this.dataLevel === 'agent_orgunit') {
                userId += '_' + SDKClient.getAgentData().teamId;
            }

            // clear ui data before get the data from server
            this.dataSource.data = [];
            // get the data from server
            const { response }: IResponse = await TUtils.HttpClient.sendRequest({
                urls: [...this.apiUrls],
                requestArgs: {
                    userId,
                    userType: this.dataLevel,
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
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.bookmarks.getDataFailedDataNotFound'), 'failure');
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
                } else if (bookmarkData[arrMap[el.parentId]]) {
                    bookmarkData[arrMap[el.parentId]].children.push(el);
                    bookmarkData[arrMap[el.parentId]].children = orderBy(bookmarkData[arrMap[el.parentId]].children, 'bookmarkType', 'asc');
                }
            });

            this.dataSource.data = orderBy(roots, 'bookmarkType', 'asc');
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * To open a bookmark
     * @param url
     */
    openBookmark(node: any): void {
        if (this.editable) {
            return;
        }

        if (node.data || node.bookmarkData) {
            window.open(node.data || node.bookmarkData);
        } else {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.bookmarks.openLinkFailed'), 'failure');
        }
    }

    /**
     * To filter bookmarks
     */
    filterBookmarks(): void {
        const searchTerm = this.searchTerm.trim();

        if (searchTerm) {
            this.serachData = this.bookmarkData.filter((f) => {
                if (f.bookmarkType === 'url') {

                    const replacedString = searchTerm.replace(/./g, (char) => {
                        return regexEscapeCharacters[char] || char;
                    });
                    const re = new RegExp(replacedString as string, 'i');
                    return f.bookmarkName?.match(re);
                }
                return false;
            });
        } else {
            this.serachData = [];
        }
    }

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
     * To delete bookmark
     * @param { 'folder' | 'url' } type
     * @param { BookmarkFlatNode } node
     */
    deleteBookmark(type: 'folder' | 'url', node: BookmarkFlatNode): void {
        try {
            this.dialogRef = this._appUIService.showAppConfirmDialog(
                'generic',
                this.translocoService.translate('widgets.bookmarks.confirmDeleteTitle'),
                this.translocoService.translate('widgets.bookmarks.confirmDeleteMessage') + type + ' ' + node.name + '?'
            );
            this.dialogRef.afterClosed().subscribe(async (dialogResult) => {
                if (dialogResult) {
                    try {
                        this.progressLoading = true;

                        // append the node id by default
                        let ids = [node.id];

                        // if there are children, reccursively get the children ids
                        if (node.children) {
                            const getChildrenId = (children: BookmarkItem[]) => {
                                return children.map((m) => {
                                    if (m.children) {
                                        return [m.id, ...getChildrenId(m.children)];
                                    } else {
                                        return [m.id];
                                    }
                                });
                            };

                            ids = [node.id, ...getChildrenId(node.children).flat(Infinity)];
                        }

                        // send the request to server
                        await TUtils.HttpClient.sendRequest({
                            urls: [...this.apiUrls].map((m) => `${m}/update`),
                            requestArgs: {
                                ids,
                                userType: 'agent',
                                bookmarkStatus: 2,
                                updatedBy: SDKClient.getAgentData().agentId
                            },
                            header: {
                                'Content-Type': 'application/json'
                            },
                            responseType: 'json',
                            method: 'POST',
                            log: true
                        });

                        const dynamicLabels = [
                            {
                                key: '#type',
                                value: type
                            },
                            {
                                key: '#name',
                                value: node.name
                            }
                        ];

                        this._appUIService.showSnackbar(
                            this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.deleteBookmarkSuccess'), dynamicLabels)
                        );

                        // remove the deleted items from bookmarks data
                        this.bookmarkData = this.bookmarkData.filter((i) => !ids.includes(i.id));

                        // get the parent node if any
                        const thisParent = this.getParentNode(node);

                        this.formatBookmarkData();

                        // if the item is bookmark and no children after delete toggle the treenode
                        if (thisParent) {
                            if (!thisParent?.children?.length) {
                                this.treeControl.toggle(thisParent);
                            }
                        }
                    } catch (error) {
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.bookmarks.deleteBookmarkError') + type, 'failure');
                    } finally {
                        this.progressLoading = false;
                        // this.editable = false;
                    }
                }
            });
        } catch (error) { }
    }

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
                title:
                    type === 'url'
                        ? this.translocoService.translate('widgets.bookmarks.addBookmark')
                        : this.translocoService.translate('widgets.bookmarks.addFolder'),
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
                title:
                    type === 'url'
                        ? this.translocoService.translate('widgets.bookmarks.editBookmark')
                        : this.translocoService.translate('widgets.bookmarks.editFolder'),
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
        let snackbarRef;
        const dynamicLabels = [
            {
                key: '#type',
                value: this.addBookmarkData.type
            }
        ];
        try {
            if (this.apiUrls.length === 0) {
                this._appUIService.showSnackbar(
                    this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.addBookmarkFailedAPINotFound'), dynamicLabels),
                    'failure'
                );
                return;
            }

            if (this.addBookmarkData.type === 'url') {
                try {
                    const url = new URL(this.addBookmarkData.data);
                } catch (_) {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.bookmarks.addBookmarkFailedInvalidURL'), 'failure');
                    return;
                }
            }

            const userId = SDKClient.getAgentData().agentId;

            snackbarRef = this._appUIService.showSnackbar(
                this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.addBookmarkLoading'), dynamicLabels),
                'loading'
            );

            this.progressLoading = true;

            // get the data from server
            const { response } = await TUtils.HttpClient.sendRequest<BookmarkResponse>({
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

            // add to the list and format
            this.bookmarkData.push({
                id: response.data.id,
                parentId: response.data.parentId,
                userId,
                userType: 'agent',
                bookmarkName: this.addBookmarkData.name,
                bookmarkType: this.addBookmarkData.type,
                bookmarkData: this.addBookmarkData.data,
                bookmarkStatus: 1
            });

            this.formatBookmarkData();
            snackbarRef?.dismiss();
            this._appUIService.showSnackbar(
                this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.addBookmarkSuccess'), dynamicLabels)
            );
        } catch (error) {
            snackbarRef?.dismiss();
            this._appUIService.showSnackbar(
                this.translocoService.translate('widgets.bookmarks.addBookmarkError') + this.addBookmarkData.type,
                'failure'
            );
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
        let snackbarRef;
        const dynamicLabels = [
            {
                key: '#type',
                value: this.addBookmarkData.type
            }
        ];
        try {
            if (this.apiUrls.length === 0) {
                this._appUIService.showSnackbar(
                    this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.updateBookmarkFailedAPINotFound'), dynamicLabels),
                    'failure'
                );
                return;
            }

            const userId = SDKClient.getAgentData().agentId;

            snackbarRef = this._appUIService.showSnackbar(
                this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.updateBookmarkLoading'), dynamicLabels),
                'loading'
            );

            this.progressLoading = true;

            // get the data from server
            await TUtils.HttpClient.sendRequest({
                urls: [...this.apiUrls].map((m) => `${m}/update`),
                requestArgs: {
                    ids: [this.addBookmarkData?.id ?? ''],
                    bookmarkName: this.addBookmarkData.name,
                    bookmarkData: this.addBookmarkData.data,
                    bookmarkStatus: 1,
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
            snackbarRef?.dismiss();
            this._appUIService.showSnackbar(
                this.getUpdatedLabel(this.translocoService.translate('widgets.bookmarks.updateBookmarkSuccess'), dynamicLabels)
            );
        } catch (error) {
            snackbarRef?.dismiss();
            this._appUIService.showSnackbar(
                this.translocoService.translate('widgets.bookmarks.updateBookmarkError') + this.addBookmarkData.type,
                'failure'
            );
            console.error(error);
        } finally {
            this.addBookmarkData = null;
            this.progressLoading = false;
            // this.editable = false;
        }
    }

    /**
     * To enable searchable
     */
    enableSearch(): void {
        this.searchable = true;
        setTimeout(() => {
            this.searchField?.nativeElement?.focus();
        }, 100);
    }

    getUpdatedLabel(msg, labels = []) {
        let updatedLabel = msg;
        labels?.forEach((ele) => {
            updatedLabel = updatedLabel.replace(ele.key, ele.value);
        });
        return updatedLabel;
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
     * Bookmark added by team
     */
    team: boolean;
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

/**
 * Bookmark response from server
 */
interface BookmarkResponse {
    /**
     * Bookmark response status
     */
    status: number;
    /**
     * Bookmark response
     */
    response: number;
    /**
     * Bookmark response status data
     */
    data?: any;
}
