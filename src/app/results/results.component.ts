import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  score: number = 0;
  numQuestions: number = 0;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { score: number, numQuestions: number };
    this.score = state.score;
    this.numQuestions = state.numQuestions;
  }

  ngOnInit(): void {}

  restart() {
    this.router.navigate(['/']);
  }
}