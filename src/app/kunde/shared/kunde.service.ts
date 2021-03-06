// tslint:disable:max-file-line-count

// Bereitgestellt durch HttpClientModule (s. Re-Export in SharedModule)
// HttpClientModule enthaelt nur Services, keine Komponenten
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
    HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
// https://github.com/ReactiveX/rxjs/blob/master/src/internal/Subject.ts
// https://github.com/ReactiveX/rxjs/blob/master/src/internal/Observable.ts
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { BASE_URI, BUECHER_PATH_REST } from '../../shared';
// Aus SharedModule als Singleton exportiert
import { DiagrammService } from '../../shared/diagramm.service';

import { Kunde, KundeServer, KundeShared, GeschlechtType } from './kunde';

// Methoden der Klasse HttpClient
//  * get(url, options) – HTTP GET request
//  * post(url, body, options) – HTTP POST request
//  * put(url, body, options) – HTTP PUT request
//  * patch(url, body, options) – HTTP PATCH request
//  * delete(url, options) – HTTP DELETE request

// Eine Service-Klasse ist eine "normale" Klasse gemaess ES 2015, die mittels
// DI in eine Komponente injiziert werden kann, falls sie innerhalb von
// provider: [...] bei einem Modul oder einer Komponente bereitgestellt wird.
// Eine Komponente realisiert gemaess MVC-Pattern den Controller und die View.
// Die Anwendungslogik wird vom Controller an Service-Klassen delegiert.

/**
 * Die Service-Klasse zu B&uuml;cher wird zum "Root Application Injector"
 * hinzugefuegt und ist in allen Klassen der Webanwendung verfuegbar.
 */
@Injectable({ providedIn: 'root' })
export class KundeService {
    private baseUriKunden: string;

    // Observables = Event-Streaming mit Promises
    readonly kundenSubject = new Subject<Array<Kunde>>();
    readonly kundeSubject = new Subject<Kunde>();
    readonly errorSubject = new Subject<string | number>();

    // tslint:disable-next-line:variable-name
    private _kunde!: Kunde;

