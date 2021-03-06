import { AuthService } from '../auth/auth.service';
// eslint-disable-next-line sort-imports
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HOME_PATH } from '../shared';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
// import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'hs-login',
    templateUrl: './login.component.html',
    styles: [],
})
export class LoginComponent implements OnInit, OnDestroy {
    username: string | undefined;
    password: string | undefined;
    notLoggedIn!: boolean;

    private isLoggedInSubscription!: Subscription;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {
        console.log('LoginLogoutComponent.constructor()');
    }

    ngOnInit() {
        // Initialisierung, falls zwischenzeitlich der Browser geschlossen wurde
        this.notLoggedIn = !this.authService.isLoggedIn;
        this.isLoggedInSubscription = this.subscribeLogin();
    }

    ngOnDestroy() {
        this.isLoggedInSubscription.unsubscribe();
    }

    onLogin() {
        console.log('LoginLogoutComponent.onLogin()');
        return this.authService.login(this.username, this.password);
    }

    /**
     * Ausloggen und dabei Benutzername und Passwort zur&uuml;cksetzen.
     */
    onLogout() {
        console.log('LoginLogoutComponent.onLogout()');
        this.authService.logout();
        return this.router.navigate([HOME_PATH]);
    }

    /**
     * Methode, um den injizierten <code>AuthService</code> zu beobachten,
     * ob es Login-Informationen gibt. Diese private Methode wird in der Methode
     * <code>ngOnInit</code> aufgerufen.
     */
    private subscribeLogin() {
        const next = (event: boolean) => {
            if (this.notLoggedIn && !event) {
                // Noch nicht eingeloggt und ein Login-Event kommt, d.h.
                // es gab einen Login-Versuch, der aber fehlerhaft (= false) war
                // TODO: Anzeige des fehlgeschlagenen Logins
                console.warn('AuthComponent: Falsche Login-Daten', event);
            }
            this.notLoggedIn = !event;
            console.log('AuthComponent.notLoggedIn:', this.notLoggedIn);
        };

        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request abbrechen ("cancel") kann
        // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md
        // http://stackoverflow.com/questions/34533197/what-is-the-difference-between-rx-observable-subscribe-and-foreach
        // https://xgrommx.github.io/rx-book/content/observable/observable_instance_methods/subscribe.html
        // Funktion als Funktionsargument, d.h. Code als Daten uebergeben
        return this.authService.isLoggedInSubject.subscribe(next);
    }
}
