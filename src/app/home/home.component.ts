import { Component, OnInit } from "@angular/core";
import fetchFromSpotify, { request } from "../../services/api";


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

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  genres: String[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: String = "";
  albumQuery: string = "";  
  artistQuery: string = "";  
  genreQuery: string = "";  
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: String = "";
  artistId: string = '';  
  albumId: String = '';
  searchType: string = 'genre';  
  searchQuery: string = '';  
  tracks: Track[] = [];  

  constructor() {}

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
    console.log(this.selectedGenre);
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
}

