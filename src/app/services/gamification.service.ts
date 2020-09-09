import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResGamification } from 'app/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    leaderboardReq: { loading: boolean; data: BehaviorSubject<ResGamification[]> } = {
        loading: false,
        data: new BehaviorSubject([])
    };

    progressReq: { loading: boolean; data: BehaviorSubject<ResGamification[]> } = {
        loading: false,
        data: new BehaviorSubject([])
    };

    constructor(private httpClient: HttpClient) {}

    fetchLeaderBoard(url: string): Observable<ResGamification[]> {
        // if (!this.leaderboardReq.loading) {
        //     this.leaderboardReq.loading = true;
        //     return this.httpClient.post<{ d: string }>(url, {}).pipe(
        //         map((x) => JSON.parse(x.d)),
        //         tap((x) => {
        //             this.leaderboardReq.data.next(x);
        //             this.leaderboardReq.data.complete();
        //             this.leaderboardReq.loading = false;
        //         })
        //     );
        // } else {
        //     return this.leaderboardReq.data.asObservable();
        // }
        return this.httpClient.post<{ d: string }>(url, {}).pipe(map((x) => JSON.parse(x.d)));
    }

    getAgentProgress(url: string, agentId: string): Observable<any> {
        // if (!this.progressReq.loading) {
        //     this.progressReq.loading = true;
        //     return this.httpClient
        //         .post<{ d: string }>(url, { agentId })
        //         .pipe(
        //             map((x) => JSON.parse(x.d)),
        //             tap((x) => {
        //                 this.progressReq.data.next(x);
        //                 this.progressReq.data.complete();
        //                 this.progressReq.loading = false;
        //             })
        //         );
        // } else {
        //     return this.progressReq.data.asObservable();
        // }
        return this.httpClient
            .post<{ d: string }>(url, { agentId })
            .pipe(map((x) => JSON.parse(x.d)));
    }
}
