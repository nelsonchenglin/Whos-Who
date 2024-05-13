import { Injectable } from "@angular/core";
import fetchFromSpotify from "src/services/api";

@Injectable({
  providedIn: "root",
})
export class DataService {
  constructor() {}

  numberOfChoices: number = 2;
  numberOfQuestions: number = 1;
  genres: string[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: string = "";
  albumQuery: string = "";
  artistQuery: string = "";
  token: string = "";
  artistId: string = "";
  albumId: string = "";
}
