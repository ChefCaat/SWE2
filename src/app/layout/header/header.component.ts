import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { HOME_PATH } from '../../shared';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'hs-header',
    templateUrl: './header.component.html',
    styles: [],
})
export class HeaderComponent implements OnInit {
    notLoggedIn!: boolean;
    readonly faSignOutAlt = faSignOutAlt;
    private isLoggedInSubscription!: Subscription;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {
        console.log('HeaderComponent.constructor()');
    }

    ngOnInit() {
        this.notLoggedIn = !this.authService.isLoggedIn;
        this.isLoggedInSubscription = this.subscribeLogin();
    }

    onLogout() {
        console.log('LoginLogoutComponent.onLogout()');
        this.authService.logout();
        return this.router.navigate([HOME_PATH]);
    }

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
