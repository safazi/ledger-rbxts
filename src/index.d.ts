/** A handle returned by Observer.Subscribe. */
interface Connection {
	Connected: boolean;
	Disconnect(this: Connection): void;
}

/** A lazy value stream you can subscribe to and transform. */
interface Observer<T> {
	Subscribe(this: Observer<T>, listener: (value: T) => void): Connection;

	Use<U>(this: Observer<T>, middleware: (value: T, emit: (out: U) => void) => void): Observer<U>;
	Map<U>(this: Observer<T>, transform: (value: T) => U): Observer<U>;
	Filter(this: Observer<T>, predicate: (value: T) => boolean): Observer<T>;
	Changed(this: Observer<T>, equals?: (a: T, b: T) => boolean): Observer<T>;

	Destroy(this: Observer<T>): void;
}

/**
 * An eager async result. Runs its callback on a new thread; grab the result
 * with :Wait(). `T` is a tuple of the return values.
 */
interface Future<T extends unknown[]> {
	/** Yields until the future resolves, then returns its values. */
	Wait(this: Future<T>, timeout?: number): LuaTuple<T>;
	/** Returns whether the future has already resolved. Pass `true` to wait for it. */
	Happened(this: Future<T>, wait?: boolean): boolean;
}

/** The internal log record shape returned by Store.Inspect. */
export interface LogRecord<S> {
	Snapshot?: S;
	Ops: Op[];
	Seen: string[];
	Version?: number;
	Floor?: number;
	Envelope?: number;
	Erased?: number;
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
	Fields?: { [key: string]: unknown };
}

export interface Config<D> {
	Name: string;
	Reducer: (state: D, op: Op) => unknown;
	Default: D;
	/** Name of a numeric field in state used as the transferable balance, e.g. `"Gold"`. Required for Transfer/RecoverTransfers. */
	Balance?: string;
	Migrations?: Migration[];
	Keys?: KeysMode;
	/** Only valid when Keys is "Player". */
	OnLoadFailed?: (player: Player, why: Reason) => boolean;
}

/** A live in-memory session for a loaded key. All methods are colon-style. */
export interface Session<S> {
	readonly LogSize: number;
	readonly LogBytes: number;

	Get(this: Session<S>): S;
	Apply(this: Session<S>, kind: string, fields?: { [key: string]: unknown }): LuaTuple<[boolean, Reason?]>;
	Commit(this: Session<S>, kind: string, fields?: { [key: string]: unknown }): Future<[boolean, Reason?]>;
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
	Inspect(this: Store<D>, key: KeyLike): Future<[LogRecord<D> | undefined, Reason?]>;
	DidApply(this: Store<D>, key: KeyLike, id: string): Future<[boolean | undefined, Reason?]>;
	History(this: Store<D>, key: KeyLike, limit?: number): Future<[HistoryEntry[] | undefined, Reason?]>;
	PeekVersion(this: Store<D>, key: KeyLike, version: string): Future<[D | undefined, Reason?]>;
	Edit(this: Store<D>, key: KeyLike, kind: string, fields?: { [key: string]: unknown }): Future<[boolean, Reason?]>;
	Transfer(this: Store<D>, from: KeyLike, to: KeyLike, amount: number, id?: string): Future<[boolean, Reason?]>;
	Tx(this: Store<D>, id: string, legs: TxLeg[]): Future<[boolean, Reason?]>;
	Resettle(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	RecoverTransfers(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	ClearDelivered(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	Reset(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	Erase(this: Store<D>, key: KeyLike): Future<[boolean, Reason?]>;
	Destroy(this: Store<D>): void;
}

export interface MockOptions {
	Players?: number;
	CCU?: number;
	Throttled?: boolean;
}

export interface MockService {
	GetDataStore(this: MockService, name: string, scope?: string): object;
	GetRequestBudgetForRequestType(this: MockService, kind: Enum["DataStoreRequestType"]): number;
	Clear(this: MockService): void;
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

