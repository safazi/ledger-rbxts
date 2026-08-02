interface Future<T extends unknown[]> {
	Wait(timeout?: number): LuaTuple<T>;
	Happened(wait?: boolean): boolean;
}

interface Observer<T> {
	Connect(callback: (value: T) => void): RBXScriptConnection;
}

export type Reason =
	| "Refused"
	| "Busy"
	| "Spent"
	| "Unresolved"
	| "Closed"
	| "Backlog"
	| "Full"
	| "Invalid"
	| "Behind";

export type KeyLike = number | string;
export type KeysMode = "Player" | "String";

export interface Op {
	Id: string;
	Kind: string;
	[key: string]: unknown;
}

export type Reducer<S> = (state: S, op: Op) => S | undefined;

export type Migration =
	| ((state: unknown) => unknown)
	| { Apply: (state: unknown) => unknown; Compatible?: boolean };

export interface HistoryEntry {
	Version: string;
	At: number;
	Deleted: boolean;
}

export interface TxLeg {
	Store?: Store<unknown>;
	UserId?: number;
	Key?: string;
	Kind: string;
	Fields?: Record<string, unknown>;
}

export interface Config<D> {
	Name: string;
	Reducer: (state: D, op: Op) => unknown;
	Default: D;
	Balance?: string;
	Migrations?: Migration[];
	Keys?: KeysMode;
	OnLoadFailed?: (player: Player, why: Reason) => boolean;
}

export interface Session<S> {
	readonly LogSize: number;
	readonly LogBytes: number;

	Get(this: Session<S>): S;
	Apply(
		this: Session<S>,
		kind: string,
		fields?: Record<string, unknown>,
	): LuaTuple<[boolean, Reason?]>;
	Commit(
		this: Session<S>,
		kind: string,
		fields?: Record<string, unknown>,
	): Future<[boolean, Reason?]>;
	CommitOp(this: Session<S>, op: Op): Future<[boolean, Reason?]>;
	Flush(this: Session<S>): Future<[boolean, Reason?]>;
	Compact(this: Session<S>): Future<[boolean, Reason?]>;
	Release(this: Session<S>): Future<[boolean, Reason?]>;
	Observe(this: Session<S>): Observer<S>;
	DidApply(this: Session<S>, id: string): boolean;
}

export interface Store<D> {
	Load(this: Store<D>, player: Player): void;
	Unload(this: Store<D>, player: Player): void;
	Get(this: Store<D>, player: Player): Session<D> | undefined;
	Expect(this: Store<D>, player: Player): Session<D>;
	IsLoaded(this: Store<D>, player: Player): boolean;
	WaitForLoaded(this: Store<D>, player: Player): Session<D> | undefined;
	Read(this: Store<D>, player: Player): D | undefined;
	Peek(this: Store<D>, key: KeyLike): Future<[D | undefined, Reason?]>;
	Inspect(
		this: Store<D>,
		key: KeyLike,
	): Future<[object | undefined, Reason?]>;
	DidApply(
		this: Store<D>,
		key: KeyLike,
		id: string,
	): Future<[boolean | undefined, Reason?]>;
	History(
		this: Store<D>,
		key: KeyLike,
		limit?: number,
	): Future<[HistoryEntry[] | undefined, Reason?]>;
	PeekVersion(
		this: Store<D>,
		key: KeyLike,
		version: string,
	): Future<[D | undefined, Reason?]>;
	Edit(
		this: Store<D>,
		key: KeyLike,
		kind: string,
		fields?: Record<string, unknown>,
	): Future<[boolean, Reason?]>;
	Transfer(
		this: Store<D>,
		from: KeyLike,
		to: KeyLike,
		amount: number,
		id?: string,
	): Future<[boolean, Reason?]>;
	Tx(this: Store<D>, id: string, legs: TxLeg[]): Future<[boolean, Reason?]>;
	Resettle(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	RecoverTransfers(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	ClearDelivered(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	Reset(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	Erase(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	Destroy(this: Store<D>): void;
}

export interface MockService {
	GetDataStore(this: MockService, name: string, scope?: string): object;
	GetRequestBudgetForRequestType(
		this: MockService,
		kind: Enum["DataStoreRequestType"],
	): number;
	Clear(this: MockService): void;
}

export interface MockOptions {
	Players?: number;
	CCU?: number;
	Throttled?: boolean;
}

export interface ReasonMap {
	readonly Refused: "Refused";
	readonly Busy: "Busy";
	readonly Spent: "Spent";
	readonly Unresolved: "Unresolved";
	readonly Closed: "Closed";
	readonly Backlog: "Backlog";
	readonly Full: "Full";
	readonly Invalid: "Invalid";
	readonly Behind: "Behind";
}

export declare const Reason: ReasonMap;
export declare function New<D>(options: Config<D>): Store<D>;
export declare function UseMock(options?: MockOptions): MockService;
export declare function UseReal(): void;
export declare function UseClock(reads?: () => number): void;
export declare function Sweep(): void;
export declare function CloseAll(): void;
