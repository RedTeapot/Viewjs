interface ViewLoggerClass{
	isEnabled(): boolean;
	setIsEnabled(): ViewLoggerClass;
	getName(): string;

	debug(str: string, ...params: any);
	info(str: string, ...params: any);
	warn(str: string, ...params: any);
	error(str: string, ...params: any);
	log(str: string, ...params: any);
}

interface ViewConfigClass{
	getName(): string;
	getValue(dftValue?: any): any;
	setValue(value: any, overrideExistingValue?: boolean): ViewConfigClass;
	getApplication(): Function;
	setApplication(application: Function): ViewConfigClass;
	apply(): ViewConfigClass;
	reflectToDom(): ViewConfigClass;
}

interface ViewConfigSetClass{
	has(key: string): boolean;
	get(key: string): ViewConfigClass;
	applyAll(): ViewConfigSetClass;
	listAll(): string[];
}

interface ViewContextClass{
	has(name: string): boolean;
	set(name: string, value: any): ViewContextClass;
	get(name: string): any;
	remove(name: string): any;
	clear(): ViewContextClass;
	listKeys(): string[];
	size(): number;
}

interface ViewStateClass{
	readonly viewId: string;
	readonly viewNamespace: string;
	readonly sn: string;
	readonly options: object|null;

	toString(): string;
	clone(): object;
}

interface ViewClass{
	readonly id: string;
	readonly namespace: string;

	readonly logger: ViewLoggerClass;
	readonly config: ViewConfigSetClass;
	readonly context: ViewContextClass;

	on(type: string, handle: Function): void;
	off(type: string, handle: Function): void;
	fire(type: string, data: any, async?: boolean): void;

	getLatestEventData(evtName: string): any;
	getContext(): ViewContextClass;
	clearContext(): ViewClass;

	getId(): string;
	getNamespace(): string;

	getDomElement<E extends Element = Element>(): E;
	getGroupName(): null|string;

	find<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
	find<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
	find<E extends Element = Element>(selectors: string): E | null;

	findAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
	findAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>;
	findAll<E extends Element = Element>(selectors: string): NodeListOf<E>;

	setLayoutAction(layoutAction: Function, ifLayoutWhenLayoutChanges?: boolean): ViewClass;
	getLayoutAction(): Function;

	hasParameter(name: string): boolean;
	getParameter(name: string): any;
	seekParameter(name: string): string|any|null;

	isReady(): boolean;
	isActive(): boolean;
	isDefault(): boolean;

	isDirectlyAccessible(): boolean;
	setAsDirectlyAccessible(isDirectlyAccessible?: boolean): ViewClass;

	setTitle(title?: string): ViewClass;
	getTitle(): string|null;

	setFallbackViewId(fallbackViewId: string): ViewClass;
	getFallbackView(): ViewClass|null;
}

interface ChainedHandleClass{
	getName(): string;
	setSequence(sequence: string[]): ChainedHandleClass;

	setProperty(name: string, value: any): ChainedHandleClass;
	setProperties(object: any): ChainedHandleClass;
	getProperty(name: string, dftValue?: any): any|null;

	setHandle(name: string, action: Function): ChainedHandleClass;
	exec(): Promise<void>;
}

interface LayoutInitOptions{
	autoReLayoutWhenResize: boolean;

	layoutAsMobilePortrait: Function,
	layoutAsMobileLandscape: Function,
	layoutAsTabletLandscape: Function,
	layoutAsTabletPortrait: Function,
	layoutAsPcPortrait: Function,
	layoutAsPcLandscape: Function
}

interface layout{
	getLayoutWidth(): number;
	getLayoutHeight(): number;
	getBrowserWidth(): number;
	getBrowserHeight(): number;
	isLayoutPortrait(): number;
	isLayoutLandscape(): number;
	isBrowserPortrait(): number;
	isBrowserLandscape(): number;
	getLayoutWidthHeightRatio(): number;
	getExpectedWidthHeightRatio(): number;
	setExpectedWidthHeightRatio(ratio: number): number;

	init(initOptions?: LayoutInitOptions): layout;
	doLayout(async?: boolean): layout;

	removeLayoutChangeListener(listener: Function): layout;
}

declare namespace ChainedHandle{
	function ofName(name: string): ChainedHandleClass;
}

interface ViewLogger{
	ofName(name: string): ViewLoggerClass;
	isGloballyEnabled(): boolean;
	setIsGloballyEnabled(isEnabled: boolean): void;
}

interface ViewSwitchCtrl{
	params?: object|null;
	options?: object|null;
	withAnimation?: boolean;
}

interface ViewBackForwardCtrl{
	params?: object|null;
}

declare class View{
	static currentState: ViewStateClass|null;

	static readonly Logger: ViewLogger;
	static readonly layout: layout;
	static readonly context: ViewContextClass;

	static readonly SWITCHTYPE_HISTORYFORWARD: string;
	static readonly SWITCHTYPE_HISTORYBACK: string;
	static readonly SWITCHTYPE_VIEWNAV: string;
	static readonly SWITCHTYPE_VIEWCHANGE: string;

	static on(type: string, handle: Function): void;
	static off(type: string, handle: Function): void;
	static fire(type: string, data: any, async?: boolean): void;

	static checkIfBrowserHistorySupportsPushPopAction(): boolean;
	static getViewContainerDomElement<E extends Element = Element>(): E;

	static find<E extends Element = Element>(selector: string): E;
	static find<E extends Element = Element>(rootObj: E, selector: string): E;
	static findAll<E extends Element = Element>(selector: string): NodeListOf<E>;
	static findAll<E extends Element = Element>(rootObj: E, selector: string): NodeListOf<E>;

	static ofId(id: string, namespace?: string): ViewClass;
	static ifExists(id: string, namespace?: string): boolean;
	static setAsDefault(id: string, namespace?: string): View;

	static listAll(groupName?: string): ViewClass[];
	static listAllGroups(): string[];

	static isDirectlyAccessible(): boolean;
	static setIsDirectlyAccessible(isDirectlyAccessible?: boolean): View;
	static setViewIsDirectlyAccessible(id: string, namespace?: string, isDirectlyAccessible?: boolean): View;

	static getActiveView(): ViewClass|null;
	static getDefaultView(): ViewClass|null;

	static setSwitchAnimation(animation: Function): View;
	static getSwitchAnimation(): Function|null;

	static getActiveViewOptions(): object|null;
	static hasActiveViewOption(name: string): boolean;
	static getActiveViewOption(name: string): string|null;
	static setActiveViewOption(name: string, value: any):View;

	static passBy(id: string, namespace?: string): View;
	static navTo(id: string, ctrl?: ViewSwitchCtrl): View;
	static navTo(id: string, namespace?: string, ctrl?: ViewSwitchCtrl): View;
	static changeTo(id: string, ctrl?: ViewSwitchCtrl): View;
	static changeTo(id: string, namespace?: string, ctrl?: ViewSwitchCtrl): View;
	static back(ctrl?: ViewBackForwardCtrl): View;
	static forward(ctrl?: ViewBackForwardCtrl): View;

	static setDocumentTitle(title?: string): View;

	static ifCanGoBack(): boolean;
	static setNoViewToNavBackAction(action: Function): View;

	static onceHistoryBack(callback: Function): View;
	static reDoLayout(): View;

	static getChainedHandleByName(name: string): ChainedHandleClass;

	static beforeInit(callback: Function): View;
	static ready(callback: Function): View;
	static setInitializer(initializer: (init: Function) => void, execTime?: string): View;
}