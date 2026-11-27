import shield from "../assets/brands/ucalgary-shield.svg";
import styles from "./UCalgary.module.css";

export default function UCalgary({ className }: { className?: string })
{
    return (
        <span className={`${styles.ucalgary} ${className ?? ""}`}>
            <span className={styles.shield} style={{ maskImage: `url(${shield})`, WebkitMaskImage: `url(${shield})` }} aria-hidden="true" />
            University of Calgary
        </span>
    );
}
