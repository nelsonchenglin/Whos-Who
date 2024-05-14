import { Component, OnInit } from "@angular/core";
import fetchFromSpotify, { request } from "../../services/api";
import { Router, NavigationExtras } from "@angular/router";

const AUTH_ENDPOINT = "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

interface Artist {
  name: string;
  id: string;
  img: string;
}

interface Track {
  id: string;
  name: string;
  preview_url: string;
}

interface Album {
  id: string;
  name: string;
}

interface SpotifyTrack {
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

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  genres: string[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: string = "";
  albumQuery: string = "";  
  artistQuery: string = "";  
  genreQuery: string = "";  
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: string = "";
  artistId: string = '';  
  albumId: string = '';
  searchType: string = 'genre';  
  searchQuery: string = '';  
  tracks: Track[] = [];  
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  numChoices: number = 4; // default number of choices
  numQuestions: number = 1; // default number of questions
  isPlayingSnippet: boolean = false;
  currentSnippet: HTMLAudioElement | null = null;
  errorMessage: string | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.authLoading = true;
    const storedTokenString = localStorage.getItem(TOKEN_KEY);
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      if (storedToken.expiration > Date.now()) {
        console.log("Token found in localstorage");
        this.authLoading = false;
        this.token = storedToken.value;
        this.loadGenres(storedToken.value);
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
      this.loadGenres(newToken.value);
    });
  }

  performSearch(): void {
    switch (this.searchType) {
      case 'genre':
        this.searchByGenre(this.searchQuery);
        break;
      case 'artist':
        this.searchArtistsByName(this.searchQuery).then(() => {
          if (this.tracks.length > 0) {
            console.log('Tracks found:', this.tracks);
             this.tracks.forEach(track => console.log('Track preview URL:', track.preview_url));
            this.createQuestions();
          }
        });
        break;
      case 'album':
        this.searchByAlbumName(this.searchQuery);
        break;
      default:
        console.error('Invalid search type');
        break;
    }
  }

  loadGenres = async (t: any) => {
    this.configLoading = true;
    this.genres = ["rock", "rap", "pop", "country", "hip-hop", "jazz", "alternative", "j-pop", "k-pop", "emo"];
    this.configLoading = false;
  };

  setGenre = (selectedGenre: any) => {
    this.selectedGenre = selectedGenre;
    console.log("is there selectedGenre value", this.selectedGenre);
    console.log(TOKEN_KEY);
  };

  searchByGenre = async (genre: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: { q: genre, type: "playlist", limit: 20 },
    });
    console.log("Genre search result:", response);
  };

  performGenreSearch = async (selectedGenre: string) => {
    if (!selectedGenre || !selectedGenre.trim()) {
      console.warn("Search query is empty.");
      return;  // Changed from return [] to return;
    }

    console.log("Searching playlists for genre:", selectedGenre); // Verify the incoming genre

    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: selectedGenre,
        type: "playlist",
        limit: 20  // Fetch a reasonable number of playlists
      },
    });

    if (!response || !response.playlists || !response.playlists.items) {
      console.error("Failed to fetch playlists or no playlists available.");
      return;  // Changed from return [] to return;
    }

    console.log("Playlist search result:", response);
    const selectedPlaylist = this.selectRandomPlaylist(response.playlists.items);
    const tracks = await this.fetchTracksFromPlaylist(selectedPlaylist.id);
    this.tracks = this.getRandomTracks(tracks);
    this.createQuestions();
    console.log("Tracks fetched:", this.tracks);
  };

  searchPlaylistsByGenre = async (selectedGenre: string) => {
    if (!selectedGenre.trim()) {
      console.warn("Search query is empty.");
      return [];
    }

    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: selectedGenre,
        type: "playlist",
        limit: 20  // Fetch a reasonable number of playlists
      },
    });

    if (!response || !response.playlists || !response.playlists.items) {
      console.error("Failed to fetch playlists or no playlists available.");
      return [];
    }

    console.log("Playlist search result:", response);
    return response.playlists.items;
  };

  selectRandomPlaylist = (playlists: any[]): any => {
    const randomIndex = Math.floor(Math.random() * playlists.length);
    return playlists[randomIndex];
  };

  fetchTracksFromPlaylist = async (playlistId: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: `playlists/${playlistId}/tracks`,
      params: { limit: 50 }
    });
  
    let tracks = response.items.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      preview_url: item.track.preview_url
    }));
  
    // Filter out tracks without preview URLs
    tracks = tracks.filter((track : Track) => track.preview_url);
    
    return tracks;
  };

  getRandomTracks = (tracks: any[], count: number = 10): any[] => {
    return this.shuffleArray(tracks).slice(0, count);
  };

  searchByAlbumName = async (albumName: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: { q: `album:'${albumName}'`, type: "album", limit: 20 },
    });
    console.log("Album search result:", response);
  };

  searchArtistsByName = async (artistName: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: { q: `artist:"${artistName}"`, type: "artist", limit: 1 },
    });
    if (response.artists.items.length > 0) {
      const artist = response.artists.items[0];
      this.artistId = artist.id;
      this.fetchAlbumsAndTracks(artist.id); 
    } else {
      console.warn("No artist found.");
      this.tracks = [];
    }
  };

  fetchAlbumsAndTracks = async (artistId: string) => {
    const albumResponse = await fetchFromSpotify({
      token: this.token,
      endpoint: `artists/${artistId}/albums`,
      params: { limit: 50, market: 'US' },
    });
    const albums = albumResponse.items;
    if (albums.length > 0) {
      const selectedAlbums = this.selectRandomAlbums(albums, 5);
      this.fetchTracksFromAlbums(selectedAlbums);
    } else {
      console.log("No albums found for this artist.");
    }
  };

  fetchTracksFromAlbums = async (albums: Album[]) => {
    let tracks: Track[] = [];
    for (let album of albums) {
      const trackResponse = await fetchFromSpotify({
        token: this.token,
        endpoint: `albums/${album.id}/tracks`,
        params: { limit: 50 },
      });
      tracks.push(...trackResponse.items.map((item: SpotifyTrack) => ({
        id: item.id,
        name: item.name,
        preview_url: item.preview_url,
      })));
    }
    tracks = this.shuffleArray(tracks).slice(0, 10);
    this.tracks = tracks;
    this.createQuestions();
  };

  shuffleArray = (array: any[]): any[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  selectRandomAlbums = (albums: any[], count: number): any[] => {
    return this.shuffleArray(albums).slice(0, count);
  };

  createQuestions = () => {
    console.log(`Generating ${this.numQuestions} questions with ${this.numChoices} choices each from ${this.tracks.length} tracks`);
    if (this.tracks.length < this.numQuestions) {
      this.errorMessage = "Not enough songs to create questions. Please select a different genre.";
      console.error(this.errorMessage);
      return;
    }

    this.questions = [];
    for (let i = 0; i < this.numQuestions; i++) {
      const randomTracks = this.shuffleArray(this.tracks).slice(0, this.numChoices);
      const correctTrack = randomTracks[Math.floor(Math.random() * randomTracks.length)];
      const options: Option[] = randomTracks.map(track => ({
        name: track.name,
        img: track.img
      }));

      this.questions.push({
        text: "Which track is playing?",
        options,
        correctAnswer: correctTrack.name,
        preview: correctTrack.preview_url
      });
      console.log(`Question ${i + 1}:`, this.questions[i]);
    }
  };

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
}