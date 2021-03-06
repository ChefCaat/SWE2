import { CommonModule } from '@angular/common';
import { DetailsBearbeitenModule } from './details-bearbeiten.module';
import { DetailsBreadcrumbsModule } from './details-breadcrumbs.module';
import { DetailsKundeComponent } from './details-kunde.component';
import { ErrorMessageModule } from '../../shared/error-message.module';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { StammdatenModule } from './stammdaten/stammdaten.module';
import { Title } from '@angular/platform-browser';
import { WaitingModule } from '../../shared/waiting.module';

@NgModule({
    declarations: [DetailsKundeComponent],
    exports: [DetailsKundeComponent],
    providers: [Title],
    imports: [
        CommonModule,
        HttpClientModule,
        ErrorMessageModule,
        WaitingModule,
        DetailsBearbeitenModule,
        DetailsBreadcrumbsModule,
        StammdatenModule,
    ],
})
export class DetailsKundeModule {}
