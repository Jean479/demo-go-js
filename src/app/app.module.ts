import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GojsAngularModule } from 'gojs-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { InspectorComponent } from './inspector/inspector/inspector.component';
import { InspectorRowComponent } from './inspector/inspector-row/inspector-row.component';

@NgModule({
  declarations: [
    AppComponent,
    InspectorComponent,
    InspectorRowComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    GojsAngularModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
