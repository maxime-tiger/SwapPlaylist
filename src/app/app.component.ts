import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HttpClient, HttpClientModule, HttpHeaders} from "@angular/common/http";
import {Buffer} from "buffer";
import {timeout} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'swap-playlist';
  // LINK
  AUTHORIZE_URL = new URL('https://accounts.spotify.com/authorize');
  TOKEN_URL = 'https://accounts.spotify.com/api/token';
  // SECRETS
  CLIENT_ID = '3f82b5f665af4633b622356a81534e22';
  CLIENT_SECRET = 'fad1fd57b253473daee79c66eae218eb';
  REDIRECT_URI = 'http://localhost:4200';
  SCOPE = 'user-read-private user-read-email';

  constructor(private http: HttpClient) {}

  async login() {
    let codeVerifier  = this.generateRandomString(64);
    let hashed = await this.generateSha256(codeVerifier);
    let codeChallenge = this.base64encode(hashed);

    window.localStorage.setItem('code_verifier', codeVerifier);
    const params =  {
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope: this.SCOPE,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: this.REDIRECT_URI,
    }

    this.AUTHORIZE_URL.search = new URLSearchParams(params).toString();
    window.location.href = this.AUTHORIZE_URL.toString();
  }

  async getPlaylist() {
    await this.valideToken();

    let url = 'https://api.spotify.com/v1/me/playlists';

    const payload = {
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
    }

    const body = await fetch(url, payload);
    const response = await body.json();

    response.items.forEach((playlist :any) => {
      console.log(playlist.name);
    })
  }

  async getToken() {
    const urlParams = new URLSearchParams(window.location.search);
    let codeCheck = urlParams.get('code');
    let code;
    if (codeCheck == null) {
      code = '';
    } else {
      code = codeCheck;
    }

    let codeVerifierCheck = localStorage.getItem('code_verifier');
    let codeVerifier;
    if (codeVerifierCheck == null) {
      codeVerifier = '';
    } else {
      codeVerifier = codeVerifierCheck;
    }

    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    }

    const body = await fetch(this.TOKEN_URL, payload);
    const response = await body.json();

    let currentDate = new Date();
    let expire_date = currentDate.setHours(currentDate.getDate() + 1);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('expire_date', expire_date.toString());
  }

  // TODO Create refresh token method => https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
  async refreshToken() {
    await this.getToken();
  }

  async valideToken() {
    let expire_date = localStorage.getItem('expire_date');

    if (expire_date === null) {
      await this.getToken();
    } else if (expire_date > Date.now().toString()) {
      await this.refreshToken();
    }
  }

  generateRandomString(length :number) :string {
    const possible :string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values :Uint8Array = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  async generateSha256(plain :string) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
  }

  base64encode(input :any) :string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

// Let's see !
// https://www.youtube.com/watch?v=SbelQW2JaDQ
// https://www.youtube.com/watch?v=olY_2MW4Eik
// https://accounts.spotify.com/authorize
