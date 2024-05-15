import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface LeaderboardEntry {
  name: string;
  score: number;
  percentage: number;
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  score: number = 0;
  numQuestions: number = 0;
  resultMessage: string = '';
  leaderboard: LeaderboardEntry[] = [];

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { score: number, numQuestions: number };
    if (state) {
      this.score = state.score;
      this.numQuestions = state.numQuestions;
    }
  }

  ngOnInit(): void {
    this.loadLeaderboard();
    this.calculateResult();
    this.updateLeaderboard();
  }

  calculateResult(): void {
    const percentage = (this.score / this.numQuestions) * 100;
    this.resultMessage = percentage >= 70 ? 'You Win!' : 'You Lose!';
  }

  updateLeaderboard(): void {
    const playerName = prompt("Enter your name:");
    const percentage = (this.score / this.numQuestions) * 100;
    const newEntry: LeaderboardEntry = {
      name: playerName || 'Anonymous',
      score: this.score,
      percentage: percentage
    };

    this.leaderboard.push(newEntry);
    this.leaderboard.sort((a, b) => b.percentage - a.percentage);
    this.saveLeaderboard();
  }

  saveLeaderboard(): void {
    localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
    console.log('Leaderboard saved:', this.leaderboard);  // Debugging log
  }

  loadLeaderboard(): void {
    const storedLeaderboard = localStorage.getItem('leaderboard');
    if (storedLeaderboard) {
      this.leaderboard = JSON.parse(storedLeaderboard);
    }
    console.log('Loaded leaderboard:', this.leaderboard);  // Debugging log
  }

  restart() {
    this.router.navigate(['/']);
  }
}