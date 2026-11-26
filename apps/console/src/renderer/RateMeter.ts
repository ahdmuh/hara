const WINDOW_MILLISECONDS = 1000;

export class RateMeter
{
    private readonly timestamps: number[] = [];

    record(timestamp: number): number
    {
        this.timestamps.push(timestamp);
        return this.rate(timestamp);
    }

    rate(now: number): number
    {
        while ((this.timestamps[0] ?? Infinity) <= now - WINDOW_MILLISECONDS)
        {
            this.timestamps.shift();
        }
        return this.timestamps.length * 1000 / WINDOW_MILLISECONDS;
    }
}
