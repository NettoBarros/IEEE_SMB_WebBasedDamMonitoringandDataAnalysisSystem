import { useState } from "react";
import "./toggle.css";

const Toggle = ({insertExitDirection, label, activated}) => {
    const [jae, setJae] = useState(activated)
return(
    <>
        <button key={label} type="button" className="btn exit-direction-button" onClick={(event) => {insertExitDirection(event); setJae(!jae);}}
        style={jae ? {backgroundColor: "#078E9C", color: "#FFF", border: "2px solid #078E9C"} : {backgroundColor: "#FFF", color: "#078E9C", border: "2px solid #078E9C"}}>
            {label}
        </button>
    </>
    );
}

export default Toggle