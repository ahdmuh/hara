const MAXIMUM_LINE_LENGTH = 256;

export class LineBuffer
{
    private pending = "";

    push(chunk: string): string[]
    {
        const parts = (this.pending + chunk).split("\n");
        this.pending = parts.pop() ?? "";
        if (this.pending.length > MAXIMUM_LINE_LENGTH)
        {
            this.pending = "";
        }
        return parts.map(part => part.replace(/\r$/, "")).filter(part => part.length > 0 && part.length <= MAXIMUM_LINE_LENGTH);
    }
}
