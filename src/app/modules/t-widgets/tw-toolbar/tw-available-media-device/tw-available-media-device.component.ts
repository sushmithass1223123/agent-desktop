import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'tw-available-media-device',
    templateUrl: './tw-available-media-device.component.html',
    styleUrls: ['./tw-available-media-device.component.scss']
})
export class TwAvailableMediaDeviceComponent implements OnInit {
    @ViewChild('availableDevicesMenu')
    availableDevicesMenu: TemplateRef<HTMLDivElement>
    mediaDeviceInfo: Observable<Array<Record<string, MediaDeviceInfo[]>>>;
    constructor(private matDialog: MatDialog) { }

    ngOnInit(): void {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log('enumerateDevices() not supported.');
            return;
        }
        this.mediaDeviceInfo = from(navigator.mediaDevices.enumerateDevices()).pipe(
            map(res => {
                const groupedByGroupId = res.reduce((acc, curr) => {
                    if (!acc[curr.groupId]) {
                        acc[curr.groupId] = []
                    }
                    acc[curr.groupId].push(curr)
                    return acc
                }, {})
                return Object.entries(groupedByGroupId).reduce((acc, curr) => {
                    const type = curr[1][0].kind.includes('audio') ? 'audio' : 'video'
                    acc.push({ type, devices: curr[1] })
                    return acc
                }, [])
            })
        );
    }

    /**
     * Opens available devices dialog
     */
    showAvailableDevices(): void {
        this.matDialog.open(this.availableDevicesMenu)
    }

}
