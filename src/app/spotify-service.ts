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

    private async fetchWithRetry(endpoint: string, options: any, retries = 5, backoff = 500): Promise<any> {
        console.log(`Fetching with retry: endpoint=${endpoint}, options=${JSON.stringify(options)}`);
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetchFromSpotify({
                    token: this.token,
                    endpoint: endpoint,
                    params: options.params
                });
                console.log(`Fetch successful: ${JSON.stringify(response)}`);
                return response;
            } catch (err: any) {
                console.error(`Fetch failed (attempt ${i + 1}): ${err.message}`);
                if (err.status === 429) { // rate limit error
                    console.log(`Rate limit error, retrying in ${backoff * Math.pow(2, i)} ms`);
                    await new Promise(res => setTimeout(res, backoff * Math.pow(2, i))); // exponential backoff
                } else {
                    throw err;
                }
            }
        }
        throw new Error('Max retries reached');
    }

    async loadGenres(): Promise<Genre[]> {
        console.log('Loading genres...');
        const response = await this.fetchWithRetry('browse/categories', {
            params: { limit: 50 }
        });
        console.log('Genres loaded:', response);
        return response.categories.items.map((category: any) => ({
            id: category.id,
            name: category.name
        }));
    }

    async searchPlaylistsByGenre(genre: string): Promise<any[]> {
        const response = await this.fetchWithRetry('search', {
            params: {
                q: genre,
                type: "playlist",
                limit: 20
            }
        });
        return response.playlists.items;
    }

    async fetchTracksFromPlaylist(playlistId: string): Promise<Track[]> {
        const response = await this.fetchWithRetry(`playlists/${playlistId}/tracks`, {
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
          endpoint: 'search',
          params: { q: `album:'${albumName}'`, type: 'album', limit: 1 }
        });
        const album = response.albums.items[0];
        const tracks = await fetchFromSpotify({
          token: this.token,
          endpoint: `albums/${album.id}/tracks`
        });
        return tracks.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          album: album.name,
          preview_url: item.preview_url // Include the preview URL if available
        }));
      }

    selectRandomPlaylist(playlists: any[]): any {
        const randomIndex = Math.floor(Math.random() * playlists.length);
        return playlists[randomIndex];
    }

    async fetchIncorrectTracks(count: number): Promise<Track[]> {
        const response = await fetchFromSpotify({
          token: this.token,
          endpoint: 'browse/new-releases',
          params: { limit: 50 }
        });
        const albums = response.albums.items;
        let incorrectTracks: Track[] = [];
        for (const album of albums) {
          const tracks = await fetchFromSpotify({
            token: this.token,
            endpoint: `albums/${album.id}/tracks`
          });
          incorrectTracks.push(...tracks.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            album: album.name
          })));
        }
        return this.shuffleArray(incorrectTracks).slice(0, count);
      }

      shuffleArray(array: any[]): any[] {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }
    }
