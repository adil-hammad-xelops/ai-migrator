import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({ selector: "app-home-page", template: "<h1>Migrated application</h1>", changeDetection: ChangeDetectionStrategy.OnPush })
export class HomePage {}
