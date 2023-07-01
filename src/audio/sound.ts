export class Sound {
	actx: AudioContext;

	soundNode: AudioBufferSourceNode;
	volumeNode: GainNode;
	panNode: StereoPannerNode;
	convolverNode: ConvolverNode;
	delayNode: DelayNode;
	feedbackNode: GainNode;
	filterNode: BiquadFilterNode;

	playing: boolean = false;
	playbackRate: number = 1;
	randomPitch: boolean = true;

	reverb: boolean = false;
	reverbImpulse!: AudioBuffer | null;

	echo: boolean = false;
	delay: number = 0.3;
	feedback: number = 0.3;
	filter: number = 0;

	constructor(
		public buffer: AudioBuffer,
		public loop: boolean = false,
		public startTime: number = 0,
		public startOffset: number = 0
	) {
		this.actx = new AudioContext();

		this.volumeNode = this.actx.createGain();
		this.panNode = this.actx.createStereoPanner();
		this.convolverNode = this.actx.createConvolver();
		this.delayNode = this.actx.createDelay();
		this.feedbackNode = this.actx.createGain();
		this.filterNode = this.actx.createBiquadFilter();

		this.soundNode = this.actx.createBufferSource();
	}

	play() {
		if (this.playing) return;

		this.startTime = this.actx.currentTime;

		this.soundNode = this.actx.createBufferSource();
		this.soundNode.buffer = this.buffer;

		this.soundNode.connect(this.volumeNode);

		if (!this.reverb) this.volumeNode.connect(this.panNode);
		else {
			this.volumeNode.connect(this.convolverNode);
			this.convolverNode.connect(this.panNode);
			this.convolverNode.buffer = this.reverbImpulse;
		}

		this.panNode.connect(this.actx.destination);

		if (this.echo) {
			this.feedbackNode.gain.value = this.feedback;
			this.delayNode.delayTime.value = this.delay;
			this.filterNode.frequency.value = this.filter;
			this.delayNode.connect(this.feedbackNode);
			if (this.filter > 0) {
				this.feedbackNode.connect(this.filterNode);
				this.filterNode.connect(this.delayNode);
			} else {
				this.feedbackNode.connect(this.delayNode);
			}
			this.volumeNode.connect(this.delayNode);
			this.delayNode.connect(this.panNode);
		}

		this.soundNode.loop = this.loop;
		this.soundNode.playbackRate.value = this.playbackRate;

		this.soundNode.start(this.startTime, this.startOffset % this.buffer.duration);
		this.playing = true;
	}

	playFrom(t: number) {
		if (this.playing) this.soundNode.stop(this.actx.currentTime);

		this.startOffset = t;
		this.play();
	}

	pause() {
		if (!this.playing) return;

		this.soundNode.stop(this.actx.currentTime);
		this.startOffset += this.actx.currentTime - this.startTime;
		this.playing = false;

		return this.startOffset;
	}

	restart() {
		if (this.playing) this.soundNode.stop(this.actx.currentTime);

		this.startOffset = 0;
		this.startTime = 0;
		this.play();
	}

	setEcho(on: boolean, delay: number = 0.3, feedback: number = 0.3, filter: number = 0) {
		this.delay = delay;
		this.feedback = feedback;
		this.filter = filter;
		this.echo = on;
	}

	setReverb(on: boolean, duration: number = 2, decay: number = 2, reverse: boolean = false) {
		const length = this.actx.sampleRate * duration;
		const impulse = this.actx.createBuffer(2, length, this.actx.sampleRate);

		const left = impulse.getChannelData(0);
		const right = impulse.getChannelData(1);

		for (let i = 0; i < length; i++) {
			const n = reverse ? length - i : i;

			left[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
			right[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
		}

		this.reverbImpulse = impulse;
		this.reverb = on;
	}

	get volume() {
		return this.volumeNode.gain.value;
	}

	set volume(v: number) {
		this.volumeNode.gain.value = v;
	}

	get pan() {
		return this.panNode.pan.value;
	}

	set pan(v: number) {
		this.panNode.pan.value = v;
	}

	onDestroy(): void {
		this.pause();
	}
}
