import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import fetchFromSpotify from 'src/services/api';
import { request } from 'src/services/api';
import { SpotifyService } from '../spotify-service';

interface Track {
  id: string;
  name: string;
  preview_url: string;
  }
  
  interface Option {
  name: string;
  img: string;
  }
  
  interface Question {
  text: string;
  options: Option[];
  correctAnswer: string;
  preview: string;
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
  selectedGenre: string;
  numChoices: number;
  numQuestions: number;
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  score: number = 0;
  isPlayingSnippet: boolean = false;
  currentSnippet: HTMLAudioElement | null = null;
  tracks: Track[] = [];
  token: string = '';
  authLoading: boolean = false;
  
  constructor(private router: Router, private spotifyService: SpotifyService) {
  const navigation = this.router.getCurrentNavigation();
  const state = navigation?.extras.state as {
  searchType: string,
  searchQuery: string,
  selectedGenre: string,
  numChoices: number,
  numQuestions: number
  };
  this.searchType = state.searchType;
  this.searchQuery = state.searchQuery;
  this.selectedGenre = state.selectedGenre;
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
  this.createQuestions();
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
  this.createQuestions();
  });
  }
  
async createQuestions() {
  console.log(`Generating ${this.numQuestions} questions with ${this.numChoices} choices each`);
  
  try {
    this.tracks = await this.fetchTracks();
    console.log('Fetched tracks:', this.tracks); // Log the tracks array to see what it contains

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
        img: track.img || '' // Adjust this as necessary
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
  
async fetchTracks(): Promise<Track[]> {
  try {
    const playlists = await this.spotifyService.searchPlaylistsByGenre('rock'); // Replace 'rock' with the genre you want to fetch
    console.log('Fetched playlists:', playlists); // Log the playlists to see what was fetched

    if (playlists.length === 0) {
      throw new Error('No playlists found');
    }

    const selectedPlaylist = this.spotifyService.selectRandomPlaylist(playlists);
    console.log('Selected playlist:', selectedPlaylist); // Log the selected playlist

    const tracks = await this.spotifyService.fetchTracksFromPlaylist(selectedPlaylist.id);
    console.log('Fetched tracks from playlist:', tracks); // Log the tracks fetched from the playlist

    return tracks;
  } catch (error) {
    console.error('Failed to fetch tracks:', error);
    throw error;
  }
}
  
  async searchByGenre(genre: string): Promise<Track[]> {
  const playlists = await this.spotifyService.searchPlaylistsByGenre(genre);
  if (playlists.length === 0) {
  throw new Error('No playlists found');
  }
  const selectedPlaylist = this.spotifyService.selectRandomPlaylist(playlists);
  return this.spotifyService.fetchTracksFromPlaylist(selectedPlaylist.id);
  }
  
  async searchArtistsByName(artistName: string): Promise<Track[]> {
  const response = await this.spotifyService.searchArtistsByName(artistName);
  if (response.artists.items.length > 0) {
  const artist = response.artists.items[0];
  const albums = await this.spotifyService.fetchAlbumsAndTracks(artist.id);
  return albums;
  } else {
  throw new Error('No artist found');
  }
  }
  
  async searchByAlbumName(albumName: string): Promise<Track[]> {
  const albums = await this.spotifyService.searchByAlbumName(albumName);
  return albums;
  }
  
  playSnippet(previewUrl: string) {
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
  const currentQuestion = this.questions[this.currentQuestionIndex];
  if (option === currentQuestion.correctAnswer) {
  this.score++;
  }
  this.currentQuestionIndex++;
  if (this.currentQuestionIndex >= this.numQuestions) {
  this.router.navigate(['/results'], { state: { score: this.score, numQuestions: this.numQuestions } });
  }
  }
  }
  