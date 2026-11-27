import { useState } from "react";
import { matchPath, usePath } from "../Router";
import Button from "../ui/Button";
import { Key } from "../ui/Icons";
import PatientDetail from "./PatientDetail";
import PatientList from "./PatientList";
import PinDialog from "./PinDialog";
import Shell from "./Shell";

export default function Portal()
{
    const path = usePath();
    const [pinOpen, setPinOpen] = useState(false);
    const detail = matchPath("/patients/:id", path);

    return (
        <>
            <Shell
                role="clinician"
                home="/patients"
                page={path}
                menu={close => (
                    <Button
                        icon={<Key />}
                        role="menuitem"
                        onClick={() =>
                        {
                            close();
                            setPinOpen(true);
                        }}
                    >
                        Link Patient
                    </Button>
                )}
            >
                {() => (detail?.id ? <PatientDetail id={detail.id} /> : <PatientList />)}
            </Shell>
            <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} />
        </>
    );
}
