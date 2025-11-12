import { useState, useEffect } from "react";
import getStructures from "../../../services/requisicoes/nesaApi/getStructures";
import "./dropDownBarragem.css";

const DropdownBarragem = ({setValue, setSensorId=()=>({})}) => {
    const [structures, setStructures] = useState([]);
    const [selectedOption, setSelectedOption] = useState(false)

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        getStructures().then((response)=>{
            setStructures(response.data);
        });
    }, []);

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        setValue(selectedOption)
        setSensorId(false)
    }, [selectedOption, setValue, setSensorId]);

    return (
        <div className="drop-down">
            <span>Selecione a estrutura:</span>
            <select id="state" defaultValue={selectedOption} onChange={(event) => setSelectedOption(event.target.value)}>
                <option value=""></option>
                {structures.map((structure) => {
                    const {id, structure_name} = structure;
                    return (<option key={id} value={id}>{`${structure_name}`}</option>);
                })}
            </select>
        </div>
    )
};

export default DropdownBarragem;