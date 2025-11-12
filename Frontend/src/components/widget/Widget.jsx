import React, { useState } from "react";
import "./widget.css";
import WaterDamageIcon from '@mui/icons-material/WaterDamage';
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import TagIcon from '@mui/icons-material/Tag';
import SensorsIcon from '@mui/icons-material/Sensors';
import { useEffect } from "react";

const Widget = ({type, information}) => {
    let structure;
    const [data, setData] = useState({})

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
      setData(information)
    }, [data, information])

    switch (type) {
        case "user":
          structure = {
            upperLeft: "Usuário: " + data?.first_name,
            centralLeft: data?.email,
            bottonLeft: data?.role,
            upperRight: data?.registration,
            upperRightIcon: (
                <TagIcon
                  className="iconn"
                  style={{
                    color: "crimson"
                  }}
                />
              ),
            bottonRightIcon: (
              <PersonOutlinedIcon
                className="iconn"
                style={{
                    color: "crimson",
                    backgroundColor: "rgba(255, 0, 0, 0.2)",
                  }}
              />
            ),
          };
          break;
        case "structure":
          structure = {
            upperLeft: "Barragem: " + data?.structure_name,
            centralLeft: "Instrumentos: " + data?.sensors?.length,
            bottonLeft: "Localização: " + data?.structure_location,
            upperRight: data?.id,
            upperRightIcon: (
                <TagIcon
                  className="iconn"
                  style={{
                    color: "#078E9C"
                  }}
                />
              ),
            bottonRightIcon: (
              <WaterDamageIcon
                className="iconn"
                style={{
                    color: "#078E9C",
                    backgroundColor: "LightBlue",
                  }}
              />
            ),
          };
          break;
        case "sensor":
          structure = {
            upperLeft: "Instrumento: " + data?.sensor_name,
            centralLeft: "Medições: " + data?.measurements?.length,
            bottonLeft: "Modelo: " + data?.sensor_model,
            upperRight: data?.id,
            upperRightIcon: (
                <TagIcon
                  className="iconn"
                  style={{
                    color: "green"
                  }}
                />
              ),
            bottonRightIcon: (
              <SensorsIcon
                className="iconn"
                style={{ backgroundColor: "rgba(0, 128, 0, 0.2)", color: "green" }}
              />
            ),
          };
          break;
        default:
          break;
      }

    return(
        <div className="widget">
            <div className="left">
                <span className="upperLeft">{structure.upperLeft}</span>
                <span className="centralLeft">
                    {structure.centralLeft}
                </span>
                <span className="bottonLeft">{structure.bottonLeft}</span>
            </div>
            <div className="right">
                <div className="upperRight">
                    {structure.upperRight}
                    {structure.upperRightIcon}
                </div>
                {structure.bottonRightIcon}
            </div>
        </div>
    )
}

export default Widget