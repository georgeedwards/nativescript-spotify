import {TNSSpotifyAuth} from './auth';
import {TNSTrack} from '../common';

declare var SPTSearch, NSURL;

export class TNSSpotifySearch {
  //https://developer.spotify.com/ios-sdk-docs/Documents/Classes/SPTRequest.html
  public static CURRENT_LIST: any;
  public static CURRENT_SEARCH_QUERY: string;

  public static QUERY(query: string, queryType: string, offset: number = 0): Promise<any> {
    // query: search term
    // queryType: album, artist, playlist, and track
    query = query && query.length ? query.replace(' ', '+') : '';

    return new Promise((resolve, reject) => {  
      if (query.length === 0) {
        return;
      }

      let reset = false;
      if (TNSSpotifySearch.CURRENT_SEARCH_QUERY !== query) {
        TNSSpotifySearch.CURRENT_SEARCH_QUERY = query;
        // always reset with new queries
        reset = true;
        TNSSpotifySearch.CURRENT_LIST = undefined;
      }

      let processResults = (error: any, results: any) => {
        if (error != null) {
          console.log(`*** Spotify search error:`);
          console.log(error);
          for (let key in error) {
            console.log('-----');
            console.log(key);
            console.log(error[key]);
          }
          reject();
          return;
        }
        
        TNSSpotifySearch.CURRENT_LIST = results;
        console.log(results);
        if (results && results.items) {
          let result: any = {
            page: offset,
            hasNextPage: results.hasNextPage,
            totalListLength: results.totalListLength
          };
          switch (queryType) {
            case 'track':
              result.tracks = TNSSpotifySearch.TRACKS_FROM_RESULTS(results)
              break;
          }
          resolve(result);
        } else {
          // no results
          reject();
        }
      };

      console.log(`TNSSpotifySearch.QUERY offset: ${offset}`);
      TNSSpotifyAuth.VERIFY_SESSION(TNSSpotifyAuth.SESSION).then(() => {
        if (!reset && offset > 0 && TNSSpotifySearch.CURRENT_LIST) {

          if (TNSSpotifySearch.CURRENT_LIST.hasNextPage) {
            // get next page
            TNSSpotifySearch.CURRENT_LIST.requestNextPageWithAccessTokenCallback(TNSSpotifyAuth.SESSION.accessToken, processResults);
          }          
          
        } else {

          SPTSearch.performSearchWithQueryQueryTypeOffsetAccessTokenCallback(NSURL.URLWithString(query), queryType, offset, TNSSpotifyAuth.SESSION.accessToken, processResults);
        }

      }, () => {
        reject();
      });
    });
  }
  
  public static TRACKS_FROM_RESULTS(results: any): Array<TNSTrack> {
    let itemNSArray = results.items;
    let cnt = itemNSArray.count;
    let items = [];
    for (let i = 0; i < cnt; i++) {
      let trackObj = itemNSArray.objectAtIndex(i);
      // console.log(trackObj.artists);
      let track: TNSTrack = {
        id: trackObj.identifier,
        name: trackObj.name,
        artist: trackObj.artists.objectAtIndex(0),
        duration: trackObj.duration,
        playableUri: trackObj.playableUri.absoluteString,
        previewUrl: trackObj.previewURL.absoluteString,
        album: trackObj.album,
        playing: false
      };
      items.push(track);
    }
    return items;
  }
}