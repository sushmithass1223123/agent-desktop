import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { fuseAnimations } from '@fuse/animations';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AppUiService } from '@services/app-ui.service';
import { IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { BookmarkItem } from 'app/interfaces';
import { throwADError } from 'app/utils';
import { orderBy } from 'lodash';

/**
 * Bookmarks Components
 */
@Component({
    selector: 'bookmarks',
    templateUrl: './bookmarks.component.html',
    styleUrls: ['./bookmarks.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [appAnimations, fuseAnimations]
})
export class BookmarksComponent implements OnInit {
    /**
     * User preferences API Urls
     */
    @Input() apiUrls: string[];

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

    constructor(private _appUIService: AppUiService) {
        this.treeControl = new FlatTreeControl<BookmarkFlatNode>(this.getLevel, this.isExpandable);

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);

        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this.checklistSelection = new SelectionModel<BookmarkFlatNode>(true /* multiple */);

        this.nestedNodeMap = new Map<BookmarkItem, BookmarkFlatNode>();

        this.flatNodeMap = new Map<BookmarkFlatNode, BookmarkItem>();

        this.skeletonList = [...Array(30).keys()].slice(1);
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        this.apiUrls = ['https://dice.tetherfi.cloud:8097/api/v1/Bookmarks'];
        this.getBookmarks();
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
        flatNode.url = node.bookmarkData;
        flatNode.expandable = !!node.children?.length;
        flatNode.context = false;

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
    hasChild = (_: number, node: BookmarkFlatNode) => node.expandable;

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
     * To get bookmarks
     * @returns
     */
    async getBookmarks(): Promise<void> {
        try {
            if (this.apiUrls.length === 0) {
                this._appUIService.showSnackbar('Unable to get data, API urls are not found!', 'failure');
                return;
            }

            // get the data from server
            const { response }: IResponse = await TUtils.HttpClient.sendRequest({
                urls: this.apiUrls,
                requestArgs: {
                    userId: SDKClient.getAgentData().agentId,
                    userType: 'agent',
                    bookmarkName: '',
                    bookmarkType: '',
                    bookmarkStatus: 1,
                    createdOn: ''
                },
                header: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
                method: 'POST',
                log: true
            });

            // check for valid response from server
            if (!response) {
                this._appUIService.showSnackbar('Unable to get data, Data not found!', 'failure');
                return;
            }

            const responseData = orderBy(response.response, 'bookmarkName', 'asc');

            // Map element ID to data index
            const arrMap = responseData.reduce((acc, el, i) => {
                acc[el.id] = i;
                return acc;
            }, {});

            const roots = [];

            responseData.forEach((el: BookmarkItem) => {
                if (el.bookmarkType === 'folder') {
                    el.children = [];
                }
            });

            // Push each element to parent's children array
            responseData.forEach((el: BookmarkItem) => {
                if (el.parentId === null) {
                    roots.push(el);
                } else {
                    responseData[arrMap[el.parentId]].children.push(el);
                    responseData[arrMap[el.parentId]].children = orderBy(responseData[arrMap[el.parentId]].children, 'bookmarkType', 'asc');
                }
            });

            this.dataSource.data = orderBy(roots, 'bookmarkType', 'asc');
        } catch (error) {
            throwADError('Error in BookmarksComponent.getBookmarks', error);
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

        if (node.url) {
            window.open(node.url);
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
        if (!this.editable) {
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
}

/** Flat node with expandable and level information */
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
     * Link of bookmark
     */
    url: string;
    /**
     * Level of item in the tree
     */
    level: number;
    /**
     * Cotext opened flag
     */
    context: boolean;
}
