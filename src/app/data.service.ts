import { Injectable } from "@angular/core";
import fetchFromSpotify from "src/services/api";

@Injectable({
  providedIn: "root",
})
export class DataService {
  constructor() {}

  token: string = "";
  selectedGenre: string = "";
  numberOfChoices: number = 2;
  numberOfQuestions: number = 1;
}
