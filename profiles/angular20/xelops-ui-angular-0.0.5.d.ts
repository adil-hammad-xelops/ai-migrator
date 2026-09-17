import * as _angular_core from '@angular/core';
import { InjectionToken, Provider, OnDestroy, TemplateRef, Type, OnInit, ElementRef, OnChanges } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
export { DialogRef } from '@angular/cdk/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

type XelBrand = 'brand-alpha' | 'brand-beta' | 'brand-xelops' | (string & {});
type XelColorScheme = 'light' | 'dark' | 'auto';
interface XelThemeConfig {
    defaultBrand: XelBrand | null;
    defaultColorScheme: XelColorScheme;
}

declare class XelThemeService {
    private readonly document;
    private readonly renderer;
    private readonly _activeBrand;
    private readonly _colorScheme;
    readonly activeBrand: _angular_core.Signal<XelBrand>;
    readonly colorScheme: _angular_core.Signal<XelColorScheme>;
    readonly isDark: _angular_core.Signal<boolean>;
    constructor();
    setBrand(brand: XelBrand | null): void;
    setColorScheme(scheme: XelColorScheme): void;
    toggleColorScheme(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XelThemeService, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<XelThemeService>;
}

declare const XELOPS_THEME_CONFIG: InjectionToken<XelThemeConfig>;

declare function provideXelopsUi(config?: Partial<XelThemeConfig>): Provider[];

type XlpButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'soft';
type XlpButtonSize = 'sm' | 'md' | 'lg';

declare class XlpButtonComponent {
    readonly variant: _angular_core.InputSignal<XlpButtonVariant>;
    readonly size: _angular_core.InputSignal<XlpButtonSize>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly loading: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly iconStart: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly iconEnd: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly iconOnly: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly type: _angular_core.InputSignal<"button" | "submit" | "reset">;
    readonly xlpClick: _angular_core.OutputEmitterRef<MouseEvent>;
    protected handleActivate(event: Event): void;
    protected readonly hostClasses: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpButtonComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpButtonComponent, "xlp-button", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "loading": { "alias": "loading"; "required": false; "isSignal": true; }; "iconStart": { "alias": "iconStart"; "required": false; "isSignal": true; }; "iconEnd": { "alias": "iconEnd"; "required": false; "isSignal": true; }; "iconOnly": { "alias": "iconOnly"; "required": false; "isSignal": true; }; "type": { "alias": "type"; "required": false; "isSignal": true; }; }, { "xlpClick": "xlpClick"; }, never, ["[xlpButtonIconStart]", "*", "[xlpButtonIconEnd]"], true, never>;
}

type XlpBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type XlpBadgeSize = 'sm' | 'md' | 'lg';
declare class XlpBadgeComponent {
    readonly variant: _angular_core.InputSignal<XlpBadgeVariant>;
    readonly size: _angular_core.InputSignal<XlpBadgeSize>;
    readonly dot: _angular_core.InputSignalWithTransform<boolean, unknown>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpBadgeComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpBadgeComponent, "xlp-badge", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "dot": { "alias": "dot"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

type XlpTagVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error';
declare class XlpTagComponent {
    readonly variant: _angular_core.InputSignal<XlpTagVariant>;
    readonly dismissible: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly dismissed: _angular_core.OutputEmitterRef<MouseEvent>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTagComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTagComponent, "xlp-tag", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "dismissible": { "alias": "dismissible"; "required": false; "isSignal": true; }; }, { "dismissed": "dismissed"; }, never, ["*"], true, never>;
}

type XlpAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type XlpAvatarShape = 'circle' | 'square';
declare class XlpAvatarComponent {
    readonly src: _angular_core.InputSignal<string>;
    readonly name: _angular_core.InputSignal<string>;
    readonly size: _angular_core.InputSignal<XlpAvatarSize>;
    readonly shape: _angular_core.InputSignal<XlpAvatarShape>;
    protected readonly imageFailed: _angular_core.WritableSignal<boolean>;
    protected readonly initials: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAvatarComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAvatarComponent, "xlp-avatar", never, { "src": { "alias": "src"; "required": false; "isSignal": true; }; "name": { "alias": "name"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "shape": { "alias": "shape"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type XlpSpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
declare class XlpSpinnerComponent {
    readonly size: _angular_core.InputSignal<XlpSpinnerSize>;
    readonly label: _angular_core.InputSignal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSpinnerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpSpinnerComponent, "xlp-spinner", never, { "size": { "alias": "size"; "required": false; "isSignal": true; }; "label": { "alias": "label"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type XlpDividerOrientation = 'horizontal' | 'vertical';
declare class XlpDividerComponent {
    readonly orientation: _angular_core.InputSignal<XlpDividerOrientation>;
    readonly hasContent: _angular_core.InputSignal<boolean>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDividerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpDividerComponent, "xlp-divider", never, { "orientation": { "alias": "orientation"; "required": false; "isSignal": true; }; "hasContent": { "alias": "hasContent"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

type XlpCardVariant = 'elevated' | 'outlined' | 'filled' | 'alert' | 'success';
declare class XlpCardHeaderDirective {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCardHeaderDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpCardHeaderDirective, "xlp-card-header", never, {}, {}, never, never, true, never>;
}
declare class XlpCardBodyDirective {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCardBodyDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpCardBodyDirective, "xlp-card-body", never, {}, {}, never, never, true, never>;
}
declare class XlpCardFooterDirective {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCardFooterDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpCardFooterDirective, "xlp-card-footer", never, {}, {}, never, never, true, never>;
}
declare class XlpCardComponent {
    readonly variant: _angular_core.InputSignal<XlpCardVariant>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCardComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCardComponent, "xlp-card", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

type XlpAlertVariant = 'info' | 'success' | 'warning' | 'error';
declare class XlpAlertComponent {
    readonly variant: _angular_core.InputSignal<XlpAlertVariant>;
    readonly title: _angular_core.InputSignal<string>;
    readonly dismissible: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly dismissed: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAlertComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAlertComponent, "xlp-alert", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "title": { "alias": "title"; "required": false; "isSignal": true; }; "dismissible": { "alias": "dismissible"; "required": false; "isSignal": true; }; }, { "dismissed": "dismissed"; }, never, ["*"], true, never>;
}

type XlpSkeletonShape = 'text' | 'circle' | 'rect';
declare class XlpSkeletonComponent {
    readonly shape: _angular_core.InputSignal<XlpSkeletonShape>;
    readonly width: _angular_core.InputSignal<string>;
    readonly height: _angular_core.InputSignal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSkeletonComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpSkeletonComponent, "xlp-skeleton", never, { "shape": { "alias": "shape"; "required": false; "isSignal": true; }; "width": { "alias": "width"; "required": false; "isSignal": true; }; "height": { "alias": "height"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type XlpProgressVariant = 'primary' | 'success' | 'warning' | 'error';
declare class XlpProgressComponent {
    readonly value: _angular_core.InputSignal<number>;
    readonly max: _angular_core.InputSignal<number>;
    readonly variant: _angular_core.InputSignal<XlpProgressVariant>;
    readonly indeterminate: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly clampedValue: _angular_core.Signal<number>;
    protected readonly percentage: _angular_core.Signal<number>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpProgressComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpProgressComponent, "xlp-progress", never, { "value": { "alias": "value"; "required": false; "isSignal": true; }; "max": { "alias": "max"; "required": false; "isSignal": true; }; "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "indeterminate": { "alias": "indeterminate"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpLabelComponent {
    readonly for: _angular_core.InputSignal<string>;
    readonly required: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly hint: _angular_core.InputSignal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpLabelComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpLabelComponent, "xlp-label", never, { "for": { "alias": "for"; "required": false; "isSignal": true; }; "required": { "alias": "required"; "required": false; "isSignal": true; }; "hint": { "alias": "hint"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

type XlpInputSize = 'sm' | 'md' | 'lg';
/**
 * Styled native input directive.
 * Usage: <input xlpInput type="text" /> or <textarea xlpInput></textarea>
 *
 * Les styles sont globaux (sélecteur d'élément) car une directive s'applique
 * à un élément natif. Importez `input/input.directive.scss` dans vos styles
 * globaux, ou il est inclus via le bundle de tokens de la librairie.
 */
declare class XlpInputDirective {
    readonly size: _angular_core.InputSignal<XlpInputSize>;
    readonly invalid: _angular_core.InputSignal<boolean>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpInputDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpInputDirective, "input[xlpInput], textarea[xlpInput], select[xlpInput]", never, { "size": { "alias": "size"; "required": false; "isSignal": true; }; "invalid": { "alias": "invalid"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpCheckboxComponent implements ControlValueAccessor {
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly inputId: string;
    protected readonly checked: _angular_core.WritableSignal<boolean>;
    protected readonly cvaDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected onChange(event: Event): void;
    writeValue(value: boolean): void;
    registerOnChange(fn: (value: boolean) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCheckboxComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCheckboxComponent, "xlp-checkbox", never, { "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpToggleComponent implements ControlValueAccessor {
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly checked: _angular_core.WritableSignal<boolean>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected toggle(): void;
    writeValue(value: boolean): void;
    registerOnChange(fn: (value: boolean) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpToggleComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpToggleComponent, "xlp-toggle", never, { "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpRadioGroupComponent implements ControlValueAccessor {
    readonly orientation: _angular_core.InputSignal<"horizontal" | "vertical">;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly name: string;
    /** Valeur sélectionnée, partagée avec les boutons enfants. */
    readonly value: _angular_core.WritableSignal<unknown>;
    readonly groupDisabled: _angular_core.WritableSignal<boolean>;
    private onChangeFn;
    onTouchedFn: () => void;
    /** Appelé par les boutons enfants quand l'utilisateur sélectionne. */
    select(value: unknown): void;
    writeValue(value: unknown): void;
    registerOnChange(fn: (value: unknown) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpRadioGroupComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpRadioGroupComponent, "xlp-radio-group", never, { "orientation": { "alias": "orientation"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpRadioButtonComponent {
    readonly value: _angular_core.InputSignal<unknown>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly inputId: string;
    protected readonly group: XlpRadioGroupComponent;
    protected readonly checked: _angular_core.Signal<boolean>;
    protected readonly isDisabled: _angular_core.Signal<boolean>;
    protected onSelect(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpRadioButtonComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpRadioButtonComponent, "xlp-radio", never, { "value": { "alias": "value"; "required": true; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

type XlpTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
declare class XlpTooltipDirective implements OnDestroy {
    readonly xlpTooltip: _angular_core.InputSignal<string>;
    readonly placement: _angular_core.InputSignal<XlpTooltipPlacement>;
    private readonly overlay;
    private readonly positionBuilder;
    private readonly elementRef;
    private overlayRef;
    show(): void;
    hide(): void;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTooltipDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpTooltipDirective, "[xlpTooltip]", never, { "xlpTooltip": { "alias": "xlpTooltip"; "required": true; "isSignal": true; }; "placement": { "alias": "placement"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpTooltipComponent {
    readonly text: _angular_core.WritableSignal<string>;
    readonly placement: _angular_core.WritableSignal<XlpTooltipPlacement>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTooltipComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTooltipComponent, "xlp-tooltip", never, {}, {}, never, never, true, never>;
}

declare class XlpMenuItemComponent {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpMenuItemComponent, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpMenuItemComponent, "[xlpMenuItem], xlp-menu-item", never, {}, {}, never, never, true, never>;
}
declare class XlpMenuComponent {
    templateRef: TemplateRef<unknown>;
    readonly closed: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpMenuComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpMenuComponent, "xlp-menu", never, {}, { "closed": "closed"; }, never, ["*"], true, never>;
}

declare class XlpMenuTriggerDirective implements OnDestroy {
    readonly menu: _angular_core.InputSignal<XlpMenuComponent>;
    private readonly overlay;
    private readonly positionBuilder;
    private readonly elementRef;
    private readonly viewContainerRef;
    private overlayRef;
    protected isOpen: boolean;
    toggle(): void;
    open(): void;
    close(): void;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpMenuTriggerDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpMenuTriggerDirective, "[xlpMenuTriggerFor]", never, { "menu": { "alias": "xlpMenuTriggerFor"; "required": true; "isSignal": true; }; }, {}, never, never, true, never>;
}

interface XlpDialogConfig<D = unknown> {
    data?: D;
    /** Largeur du panneau (ex: '480px'). */
    width?: string;
    /** Fermeture au clic sur le backdrop. Défaut true. */
    closeOnBackdropClick?: boolean;
    /** Fermeture à la touche Escape. Défaut true. */
    closeOnEscape?: boolean;
    ariaLabel?: string;
}
/**
 * Service de dialogue basé sur @angular/cdk/dialog.
 * Fournit le focus trap, le scroll blocking, l'ARIA et le backdrop.
 */
declare class XlpDialogService {
    private readonly cdkDialog;
    open<T, D = unknown, R = unknown>(componentOrTemplate: Type<T> | TemplateRef<T>, config?: XlpDialogConfig<D>): DialogRef<R, T>;
    closeAll(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDialogService, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<XlpDialogService>;
}

declare class XlpDialogTitleDirective {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDialogTitleDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpDialogTitleDirective, "[xlpDialogTitle]", never, {}, {}, never, never, true, never>;
}
declare class XlpDialogContentDirective {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDialogContentDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpDialogContentDirective, "[xlpDialogContent]", never, {}, {}, never, never, true, never>;
}
declare class XlpDialogActionsDirective {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDialogActionsDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpDialogActionsDirective, "[xlpDialogActions]", never, {}, {}, never, never, true, never>;
}
/** Ferme le dialogue courant au clic. Optionnellement renvoie une valeur. */
declare class XlpDialogCloseDirective {
    private readonly dialogRef;
    close(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDialogCloseDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpDialogCloseDirective, "[xlpDialogClose]", never, {}, {}, never, never, true, never>;
}

declare class XlpTabComponent {
    readonly label: _angular_core.InputSignal<string>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly id: string;
    content: TemplateRef<unknown>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTabComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTabComponent, "xlp-tab", never, { "label": { "alias": "label"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpTabsComponent {
    readonly tabs: _angular_core.Signal<readonly XlpTabComponent[]>;
    readonly activeIndex: _angular_core.ModelSignal<number>;
    protected readonly activeTab: _angular_core.Signal<XlpTabComponent>;
    selectTab(index: number): void;
    onKeydown(event: KeyboardEvent, current: number): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTabsComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTabsComponent, "xlp-tabs", never, { "activeIndex": { "alias": "activeIndex"; "required": false; "isSignal": true; }; }, { "activeIndex": "activeIndexChange"; }, ["tabs"], never, true, never>;
}

/**
 * Conteneur d'accordéon. Gère la politique single/multi-expand.
 */
declare class XlpAccordionComponent {
    /** Si false, un seul panneau ouvert à la fois. */
    readonly multi: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /** Set des panneaux actuellement ouverts (par référence). */
    private readonly openPanels;
    isOpen(panel: XlpAccordionPanelComponent): boolean;
    toggle(panel: XlpAccordionPanelComponent): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAccordionComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAccordionComponent, "xlp-accordion", never, { "multi": { "alias": "multi"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}
declare class XlpAccordionPanelComponent {
    readonly title: _angular_core.InputSignal<string>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    private readonly accordion;
    readonly triggerId: string;
    readonly panelId: string;
    isOpen(): boolean;
    toggle(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAccordionPanelComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAccordionPanelComponent, "xlp-accordion-panel", never, { "title": { "alias": "title"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

interface XlpBreadcrumbItem {
    label: string;
    href?: string;
}
declare class XlpBreadcrumbComponent {
    readonly items: _angular_core.InputSignal<XlpBreadcrumbItem[]>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpBreadcrumbComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpBreadcrumbComponent, "xlp-breadcrumb", never, { "items": { "alias": "items"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type PageItem = number | '…';
declare class XlpPaginationComponent {
    readonly page: _angular_core.InputSignal<number>;
    readonly total: _angular_core.InputSignal<number>;
    readonly pageSize: _angular_core.InputSignal<number>;
    readonly siblingCount: _angular_core.InputSignal<number>;
    readonly ariaLabel: _angular_core.InputSignal<string>;
    readonly pageChange: _angular_core.OutputEmitterRef<number>;
    protected readonly totalPages: _angular_core.Signal<number>;
    protected readonly visiblePages: _angular_core.Signal<PageItem[]>;
    protected goTo(p: number): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpPaginationComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpPaginationComponent, "xlp-pagination", never, { "page": { "alias": "page"; "required": false; "isSignal": true; }; "total": { "alias": "total"; "required": false; "isSignal": true; }; "pageSize": { "alias": "pageSize"; "required": false; "isSignal": true; }; "siblingCount": { "alias": "siblingCount"; "required": false; "isSignal": true; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; "isSignal": true; }; }, { "pageChange": "pageChange"; }, never, never, true, never>;
}

type XlpToastVariant = 'success' | 'error' | 'warning' | 'info' | 'stacked';
interface XlpToastOptions {
    variant?: XlpToastVariant;
    /** Auto-dismiss delay in ms. Set to 0 to disable. Default: 4000 */
    duration?: number;
    dismissible?: boolean;
}
interface XlpToast {
    id: string;
    message: string;
    variant: XlpToastVariant;
    duration: number;
    dismissible: boolean;
}

declare class XlpToastService {
    #private;
    readonly toasts: _angular_core.Signal<XlpToast[]>;
    show(message: string, options?: XlpToastOptions): string;
    success(message: string, options?: XlpToastOptions): string;
    error(message: string, options?: XlpToastOptions): string;
    warning(message: string, options?: XlpToastOptions): string;
    info(message: string, options?: XlpToastOptions): string;
    stacked(message: string, options?: XlpToastOptions): string;
    dismiss(id: string): void;
    dismissAll(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpToastService, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<XlpToastService>;
}

declare class XlpToastContainerComponent {
    protected readonly toastService: XlpToastService;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpToastContainerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpToastContainerComponent, "xlp-toast-container", never, {}, {}, never, never, true, never>;
}

interface XlpDonutSlice {
    label: string;
    value: number;
    color?: string;
}
type XlpDonutSize = 'xs' | 'sm' | 'md' | 'lg';
type XlpDonutVariant = 'default' | 'mini';
interface ComputedSlice extends XlpDonutSlice {
    percentage: number;
    strokeDasharray: string;
    strokeDashoffset: number;
    color: string;
}
declare class XlpDonutChartComponent {
    readonly slices: _angular_core.InputSignal<XlpDonutSlice[]>;
    readonly size: _angular_core.InputSignal<XlpDonutSize>;
    readonly variant: _angular_core.InputSignal<XlpDonutVariant>;
    readonly label: _angular_core.InputSignal<string>;
    readonly centerLabel: _angular_core.InputSignal<string>;
    readonly centerSub: _angular_core.InputSignal<string>;
    readonly showLegend: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly dim: _angular_core.Signal<number>;
    protected readonly r: _angular_core.Signal<number>;
    protected readonly stroke: _angular_core.Signal<number>;
    protected readonly computedSlices: _angular_core.Signal<ComputedSlice[]>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDonutChartComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpDonutChartComponent, "xlp-donut-chart", never, { "slices": { "alias": "slices"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "label": { "alias": "label"; "required": false; "isSignal": true; }; "centerLabel": { "alias": "centerLabel"; "required": false; "isSignal": true; }; "centerSub": { "alias": "centerSub"; "required": false; "isSignal": true; }; "showLegend": { "alias": "showLegend"; "required": false; "isSignal": true; }; }, {}, never, ["[xlpDonutIcon]"], true, never>;
}

type XlpTableRowState = 'default' | 'hover' | 'selected' | 'critical' | 'success' | 'warning';
type XlpTableAlign = 'left' | 'center' | 'right';
interface XlpTableColumn<T = Record<string, unknown>> {
    key: string;
    label: string;
    align?: XlpTableAlign;
    width?: string;
    sortable?: boolean;
    cell?: (row: T) => string;
}
interface XlpSortEvent {
    key: string;
    dir: 'asc' | 'desc';
}
declare class XlpThDirective {
    readonly align: _angular_core.InputSignal<XlpTableAlign>;
    readonly sortable: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly sort: _angular_core.InputSignal<"asc" | "desc">;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpThDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpThDirective, "th[xlpTh]", never, { "align": { "alias": "align"; "required": false; "isSignal": true; }; "sortable": { "alias": "sortable"; "required": false; "isSignal": true; }; "sort": { "alias": "sort"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
declare class XlpTdDirective {
    readonly align: _angular_core.InputSignal<XlpTableAlign>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTdDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpTdDirective, "td[xlpTd]", never, { "align": { "alias": "align"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
declare class XlpTrDirective {
    readonly state: _angular_core.InputSignal<XlpTableRowState>;
    readonly selected: _angular_core.InputSignalWithTransform<boolean, unknown>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTrDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpTrDirective, "tr[xlpTr]", never, { "state": { "alias": "state"; "required": false; "isSignal": true; }; "selected": { "alias": "selected"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
declare class XlpDataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
    readonly columns: _angular_core.InputSignal<XlpTableColumn<T>[]>;
    readonly rows: _angular_core.InputSignal<T[]>;
    readonly caption: _angular_core.InputSignal<string>;
    readonly striped: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly bordered: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly compact: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly emptyText: _angular_core.InputSignal<string>;
    readonly rowTrackBy: _angular_core.InputSignal<(row: T) => unknown>;
    readonly rowState: _angular_core.InputSignal<(row: T) => XlpTableRowState>;
    readonly rowSelected: _angular_core.InputSignal<(row: T) => boolean>;
    readonly sortChange: _angular_core.OutputEmitterRef<XlpSortEvent>;
    protected readonly sortKey: _angular_core.WritableSignal<string>;
    protected readonly sortDir: _angular_core.WritableSignal<"asc" | "desc">;
    protected onSort(key: string): void;
    protected getCellValue(row: T, key: string): unknown;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDataTableComponent<any>, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpDataTableComponent<any>, "xlp-data-table", never, { "columns": { "alias": "columns"; "required": false; "isSignal": true; }; "rows": { "alias": "rows"; "required": false; "isSignal": true; }; "caption": { "alias": "caption"; "required": false; "isSignal": true; }; "striped": { "alias": "striped"; "required": false; "isSignal": true; }; "bordered": { "alias": "bordered"; "required": false; "isSignal": true; }; "compact": { "alias": "compact"; "required": false; "isSignal": true; }; "emptyText": { "alias": "emptyText"; "required": false; "isSignal": true; }; "rowTrackBy": { "alias": "rowTrackBy"; "required": false; "isSignal": true; }; "rowState": { "alias": "rowState"; "required": false; "isSignal": true; }; "rowSelected": { "alias": "rowSelected"; "required": false; "isSignal": true; }; }, { "sortChange": "sortChange"; }, never, never, true, never>;
}

type XlpMetricBarVariant = 'primary' | 'success' | 'warning' | 'error';
declare class XlpMetricBarComponent {
    readonly label: _angular_core.InputSignal<string>;
    readonly value: _angular_core.InputSignal<number>;
    readonly variant: _angular_core.InputSignal<XlpMetricBarVariant>;
    protected readonly clamped: _angular_core.Signal<number>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpMetricBarComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpMetricBarComponent, "xlp-metric-bar", never, { "label": { "alias": "label"; "required": false; "isSignal": true; }; "value": { "alias": "value"; "required": false; "isSignal": true; }; "variant": { "alias": "variant"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

interface XlpSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
type XlpSelectSize = 'sm' | 'md' | 'lg';
declare class XlpSelectComponent implements ControlValueAccessor {
    private readonly elementRef;
    readonly options: _angular_core.InputSignal<XlpSelectOption[]>;
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly size: _angular_core.InputSignal<XlpSelectSize>;
    readonly invalid: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly value: _angular_core.ModelSignal<string>;
    readonly isOpen: _angular_core.WritableSignal<boolean>;
    readonly focusedIndex: _angular_core.WritableSignal<number>;
    protected readonly selectedLabel: _angular_core.Signal<string>;
    protected onChange: (v: string) => void;
    protected onTouched: () => void;
    protected toggleDropdown(): void;
    protected openDropdown(): void;
    protected closeDropdown(): void;
    protected selectOption(opt: XlpSelectOption): void;
    protected moveFocus(dir: 1 | -1): void;
    onDocClick(e: MouseEvent): void;
    writeValue(val: string): void;
    registerOnChange(fn: (v: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSelectComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpSelectComponent, "xlp-select", never, { "options": { "alias": "options"; "required": false; "isSignal": true; }; "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "invalid": { "alias": "invalid"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "value": { "alias": "value"; "required": false; "isSignal": true; }; }, { "value": "valueChange"; }, never, never, true, never>;
}

declare class XlpAutocompleteComponent {
    readonly options: _angular_core.InputSignal<string[]>;
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly size: _angular_core.InputSignal<XlpInputSize>;
    readonly minChars: _angular_core.InputSignal<number>;
    readonly multiple: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly query: _angular_core.ModelSignal<string>;
    readonly selectedItems: _angular_core.ModelSignal<string[]>;
    readonly valueChange: _angular_core.OutputEmitterRef<string>;
    readonly searchChange: _angular_core.OutputEmitterRef<string>;
    protected readonly open: _angular_core.WritableSignal<boolean>;
    protected readonly focusedIndex: _angular_core.WritableSignal<number>;
    protected readonly filtered: _angular_core.Signal<string[]>;
    private readonly inputEl;
    protected onQueryChange(val: string): void;
    protected selectOption(opt: string): void;
    protected removeSelectedItem(item: string): void;
    protected onTagDismiss(item: string, event: MouseEvent): void;
    protected onBackspace(): void;
    protected selectFocused(): void;
    protected optionIsSelected(opt: string): boolean;
    protected moveFocus(dir: 1 | -1): void;
    protected close(): void;
    protected focusInput(): void;
    onDocClick(e: Event): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAutocompleteComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAutocompleteComponent, "xlp-autocomplete", never, { "options": { "alias": "options"; "required": false; "isSignal": true; }; "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "minChars": { "alias": "minChars"; "required": false; "isSignal": true; }; "multiple": { "alias": "multiple"; "required": false; "isSignal": true; }; "query": { "alias": "query"; "required": false; "isSignal": true; }; "selectedItems": { "alias": "selectedItems"; "required": false; "isSignal": true; }; }, { "query": "queryChange"; "selectedItems": "selectedItemsChange"; "valueChange": "valueChange"; "searchChange": "searchChange"; }, never, never, true, never>;
}

interface XlpNavItem {
    id: string;
    label: string;
    icon?: string;
    badge?: number;
    disabled?: boolean;
    href?: string;
    dividerBefore?: boolean;
}
declare class XlpNavComponent {
    readonly items: _angular_core.InputSignal<XlpNavItem[]>;
    readonly activeId: _angular_core.InputSignal<string>;
    readonly navSelect: _angular_core.OutputEmitterRef<XlpNavItem>;
    protected onSelect(item: XlpNavItem, event: Event): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpNavComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpNavComponent, "xlp-nav", never, { "items": { "alias": "items"; "required": false; "isSignal": true; }; "activeId": { "alias": "activeId"; "required": false; "isSignal": true; }; }, { "navSelect": "navSelect"; }, never, never, true, never>;
}

type XlpTopbarHeight = 'sm' | 'md' | 'lg';
declare class XlpTopbarComponent {
    readonly height: _angular_core.InputSignal<XlpTopbarHeight>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTopbarComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTopbarComponent, "xlp-topbar", never, { "height": { "alias": "height"; "required": false; "isSignal": true; }; }, {}, never, ["[xlpTopbarStart]", "[xlpTopbarCenter]", "[xlpTopbarEnd]"], true, never>;
}

declare class XlpNotificationDrawerService {
    #private;
    readonly isOpen: _angular_core.Signal<boolean>;
    open(): void;
    close(): void;
    toggle(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpNotificationDrawerService, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<XlpNotificationDrawerService>;
}

type XlpNotificationVariant = 'info' | 'success' | 'warning' | 'error';
interface XlpNotification {
    id: string;
    title: string;
    message?: string;
    timestamp?: string;
    read?: boolean;
    variant?: XlpNotificationVariant;
}

declare class XlpNotificationDrawerComponent implements OnDestroy {
    readonly title: _angular_core.InputSignal<string>;
    readonly notifications: _angular_core.InputSignal<XlpNotification[]>;
    readonly width: _angular_core.InputSignal<string>;
    readonly dismiss: _angular_core.OutputEmitterRef<string>;
    readonly dismissAll: _angular_core.OutputEmitterRef<void>;
    protected readonly drawerService: XlpNotificationDrawerService;
    private readonly overlay;
    private readonly vcr;
    private drawerTpl;
    private overlayRef;
    constructor();
    protected onDismiss(id: string): void;
    protected onDismissAll(): void;
    private _openOverlay;
    private _closeOverlay;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpNotificationDrawerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpNotificationDrawerComponent, "xlp-notification-drawer", never, { "title": { "alias": "title"; "required": false; "isSignal": true; }; "notifications": { "alias": "notifications"; "required": false; "isSignal": true; }; "width": { "alias": "width"; "required": false; "isSignal": true; }; }, { "dismiss": "dismiss"; "dismissAll": "dismissAll"; }, never, never, true, never>;
}

declare class XlpNotificationItemComponent {
    readonly notification: _angular_core.InputSignal<XlpNotification>;
    readonly dismiss: _angular_core.OutputEmitterRef<string>;
    protected variantIcon(variant?: string): string;
    protected onDismiss(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpNotificationItemComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpNotificationItemComponent, "xlp-notification-item", never, { "notification": { "alias": "notification"; "required": true; "isSignal": true; }; }, { "dismiss": "dismiss"; }, never, never, true, never>;
}

type XlpAccountMenuItemVariant = 'default' | 'danger';
interface XlpAccountMenuItem {
    id: string;
    label: string;
    icon?: string;
    variant?: XlpAccountMenuItemVariant;
    dividerBefore?: boolean;
    href?: string;
}

declare class XlpAccountMenuComponent implements OnDestroy {
    readonly avatarSrc: _angular_core.InputSignal<string>;
    readonly userName: _angular_core.InputSignal<string>;
    readonly userEmail: _angular_core.InputSignal<string>;
    readonly userRole: _angular_core.InputSignal<string>;
    readonly menuItems: _angular_core.InputSignal<XlpAccountMenuItem[]>;
    readonly itemSelect: _angular_core.OutputEmitterRef<XlpAccountMenuItem>;
    private readonly overlay;
    private readonly positionBuilder;
    private readonly elementRef;
    private readonly vcr;
    private panelTpl;
    private triggerRef;
    protected readonly isOpen: _angular_core.WritableSignal<boolean>;
    private overlayRef;
    toggle(): void;
    open(): void;
    close(): void;
    protected selectItem(item: XlpAccountMenuItem): void;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAccountMenuComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAccountMenuComponent, "xlp-account-menu", never, { "avatarSrc": { "alias": "avatarSrc"; "required": false; "isSignal": true; }; "userName": { "alias": "userName"; "required": false; "isSignal": true; }; "userEmail": { "alias": "userEmail"; "required": false; "isSignal": true; }; "userRole": { "alias": "userRole"; "required": false; "isSignal": true; }; "menuItems": { "alias": "menuItems"; "required": false; "isSignal": true; }; }, { "itemSelect": "itemSelect"; }, never, never, true, never>;
}

interface XlpShellLayoutItem {
    id: number;
    label: string;
    colSpan?: number;
    rowSpan?: number;
    flexGrow?: number;
    height?: number;
}
declare const SHELL_LAYOUT_DEFAULT_ROWS: XlpShellLayoutItem[][];
declare class XlpShellLayoutComponent implements OnInit {
    /** Seed rows; each sub-array is one drop zone rendered as grid or flex. */
    readonly initialRows: _angular_core.InputSignal<XlpShellLayoutItem[][]>;
    protected readonly rows: _angular_core.WritableSignal<XlpShellLayoutItem[][]>;
    ngOnInit(): void;
    drop(rowIndex: number, event: CdkDragDrop<XlpShellLayoutItem[]>): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpShellLayoutComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpShellLayoutComponent, "xlp-shell-layout", never, { "initialRows": { "alias": "initialRows"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type XlpDatePickerSize = 'sm' | 'md' | 'lg';
interface XlpCalendarDay {
    date: Date;
    outsideMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
}

declare class XlpDatePickerComponent implements ControlValueAccessor, OnDestroy {
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly size: _angular_core.InputSignal<XlpDatePickerSize>;
    readonly invalid: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly value: _angular_core.ModelSignal<Date>;
    protected readonly isOpen: _angular_core.WritableSignal<boolean>;
    protected readonly viewMonth: _angular_core.WritableSignal<Date>;
    protected readonly weekdays: string[];
    protected readonly displayValue: _angular_core.Signal<string>;
    protected readonly monthLabel: _angular_core.Signal<string>;
    protected readonly calendarDays: _angular_core.Signal<XlpCalendarDay[][]>;
    triggerEl: ElementRef<HTMLElement>;
    calendarTpl: TemplateRef<void>;
    private readonly overlay;
    private readonly positionBuilder;
    private readonly viewContainerRef;
    private overlayRef;
    protected onChange: (v: Date | null) => void;
    protected onTouched: () => void;
    toggleOpen(): void;
    open(): void;
    close(): void;
    selectDay(day: XlpCalendarDay): void;
    prevMonth(): void;
    nextMonth(): void;
    writeValue(val: Date | string | null): void;
    registerOnChange(fn: (v: Date | null) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(): void;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDatePickerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpDatePickerComponent, "xlp-date-picker", never, { "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "invalid": { "alias": "invalid"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "value": { "alias": "value"; "required": false; "isSignal": true; }; }, { "value": "valueChange"; }, never, never, true, never>;
}

type XlpSliderVariant = 'primary' | 'warning' | 'error';
declare class XlpSliderComponent implements ControlValueAccessor {
    readonly min: _angular_core.InputSignal<number>;
    readonly max: _angular_core.InputSignal<number>;
    readonly step: _angular_core.InputSignal<number>;
    readonly label: _angular_core.InputSignal<string>;
    readonly showValue: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly variant: _angular_core.InputSignal<XlpSliderVariant>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly value: _angular_core.ModelSignal<number>;
    protected readonly fillPct: _angular_core.Signal<string>;
    protected onChange: (v: number) => void;
    protected onTouched: () => void;
    writeValue(val: number): void;
    registerOnChange(fn: (v: number) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSliderComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpSliderComponent, "xlp-slider", never, { "min": { "alias": "min"; "required": false; "isSignal": true; }; "max": { "alias": "max"; "required": false; "isSignal": true; }; "step": { "alias": "step"; "required": false; "isSignal": true; }; "label": { "alias": "label"; "required": false; "isSignal": true; }; "showValue": { "alias": "showValue"; "required": false; "isSignal": true; }; "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "value": { "alias": "value"; "required": false; "isSignal": true; }; }, { "value": "valueChange"; }, never, never, true, never>;
}

type XlpStepStatus = 'pending' | 'active' | 'completed' | 'error';
interface XlpStep {
    id: string;
    label: string;
    description?: string;
    status?: XlpStepStatus;
}

declare class XlpStepperComponent {
    readonly steps: _angular_core.InputSignal<XlpStep[]>;
    readonly orientation: _angular_core.InputSignal<"horizontal" | "vertical">;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpStepperComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpStepperComponent, "xlp-stepper", never, { "steps": { "alias": "steps"; "required": false; "isSignal": true; }; "orientation": { "alias": "orientation"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpListComponent {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpListComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpListComponent, "xlp-list", never, {}, {}, never, ["*"], true, never>;
}
declare class XlpListItemComponent {
    readonly selected: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly divider: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly description: _angular_core.InputSignal<string>;
    readonly meta: _angular_core.InputSignal<string>;
    readonly itemSelect: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpListItemComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpListItemComponent, "xlp-list-item", never, { "selected": { "alias": "selected"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "divider": { "alias": "divider"; "required": false; "isSignal": true; }; "description": { "alias": "description"; "required": false; "isSignal": true; }; "meta": { "alias": "meta"; "required": false; "isSignal": true; }; }, { "itemSelect": "itemSelect"; }, never, ["[xlpListItemIcon]", "*", "[xlpListItemEnd]"], true, never>;
}

interface XlpCheckboxTreeItem {
    id: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
    children?: XlpCheckboxTreeItem[];
}

interface FlatCbNode {
    id: string;
    label: string;
    depth: number;
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    hasChildren: boolean;
    expanded: boolean;
}
declare class XlpCheckboxTreeComponent implements OnChanges {
    readonly items: _angular_core.InputSignal<XlpCheckboxTreeItem[]>;
    readonly itemsChange: _angular_core.OutputEmitterRef<XlpCheckboxTreeItem[]>;
    private readonly _tree;
    private readonly expandedIds;
    ngOnChanges(): void;
    protected readonly flatNodes: _angular_core.Signal<FlatCbNode[]>;
    protected toggleExpand(id: string): void;
    protected onCheck(id: string, checked: boolean): void;
    private flatten;
    private isIndeterminate;
    /** Finds node by id, cascades check down, propagates "all-checked" up. */
    private setChecked;
    private cascadeDown;
    private deepClone;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCheckboxTreeComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCheckboxTreeComponent, "xlp-checkbox-tree", never, { "items": { "alias": "items"; "required": false; "isSignal": true; }; }, { "itemsChange": "itemsChange"; }, never, never, true, never>;
}

interface XlpTreeNode {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
    children?: XlpTreeNode[];
}
interface XlpFlatNode {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
}

declare class XlpTreeComponent {
    readonly nodes: _angular_core.InputSignal<XlpTreeNode[]>;
    readonly nodeSelect: _angular_core.OutputEmitterRef<XlpTreeNode>;
    private readonly expandedIds;
    protected readonly flatNodes: _angular_core.Signal<XlpFlatNode[]>;
    protected onNodeClick(flat: XlpFlatNode): void;
    private flatten;
    private findNode;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTreeComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTreeComponent, "xlp-tree", never, { "nodes": { "alias": "nodes"; "required": false; "isSignal": true; }; }, { "nodeSelect": "nodeSelect"; }, never, never, true, never>;
}

type XlpStatusVariant = 'online' | 'offline' | 'away' | 'busy' | 'active' | 'inactive' | 'pending' | 'maintenance' | 'deprecated' | 'new';
type XlpStatusSize = 'sm' | 'md' | 'lg';
declare class XlpStatusComponent {
    readonly variant: _angular_core.InputSignal<XlpStatusVariant>;
    readonly size: _angular_core.InputSignal<XlpStatusSize>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpStatusComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpStatusComponent, "xlp-status", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpDropZoneComponent implements ControlValueAccessor {
    readonly accept: _angular_core.InputSignal<string>;
    readonly multiple: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly maxSize: _angular_core.InputSignal<number>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly files: _angular_core.WritableSignal<File[]>;
    protected readonly isDragOver: _angular_core.WritableSignal<boolean>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly errors: _angular_core.WritableSignal<string[]>;
    private dragCounter;
    private onChangeFn;
    protected onTouched: () => void;
    private readonly fileInputEl;
    constructor();
    protected openPicker(): void;
    protected onDragEnter(e: DragEvent): void;
    protected onDragOver(e: DragEvent): void;
    protected onDragLeave(e: DragEvent): void;
    protected onDrop(e: DragEvent): void;
    protected onInputChange(e: Event): void;
    protected removeFile(index: number): void;
    protected formatSize(bytes: number): string;
    private processFiles;
    writeValue(files: File[] | null): void;
    registerOnChange(fn: (value: File[]) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDropZoneComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpDropZoneComponent, "xlp-drop-zone", never, { "accept": { "alias": "accept"; "required": false; "isSignal": true; }; "multiple": { "alias": "multiple"; "required": false; "isSignal": true; }; "maxSize": { "alias": "maxSize"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

interface XlpSegmentedOption {
    value: string;
    label: string;
    disabled?: boolean;
}
declare class XlpSegmentedControlComponent implements ControlValueAccessor {
    readonly options: _angular_core.InputSignal<XlpSegmentedOption[]>;
    readonly size: _angular_core.InputSignal<"sm" | "md" | "lg">;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly ariaLabel: _angular_core.InputSignal<string>;
    protected readonly selected: _angular_core.WritableSignal<string>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected select(opt: XlpSegmentedOption): void;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSegmentedControlComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpSegmentedControlComponent, "xlp-segmented-control", never, { "options": { "alias": "options"; "required": true; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpNumberInputComponent implements ControlValueAccessor {
    readonly min: _angular_core.InputSignal<number>;
    readonly max: _angular_core.InputSignal<number>;
    readonly step: _angular_core.InputSignal<number>;
    readonly size: _angular_core.InputSignal<"sm" | "md" | "lg">;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly invalid: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly placeholder: _angular_core.InputSignal<string>;
    protected readonly value: _angular_core.WritableSignal<number>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    private onChangeFn;
    protected onTouched: () => void;
    protected readonly atMin: _angular_core.Signal<boolean>;
    protected readonly atMax: _angular_core.Signal<boolean>;
    constructor();
    protected increment(): void;
    protected decrement(): void;
    protected onKeydown(event: KeyboardEvent): void;
    protected onInput(event: Event): void;
    private clamp;
    writeValue(value: number | null): void;
    registerOnChange(fn: (value: number | null) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpNumberInputComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpNumberInputComponent, "xlp-number-input", never, { "min": { "alias": "min"; "required": false; "isSignal": true; }; "max": { "alias": "max"; "required": false; "isSignal": true; }; "step": { "alias": "step"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "invalid": { "alias": "invalid"; "required": false; "isSignal": true; }; "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpRatingComponent implements ControlValueAccessor {
    readonly max: _angular_core.InputSignal<number>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly readonly: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly size: _angular_core.InputSignal<"sm" | "md" | "lg">;
    protected readonly value: _angular_core.WritableSignal<number>;
    protected readonly hovered: _angular_core.WritableSignal<number>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly displayValue: _angular_core.Signal<number>;
    protected readonly stars: _angular_core.Signal<number[]>;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected onStarHover(star: number): void;
    protected rate(star: number): void;
    writeValue(value: number): void;
    registerOnChange(fn: (value: number) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpRatingComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpRatingComponent, "xlp-rating", never, { "max": { "alias": "max"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "readonly": { "alias": "readonly"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpKbdComponent {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpKbdComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpKbdComponent, "xlp-kbd", never, {}, {}, never, ["*"], true, never>;
}

type XlpCalloutType = 'info' | 'success' | 'warning' | 'danger';
declare class XlpCalloutComponent {
    readonly type: _angular_core.InputSignal<XlpCalloutType>;
    readonly title: _angular_core.InputSignal<string>;
    readonly icon: _angular_core.InputSignal<string>;
    readonly resolvedIcon: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCalloutComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCalloutComponent, "xlp-callout", never, { "type": { "alias": "type"; "required": false; "isSignal": true; }; "title": { "alias": "title"; "required": false; "isSignal": true; }; "icon": { "alias": "icon"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpEmptyStateComponent {
    readonly title: _angular_core.InputSignal<string>;
    readonly description: _angular_core.InputSignal<string>;
    readonly icon: _angular_core.InputSignal<string>;
    readonly resolvedIcon: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpEmptyStateComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpEmptyStateComponent, "xlp-empty-state", never, { "title": { "alias": "title"; "required": false; "isSignal": true; }; "description": { "alias": "description"; "required": false; "isSignal": true; }; "icon": { "alias": "icon"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpCodeBlockComponent {
    readonly code: _angular_core.InputSignal<string>;
    readonly language: _angular_core.InputSignal<string>;
    readonly filename: _angular_core.InputSignal<string>;
    readonly copied: _angular_core.WritableSignal<boolean>;
    copy(): Promise<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCodeBlockComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCodeBlockComponent, "xlp-code-block", never, { "code": { "alias": "code"; "required": true; "isSignal": true; }; "language": { "alias": "language"; "required": false; "isSignal": true; }; "filename": { "alias": "filename"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

interface XlpAvatarItem {
    name?: string;
    src?: string;
    color?: string;
}
type XlpAvatarGroupSize = 'sm' | 'md' | 'lg' | 'xl';
declare class XlpAvatarGroupComponent {
    readonly avatars: _angular_core.InputSignal<XlpAvatarItem[]>;
    readonly max: _angular_core.InputSignal<number>;
    readonly size: _angular_core.InputSignal<XlpAvatarGroupSize>;
    readonly visible: _angular_core.Signal<XlpAvatarItem[]>;
    readonly overflow: _angular_core.Signal<number>;
    initials(name?: string): string;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpAvatarGroupComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpAvatarGroupComponent, "xlp-avatar-group", never, { "avatars": { "alias": "avatars"; "required": true; "isSignal": true; }; "max": { "alias": "max"; "required": false; "isSignal": true; }; "size": { "alias": "size"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type XlpTimelineVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
declare class XlpTimelineItemComponent {
    readonly label: _angular_core.InputSignal<string>;
    readonly time: _angular_core.InputSignal<string>;
    readonly variant: _angular_core.InputSignal<XlpTimelineVariant>;
    readonly icon: _angular_core.InputSignal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTimelineItemComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTimelineItemComponent, "xlp-timeline-item", never, { "label": { "alias": "label"; "required": true; "isSignal": true; }; "time": { "alias": "time"; "required": false; "isSignal": true; }; "variant": { "alias": "variant"; "required": false; "isSignal": true; }; "icon": { "alias": "icon"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}
declare class XlpTimelineComponent {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTimelineComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTimelineComponent, "xlp-timeline", never, {}, {}, never, ["*"], true, never>;
}

type XlpFlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type XlpFlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type XlpFlexJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
type XlpFlexAlign = 'stretch' | 'start' | 'end' | 'center' | 'baseline';
type XlpFlexPreset = 'none' | 'stack' | 'center' | 'between' | 'cluster' | 'split';

declare class XlpFlexComponent {
    readonly preset: _angular_core.InputSignal<XlpFlexPreset>;
    readonly direction: _angular_core.InputSignal<"" | XlpFlexDirection>;
    readonly wrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly justify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly align: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly gap: _angular_core.InputSignal<string>;
    readonly rowGap: _angular_core.InputSignal<string>;
    readonly columnGap: _angular_core.InputSignal<string>;
    readonly inline: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly grow: _angular_core.InputSignal<number | "">;
    readonly shrink: _angular_core.InputSignal<number | "">;
    readonly basis: _angular_core.InputSignal<string>;
    readonly smDirection: _angular_core.InputSignal<"" | XlpFlexDirection>;
    readonly mdDirection: _angular_core.InputSignal<"" | XlpFlexDirection>;
    readonly lgDirection: _angular_core.InputSignal<"" | XlpFlexDirection>;
    readonly xlDirection: _angular_core.InputSignal<"" | XlpFlexDirection>;
    readonly smWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly mdWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly lgWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly xlWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly smJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly mdJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly lgJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly xlJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly smAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly mdAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly lgAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly xlAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly smGap: _angular_core.InputSignal<string>;
    readonly mdGap: _angular_core.InputSignal<string>;
    readonly lgGap: _angular_core.InputSignal<string>;
    readonly xlGap: _angular_core.InputSignal<string>;
    protected readonly hostStyle: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpFlexComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpFlexComponent, "xlp-flex", never, { "preset": { "alias": "preset"; "required": false; "isSignal": true; }; "direction": { "alias": "direction"; "required": false; "isSignal": true; }; "wrap": { "alias": "wrap"; "required": false; "isSignal": true; }; "justify": { "alias": "justify"; "required": false; "isSignal": true; }; "align": { "alias": "align"; "required": false; "isSignal": true; }; "gap": { "alias": "gap"; "required": false; "isSignal": true; }; "rowGap": { "alias": "rowGap"; "required": false; "isSignal": true; }; "columnGap": { "alias": "columnGap"; "required": false; "isSignal": true; }; "inline": { "alias": "inline"; "required": false; "isSignal": true; }; "grow": { "alias": "grow"; "required": false; "isSignal": true; }; "shrink": { "alias": "shrink"; "required": false; "isSignal": true; }; "basis": { "alias": "basis"; "required": false; "isSignal": true; }; "smDirection": { "alias": "smDirection"; "required": false; "isSignal": true; }; "mdDirection": { "alias": "mdDirection"; "required": false; "isSignal": true; }; "lgDirection": { "alias": "lgDirection"; "required": false; "isSignal": true; }; "xlDirection": { "alias": "xlDirection"; "required": false; "isSignal": true; }; "smWrap": { "alias": "smWrap"; "required": false; "isSignal": true; }; "mdWrap": { "alias": "mdWrap"; "required": false; "isSignal": true; }; "lgWrap": { "alias": "lgWrap"; "required": false; "isSignal": true; }; "xlWrap": { "alias": "xlWrap"; "required": false; "isSignal": true; }; "smJustify": { "alias": "smJustify"; "required": false; "isSignal": true; }; "mdJustify": { "alias": "mdJustify"; "required": false; "isSignal": true; }; "lgJustify": { "alias": "lgJustify"; "required": false; "isSignal": true; }; "xlJustify": { "alias": "xlJustify"; "required": false; "isSignal": true; }; "smAlign": { "alias": "smAlign"; "required": false; "isSignal": true; }; "mdAlign": { "alias": "mdAlign"; "required": false; "isSignal": true; }; "lgAlign": { "alias": "lgAlign"; "required": false; "isSignal": true; }; "xlAlign": { "alias": "xlAlign"; "required": false; "isSignal": true; }; "smGap": { "alias": "smGap"; "required": false; "isSignal": true; }; "mdGap": { "alias": "mdGap"; "required": false; "isSignal": true; }; "lgGap": { "alias": "lgGap"; "required": false; "isSignal": true; }; "xlGap": { "alias": "xlGap"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpRowComponent {
    readonly preset: _angular_core.InputSignal<XlpFlexPreset>;
    readonly wrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly justify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly align: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly gap: _angular_core.InputSignal<string>;
    readonly rowGap: _angular_core.InputSignal<string>;
    readonly columnGap: _angular_core.InputSignal<string>;
    readonly inline: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly grow: _angular_core.InputSignal<number | "">;
    readonly shrink: _angular_core.InputSignal<number | "">;
    readonly basis: _angular_core.InputSignal<string>;
    readonly smWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly mdWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly lgWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly xlWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly smJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly mdJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly lgJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly xlJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly smAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly mdAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly lgAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly xlAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly smGap: _angular_core.InputSignal<string>;
    readonly mdGap: _angular_core.InputSignal<string>;
    readonly lgGap: _angular_core.InputSignal<string>;
    readonly xlGap: _angular_core.InputSignal<string>;
    protected readonly hostStyle: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpRowComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpRowComponent, "xlp-row", never, { "preset": { "alias": "preset"; "required": false; "isSignal": true; }; "wrap": { "alias": "wrap"; "required": false; "isSignal": true; }; "justify": { "alias": "justify"; "required": false; "isSignal": true; }; "align": { "alias": "align"; "required": false; "isSignal": true; }; "gap": { "alias": "gap"; "required": false; "isSignal": true; }; "rowGap": { "alias": "rowGap"; "required": false; "isSignal": true; }; "columnGap": { "alias": "columnGap"; "required": false; "isSignal": true; }; "inline": { "alias": "inline"; "required": false; "isSignal": true; }; "grow": { "alias": "grow"; "required": false; "isSignal": true; }; "shrink": { "alias": "shrink"; "required": false; "isSignal": true; }; "basis": { "alias": "basis"; "required": false; "isSignal": true; }; "smWrap": { "alias": "smWrap"; "required": false; "isSignal": true; }; "mdWrap": { "alias": "mdWrap"; "required": false; "isSignal": true; }; "lgWrap": { "alias": "lgWrap"; "required": false; "isSignal": true; }; "xlWrap": { "alias": "xlWrap"; "required": false; "isSignal": true; }; "smJustify": { "alias": "smJustify"; "required": false; "isSignal": true; }; "mdJustify": { "alias": "mdJustify"; "required": false; "isSignal": true; }; "lgJustify": { "alias": "lgJustify"; "required": false; "isSignal": true; }; "xlJustify": { "alias": "xlJustify"; "required": false; "isSignal": true; }; "smAlign": { "alias": "smAlign"; "required": false; "isSignal": true; }; "mdAlign": { "alias": "mdAlign"; "required": false; "isSignal": true; }; "lgAlign": { "alias": "lgAlign"; "required": false; "isSignal": true; }; "xlAlign": { "alias": "xlAlign"; "required": false; "isSignal": true; }; "smGap": { "alias": "smGap"; "required": false; "isSignal": true; }; "mdGap": { "alias": "mdGap"; "required": false; "isSignal": true; }; "lgGap": { "alias": "lgGap"; "required": false; "isSignal": true; }; "xlGap": { "alias": "xlGap"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

declare class XlpColumnComponent {
    readonly preset: _angular_core.InputSignal<XlpFlexPreset>;
    readonly wrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly justify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly align: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly gap: _angular_core.InputSignal<string>;
    readonly rowGap: _angular_core.InputSignal<string>;
    readonly columnGap: _angular_core.InputSignal<string>;
    readonly inline: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly grow: _angular_core.InputSignal<number | "">;
    readonly shrink: _angular_core.InputSignal<number | "">;
    readonly basis: _angular_core.InputSignal<string>;
    readonly smWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly mdWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly lgWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly xlWrap: _angular_core.InputSignal<"" | XlpFlexWrap>;
    readonly smJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly mdJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly lgJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly xlJustify: _angular_core.InputSignal<"" | XlpFlexJustify>;
    readonly smAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly mdAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly lgAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly xlAlign: _angular_core.InputSignal<"" | XlpFlexAlign>;
    readonly smGap: _angular_core.InputSignal<string>;
    readonly mdGap: _angular_core.InputSignal<string>;
    readonly lgGap: _angular_core.InputSignal<string>;
    readonly xlGap: _angular_core.InputSignal<string>;
    protected readonly hostStyle: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpColumnComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpColumnComponent, "xlp-column", never, { "preset": { "alias": "preset"; "required": false; "isSignal": true; }; "wrap": { "alias": "wrap"; "required": false; "isSignal": true; }; "justify": { "alias": "justify"; "required": false; "isSignal": true; }; "align": { "alias": "align"; "required": false; "isSignal": true; }; "gap": { "alias": "gap"; "required": false; "isSignal": true; }; "rowGap": { "alias": "rowGap"; "required": false; "isSignal": true; }; "columnGap": { "alias": "columnGap"; "required": false; "isSignal": true; }; "inline": { "alias": "inline"; "required": false; "isSignal": true; }; "grow": { "alias": "grow"; "required": false; "isSignal": true; }; "shrink": { "alias": "shrink"; "required": false; "isSignal": true; }; "basis": { "alias": "basis"; "required": false; "isSignal": true; }; "smWrap": { "alias": "smWrap"; "required": false; "isSignal": true; }; "mdWrap": { "alias": "mdWrap"; "required": false; "isSignal": true; }; "lgWrap": { "alias": "lgWrap"; "required": false; "isSignal": true; }; "xlWrap": { "alias": "xlWrap"; "required": false; "isSignal": true; }; "smJustify": { "alias": "smJustify"; "required": false; "isSignal": true; }; "mdJustify": { "alias": "mdJustify"; "required": false; "isSignal": true; }; "lgJustify": { "alias": "lgJustify"; "required": false; "isSignal": true; }; "xlJustify": { "alias": "xlJustify"; "required": false; "isSignal": true; }; "smAlign": { "alias": "smAlign"; "required": false; "isSignal": true; }; "mdAlign": { "alias": "mdAlign"; "required": false; "isSignal": true; }; "lgAlign": { "alias": "lgAlign"; "required": false; "isSignal": true; }; "xlAlign": { "alias": "xlAlign"; "required": false; "isSignal": true; }; "smGap": { "alias": "smGap"; "required": false; "isSignal": true; }; "mdGap": { "alias": "mdGap"; "required": false; "isSignal": true; }; "lgGap": { "alias": "lgGap"; "required": false; "isSignal": true; }; "xlGap": { "alias": "xlGap"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

type XlpGridAutoFlow = 'row' | 'column' | 'row dense' | 'column dense';
type XlpGridAlign = 'start' | 'end' | 'center' | 'stretch';
type XlpGridPreset = 'none' | 'cards' | 'equal-2' | 'equal-3' | 'dashboard';

declare class XlpGridComponent {
    readonly preset: _angular_core.InputSignal<XlpGridPreset>;
    readonly columns: _angular_core.InputSignal<string>;
    readonly rows: _angular_core.InputSignal<string>;
    readonly areas: _angular_core.InputSignal<string>;
    readonly autoFlow: _angular_core.InputSignal<"" | XlpGridAutoFlow>;
    readonly gap: _angular_core.InputSignal<string>;
    readonly rowGap: _angular_core.InputSignal<string>;
    readonly columnGap: _angular_core.InputSignal<string>;
    readonly alignItems: _angular_core.InputSignal<"" | XlpGridAlign>;
    readonly justifyItems: _angular_core.InputSignal<"" | XlpGridAlign>;
    readonly alignContent: _angular_core.InputSignal<"" | XlpGridAlign>;
    readonly justifyContent: _angular_core.InputSignal<"" | XlpGridAlign>;
    readonly inline: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly smColumns: _angular_core.InputSignal<string>;
    readonly mdColumns: _angular_core.InputSignal<string>;
    readonly lgColumns: _angular_core.InputSignal<string>;
    readonly xlColumns: _angular_core.InputSignal<string>;
    readonly smGap: _angular_core.InputSignal<string>;
    readonly mdGap: _angular_core.InputSignal<string>;
    readonly lgGap: _angular_core.InputSignal<string>;
    readonly xlGap: _angular_core.InputSignal<string>;
    readonly smAreas: _angular_core.InputSignal<string>;
    readonly mdAreas: _angular_core.InputSignal<string>;
    readonly lgAreas: _angular_core.InputSignal<string>;
    readonly xlAreas: _angular_core.InputSignal<string>;
    protected readonly hostStyle: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpGridComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpGridComponent, "xlp-grid", never, { "preset": { "alias": "preset"; "required": false; "isSignal": true; }; "columns": { "alias": "columns"; "required": false; "isSignal": true; }; "rows": { "alias": "rows"; "required": false; "isSignal": true; }; "areas": { "alias": "areas"; "required": false; "isSignal": true; }; "autoFlow": { "alias": "autoFlow"; "required": false; "isSignal": true; }; "gap": { "alias": "gap"; "required": false; "isSignal": true; }; "rowGap": { "alias": "rowGap"; "required": false; "isSignal": true; }; "columnGap": { "alias": "columnGap"; "required": false; "isSignal": true; }; "alignItems": { "alias": "alignItems"; "required": false; "isSignal": true; }; "justifyItems": { "alias": "justifyItems"; "required": false; "isSignal": true; }; "alignContent": { "alias": "alignContent"; "required": false; "isSignal": true; }; "justifyContent": { "alias": "justifyContent"; "required": false; "isSignal": true; }; "inline": { "alias": "inline"; "required": false; "isSignal": true; }; "smColumns": { "alias": "smColumns"; "required": false; "isSignal": true; }; "mdColumns": { "alias": "mdColumns"; "required": false; "isSignal": true; }; "lgColumns": { "alias": "lgColumns"; "required": false; "isSignal": true; }; "xlColumns": { "alias": "xlColumns"; "required": false; "isSignal": true; }; "smGap": { "alias": "smGap"; "required": false; "isSignal": true; }; "mdGap": { "alias": "mdGap"; "required": false; "isSignal": true; }; "lgGap": { "alias": "lgGap"; "required": false; "isSignal": true; }; "xlGap": { "alias": "xlGap"; "required": false; "isSignal": true; }; "smAreas": { "alias": "smAreas"; "required": false; "isSignal": true; }; "mdAreas": { "alias": "mdAreas"; "required": false; "isSignal": true; }; "lgAreas": { "alias": "lgAreas"; "required": false; "isSignal": true; }; "xlAreas": { "alias": "xlAreas"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

/**
 * Interactive overlay anchored to a trigger element. Unlike a tooltip, a popover
 * can contain interactive content (buttons, forms, rich layouts) and is opened
 * by clicking its trigger.
 *
 * The panel is rendered through an `<ng-template>` and projected into a CDK
 * overlay by {@link XlpPopoverTriggerDirective}. Because the panel is portaled
 * to `document.body`, its styles live as GLOBAL class selectors
 * (`.xlp-popover__panel`).
 */
declare class XlpPopoverComponent {
    templateRef: TemplateRef<unknown>;
    /** Accessible label applied to the dialog panel. */
    readonly ariaLabel: _angular_core.InputSignal<string>;
    /** Emitted whenever the popover is closed. */
    readonly closed: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpPopoverComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpPopoverComponent, "xlp-popover", never, { "ariaLabel": { "alias": "ariaLabel"; "required": false; "isSignal": true; }; }, { "closed": "closed"; }, never, ["*"], true, never>;
}
type XlpPopoverPosition = 'top' | 'bottom' | 'left' | 'right';
/**
 * Trigger directive that wires an element to an {@link XlpPopoverComponent}.
 * Opens on click using a flexible connected overlay, with fallback positions so
 * the panel always stays inside the viewport.
 */
declare class XlpPopoverTriggerDirective implements OnDestroy {
    readonly popover: _angular_core.InputSignal<XlpPopoverComponent>;
    readonly position: _angular_core.InputSignal<XlpPopoverPosition>;
    private readonly overlay;
    private readonly positionBuilder;
    private readonly elementRef;
    private readonly viewContainerRef;
    private overlayRef;
    protected isOpen: boolean;
    toggle(): void;
    open(): void;
    close(): void;
    ngOnDestroy(): void;
    /**
     * Builds the connected position list for the requested side, always providing
     * fallbacks so the panel flips when it would overflow the viewport.
     */
    private resolvePositions;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpPopoverTriggerDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpPopoverTriggerDirective, "[xlpPopoverTriggerFor]", never, { "popover": { "alias": "xlpPopoverTriggerFor"; "required": true; "isSignal": true; }; "position": { "alias": "position"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type XlpDrawerSide = 'left' | 'right' | 'top' | 'bottom';
/**
 * A panel that slides in from a viewport edge. Unlike a dialog (centered), a
 * drawer is anchored to an edge and is commonly used for navigation menus,
 * filters, and detail panels.
 *
 * The panel is declared as an `<ng-template>` and projected into a CDK overlay
 * by {@link XlpDrawerTriggerDirective} using a global position strategy. Panel
 * styles are GLOBAL class selectors because the panel is portaled to
 * `document.body`.
 */
declare class XlpDrawerComponent {
    templateRef: TemplateRef<unknown>;
    /** Viewport edge the drawer slides in from. */
    readonly side: _angular_core.InputSignal<XlpDrawerSide>;
    /** Width for left/right drawers (e.g. '400px'). */
    readonly width: _angular_core.InputSignal<string>;
    /** Height for top/bottom drawers (e.g. '360px'). */
    readonly height: _angular_core.InputSignal<string>;
    /** Title rendered in the drawer header. */
    readonly title: _angular_core.InputSignal<string>;
    /** Emitted when the drawer requests to close (header X or trigger). */
    readonly closed: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDrawerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpDrawerComponent, "xlp-drawer", never, { "side": { "alias": "side"; "required": false; "isSignal": true; }; "width": { "alias": "width"; "required": false; "isSignal": true; }; "height": { "alias": "height"; "required": false; "isSignal": true; }; "title": { "alias": "title"; "required": false; "isSignal": true; }; }, { "closed": "closed"; }, never, ["*"], true, never>;
}
/**
 * Trigger directive that opens an {@link XlpDrawerComponent} on click. Uses a CDK
 * global position strategy anchored to the relevant viewport edge, a blocking
 * scroll strategy, a backdrop, and Escape-to-close.
 */
declare class XlpDrawerTriggerDirective implements OnDestroy {
    readonly drawer: _angular_core.InputSignal<XlpDrawerComponent>;
    private readonly overlay;
    private readonly viewContainerRef;
    private overlayRef;
    constructor();
    open(): void;
    close(): void;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpDrawerTriggerDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpDrawerTriggerDirective, "[xlpDrawerTriggerFor]", never, { "drawer": { "alias": "xlpDrawerTriggerFor"; "required": true; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpContextMenuItemComponent {
    readonly variant: _angular_core.InputSignal<"danger" | "default">;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpContextMenuItemComponent, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpContextMenuItemComponent, "[xlpContextMenuItem], xlp-context-menu-item", never, { "variant": { "alias": "variant"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
declare class XlpContextMenuSeparatorComponent {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpContextMenuSeparatorComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpContextMenuSeparatorComponent, "xlp-context-menu-separator", never, {}, {}, never, never, true, never>;
}
declare class XlpContextMenuComponent {
    templateRef: TemplateRef<unknown>;
    readonly closed: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpContextMenuComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpContextMenuComponent, "xlp-context-menu", never, {}, { "closed": "closed"; }, never, ["*"], true, never>;
}
declare class XlpContextMenuTriggerDirective implements OnDestroy {
    readonly menu: _angular_core.InputSignal<XlpContextMenuComponent>;
    private readonly overlay;
    private readonly viewContainerRef;
    private overlayRef;
    onContextMenu(event: MouseEvent): void;
    close(): void;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpContextMenuTriggerDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpContextMenuTriggerDirective, "[xlpContextMenuTriggerFor]", never, { "menu": { "alias": "xlpContextMenuTriggerFor"; "required": true; "isSignal": true; }; }, {}, never, never, true, never>;
}

interface XlpCommand {
    id: string;
    label: string;
    group?: string;
    icon?: string;
    shortcut?: string;
    keywords?: string;
}
interface XlpCommandGroup {
    name: string;
    items: XlpCommand[];
}
declare class XlpCommandPaletteComponent implements OnDestroy {
    readonly commands: _angular_core.InputSignal<XlpCommand[]>;
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly commandSelected: _angular_core.OutputEmitterRef<XlpCommand>;
    private templateRef;
    private searchInput?;
    private readonly overlay;
    private readonly viewContainerRef;
    private overlayRef;
    readonly query: _angular_core.WritableSignal<string>;
    readonly activeIndex: _angular_core.WritableSignal<number>;
    readonly filtered: _angular_core.Signal<XlpCommand[]>;
    readonly grouped: _angular_core.Signal<XlpCommandGroup[]>;
    readonly activeId: _angular_core.Signal<string>;
    get isOpen(): boolean;
    open(): void;
    close(): void;
    toggle(): void;
    onQuery(event: Event): void;
    onKeydown(event: KeyboardEvent): void;
    selectCommand(cmd: XlpCommand): void;
    setActiveById(id: string): void;
    private scrollActiveIntoView;
    ngOnDestroy(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCommandPaletteComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCommandPaletteComponent, "xlp-command-palette", never, { "commands": { "alias": "commands"; "required": true; "isSignal": true; }; "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; }, { "commandSelected": "commandSelected"; }, never, never, true, never>;
}

declare class XlpTagInputComponent implements ControlValueAccessor {
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly max: _angular_core.InputSignal<number>;
    readonly allowDuplicates: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly tags: _angular_core.WritableSignal<string[]>;
    protected readonly draft: _angular_core.WritableSignal<string>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly atMax: _angular_core.Signal<boolean>;
    private readonly inputRef;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected focusInput(): void;
    protected addTag(value: string): void;
    protected removeTag(index: number): void;
    protected onInput(event: Event): void;
    protected onKeydown(event: KeyboardEvent): void;
    writeValue(value: string[]): void;
    registerOnChange(fn: (value: string[]) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTagInputComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTagInputComponent, "xlp-tag-input", never, { "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; "max": { "alias": "max"; "required": false; "isSignal": true; }; "allowDuplicates": { "alias": "allowDuplicates"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare class XlpOtpInputComponent implements ControlValueAccessor {
    readonly length: _angular_core.InputSignal<number>;
    readonly type: _angular_core.InputSignal<"numeric" | "alphanumeric">;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly invalid: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly values: _angular_core.WritableSignal<string[]>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly slots: _angular_core.Signal<number[]>;
    private readonly boxes;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    private emptyValues;
    private get pattern();
    protected onInput(index: number, event: Event): void;
    protected onKeydown(index: number, event: KeyboardEvent): void;
    protected onPaste(event: ClipboardEvent): void;
    protected onFocus(event: FocusEvent): void;
    private setValueAt;
    private syncBox;
    private syncAllBoxes;
    private focusBox;
    private emitCode;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpOtpInputComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpOtpInputComponent, "xlp-otp-input", never, { "length": { "alias": "length"; "required": false; "isSignal": true; }; "type": { "alias": "type"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "invalid": { "alias": "invalid"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

interface XlpComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
}
declare class XlpComboboxComponent implements ControlValueAccessor {
    readonly options: _angular_core.InputSignal<XlpComboboxOption[]>;
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly searchPlaceholder: _angular_core.InputSignal<string>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly selected: _angular_core.WritableSignal<string>;
    protected readonly query: _angular_core.WritableSignal<string>;
    protected readonly activeIndex: _angular_core.WritableSignal<number>;
    protected readonly isOpen: _angular_core.WritableSignal<boolean>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly filtered: _angular_core.Signal<XlpComboboxOption[]>;
    protected readonly selectedLabel: _angular_core.Signal<string>;
    private readonly fieldRef;
    private readonly panelTpl;
    private readonly searchInput;
    private readonly overlay;
    private readonly viewContainerRef;
    private overlayRef;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected toggle(): void;
    protected open(): void;
    protected close(): void;
    protected onQueryInput(e: Event): void;
    protected moveActive(dir: 1 | -1): void;
    protected selectActive(): void;
    protected select(opt: XlpComboboxOption): void;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpComboboxComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpComboboxComponent, "xlp-combobox", never, { "options": { "alias": "options"; "required": true; "isSignal": true; }; "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; "searchPlaceholder": { "alias": "searchPlaceholder"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

declare const DEFAULT_PRESETS: string[];
declare class XlpColorPickerComponent implements ControlValueAccessor {
    readonly presets: _angular_core.InputSignal<string[]>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly showInput: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly value: _angular_core.WritableSignal<string>;
    protected readonly isOpen: _angular_core.WritableSignal<boolean>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    private readonly fieldRef;
    private readonly panelTpl;
    private readonly overlay;
    private readonly viewContainerRef;
    private overlayRef;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected toggle(): void;
    protected open(): void;
    protected close(): void;
    /** Commits a color value and notifies the form. */
    protected selectColor(hex: string): void;
    /** Preset click commits the color and closes the popover. */
    protected selectPreset(hex: string): void;
    protected onHexInput(e: Event): void;
    protected onNativeInput(e: Event): void;
    protected isValidHex(s: string): boolean;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpColorPickerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpColorPickerComponent, "xlp-color-picker", never, { "presets": { "alias": "presets"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "showInput": { "alias": "showInput"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type Meridiem = 'AM' | 'PM';
declare class XlpTimePickerComponent implements ControlValueAccessor {
    readonly use12Hour: _angular_core.InputSignalWithTransform<boolean, unknown>;
    readonly minuteStep: _angular_core.InputSignal<number>;
    readonly placeholder: _angular_core.InputSignal<string>;
    readonly disabled: _angular_core.InputSignalWithTransform<boolean, unknown>;
    protected readonly hour: _angular_core.WritableSignal<number>;
    protected readonly minute: _angular_core.WritableSignal<number>;
    protected readonly meridiem: _angular_core.WritableSignal<Meridiem>;
    protected readonly hasValue: _angular_core.WritableSignal<boolean>;
    protected readonly isOpen: _angular_core.WritableSignal<boolean>;
    protected readonly isDisabled: _angular_core.WritableSignal<boolean>;
    protected readonly meridiems: Meridiem[];
    protected readonly hours: _angular_core.Signal<number[]>;
    protected readonly minutes: _angular_core.Signal<number[]>;
    /** Hour as shown in the dropdown (1-12 in 12h mode, 0-23 in 24h mode). */
    protected readonly displayHour: _angular_core.Signal<number>;
    protected readonly displayLabel: _angular_core.Signal<string>;
    private readonly fieldRef;
    private readonly panelTpl;
    private readonly overlay;
    private readonly viewContainerRef;
    private overlayRef;
    private onChangeFn;
    protected onTouched: () => void;
    constructor();
    protected toggle(): void;
    protected open(): void;
    protected close(): void;
    protected selectHour(displayed: number): void;
    protected selectMinute(m: number): void;
    protected selectMeridiem(mer: Meridiem): void;
    /** Builds the 24h "HH:mm" string from internal state and emits it. */
    protected commit(): void;
    protected pad2(n: number): string;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpTimePickerComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpTimePickerComponent, "xlp-time-picker", never, { "use12Hour": { "alias": "use12Hour"; "required": false; "isSignal": true; }; "minuteStep": { "alias": "minuteStep"; "required": false; "isSignal": true; }; "placeholder": { "alias": "placeholder"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Structural directive that captures the row template for {@link XlpVirtualListComponent}.
 *
 * Usage:
 * ```html
 * <xlp-virtual-list [items]="rows" [itemHeight]="52">
 *   <div *xlpVirtualListItem="let item; let i = index">{{ i }} — {{ item.name }}</div>
 * </xlp-virtual-list>
 * ```
 *
 * The template context exposes the item as `$implicit` and the row index as `index`.
 */
declare class XlpVirtualListItemDirective {
    templateRef: TemplateRef<unknown>;
    constructor(templateRef: TemplateRef<unknown>);
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpVirtualListItemDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpVirtualListItemDirective, "[xlpVirtualListItem]", never, {}, {}, never, never, true, never>;
}
/**
 * A virtualized scrolling list for rendering very large datasets (1000s of rows)
 * efficiently. Built on `@angular/cdk/scrolling` — only the rows currently visible
 * inside the viewport are present in the DOM.
 *
 * Rows have a fixed height (`itemHeight`); the consumer provides the data and a row
 * template via the {@link XlpVirtualListItemDirective}.
 */
declare class XlpVirtualListComponent<T = unknown> {
    /** The full dataset to render. Only visible rows are kept in the DOM. */
    readonly items: _angular_core.InputSignal<T[]>;
    /** Fixed height of each row, in pixels. Must match the rendered row height. */
    readonly itemHeight: _angular_core.InputSignal<number>;
    /** Height of the scroll viewport (any CSS length). */
    readonly height: _angular_core.InputSignal<string>;
    /** The consumer-provided row template captured via `*xlpVirtualListItem`. */
    protected readonly itemTpl: _angular_core.Signal<XlpVirtualListItemDirective>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpVirtualListComponent<any>, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpVirtualListComponent<any>, "xlp-virtual-list", never, { "items": { "alias": "items"; "required": true; "isSignal": true; }; "itemHeight": { "alias": "itemHeight"; "required": false; "isSignal": true; }; "height": { "alias": "height"; "required": false; "isSignal": true; }; }, {}, ["itemTpl"], never, true, never>;
}

/**
 * Structural directive that captures the row template for {@link XlpSortableListComponent}.
 *
 * Usage:
 * ```html
 * <xlp-sortable-list [(items)]="tasks">
 *   <div *xlpSortableItem="let item; let i = index">{{ item.name }}</div>
 * </xlp-sortable-list>
 * ```
 *
 * The template context exposes the item as `$implicit` and its index as `index`.
 */
declare class XlpSortableItemDirective {
    templateRef: TemplateRef<unknown>;
    constructor(templateRef: TemplateRef<unknown>);
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSortableItemDirective, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<XlpSortableItemDirective, "[xlpSortableItem]", never, {}, {}, never, never, true, never>;
}
/**
 * A drag-and-drop reorderable list built on `@angular/cdk/drag-drop`.
 *
 * The `items` array is a two-way model — reordering updates it in place. A
 * `reordered` event is also emitted with the previous/current indices. Each row
 * gets an optional drag handle (`showHandle`); the consumer provides the row
 * markup via the {@link XlpSortableItemDirective}.
 */
declare class XlpSortableListComponent<T = unknown> {
    /** The list to render and reorder. Two-way bindable via `[(items)]`. */
    readonly items: _angular_core.ModelSignal<T[]>;
    /** Whether to show a dedicated drag handle on each row. */
    readonly showHandle: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /** Emitted after a successful reorder with the affected indices. */
    readonly reordered: _angular_core.OutputEmitterRef<{
        previousIndex: number;
        currentIndex: number;
    }>;
    /** The consumer-provided row template captured via `*xlpSortableItem`. */
    protected readonly itemTpl: _angular_core.Signal<XlpSortableItemDirective>;
    protected drop(event: CdkDragDrop<T[]>): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpSortableListComponent<any>, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpSortableListComponent<any>, "xlp-sortable-list", never, { "items": { "alias": "items"; "required": true; "isSignal": true; }; "showHandle": { "alias": "showHandle"; "required": false; "isSignal": true; }; }, { "items": "itemsChange"; "reordered": "reordered"; }, ["itemTpl"], never, true, never>;
}

/**
 * A single slide projected into an {@link XlpCarouselComponent}.
 */
declare class XlpCarouselSlideComponent {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCarouselSlideComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCarouselSlideComponent, "xlp-carousel-slide", never, {}, {}, never, ["*"], true, never>;
}
/**
 * Horizontal slideshow. Projects {@link XlpCarouselSlideComponent} children, shows
 * prev/next arrows and dot indicators, and supports optional autoplay + looping.
 */
declare class XlpCarouselComponent {
    /** When true, advancing past the last slide wraps to the first (and vice versa). */
    readonly loop: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /** When true, the carousel auto-advances on the configured interval. */
    readonly autoplay: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /** Autoplay interval in milliseconds. */
    readonly interval: _angular_core.InputSignal<number>;
    /** Whether to render the prev/next arrow buttons. */
    readonly showArrows: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /** Whether to render the dot indicators. */
    readonly showDots: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /** Index of the currently visible slide. */
    readonly current: _angular_core.WritableSignal<number>;
    /** Whether autoplay is paused (e.g. while hovered). */
    protected readonly paused: _angular_core.WritableSignal<boolean>;
    /** Projected slide components. */
    readonly slides: _angular_core.Signal<readonly XlpCarouselSlideComponent[]>;
    /** Number of slides. */
    readonly count: _angular_core.Signal<number>;
    /** Emits the new index whenever the active slide changes. */
    readonly slideChange: _angular_core.OutputEmitterRef<number>;
    private readonly destroyRef;
    private timer;
    constructor();
    next(): void;
    prev(): void;
    goTo(index: number): void;
    onKeydown(event: KeyboardEvent): void;
    private clearTimer;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpCarouselComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpCarouselComponent, "xlp-carousel", never, { "loop": { "alias": "loop"; "required": false; "isSignal": true; }; "autoplay": { "alias": "autoplay"; "required": false; "isSignal": true; }; "interval": { "alias": "interval"; "required": false; "isSignal": true; }; "showArrows": { "alias": "showArrows"; "required": false; "isSignal": true; }; "showDots": { "alias": "showDots"; "required": false; "isSignal": true; }; }, { "slideChange": "slideChange"; }, ["slides"], ["*"], true, never>;
}

declare class XlpResizablePanelsComponent {
    readonly direction: _angular_core.InputSignal<"horizontal" | "vertical">;
    readonly initialSplit: _angular_core.InputSignal<number>;
    readonly minSize: _angular_core.InputSignal<number>;
    readonly splitChange: _angular_core.OutputEmitterRef<number>;
    protected readonly split: _angular_core.WritableSignal<number>;
    protected readonly paneAStyle: () => string;
    private readonly containerRef;
    private readonly destroyRef;
    private dragging;
    private startPos;
    private startSplit;
    private containerSize;
    constructor();
    protected startDrag(e: MouseEvent): void;
    protected onKeydown(e: KeyboardEvent): void;
    private readonly onMove;
    private readonly onUp;
    private updateSplit;
    private isH;
    private cleanup;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<XlpResizablePanelsComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<XlpResizablePanelsComponent, "xlp-resizable-panels", never, { "direction": { "alias": "direction"; "required": false; "isSignal": true; }; "initialSplit": { "alias": "initialSplit"; "required": false; "isSignal": true; }; "minSize": { "alias": "minSize"; "required": false; "isSignal": true; }; }, { "splitChange": "splitChange"; }, never, ["[panel-a]", "[panel-b]"], true, never>;
}

export { DEFAULT_PRESETS, SHELL_LAYOUT_DEFAULT_ROWS, XELOPS_THEME_CONFIG, XelThemeService, XlpAccordionComponent, XlpAccordionPanelComponent, XlpAccountMenuComponent, XlpAlertComponent, XlpAutocompleteComponent, XlpAvatarComponent, XlpAvatarGroupComponent, XlpBadgeComponent, XlpBreadcrumbComponent, XlpButtonComponent, XlpCalloutComponent, XlpCardBodyDirective, XlpCardComponent, XlpCardFooterDirective, XlpCardHeaderDirective, XlpCarouselComponent, XlpCarouselSlideComponent, XlpCheckboxComponent, XlpCheckboxTreeComponent, XlpCodeBlockComponent, XlpColorPickerComponent, XlpColumnComponent, XlpComboboxComponent, XlpCommandPaletteComponent, XlpContextMenuComponent, XlpContextMenuItemComponent, XlpContextMenuSeparatorComponent, XlpContextMenuTriggerDirective, XlpDataTableComponent, XlpDatePickerComponent, XlpDialogActionsDirective, XlpDialogCloseDirective, XlpDialogContentDirective, XlpDialogService, XlpDialogTitleDirective, XlpDividerComponent, XlpDonutChartComponent, XlpDrawerComponent, XlpDrawerTriggerDirective, XlpDropZoneComponent, XlpEmptyStateComponent, XlpFlexComponent, XlpGridComponent, XlpInputDirective, XlpKbdComponent, XlpLabelComponent, XlpListComponent, XlpListItemComponent, XlpMenuComponent, XlpMenuItemComponent, XlpMenuTriggerDirective, XlpMetricBarComponent, XlpNavComponent, XlpNotificationDrawerComponent, XlpNotificationDrawerService, XlpNotificationItemComponent, XlpNumberInputComponent, XlpOtpInputComponent, XlpPaginationComponent, XlpPopoverComponent, XlpPopoverTriggerDirective, XlpProgressComponent, XlpRadioButtonComponent, XlpRadioGroupComponent, XlpRatingComponent, XlpResizablePanelsComponent, XlpRowComponent, XlpSegmentedControlComponent, XlpSelectComponent, XlpShellLayoutComponent, XlpSkeletonComponent, XlpSliderComponent, XlpSortableItemDirective, XlpSortableListComponent, XlpSpinnerComponent, XlpStatusComponent, XlpStepperComponent, XlpTabComponent, XlpTabsComponent, XlpTagComponent, XlpTagInputComponent, XlpTdDirective, XlpThDirective, XlpTimePickerComponent, XlpTimelineComponent, XlpTimelineItemComponent, XlpToastContainerComponent, XlpToastService, XlpToggleComponent, XlpTooltipComponent, XlpTooltipDirective, XlpTopbarComponent, XlpTrDirective, XlpTreeComponent, XlpVirtualListComponent, XlpVirtualListItemDirective, provideXelopsUi };
export type { XelBrand, XelColorScheme, XelThemeConfig, XlpAccountMenuItem, XlpAccountMenuItemVariant, XlpAlertVariant, XlpAvatarGroupSize, XlpAvatarItem, XlpAvatarShape, XlpAvatarSize, XlpBadgeSize, XlpBadgeVariant, XlpBreadcrumbItem, XlpButtonSize, XlpButtonVariant, XlpCalendarDay, XlpCalloutType, XlpCardVariant, XlpCheckboxTreeItem, XlpComboboxOption, XlpCommand, XlpDatePickerSize, XlpDialogConfig, XlpDividerOrientation, XlpDonutSize, XlpDonutSlice, XlpDonutVariant, XlpFlatNode, XlpFlexAlign, XlpFlexDirection, XlpFlexJustify, XlpFlexPreset, XlpFlexWrap, XlpGridAlign, XlpGridAutoFlow, XlpGridPreset, XlpInputSize, XlpMetricBarVariant, XlpNavItem, XlpNotification, XlpNotificationVariant, XlpProgressVariant, XlpSegmentedOption, XlpSelectOption, XlpSelectSize, XlpShellLayoutItem, XlpSkeletonShape, XlpSliderVariant, XlpSortEvent, XlpSpinnerSize, XlpStatusSize, XlpStatusVariant, XlpStep, XlpStepStatus, XlpTableAlign, XlpTableColumn, XlpTableRowState, XlpTagVariant, XlpTimelineVariant, XlpToast, XlpToastOptions, XlpToastVariant, XlpTooltipPlacement, XlpTopbarHeight, XlpTreeNode };
