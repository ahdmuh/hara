import { motion } from "motion/react";
import type { ReactNode } from "react";
import { RISE, STAGGER } from "./Motion";

interface IRevealProps
{
    children: ReactNode;
    className?: string;
    as?: "div" | "section" | "ul" | "ol" | "li" | "header";
    group?: boolean;
    id?: string;
}

export default function Reveal({ children, className, as = "div", group = false, id }: IRevealProps)
{
    const Component = motion[as];
    return (
        <Component
            id={id}
            className={className}
            variants={group ? STAGGER : RISE}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        >
            {children}
        </Component>
    );
}

export function RevealItem({ children, className, as = "div" }: Omit<IRevealProps, "group">)
{
    const Component = motion[as];
    return (
        <Component className={className} variants={RISE}>
            {children}
        </Component>
    );
}
