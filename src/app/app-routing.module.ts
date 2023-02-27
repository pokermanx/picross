import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Game } from './game/game.component';
import { LevelBuilder } from './level-builder/level-builder.component';
import { MenuComponent } from './menu/menu.component';

const routes: Routes = [
  {
    path: 'game/:levelFile',
    pathMatch: 'full',
    redirectTo: '/game/:levelFile/0'
  },
  {
    path: 'game/:levelFile/:levelStage',
    component: Game
  },
  {
    path: 'level-builder',
    component: LevelBuilder
  },
  {
    path: 'menu',
    component: MenuComponent
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'menu'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
