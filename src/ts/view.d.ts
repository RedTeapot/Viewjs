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
	setValue(value: any, ifOverride?: boolean): ViewConfigClass;
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

interface ViewThenable{
	then: (onFulfilled: (resolvedData: any) => void, onRejected: (rejectedReason: any) => void) => void;
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
	getName(): null|string;

	/**
	 * @deprecated
	 */
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
	getParameter(): null | Object;
	getParameter(name: string): any;
	getParameter(name: string): any;
	seekParameter(name: string, ifRetrieveFromContext?: boolean): any | null;

	setIfAutoSaveParamsToContext(autoSave?: boolean): ViewClass;
	getIfAutoSaveParamsToContext(): boolean;

	isReady(): boolean;
	isActive(): boolean;
	getActiveTimes(): Number;
	isDefault(): boolean;

	isDirectlyAccessible(): boolean;
	setAsDirectlyAccessible(isDirectlyAccessible?: boolean): ViewClass;

	setTitle(title?: string): ViewClass;
	getTitle(): string | null;

	setFallbackViewId(fallbackViewId: string): ViewClass;
	getFallbackView(): ViewClass | null;

	setDataFetchAction(action: (resolve: Function, reject: Function) => void): ViewClass;
	getDataFetchAction(): (resolve: Function, reject: Function) => void | null;
	fetchData(): Promise<any> | ViewThenable;

	addTimer(timerHandle: Function, timerInterval: Number): ViewClass;
	addTimer(timerName: string, timerHandle: Function, timerInterval: Number): ViewClass;
	startTimer(timerName: string): boolean;
	startAllTimers(): ViewClass;
	stopTimer(timerName: string): boolean;
	stopAllTimers(): ViewClass;
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

interface ViewLayoutInitOptions{
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

	init(initOptions?: ViewLayoutInitOptions): layout;
	doLayout(async?: boolean): layout;

	addLayoutChangeListener(listener: (layoutWidth?: number, layoutHeight?: number, browserWidth?: number, browserHeight?: number) => void): layout;
	removeLayoutChangeListener(listener: (layoutWidth?: number, layoutHeight?: number, browserWidth?: number, browserHeight?: number) => void): layout;
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

interface ViewSwitchMeta{
	sourceView: ViewClass|null,
	targetView: ViewClass|null,
	type: string,
	trigger: string,
	params: object|null,
	options: object|null
}

interface ViewSwitchAnimationMeta{
	srcElement: Element|null,
	targetElement: Element|null,
	type: string,
	trigger: string,
	render: Function
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

	static readonly SWITCHTRIGGER_APP: string;
	static readonly SWITCHTRIGGER_NAVIGATOR: string;

	static on(type: string, handle: Function): void;
	static off(type: string, handle: Function): void;
	static fire(type: string, data: any, async?: boolean): void;

	static checkIfBrowserHistorySupportsPushPopAction(): boolean;
	static getViewContainerDomElement<E extends Element = Element>(): E;

	static setResolver(
		resolver: (
			viewId: string,
			viewNamespace: string,
			resolve: (view: ViewClass) => void,
			reject: (reason: any) => void
		) => void
	): View;
	static getResolver(): (
		viewId: string,
		viewNamespace: string,
		resolve: (view: ViewClass) => void,
		reject: (reason: any) => void
	) => void;
	static resolve(
		viewId: string,
		viewNamespace: string,
		onresolve: (view: ViewClass) => void,
		onreject: (reason: any) => void
	): View;
	static newResolver1(
		viewFileLocator: (viewId: string, viewNamespace: string) => string
	): (
		viewId: string,
		viewNamespace: string,
		resolve: (view: ViewClass) => void,
		reject: (reason: any) => void
	) => void;

	static find<E extends Element = Element>(selector: string): E;
	static find<E extends Element = Element>(rootObj: Element, selector: string): E;
	static findAll<E extends Element = Element>(selector: string): NodeListOf<E>;
	static findAll<E extends Element = Element>(rootObj: Element, selector: string): NodeListOf<E>;

	static ofId(id: string, namespace?: string): ViewClass;
	static ifExists(id: string, namespace?: string): boolean;
	static setAsDefault(id: string, namespace?: string): View;

	static listAll(viewName?: string): ViewClass[];
	static listAllViewNames(): string[];

	/**
	 * @deprecated
	 */
	static listAllGroups(): string[];

	static isDirectlyAccessible(): boolean;
	static setIsDirectlyAccessible(isDirectlyAccessible?: boolean): View;
	static setViewIsDirectlyAccessible(id: string, namespace?: string, isDirectlyAccessible?: boolean): View;

	static getActiveView(): ViewClass|null;
	static getDefaultView(): ViewClass|null;

	static setSwitchAnimation(animation: (meta: ViewSwitchAnimationMeta) => void): View;
	static getSwitchAnimation(): Function|null;

	static getActiveViewOptions(): object|null;
	static hasActiveViewOption(name: string): boolean;
	static getActiveViewOption(name: string): string|null;
	static setActiveViewOption(name: string, value: any):View;

	static addSwitchInterceptor(interceptor: (ViewSwitchMeta) => boolean): View;
	static getSwitchInterceptors(): ((ViewSwitchMeta) => boolean)[];

	/**
	 * @deprecated
	 */
	static passBy(id: string, namespace?: string): View;
	static navBy(id: string, namespace?: string): View;
	static changeBy(id: string, namespace?: string): View;

	static navTo(id: string, ctrl?: ViewSwitchCtrl): View;
	static navTo(id: string, namespace?: string, ctrl?: ViewSwitchCtrl): View;
	static navTo(view: ViewClass, ctrl?: ViewSwitchCtrl): View;
	static changeTo(id: string, ctrl?: ViewSwitchCtrl): View;
	static changeTo(id: string, namespace?: string, ctrl?: ViewSwitchCtrl): View;
	static changeTo(view: ViewClass, ctrl?: ViewSwitchCtrl): View;
	static back(ctrl?: ViewBackForwardCtrl): View;
	static forward(ctrl?: ViewBackForwardCtrl): View;

	static setDocumentTitle(title?: string): View;

	static ifCanGoBack(): boolean;
	static setNoViewToNavBackAction(action: Function): View;

	/**
	 * @deprecated
	 */
	static onceHistoryBack(callback: Function): View;

	static reDoLayout(): View;

	/**
	 * @deprecated
	 */
	static getChainedHandleByName(name: string): ChainedHandleClass;

	static beforeInit(callback: Function): View;
	static ready(callback: Function): View;

	/**
	 * @deprecated
	 */
	static setInitializer(initializer: (init: Function) => void, execTime?: string): View;

	static init(): View;
}