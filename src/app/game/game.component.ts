import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import fetchFromSpotify from 'src/services/api';
import { request } from 'src/services/api';
import { SpotifyService } from '../spotify-service';

interface Track {
  id: string;
  name: string;
  album?: string;  // Optional field
  preview_url?: string;  // Optional field
}

interface Option {
  name: string;
  img: string;
}

interface Question {
  text: string;
  options: Option[];
  correctAnswer: string;
  preview?: string;  // Optional field
}

const AUTH_ENDPOINT = "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  searchType: string;
  searchQuery: string;
  numChoices: number;
  numQuestions: number;
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  score: number = 0;
  token: string = '';
  authLoading: boolean = false;
  isPlayingSnippet: boolean = false;
  currentSnippet: HTMLAudioElement | null = null;
  tracks: Track[] = [];  // Define the tracks property
  selectedAnswer: string = '';  // Define a property to store the selected answer

  constructor(private router: Router, private spotifyService: SpotifyService) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      searchType: string,
      searchQuery: string,
      numChoices: number,
      numQuestions: number
    };
    this.searchType = state.searchType;
    this.searchQuery = state.searchQuery;
    this.numChoices = state.numChoices;
    this.numQuestions = state.numQuestions;
  }

  ngOnInit(): void {
    this.authLoading = true;
    const storedTokenString = localStorage.getItem(TOKEN_KEY);
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      if (storedToken.expiration > Date.now()) {
        this.authLoading = false;
        this.token = storedToken.value;
        this.spotifyService.setToken(this.token);
        if (this.searchType === 'album') {
          this.createAlbumQuestions();
        } else {
          this.createQuestions();
        }
        return;
      }
    }
    console.log("Sending request to AWS endpoint");
    request(AUTH_ENDPOINT).then(({ access_token, expires_in }) => {
      const newToken = {
        value: access_token,
        expiration: Date.now() + (expires_in - 20) * 1000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(newToken));
      this.authLoading = false;
      this.token = newToken.value;
      this.spotifyService.setToken(this.token);
      if (this.searchType === 'album') {
        this.createAlbumQuestions();
      } else {
        this.createQuestions();
      }
    });
  }

  async fetchTracks(): Promise<Track[]> {
    try {
      const playlists = await this.spotifyService.searchPlaylistsByGenre('rock'); // Replace 'rock' with the genre you want to fetch
      console.log('Fetched playlists:', playlists);

      if (playlists.length === 0) {
        throw new Error('No playlists found');
      }

      const selectedPlaylist = this.spotifyService.selectRandomPlaylist(playlists);
      console.log('Selected playlist:', selectedPlaylist);

      const tracks = await this.spotifyService.fetchTracksFromPlaylist(selectedPlaylist.id);
      console.log('Fetched tracks from playlist:', tracks);

      return tracks;
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      throw error;
    }
  }

  async createQuestions() {
    console.log(`Generating ${this.numQuestions} questions with ${this.numChoices} choices each`);

    try {
      this.tracks = await this.fetchTracks();
      console.log('Fetched tracks:', this.tracks);

      if (this.tracks.length < this.numQuestions) {
        console.error("Not enough songs to create questions. Please select a different genre.");
        return;
      }

      this.questions = [];
      for (let i = 0; i < this.numQuestions; i++) {
        const randomTracks = this.spotifyService.shuffleArray(this.tracks).slice(0, this.numChoices);
        const correctTrack = randomTracks[Math.floor(Math.random() * randomTracks.length)];
        const options: Option[] = randomTracks.map(track => ({
          name: track.name,
          img: track.album || '' // Adjust this if you want to display album images
        }));

        this.questions.push({
          text: "Which track is playing?",
          options,
          correctAnswer: correctTrack.name,
          preview: correctTrack.preview_url
        });
        console.log(`Question ${i + 1}:`, this.questions[i]);
      }
    } catch (error) {
      console.error('Failed to create questions:', error);
    }
  }

  async createAlbumQuestions() {
    try {
      const albumTracks = await this.spotifyService.searchByAlbumName(this.searchQuery);
      const incorrectTracks = await this.spotifyService.fetchIncorrectTracks(this.numChoices - 1);

      if (albumTracks.length === 0) {
        console.error("No tracks found for the specified album.");
        return;
      }

      this.questions = [];
      for (let i = 0; i < this.numQuestions; i++) {
        const correctTrack = albumTracks[Math.floor(Math.random() * albumTracks.length)];
        const options: Option[] = incorrectTracks.slice(0, this.numChoices - 1).map(track => ({
          name: track.name,
          img: '' // Adjust this if you want to display album images
        }));

        options.push({
          name: correctTrack.name,
          img: '' // Adjust this if you want to display album images
        });

        this.questions.push({
          text: `Which track is from the album ${this.searchQuery}?`,
          options: this.spotifyService.shuffleArray(options),
          correctAnswer: correctTrack.name
        });
      }
    } catch (error) {
      console.error('Failed to create album questions:', error);
    }
  }

  playSnippet(previewUrl?: string) {
    if (!previewUrl) {
      console.warn("No preview URL available for this track.");
      return;
    }
    if (this.currentSnippet) {
      this.currentSnippet.pause();
      this.currentSnippet = null;
    }
    this.currentSnippet = new Audio(previewUrl);
    this.currentSnippet.play();
  }

  pauseSnippet() {
    if (this.currentSnippet) {
      this.currentSnippet.pause();
    }
  }

  selectAnswer(option: string) {
    this.selectedAnswer = option;  // Store the selected answer
  }

  nextQuestion() {
    this.pauseSnippet();  // Pause the snippet when navigating to the next question

    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (this.selectedAnswer === currentQuestion.correctAnswer) {
      this.score++;
    }

    this.currentQuestionIndex++;
    this.selectedAnswer = '';  // Reset selected answer for next question
  }

  submitQuiz() {
    this.pauseSnippet();  // Pause the snippet when navigating to the results page

    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (this.selectedAnswer === currentQuestion.correctAnswer) {
      this.score++;
    }

    this.router.navigate(['/results'], { state: { score: this.score, numQuestions: this.numQuestions } });
  }
}