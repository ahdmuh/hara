import { portalHref } from "../Site";
import { LinkButton } from "../ui/Button";
import { Login, Mail } from "../ui/Icons";
import Reveal from "../ui/Reveal";
import UCalgary from "../ui/UCalgary";
import Wordmark from "../ui/Wordmark";
import styles from "./Footer.module.css";
import { CONTACT_EMAIL } from "./TakePart";

export default function Footer()
{
    return (
        <footer className={styles.footer}>
            <div className={styles.panel}>
                <Reveal className={styles.mark}>
                    <Wordmark />
                </Reveal>
                <div className={styles.row}>
                    <p>
                        A capstone project from the Schulich School of Engineering at the
                        <UCalgary className={styles.ucalgary} />
                    </p>
                    <div className={styles.links}>
                        <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>
                            <Mail aria-hidden="true" />
                            <span>{CONTACT_EMAIL}</span>
                        </a>
                        <LinkButton to={portalHref("/login")} variant="light" size="small" icon={<Login />}>Portal</LinkButton>
                    </div>
                </div>
            </div>
        </footer>
    );
}
