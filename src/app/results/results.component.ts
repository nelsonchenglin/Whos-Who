import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

interface LeaderboardEntry {
  name: string;
  score: number;
  percentage: number;
  gameType: string;
}

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.css"],
})
export class ResultsComponent implements OnInit {
  score: number = 0;
  numQuestions: number = 0;
  resultMessage: string = "";
  leaderboard: LeaderboardEntry[] = [];
  gameType: string = "";
  gameEnded: boolean = false;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      score: number;
      numQuestions: number;
      gameType: string;
    };
    if (state) {
      this.score = state.score;
      this.numQuestions = state.numQuestions;
      this.gameType = state.gameType;
    }
  }

  ngOnInit(): void {
    this.loadLeaderboard();
    this.calculateResult();
    this.updateLeaderboard();
  }

  calculateResult(): void {
    const percentage = (this.score / this.numQuestions) * 100;
    this.resultMessage = percentage >= 70 ? "You Win!" : "You Lose!";
  }

  updateLeaderboard(): void {
    const playerName = prompt("Enter your name:");
    const percentage = (this.score / this.numQuestions) * 100;
    const percentageCheck =
      percentage == null ? 0 : parseFloat(percentage.toFixed(2));
    const newEntry: LeaderboardEntry = {
      name: playerName || "Anonymous",
      score: this.score,
      percentage: percentageCheck,
      gameType: this.gameType,
    };

    this.leaderboard.push(newEntry);
    this.leaderboard.sort((a, b) => b.percentage - a.percentage);
    this.saveLeaderboard();
  }

  saveLeaderboard(): void {
    localStorage.setItem("leaderboard", JSON.stringify(this.leaderboard));
  }

  loadLeaderboard(): void {
    const storedLeaderboard = localStorage.getItem("leaderboard");
    if (storedLeaderboard) {
      this.leaderboard = JSON.parse(storedLeaderboard);
    }
  }

  restart() {
    this.router.navigate(["/"]);
  }

  end() {
    this.gameEnded = true;
    this.resultMessage = "Thank you for playing!";
    localStorage.removeItem("scores");
  }
}
