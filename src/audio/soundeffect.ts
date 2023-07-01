export class SoundEffect {
	actx: AudioContext;
	oscillator: OscillatorNode;
	wait: number;

	constructor(
		frequencyValue: number,
		attack: number = 0,
		decay: number = 1,
		type: OscillatorType = 'sine',
		volumeValue: number = 1,
		panValue: number = 0,
		wait: number = 0,
		pitchBendAmount: number = 0,
		reverse: boolean = false,
		randomValue: number = 0,
		echo: [number, number, number] | undefined = undefined,
		reverb: [number, number, boolean] | undefined = undefined
	) {
		this.actx = new AudioContext({ latencyHint: 'interactive' });

		this.oscillator = this.actx.createOscillator();
		this.wait = wait;

		const volume = this.actx.createGain();
		const pan = this.actx.createStereoPanner();

		this.oscillator.connect(volume);
		volume.connect(pan);
		pan.connect(this.actx.destination);

		volume.gain.value = volumeValue;
		pan.pan.value = panValue;
		this.oscillator.type = type;

		if (randomValue > 0) {
			this.oscillator.frequency.value =
				Math.floor(
					Math.random() * (frequencyValue + randomValue / 2 - (frequencyValue - randomValue / 2) + 1)
				) +
				(frequencyValue - randomValue / 2);
		} else {
			this.oscillator.frequency.value = frequencyValue;
		}

		if (attack > 0) {
			volume.gain.value = 0;

			volume.gain.linearRampToValueAtTime(0, this.actx.currentTime + wait);
			volume.gain.linearRampToValueAtTime(volumeValue, this.actx.currentTime + wait + attack);
		}
		if (decay > 0) {
			volume.gain.linearRampToValueAtTime(volumeValue, this.actx.currentTime + wait + attack);
			volume.gain.linearRampToValueAtTime(0, this.actx.currentTime + wait + attack + decay);
		}
		if (pitchBendAmount > 0) {
			const f = this.oscillator.frequency.value;

			this.oscillator.frequency.linearRampToValueAtTime(f, this.actx.currentTime + wait);
			this.oscillator.frequency.linearRampToValueAtTime(
				f + (reverse ? -pitchBendAmount : pitchBendAmount),
				this.actx.currentTime + wait + attack + decay
			);
		}

		if (echo) {
			const feedback = this.actx.createGain();
			const delay = this.actx.createDelay();
			const filter = this.actx.createBiquadFilter();

			delay.delayTime.value = echo[0];
			feedback.gain.value = echo[1];
			if (echo[2]) filter.frequency.value = echo[2];

			delay.connect(feedback);
			if (echo[2]) {
				feedback.connect(filter);
				filter.connect(delay);
			} else {
				feedback.connect(delay);
			}

			volume.connect(delay);
			delay.connect(pan);
		}

		if (reverb) {
			const length = this.actx.sampleRate * reverb[0];
			const impulse = this.actx.createBuffer(2, length, this.actx.sampleRate);
			const convolver = this.actx.createConvolver();

			const left = impulse.getChannelData(0);
			const right = impulse.getChannelData(1);

			for (let i = 0; i < length; i++) {
				const n = reverb[2] ? length - i : i;

				left[i] = (Math.random() * 2 - 1) * (1 - n / length) ** reverb[1];
				right[i] = (Math.random() * 2 - 1) * (1 - n / length) ** reverb[1];
			}

			convolver.buffer = impulse;
			volume.connect(convolver);
			convolver.connect(pan);
		}
	}

	play() {
		this.oscillator.start(this.actx.currentTime + this.wait);
	}

	onDestroy() {
		this.oscillator.stop(this.actx.currentTime);
	}
}
