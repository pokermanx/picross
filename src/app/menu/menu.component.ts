import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getLevels()
      .subscribe(levels => {
        console.log(levels)
      });
  }
}
