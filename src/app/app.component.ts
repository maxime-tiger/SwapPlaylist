import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HttpClient, HttpClientModule, HttpHeaders} from "@angular/common/http";
import {Buffer} from "buffer";
import {timestamp} from "rxjs";
import {log} from "@angular-devkit/build-angular/src/builders/ssr-dev-server";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'swap-playlist';

  constructor(private http: HttpClient) {
  }

  getToken() {
    let url :string = 'https://accounts.spotify.com/api/token';
    const client_id :string = '3f82b5f665af4633b622356a81534e22'
    const client_secret :string = 'fad1fd57b253473daee79c66eae218eb'
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
    });

    let body :string = 'grant_type=client_credentials';

    this.http.post(url, body, {headers},)
    .subscribe((elem :Object) => {
      // TODO : Améliorer stockage du Token avec durée de validité (3600s par default)
      sessionStorage.setItem('token', Object.entries(elem)[0][1])
    })
  }

  getArtist() {
    const token: string | null = sessionStorage.getItem('token');
    this.http.get('https://api.spotify.com/v1/artists/4Z8W4fKeB5YxbusRsdQVPb', {headers: {'Authorization': 'Bearer ' + token}})
      .subscribe(elem => {
        console.log(elem)
      })
  }
}

// Let's see !
// https://www.youtube.com/watch?v=SbelQW2JaDQ
