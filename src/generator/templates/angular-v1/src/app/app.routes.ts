import type { Routes } from "@angular/router";
import { AppLayoutComponent } from "./layouts/app-layout.component";

export const appRoutes: Routes = [{
  path: "",
  component: AppLayoutComponent,
  children: [{ path: "", loadChildren: () => import("./features/home/feature.routes").then((module) => module.HOME_ROUTES) }]
}];
