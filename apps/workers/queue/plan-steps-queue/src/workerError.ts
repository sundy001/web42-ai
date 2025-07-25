export class WorkerError extends Error {
	constructor(
		message: string,
		public status: number,
		public details?: unknown,
	) {
		super(message);
	}
}
