/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { CommonModule } from '@angular/common';
import { CreateEmailModule } from './create-email.module';
import { CreateFamilienstandModule } from './create-familienstand.module';
import { CreateGeburtsdatumModule } from './create-geburtsdatum.module';
import { CreateGeschlechtModule } from './create-geschlecht.module';
import { CreateHomepageModule } from './create-homepage.module';
import { CreateInteressenModule } from './create-interessen.module';
import { CreateKategorieModule } from './create-kategorie.module';
import { CreateKundeComponent } from './create-kunde.component';
import { CreateNachnameModule } from './create-nachname.module';
import { CreateNewsletterModule } from './create-newsletter.module';
import { CreateOrtModule } from './create-ort.module';
import { CreatePasswortModule } from './create-passwort.module';
import { CreatePlzModule } from './create-plz.module';
import { CreateSuccessModule } from './create-sucess/create-success.module';
import { CreateUsernameModule } from './create-username.module';
import { ErrorMessageModule } from '../../shared/error-message.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
// eslint-disable-next-line sort-imports
import { /* FormGroup, */ ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

// Ein Modul enthaelt logisch zusammengehoerige Funktionalitaet.
// Exportierte Komponenten koennen bei einem importierenden Modul in dessen
// Komponenten innerhalb deren Templates (= HTML-Fragmente) genutzt werden.
// BuchModule ist ein "FeatureModule", das Features fuer Buecher bereitstellt
@NgModule({
    declarations: [CreateKundeComponent],
    exports: [CreateKundeComponent, CreateSuccessModule],
    imports: [
        CommonModule,
        HttpClientModule,
        ReactiveFormsModule,
        FontAwesomeModule,
        CreateInteressenModule,
        CreateKategorieModule,
        CreateEmailModule,
        CreateNewsletterModule,
        CreateNachnameModule,
        CreateGeburtsdatumModule,
        CreateHomepageModule,
        CreateUsernameModule,
        CreateOrtModule,
        CreatePlzModule,
        CreatePasswortModule,
        CreateGeschlechtModule,
        CreateFamilienstandModule,
        ErrorMessageModule,
        CreateSuccessModule,
    ],
    providers: [Title],
})
export class CreateKundeModule {}
