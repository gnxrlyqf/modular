import { Module } from "../Abstractions";

class Patch {
	input: Module | undefined;

	constructor(input: Module | undefined) {
		this.input = input;
	}

	getSignal() {
		return (this.input?.getSignal());
	}
}

export default Patch;