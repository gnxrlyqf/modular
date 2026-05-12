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

		if (this.port == "freq")
			return (this.input as any).getFrequencySignal?.();
		if (this.port == "trigger")
			return (this.input as any).getTriggerSignal?.();
		return (this.input?.getSignal());
	}
}

export default Patch;