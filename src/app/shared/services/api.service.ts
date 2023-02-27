import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LevelConfig } from '../models/level.model';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(private http: HttpClient) { }

    getLevels(): Observable<string[]> {
        return this.http.get('http://localhost:5500/levels') as Observable<string[]>;
    }

    getLevelFile(fileName: string): Observable<LevelConfig> {
        return this.http.get(`http://localhost:5500/levels/${fileName}`) as Observable<LevelConfig>;
    }

    createLevel(level: LevelConfig) {
        return this.http.post(`http://localhost:5500/levels`, level) as Observable<LevelConfig>;
    }
}
