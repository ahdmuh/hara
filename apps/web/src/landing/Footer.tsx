import { ArrowRight } from "../ui/Icons";
import { portalHref } from "../Site";
import { LinkButton } from "../ui/Button";
import Reveal from "../ui/Reveal";
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
                    <p>A University of Calgary, Schulich School of Engineering capstone project.</p>
                    <div className={styles.links}>
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                        <LinkButton to={portalHref("/login")} variant="light" size="small" iconAfter={<ArrowRight />}>Clinician Login</LinkButton>
                    </div>
                </div>
            </div>
        </footer>
    );
}
