import { ApplicationRef, Injectable, ViewContainerRef } from '@angular/core';
import {TSnackbarComponent, TSnackbarContainer} from './t-snackbar.component';

@Injectable({
    providedIn: 'root'
})
export class TSnackbarService {
    /**
     * Variable to store instance of snackbar container
     */
    private _container: TSnackbarContainer;

    /**
     * Reference variable for snackbar container
     */
    private _containerRef;

    /**
     * Reference of previously loaded snackbar [used in case of single snackbar] 
     */
    private _previousRef;

    constructor(private _applicationRef: ApplicationRef) {}

    loadSnackbar(input, config?) {

        if (this._container === undefined) {
            // Get the root view container ref of the application by injecting it into the root component
            const rootViewContainerRef = this._applicationRef.components[0]?.injector.get(ViewContainerRef);
            
            // Insert the snackbar container component into the root view container
            this._containerRef = rootViewContainerRef?.createComponent(TSnackbarContainer);
            
            // Get the instance of the modal component
            this._container = this._containerRef.instance;
            
            // Detect the changes of loaded component [this is needed to perform to make sure container has 
            // been loaded and ready for snackbar insertions]
            this._containerRef.changeDetectorRef.detectChanges();
        }

        // check if single snackbar feature enabled
        if(config && config.enableSingle) { 
            this._previousRef?.destroy();
        }

        // create new snackbar and return the reference of instance 
        let snackbarRef = this._container.vcr.createComponent(TSnackbarComponent);
        
        this._previousRef = snackbarRef;
        
        let snackbarComponent = snackbarRef.instance;
        snackbarComponent.ref = snackbarRef;
        snackbarComponent.data = input;
        
        return snackbarComponent; 
    }
}