export type Sound = "move" | "select" | "back" | "open" | "insert" | "error" | "type";

const MAXIMUM_GAIN = 0.5;

class Sounds
{
    private context: AudioContext | null = null;
    private output: GainNode | null = null;
    private noise: AudioBuffer | null = null;
    private volume = 0.6;
    private last = new Map<Sound, number>();

    setVolume(level: number): void
    {
        this.volume = Math.min(1, Math.max(0, level));
        if (this.output && this.context)
        {
            this.output.gain.setTargetAtTime(this.volume * MAXIMUM_GAIN, this.context.currentTime, 0.05);
        }
    }

    play(sound: Sound): void
    {
        const context = this.ensure();
        void context.resume();
        const now = context.currentTime;
        if (now - (this.last.get(sound) ?? -1) < (sound === "type" ? 0.015 : 0.05))
        {
            return;
        }
        this.last.set(sound, now);
        switch (sound)
        {
            case "move":
                this.tone(1760, now, 0.05, 0.05, "sine");
                break;
            case "select":
                this.tone(880, now, 0.12, 0.09, "sine");
                this.tone(1318.5, now + 0.06, 0.18, 0.08, "sine");
                break;
            case "back":
                this.tone(1046.5, now, 0.1, 0.07, "sine");
                this.tone(698.5, now + 0.06, 0.16, 0.07, "sine");
                break;
            case "open":
                [783.99, 987.77, 1174.66].forEach((pitch, index) => this.tone(pitch, now + index * 0.05, 0.3, 0.06, "sine"));
                break;
            case "insert":
                this.click(now, 0.18);
                this.thunk(now + 0.02);
                this.click(now + 0.16, 0.12);
                [659.25, 987.77].forEach((pitch, index) => this.tone(pitch, now + 0.32 + index * 0.08, 0.35, 0.07, "sine"));
                break;
            case "type":
                this.click(now, 0.05 + Math.random() * 0.02);
                this.tone(2200 + Math.random() * 500, now, 0.03, 0.012, "sine");
                break;
            case "error":
                this.tone(329.63, now, 0.14, 0.07, "triangle");
                this.tone(293.66, now + 0.1, 0.2, 0.07, "triangle");
                break;
        }
    }

    playedRecently(sound: Sound, seconds = 0.1): boolean
    {
        const at = this.last.get(sound);
        return !!this.context && at !== undefined && this.context.currentTime - at < seconds;
    }

    close(): void
    {
        void this.context?.close();
        this.context = null;
    }

    private ensure(): AudioContext
    {
        if (this.context)
        {
            return this.context;
        }
        const context = new AudioContext();
        const output = context.createGain();
        output.gain.value = this.volume * MAXIMUM_GAIN;
        output.connect(context.destination);
        const noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.1), context.sampleRate);
        noise.getChannelData(0).forEach((_, index, data) =>
        {
            data[index] = Math.random() * 2 - 1;
        });
        this.context = context;
        this.output = output;
        this.noise = noise;
        return context;
    }

    private tone(pitch: number, time: number, length: number, peak: number, type: OscillatorType): void
    {
        if (!this.context || !this.output)
        {
            return;
        }
        const oscillator = this.context.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = pitch;
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
        oscillator.connect(gain);
        gain.connect(this.output);
        oscillator.start(time);
        oscillator.stop(time + length + 0.02);
    }

    private click(time: number, peak: number): void
    {
        if (!this.context || !this.output || !this.noise)
        {
            return;
        }
        const source = this.context.createBufferSource();
        source.buffer = this.noise;
        const filter = this.context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 3200;
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(peak, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        source.start(time);
        source.stop(time + 0.04);
    }

    private thunk(time: number): void
    {
        if (!this.context || !this.output)
        {
            return;
        }
        const oscillator = this.context.createOscillator();
        oscillator.frequency.setValueAtTime(180, time);
        oscillator.frequency.exponentialRampToValueAtTime(70, time + 0.12);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
        oscillator.connect(gain);
        gain.connect(this.output);
        oscillator.start(time);
        oscillator.stop(time + 0.18);
    }
}

export const sounds = new Sounds();

import.meta.hot?.dispose(() => sounds.close());
