import { Component, Input, OnInit } from "@angular/core";
import { DataService } from "../data.service";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-quiz",
  templateUrl: "./quiz.component.html",
  styleUrls: ["./quiz.component.css"],
})
export class QuizComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private service: DataService,
    private router: Router
  ) {}

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
