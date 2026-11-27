import calm from "./assets/audio/calming-yoga.mp3";
import jazz from "./assets/audio/rainy-night-jazz.mp3";

const MAXIMUM_LEVEL = 0.1;
const FADE_SECONDS = 1.6;
const INTRO_SECONDS = 4.5;
const THEME_SECONDS = 2.5;
const CROSSFADE_SECONDS = 4;
const TICK_MILLISECONDS = 50;
const VOLUME_KEY = "hara.volume";
const DEFAULT_VOLUME = 6;

export const VOLUME_STEPS = 10;

export function storedVolume(): number
{
    const value = Number(window.localStorage.getItem(VOLUME_KEY) ?? DEFAULT_VOLUME);
    return Number.isFinite(value) ? Math.min(VOLUME_STEPS, Math.max(0, Math.round(value))) : DEFAULT_VOLUME;
}

export function saveVolume(level: number): void
{
    window.localStorage.setItem(VOLUME_KEY, String(level));
}

interface IDeck
{
    element: HTMLAudioElement;
    fade: number;
}

export type Theme = "onboarding" | "home";

interface ITrack
{
    source: string;
    gain: number;
    head: number;
    tail: number;
}

const THEMES: Record<Theme, ITrack> = {
    onboarding: { source: calm, gain: 4.2, head: 0.7, tail: 1.6 },
    home: { source: jazz, gain: 1, head: 0, tail: 0 },
};

class LoopPlayer
{
    private decks: IDeck[] = [];
    private current = 0;
    private volume = DEFAULT_VOLUME / VOLUME_STEPS;
    private level = 0;
    private target = 0;
    private timer = 0;
    private playing = false;
    private fadeSeconds = INTRO_SECONDS;

    constructor(private readonly track: ITrack)
    {
    }

    setVolume(level: number): void
    {
        this.volume = Math.min(1, Math.max(0, level));
        if (this.playing)
        {
            this.target = this.volume * MAXIMUM_LEVEL;
        }
    }

    play(fadeSeconds?: number): void
    {
        this.ensure();
        if (fadeSeconds)
        {
            this.fadeSeconds = fadeSeconds;
        }
        if (this.playing)
        {
            return;
        }
        this.playing = true;
        this.target = this.volume * MAXIMUM_LEVEL;
        this.decks.forEach((deck, index) =>
        {
            if (index === this.current || deck.fade > 0)
            {
                void deck.element.play().catch(() => undefined);
            }
        });
        window.clearInterval(this.timer);
        this.timer = window.setInterval(() => this.tick(), TICK_MILLISECONDS);
    }

    pause(fadeSeconds = FADE_SECONDS): void
    {
        if (!this.playing)
        {
            return;
        }
        this.fadeSeconds = fadeSeconds;
        this.playing = false;
        this.target = 0;
    }

    close(): void
    {
        window.clearInterval(this.timer);
        this.decks.forEach(deck => deck.element.pause());
        this.decks = [];
        this.playing = false;
    }

    private ensure(): void
    {
        if (this.decks.length)
        {
            return;
        }
        this.decks = [0, 1].map(() =>
        {
            const element = new Audio(this.track.source);
            element.preload = "auto";
            element.volume = 0;
            return { element, fade: 0 };
        });
        const first = this.decks[0];
        if (first)
        {
            first.fade = 1;
        }
    }

    private tick(): void
    {
        const step = TICK_MILLISECONDS / 1000;
        const ramp = (MAXIMUM_LEVEL * step) / this.fadeSeconds;
        this.level = this.level < this.target ? Math.min(this.target, this.level + ramp) : Math.max(this.target, this.level - ramp);
        if (this.level === this.target && this.target > 0)
        {
            this.fadeSeconds = FADE_SECONDS;
        }
        const active = this.decks[this.current];
        const other = this.decks[1 - this.current];
        if (!active || !other)
        {
            return;
        }
        const duration = active.element.duration;
        const fadeAt = duration - this.track.tail - CROSSFADE_SECONDS;
        if (this.playing && Number.isFinite(duration) && active.element.currentTime >= fadeAt && other.fade === 0)
        {
            other.element.currentTime = this.track.head;
            other.fade = 0.0001;
            void other.element.play().catch(() => undefined);
        }
        if (other.fade > 0)
        {
            const amount = step / CROSSFADE_SECONDS;
            other.fade = Math.min(1, other.fade + amount);
            active.fade = Math.max(0, active.fade - amount);
            if (active.fade === 0)
            {
                active.element.pause();
                this.current = 1 - this.current;
            }
        }
        this.decks.forEach((deck) =>
        {
            deck.element.volume = Math.min(1, this.level * this.track.gain * deck.fade);
        });
        if (!this.playing && this.level === 0)
        {
            this.decks.forEach(deck => deck.element.pause());
            window.clearInterval(this.timer);
        }
    }
}

export class Music
{
    private readonly players = new Map<Theme, LoopPlayer>();
    private theme: Theme = "onboarding";
    private active = false;
    private volume = DEFAULT_VOLUME / VOLUME_STEPS;

    setVolume(level: number): void
    {
        this.volume = level;
        this.players.forEach(player => player.setVolume(level));
    }

    setTheme(theme: Theme): void
    {
        if (theme === this.theme)
        {
            return;
        }
        const previous = this.theme;
        this.theme = theme;
        if (this.active)
        {
            this.player(previous).pause(THEME_SECONDS);
            this.player(theme).play(THEME_SECONDS);
        }
    }

    play(): void
    {
        this.active = true;
        this.player(this.theme).play();
    }

    pause(): void
    {
        this.active = false;
        this.players.forEach(player => player.pause());
    }

    close(): void
    {
        this.players.forEach(player => player.close());
        this.players.clear();
    }

    private player(theme: Theme): LoopPlayer
    {
        let player = this.players.get(theme);
        if (!player)
        {
            player = new LoopPlayer(THEMES[theme]);
            player.setVolume(this.volume);
            this.players.set(theme, player);
        }
        return player;
    }
}

export const music = new Music();

import.meta.hot?.dispose(() => music.close());
