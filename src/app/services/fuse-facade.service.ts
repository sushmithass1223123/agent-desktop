import { Injectable } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { FuseBgConf } from 'app/interfaces';
import { formatJsonData } from 'app/utils';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * A Facade service for fuse config
 */
@Injectable({
    providedIn: 'root'
})
export class FuseFacadeService {
    constructor(private fuseConfig: FuseConfigService) {
    }
    /**
     * gets Custom Fuse Bg anchor widget color classes
     */
    public anchorBgClasses$(): Observable<FuseBgConf> {
        return this.fuseConfig.getConfig().pipe(
            map((conf: FuseConfig) => {
                if (!conf.layout?.anchorWidget?.customBackgroundColor) {
                    return { content: '', header: '', body: '' };
                }
                const { contentBackground: content, headerBackground: header, bodyBackground: body } = conf.layout.anchorWidget;
                return { content, header, body };
            }),
            shareReplay()
        );
    } 

    /**
     * gets Custom Fuse widget Bg color classes
     */
    public widgetBgClasses$(): Observable<FuseBgConf> { 
        return this.fuseConfig.getConfig().pipe(
            map((conf: FuseConfig) => {
                if (!conf.layout?.widget?.customBackgroundColor) {
                    return { content: '', header: '', body: '' };
                }
                const { contentBackground: content, headerBackground: header, bodyBackground: body } = conf.layout.widget;
                return { content, header, body };
            }),
            shareReplay()
        );
}

    /**
     * gets Custom Fuse widget Bg color classes
     */
    public anchorOrWidgetBgClasses$(): Observable<FuseBgConf | unknown> { 
        return this.fuseConfig.getConfig().pipe(
            map((conf: FuseConfig) => {
                if (conf.layout?.anchorWidget?.customBackgroundColor) {
                    let { contentBackground: content, headerBackground: header, bodyBackground: body } = conf.layout.anchorWidget;
                    if (conf.layout?.widget?.customBackgroundColor) {
                        const { contentBackground, headerBackground, bodyBackground } = conf.layout.widget;
                        if (!content) {
                            content = contentBackground;
                        }
                        if (!header) {
                            header = headerBackground;
                        }
                        if (!body) {
                            body = bodyBackground;
                        }
                    }
                    return { content, header, body };
                }
                return {};
            }),
            shareReplay()
        )
    };

    /**
     * gets Custom Fuse widget Bg color classes
     */
    public widgetOrAnchorBgClasses$(): Observable<FuseBgConf | boolean> { 
        return this.fuseConfig.getConfig().pipe(
        map((conf: FuseConfig) => {
            if (conf.layout?.widget?.customBackgroundColor) {
                let { contentBackground: content, headerBackground: header, bodyBackground: body } = conf.layout.widget;
                if (conf.layout?.anchorWidget?.customBackgroundColor) {
                    const { contentBackground, headerBackground, bodyBackground } = conf.layout.anchorWidget;
                    if (!content) {
                        content = contentBackground;
                    }
                    if (!header) {
                        header = headerBackground;
                    }
                    if (!body) {
                        body = bodyBackground;
                    }
                }
                return { content, header, body };
            }
            return false;
        }),
        shareReplay()
    );
}

    /**
     * Gets fuse specific keys from fuse config
     * @param {Record<string , string>} json
     * @returns {Observable<Partial<FuseConfig>>}
     */
    getConfig(json?: Record<string, string>): Observable<Partial<FuseConfig>> {
        if (json) {
            return this.fuseConfig.getConfig().pipe(map((conf) => formatJsonData(conf, json)));
        }
        return this.fuseConfig.getConfig();
    }

    /**
     * Set and get the config
     */
    set setConfig(value: any) {
        this.fuseConfig.config = value;
    }
}
