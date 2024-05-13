import { Component, OnInit } from "@angular/core";
import fetchFromSpotify, { request } from "../../services/api";

const AUTH_ENDPOINT =
  "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  constructor() {}

  genres: String[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: String = "";
  albumQuery: string = ""; // Holds the album name input what ngModel is binding to
  artistQuery: string = ""; // Holds the artist name input: what ngModel is binding to
  genreQuery: string = ""; // Holds the genre input for searching playlists
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: String = "";

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

  loadGenres = async (t: any) => {
    this.configLoading = true;

    // #################################################################################
    // DEPRECATED!!! Use only for example purposes
    // DO NOT USE the recommendations endpoint in your application
    // Has been known to cause 429 errors
    // const response = await fetchFromSpotify({
    //   token: t,
    //   endpoint: "recommendations/available-genre-seeds",
    // });
    // console.log(response);
    // #################################################################################

    this.genres = [
      "rock",
      "rap",
      "pop",
      "country",
      "hip-hop",
      "jazz",
      "alternative",
      "j-pop",
      "k-pop",
      "emo",
    ];
    this.configLoading = false;
  };

  setGenre(selectedGenre: any) {
    this.selectedGenre = selectedGenre;
    console.log(this.selectedGenre);
    console.log(TOKEN_KEY);
  }

  // Search by Genre
  searchByGenre = async (genre: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: genre,
        type: "playlist", // Assuming you want playlists for genres
        limit: 20,
      },
    });
    console.log("Genre search result:", response);
  };

  // Search by Album Name
  searchByAlbumName = async (albumName: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: `album:'${albumName}'`,
        type: "album",
        limit: 20,
      },
    });
    console.log("Album search result:", response);
  };

  // Search by Artist Name
  searchByArtist = async (artistName: string) => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: `artist:'${artistName}'`,
        type: "artist",
        limit: 20,
      },
    });
    console.log("Artist search result:", response);
  };
}
