import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../spotify-service';
import { request } from 'src/services/api';


interface Genre {
  id: string;
  name: string;
}
const AUTH_ENDPOINT = "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

@Component({
  selector: 'app-set-up-game-configuration',
  templateUrl: './set-up-game-configuration.component.html',
  styleUrls: ['./set-up-game-configuration.component.css']
})

export class SetUpGameConfigurationComponent implements OnInit {
  genres: Genre[] = []; // Update to use Genre type
  selectedGenre: string = '';
  searchType: string = 'genre';
  searchQuery: string = '';
  numChoices: number = 4;
  numQuestions: number = 4;
  token: string = '';

  constructor(private router: Router, private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    const storedTokenString = localStorage.getItem('whos-who-access-token');
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      if (storedToken.expiration > Date.now()) {
        this.token = storedToken.value;
        this.spotifyService.setToken(this.token);
        this.loadGenres();
        return;
      }
    }
    console.log("Sending request to AWS endpoint");
    request(AUTH_ENDPOINT).then(({ access_token, expires_in }) => {
      const newToken = {
        value: access_token,
        expiration: Date.now() + (expires_in - 20) * 1000,
      };
      localStorage.setItem('whos-who-access-token', JSON.stringify(newToken));
      this.token = newToken.value;
      this.spotifyService.setToken(this.token);
      this.loadGenres();
    });
  }

  loadGenres(): void {
    this.spotifyService.loadGenres().then(genres => {
      this.genres = genres;
    });
  }

  startGame() {
    const navigationExtras = {
      state: {
        searchType: this.searchType,
        searchQuery: this.searchQuery,
        selectedGenre: this.selectedGenre,
        numChoices: this.numChoices,
        numQuestions: this.numQuestions
      }
    };
    this.router.navigate(['/game'], navigationExtras);
  }
}