import Reveal, { RevealItem } from "../ui/Reveal";
import styles from "./Team.module.css";

const GROUPS = [
    {
        name: "Software",
        people: [
            { name: "Muhammad Ahmed", role: "Project Manager" },
            { name: "Matthew Roxas", role: "Software Lead" },
            { name: "Wilson Zheng", role: "Data and Integration Lead" },
        ],
    },
    {
        name: "Mechanical",
        people: [
            { name: "Jaden Destine", role: "Mechanical Lead" },
            { name: "Rohan Jackson", role: "Electronics and Mechanical System Integration Lead" },
            { name: "Ali Zaidi", role: "Controls Systems Integration Lead" },
        ],
    },
    {
        name: "Counsel",
        people: [
            { name: "Dr. Junho Park", role: "Advisor" },
            { name: "Hourieh Jamalidinan", role: "Teaching Assistant" },
            { name: "Mujtaba Khawaja", role: "Support" },
        ],
    },
];

function initials(name: string): string
{
    return name.replace("Dr. ", "").split(" ").map(part => part[0]).join("").slice(0, 2);
}

export default function Team()
{
    return (
        <section className={styles.team} id="team">
            <Reveal className={styles.head}>
                <h2>The Team</h2>
            </Reveal>
            <div className={styles.groups}>
                {GROUPS.map(group => (
                    <Reveal key={group.name} className={styles.group} group>
                        <RevealItem as="header">
                            <h3>{group.name}</h3>
                        </RevealItem>
                        <ul>
                            {group.people.map(person => (
                                <RevealItem as="li" key={person.name} className={styles.person}>
                                    <span className={styles.avatar} aria-hidden="true">{initials(person.name)}</span>
                                    <span className={styles.who}>
                                        <strong>{person.name}</strong>
                                        <span>{person.role}</span>
                                    </span>
                                </RevealItem>
                            ))}
                        </ul>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
