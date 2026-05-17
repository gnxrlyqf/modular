import { Module } from "../Abstractions";

class Patch {
	input: Module | undefined;
	port: string;

	constructor(input: Module | undefined, port: string = "output") {
		this.input = input;
		this.port = port;
	}

	getSignal() {
		if (!this.input) return undefined;

		// Prefer specialized signals but fall back to the module's generic
		// `getSignal()` if the specialized accessor isn't implemented.
		if (this.port == "freq")
			return (this.input as any).getFrequencySignal?.() ?? (this.input as any).getSignal?.();
		if (this.port == "trigger")
			return (this.input as any).getTriggerSignal?.() ?? (this.input as any).getSignal?.();
		return (this.input as any).getSignal?.();
	}
}

export default Patch;