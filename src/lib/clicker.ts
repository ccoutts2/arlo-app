// A training clicker: a short, sharp "click" synthesised with Web Audio (no sound file to load).
let ctx: AudioContext | null = null;

export function click() {
	ctx ??= new (
		window.AudioContext ||
		(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
	)();
	if (ctx.state === 'suspended') void ctx.resume(); // iOS: audio starts on a tap
	const t = ctx.currentTime;
	// Two quick transients, like the metal tongue of a box clicker going down and up.
	for (const [offset, freq] of [
		[0, 3200],
		[0.045, 2400]
	] as const) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(freq, t + offset);
		gain.gain.setValueAtTime(0.0001, t + offset);
		gain.gain.exponentialRampToValueAtTime(0.5, t + offset + 0.002);
		gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.025);
		osc.connect(gain).connect(ctx.destination);
		osc.start(t + offset);
		osc.stop(t + offset + 0.03);
	}
}
