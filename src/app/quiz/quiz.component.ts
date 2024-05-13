import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-quiz",
  templateUrl: "./quiz.component.html",
  styleUrls: ["./quiz.component.css"],
})
export class QuizComponent implements OnInit {
  constructor() {}

  @Input() artistName: string = "";
  @Input() genreSelected: string = "";

  questions: object = {};
  answers: string[] = [];
  score: number = 0;
  numIncorrect: number = 0;
  quizDone: boolean = false;
  sampleList: object = {};
  currentSample: string = "";

  ngOnInit(): void {}
}
