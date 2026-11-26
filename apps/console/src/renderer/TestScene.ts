import { Actor, Color, DisplayMode, Engine, Font, Label, vec } from "excalibur";

const SPEED = 240;
const RADIUS = 24;

export function startTestScene(canvasElement: HTMLCanvasElement): Engine
{
    const engine = new Engine({ canvasElement, displayMode: DisplayMode.FillContainer, backgroundColor: Color.Black });

    const ball = new Actor({ pos: vec(100, 100), radius: RADIUS, color: Color.Azure, vel: vec(SPEED, SPEED) });
    ball.on("postupdate", () =>
    {
        if (ball.pos.x < RADIUS || ball.pos.x > engine.drawWidth - RADIUS)
        {
            ball.vel.x = ball.pos.x < RADIUS ? SPEED : -SPEED;
        }
        if (ball.pos.y < RADIUS || ball.pos.y > engine.drawHeight - RADIUS)
        {
            ball.vel.y = ball.pos.y < RADIUS ? SPEED : -SPEED;
        }
    });

    const fps = new Label({ pos: vec(16, 32), font: new Font({ size: 20, color: Color.White }) });
    fps.on("postupdate", () =>
    {
        fps.text = `${Math.round(engine.stats.currFrame.fps)} fps`;
    });

    engine.add(ball);
    engine.add(fps);
    void engine.start();
    return engine;
}
