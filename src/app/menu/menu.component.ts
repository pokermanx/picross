import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError } from 'rxjs';
import { MenuLevel } from '../shared/models/level.model';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {

  errorMessage = '';

  levels: MenuLevel[] = [];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService
      .getLevels()
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 0) {
            this.errorMessage = 'Please, make sure the back-end service is running. Launch the application with `npm run start`'
          }
          throw err;
        })
      )
      .subscribe((levels: string[]) => {

        this.levels = levels.map(level => ({
          levelFile: level,
          levelName: level.split('.')[0]
        }));
        console.log(this.levels);

      });
  }
}