    private headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain',
    });

    constructor(
        private readonly diagrammService: DiagrammService,
        private readonly httpClient: HttpClient,
    ) {
        this.baseUriKunden = `${BASE_URI}/${BUECHER_PATH_REST}`;
        console.log(
            `KundeService.constructor(): baseUriKunden=${this.baseUriKunden}`,
        );
    }

    set kunde(kunde: Kunde) {
        console.log('KundeService.set kunde()', kunde);
        this._kunde = kunde;
    }

    subscribeKunden(next: (kunden: Array<Kunde>) => void) {
        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request auch abbrechen ("cancel") kann
        // tslint:disable:max-line-length
        // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md
        // http://stackoverflow.com/questions/34533197/what-is-the-difference-between-rx-observable-subscribe-and-foreach
        // https://xgrommx.github.io/rx-book/content/observable/observable_instance_methods/subscribe.html
        // tslint:enable:max-line-length
        return this.kundenSubject.subscribe(next);
    }
    subscribeKunde(next: (kunde: Kunde) => void) {
        return this.kundeSubject.subscribe(next);
    }

    subscribeError(next: (err: string | number) => void) {
        return this.errorSubject.subscribe(next);
    }

    /**
     * Buecher suchen
     * @param suchkriterien Die Suchkriterien
     */
    find(suchkriterien: KundeShared) {
        const params = this.suchkriterienToHttpParams(suchkriterien);
        const uri = this.baseUriKunden;
        console.log(`KundeService.find(): uri=${uri}`);

        const errorFn = (err: HttpErrorResponse) => {
            if (err.error instanceof ProgressEvent) {
                console.error('Client-seitiger oder Netzwerkfehler', err.error);
                this.errorSubject.next(-1);
                return;
            }

            const { status } = err;
            console.log(
                `KundeService.find(): errorFn(): status=${status}, ` +
                    'Response-Body=',
                err.error,
            );
            this.errorSubject.next(status);
        };

        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request abbrechen ("cancel") kann
        // tslint:disable:max-line-length
        // https://angular.io/guide/http
        // tslint:enable:max-line-length
        return this.httpClient
            .get<Array<KundeServer>>(uri, { params })
            .pipe(
                // http://reactivex.io/documentation/operators.html
                map(jsonArray =>
                    jsonArray.map(jsonObjekt => Kunde.fromServer(jsonObjekt)),
                ),
            )
            .subscribe(buecher => this.kundenSubject.next(buecher), errorFn);
    }

    findById(id: string | undefined) {
        if (this._kunde !== undefined && this._kunde.id === id) {
            console.log('KundeService.findById(): Kunde gepuffert');
            this.kundeSubject.next(this._kunde);
            return;
        }
        if (id === undefined) {
            console.log('KundeService.findById(): Keine Id');
            return;
        }

        // Ggf wegen fehlender Versionsnummer (im ETag) nachladen
        const uri = `${this.baseUriKunden}/${id}`;

        const errorFn = (err: HttpErrorResponse) => {
            if (err.error instanceof ProgressEvent) {
                console.error(
                    'KundeService.findById(): errorFn(): Client- oder Netzwerkfehler',
                    err.error,
                );
                this.errorSubject.next(-1);
                return;
            }

            const { status } = err;
            console.log(
                `KundeService.findById(): errorFn(): status=${status}` +
                    `Response-Body=${err.error}`,
            );
            this.errorSubject.next(status);
        };

        console.log('KundeService.findById(): GET-Request');

        let body: KundeServer | null;
        let etag: string | null;
        return this.httpClient
            .get<KundeServer>(uri, { observe: 'response' })
            .pipe(
                filter(response => {
                    console.debug(
                        'KundeService.findById(): filter(): response=',
                        response,
                    );
                    ({ body } = response);
                    return body !== null;
                }),
                filter(response => {
                    etag = response.headers.get('ETag');
                    return etag !== null;
                }),
                map(_ => {
                    this._kunde = Kunde.fromServer(body, etag);
                    return this._kunde;
                }),
            )
            .subscribe(kunde => this.kundeSubject.next(kunde), errorFn);
    }

    save(
        neuerKunde: Kunde,
        successFn: (location: string | undefined) => void,
        errorFn: (status: number, errors: { [s: string]: any }) => void,
    ) {
        // Alternative:date-fns

        const errorFnPost = (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
                console.error(
                    'KundeService.save(): errorFnPost(): Client- oder Netzwerkfehler',
                    err.error.message,
                );
            } else {
                if (errorFn !== undefined) {
                    // z.B. {titel: ..., verlag: ..., isbn: ...}
                    errorFn(err.status, err.error);
                } else {
                    console.error('errorFnPost', err);
                }
            }
        };

        return this.httpClient
            .post(this.baseUriKunden, neuerKunde, {
                headers: this.headers,
                observe: 'response',
                responseType: 'text',
            })
            .pipe(
                map(response => {
                    console.debug(
                        'KundeService.save(): map(): response',
                        response,
                    );
                    const { headers } = response;
                    let location: string | null | undefined = headers.get(
                        'Location',
                    );
                    if (location === null) {
                        location = undefined;
                    }
                    return location;
                }),
            )
            .subscribe(location => successFn(location), errorFnPost);
    }

    update(
        kunde: Kunde,
        successFn: () => void,
        errorFn: (
            status: number,
            errors: { [s: string]: any } | undefined,
        ) => void,
    ) {
        const { version } = kunde;
        if (version === undefined) {
            console.error(`Keine Versionsnummer fuer den Kunden ${kunde.id}`);
            return;
        }
        const errorFnPut = (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
                console.error(
                    'Client-seitiger oder Netzwerkfehler',
                    err.error.message,
                );
            } else {
                if (errorFn !== undefined) {
                    errorFn(err.status, err.error);
                } else {
                    console.error('errorFnPut', err);
                }
            }
        };

        const uri = `${this.baseUriKunden}/${kunde.id}`;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'text/plain',
            'If-Match': `"${version}"`,
        });
        console.log('headers=', this.headers);
        return this.httpClient
            .put(uri, kunde, { headers: this.headers })
            .subscribe(successFn, errorFnPut);
    }

    remove(
        kunde: Kunde,
        successFn: (() => void) | undefined,
        errorFn: (status: number) => void,
    ) {
        const uri = `${this.baseUriKunden}/${kunde.id}`;

        const errorFnDelete = (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
                console.error(
                    'Client-seitiger oder Netzwerkfehler',
                    err.error.message,
                );
            } else {
                if (errorFn !== undefined) {
                    errorFn(err.status);
                } else {
                    console.error('errorFnPut', err);
                }
            }
        };

        return this.httpClient.delete(uri).subscribe(successFn, errorFnDelete);
    }

    // http://www.sitepoint.com/15-best-javascript-charting-libraries
    // http://thenextweb.com/dd/2015/06/12/20-best-javascript-chart-libraries
    // http://mikemcdearmon.com/portfolio/techposts/charting-libraries-using-d3

    // D3 (= Data Driven Documents) https://d3js.org ist das fuehrende Produkt
    // fuer Datenvisualisierung:
    //  initiale Version durch die Dissertation von Mike Bostock
    //  gesponsort von der New York Times, seinem heutigen Arbeitgeber
    //  basiert auf SVG = scalable vector graphics: Punkte, Linien, Kurven, ...
    //  ca 250.000 Downloads/Monat bei https://www.npmjs.com
    //  https://github.com/mbostock/d3 mit ueber 100 Contributors

    // Weitere Alternativen:
    // Google Charts: https://google-developers.appspot.com/chart
    // Chartist.js:   http://gionkunz.github.io/chartist-js
    // n3-chart:      http://n3-charts.github.io/line-chart

    // Chart.js ist deutlich einfacher zu benutzen als D3
    //  basiert auf <canvas>
    //  ca 25.000 Downloads/Monat bei https://www.npmjs.com
    //  https://github.com/nnnick/Chart.js mit ueber 60 Contributors

    /**
     * Ein Balkendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    createBarChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriKunden;
        return this.httpClient
            .get<Array<KundeServer>>(uri)
            .pipe(
                // ID aus Self-Link
                map(kunden => kunden.map(kunde => this.setKundeId(kunde))),
                map(kunden => {
                    const kundenGueltig = kunden.filter(
                        b => b.id !== null && b.nachname !== undefined,
                    );
                    const labels = kundenGueltig.map(b => b.nachname);
                    console.log(
                        'KundeService.createBarChart(): labels: ',
                        labels,
                    );

                    const data = kundenGueltig.map(b => b.kategorie);
                    const datasets = [{ label: 'Kategorie', data }];

                    return {
                        type: 'bar',
                        data: { labels, datasets },
                    };
                }),
            )
            .subscribe(config =>
                this.diagrammService.createChart(chartElement, config),
            );
    }

    /**
     * Ein Liniendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    createLinearChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriKunden;

        this.httpClient
            .get<Array<KundeServer>>(uri)
            .pipe(
                // ID aus Self-Link
                map(kunden => kunden.map(b => this.setKundeId(b))),
                map(kunden => {
                    const kundenGueltig = kunden.filter(
                        b => b.id !== null && b.nachname !== undefined,
                    );
                    const labels = kundenGueltig.map(b => b.nachname);
                    console.log(
                        'KundeService.createLinearChart(): labels: ',
                        labels,
                    );

                    const data = kundenGueltig.map(b => b.kategorie);
                    const datasets = [{ label: 'Kategorie', data }];

                    return {
                        type: 'line',
                        data: { labels, datasets },
                    };
                }),
            )
            .subscribe(config =>
                this.diagrammService.createChart(chartElement, config),
            );
    }

    /**
     * Ein Tortendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    createPieChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriKunden;

        this.httpClient
            .get<Array<KundeServer>>(uri)
            .pipe(
                // ID aus Self-Link
                map(kunden => kunden.map(buch => this.setKundeId(buch))),
                map(kunden => {
                    const kundenGueltig = kunden.filter(
                        b => b.id !== null && b.nachname !== undefined,
                    );
                    const labels = kundenGueltig.map(b => b.nachname);
                    console.log(
                        'KundeService.createPieChart(): labels: ',
                        labels,
                    );
                    const umsaetze = kundenGueltig.map(b => b.kategorie);

                    const anzahl = umsaetze.length;
                    const backgroundColor = new Array<string>(anzahl);
                    const hoverBackgroundColor = new Array<string>(anzahl);
                    Array(anzahl)
                        .fill(true)
                        .forEach((_, i) => {
                            backgroundColor[
                                i
                            ] = this.diagrammService.getBackgroundColor(i);
                            hoverBackgroundColor[
                                i
                            ] = this.diagrammService.getHoverBackgroundColor(i);
                        });

                    const data: any = {
                        labels,
                        datasets: [
                            {
                                data: umsaetze,
                                backgroundColor,
                                hoverBackgroundColor,
                            },
                        ],
                    };

                    return { type: 'pie', data };
                }),
            )
            .subscribe(config =>
                this.diagrammService.createChart(chartElement, config),
            );
    }

    toString() {
        return `KundeService: {buch: ${JSON.stringify(this._kunde, null, 2)}}`;
    }

    /**
     * Suchkriterien in Request-Parameter konvertieren.
     * @param suchkriterien Suchkriterien fuer den GET-Request.
     * @return Parameter fuer den GET-Request
     */
    private suchkriterienToHttpParams(suchkriterien: KundeShared): HttpParams {
        let httpParams = new HttpParams();

        if (
            suchkriterien.nachname !== undefined &&
            suchkriterien.nachname !== ''
        ) {
            httpParams = httpParams.set('nachname', suchkriterien.nachname);
        }
        if (suchkriterien.email !== undefined && suchkriterien.email !== '') {
            const value = suchkriterien.email;
            httpParams = httpParams.set('email', value);
        }
        if (suchkriterien.geschlecht !== undefined) {
            const value = suchkriterien.geschlecht;
            httpParams = httpParams.set('geschlecht', value);
        }
        return httpParams;
    }

    private setKundeId(kunde: KundeServer) {
        const { _links } = kunde;
        if (_links !== undefined) {
            const selfLink = kunde._links.self.href;
            if (typeof selfLink === 'string') {
                const lastSlash = selfLink.lastIndexOf('/');
                kunde.id = selfLink.substring(lastSlash + 1);
            }
        }
        if (kunde.id === undefined) {
            kunde.id = 'undefined';
        }
        return kunde;
    }
}

export interface Suchkriterien {
    nachname: string;
    geschlecht: GeschlechtType | '';
    email: string | '';
    interesse: { lesen: boolean; reisen: boolean; sport: boolean };
}
