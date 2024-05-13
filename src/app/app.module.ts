import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { QuizComponent } from "./quiz/quiz.component";
import { LeaderboardComponent } from "./leaderboard/leaderboard.component";

const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "/quizGame", component: QuizComponent },
  { path: "/leaderboard", component: LeaderboardComponent },
];

@NgModule({
  declarations: [AppComponent, HomeComponent, QuizComponent],
  imports: [BrowserModule, FormsModule, RouterModule.forRoot(routes)],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
