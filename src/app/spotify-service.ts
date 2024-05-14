import fetchFromSpotify from "src/services/api";
import { Injectable } from "@angular/core";

interface Track {
    id: string;
    name: string;
    preview_url: string;
  }
  
  interface Genre {
    id: string;
    name: string;
  }
  
  @Injectable({
    providedIn: 'root',
  })
  export class SpotifyService {
    private token: string = '';
  
    constructor() {}
  
    setToken(token: string) {
      this.token = token;
    }
  
    async loadGenres(): Promise<Genre[]> {
        const response = await fetchFromSpotify({
          token: this.token,
          endpoint: 'recommendations/available-genre-seeds',
        });
        return response.genres.map((genre: string) => ({
          id: genre,
          name: genre.charAt(0).toUpperCase() + genre.slice(1),
        }));
      }
  
    async searchPlaylistsByGenre(genre: string): Promise<any[]> {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: "search",
        params: {
          q: genre,
          type: "playlist",
          limit: 20
        }
      });
      return response.playlists.items;
    }
  
    async fetchTracksFromPlaylist(playlistId: string): Promise<Track[]> {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `playlists/${playlistId}/tracks`,
        params: { limit: 50 }
      });
      return response.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        preview_url: item.track.preview_url
      })).filter((track: Track) => track.preview_url);
    }
  
    async searchArtistsByName(artistName: string): Promise<any> {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: "search",
        params: {
          q: `artist:"${artistName}"`,
          type: "artist",
          limit: 1
        }
      });
      return response;
    }
  
    async fetchAlbumsAndTracks(artistId: string): Promise<Track[]> {
      const albumResponse = await fetchFromSpotify({
        token: this.token,
        endpoint: `artists/${artistId}/albums`,
        params: { limit: 50, market: 'US' },
      });
      const albums = albumResponse.items;
      let tracks: Track[] = [];
      for (let album of albums) {
        const trackResponse = await fetchFromSpotify({
          token: this.token,
          endpoint: `albums/${album.id}/tracks`,
          params: { limit: 50 },
        });
        tracks.push(...trackResponse.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          preview_url: item.preview_url,
        })).filter((track: Track) => track.preview_url));
      }
      return tracks;
    }
  
    async searchByAlbumName(albumName: string): Promise<Track[]> {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: "search",
        params: {
          q: `album:'${albumName}'`,
          type: "album",
          limit: 20
        }
      });
      const albums = response.albums.items;
      let tracks: Track[] = [];
      for (let album of albums) {
        const trackResponse = await fetchFromSpotify({
          token: this.token,
          endpoint: `albums/${album.id}/tracks`,
          params: { limit: 50 },
        });
        tracks.push(...trackResponse.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          preview_url: item.preview_url,
        })).filter((track: Track) => track.preview_url));
      }
      return tracks;
    }
  
    selectRandomPlaylist(playlists: any[]): any {
      const randomIndex = Math.floor(Math.random() * playlists.length);
      return playlists[randomIndex];
    }
  
    shuffleArray(array: any[]): any[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  }