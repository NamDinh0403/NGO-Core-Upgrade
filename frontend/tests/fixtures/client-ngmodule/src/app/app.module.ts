import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from 'ngo-core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppEnvironmentService } from './app-environment.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, CoreModule, AppRoutingModule],
  providers: [AppEnvironmentService],
  bootstrap: [AppComponent],
})
export class AppModule {}
