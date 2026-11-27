import { useAnimate } from "motion/react";

const SHAKE = { x: [0, -10, 10, -6, 6, 0] };

export function useShake<TElement extends Element>()
{
    const [scope, animate] = useAnimate<TElement>();
    const shake = (selector?: string) =>
    {
        const target = selector ? scope.current?.querySelector(selector) : scope.current;
        if (target)
        {
            void animate(target, SHAKE, { duration: 0.4 });
        }
    };
    return [scope, shake] as const;
}
