export interface PreviewDialogDataTypes {
    title: string;
    component: PreviewComponentTypes;
    previewData: any;
    actions: PreviewActionType[];
}

export type PreviewComponentTypes = 'email' | 'other';

export interface PreviewActionType {
        label: string;
        callback: any;
}

export type CallbackActions = {
    /**
     * Done callback
     */
    done: (data?: any) => void;
    /**
     * Cancel callback
     */
    cancel: () => void;
};