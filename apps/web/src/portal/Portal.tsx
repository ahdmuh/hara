import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { matchPath, usePath } from "../Router";
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
    useQuery(api.Clinician.patients);

    return (
        <>
            <Shell
                role="clinician"
                home="/patients"
                page={path}
                action={{ label: "Link Patient", icon: <Key />, onClick: () => setPinOpen(true) }}
            >
                {() => (
                    <>
                        {detail?.id ? <PatientDetail id={detail.id} /> : <PatientList />}
                        <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} />
                    </>
                )}
            </Shell>
        </>
    );
}
