import { useState } from "react";
import { useEffect } from "react";
import getSensorsWithAnomalies from "../../../services/requisicoes/nesaApi/getSensorsWithAnomalies";

const DropdownSensor = ({setValue, structure_id}) => {
    const [selectedOption, setSelectedOption] = useState(false)
    const [sensors, setSensors] = useState([])

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        getSensorsWithAnomalies(structure_id).then((response) =>{
            setSensors(response.data.sensors)
        });
    }, [structure_id])

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        setValue(selectedOption)
    }, [selectedOption, setValue]);

    return (
        <div className="drop-down">
            <span>Selecione o instrumento: </span>
            <select id="state" defaultValue={selectedOption} onChange={(event) => setSelectedOption(event.target.value)}>
                <option value=""></option>
                {sensors.map((sensor) => {
                    const {id, sensor_name, has_anomaly} = sensor;
                    return (<option key={id} value={id} 
                        style={has_anomaly ? {color: "red"} : {color: "#078E9C"}}>
                            {`${sensor_name}`}
                        </option>);
                })}
            </select>
        </div>
    )
};

export default DropdownSensor;