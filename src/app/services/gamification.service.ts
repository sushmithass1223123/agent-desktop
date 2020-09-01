import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResGamification } from 'app/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    constructor(private httpClient: HttpClient) {}

    fetchLeaderBoard(url: string): Observable<ResGamification[]> {
        // if (this.leaderboard.getValue()?.length) {
        //     return this.leaderboard.asObservable();
        // } else {
        return this.httpClient.post<{ d: string }>(url, {}).pipe(map((x) => JSON.parse(x.d)));
        // }
    }

    getAgentProgress(url: string, agentId: string): Observable<any> {
        return this.httpClient.post(url, { agentId });
    }
}
