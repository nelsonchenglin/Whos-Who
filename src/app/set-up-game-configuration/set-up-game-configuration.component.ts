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
const SETTINGS_KEY = "music-trivia-settings";

@Component({
  selector: 'app-set-up-game-configuration',
  templateUrl: './set-up-game-configuration.component.html',
  styleUrls: ['./set-up-game-configuration.component.css']
})
export class SetUpGameConfigurationComponent implements OnInit {
  genres: Genre[] = [];
  selectedGenre: string = '';
  searchType: string = 'genre';
  searchQuery: string = '';
  numChoices: number = 4;
  numQuestions: number = 4;
  token: string = '';

  constructor(private router: Router, private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    console.log('Initializing SetUpGameConfigurationComponent...');
    this.loadSettings();
    const storedTokenString = localStorage.getItem(TOKEN_KEY);
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      console.log('Stored token found:', storedToken);
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
      console.log('New token received:', newToken);
      localStorage.setItem(TOKEN_KEY, JSON.stringify(newToken));
      this.token = newToken.value;
      this.spotifyService.setToken(this.token);
      this.loadGenres();
    }).catch(error => {
      console.error('Failed to retrieve token from AWS endpoint:', error);
    });
  }

  loadGenres(): void {
    console.log('Calling loadGenres...');
    this.spotifyService.loadGenres().then(genres => {
      console.log('Genres loaded:', genres);
      this.genres = genres;
    }).catch(error => {
      console.error('Failed to load genres:', error);
    });
  }

  startGame() {
    const settings = {
      searchType: this.searchType,
      searchQuery: this.searchQuery,
      selectedGenre: this.genres.find(genre => genre.id === this.selectedGenre)?.name || '', // Get the genre name
      numChoices: this.numChoices,
      numQuestions: this.numQuestions
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('Starting game with configuration:', settings);
    this.router.navigate(['/game'], { state: settings });
  }

  loadSettings(): void {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      this.searchType = settings.searchType;
      this.searchQuery = settings.searchQuery;
      this.selectedGenre = settings.selectedGenre;
      this.numChoices = settings.numChoices;
      this.numQuestions = settings.numQuestions;
      console.log('Loaded settings:', settings);
    }
  }

  Leaderboard() {
    this.router.navigate(['/results']);
  }
}
