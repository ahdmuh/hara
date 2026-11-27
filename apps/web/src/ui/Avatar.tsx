import styles from "./Avatar.module.css";

const COLORS = ["#0a84ff", "#1f9d55", "#e07a1f", "#c2410c", "#7c3aed", "#0f766e", "#be185d", "#4b5563", "#2563eb", "#a16207"];

export function initialsOf(name: string): string
{
    return name.replace(/^Dr\.?\s+/, "").split(/\s+/).map(part => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export function colorFor(initials: string): string
{
    const hash = [...initials].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
    return COLORS[hash % COLORS.length] ?? COLORS[0] ?? "#0a84ff";
}

interface IAvatarProps
{
    name: string;
    size?: number;
    className?: string;
}

export default function Avatar({ name, size = 36, className }: IAvatarProps)
{
    const initials = initialsOf(name);
    return (
        <span
            className={`${styles.avatar} ${className ?? ""}`}
            style={{ width: size, height: size, fontSize: size * 0.36, background: colorFor(initials) }}
            aria-hidden="true"
        >
            {initials}
        </span>
    );
}
