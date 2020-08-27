import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ResGamification } from 'app/models';
import { AppDataService } from './app-data.service';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private leaderboard = new BehaviorSubject<ResGamification[]>(null);

    constructor(private httpClient: HttpClient) {
        // this.fetchLeaderBoard();
        // appDataService.config.subscribe((res) => {
        //     console.log({ res });
        // });
    }

    fetchLeaderBoard(url: string): Observable<ResGamification[]> {
        if (this.leaderboard.getValue()?.length) {
            return this.leaderboard.asObservable();
        } else {
            return this.httpClient.post<{ d: string }>(url, {}).pipe(map((x) => JSON.parse(x.d)));
        }
    }

    getAgentProgress(url: string, agentId: string): Observable<any> {
        return this.httpClient.post(url, { agentId });
    }
}
