import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Game } from './game/game.component';
import { LevelBuilder } from './level-builder/level-builder.component';

const routes: Routes = [
  {
    path: 'game',
    component: Game
  },
  {
    path: 'level-builder',
    component: LevelBuilder
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
