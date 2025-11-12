import React  from "react";
import { useState } from "react";
import homeIcon from "./icon/homeIcon.png";
import dashboardIcon from "./icon/dashIcon.png";
import controlIcon from "./icon/controlIcon.png";
import iaIcon from "./icon/iaIcon.png";
import setaIcon from "./icon/seta.png";
import visionIcon from "./icon/visionIcon.png";
import aiIcon from "./icon/aiIcon.png";
import structureIcon from "./icon/structureIcon.png";
import profileIcon from "./icon/profileIcon.png";
import thresholdIcon from "./icon/thresholdIcon.png";
import inspectionIcon from "./icon/inspectionIcon.png";
import modelsIcon from "./icon/modelsIcon.png";
import detectionAutomaticIcon from "./icon/detectionAutomaticIcon.png";
import { useNavigate } from "react-router-dom";
import authenticated from "../../services/requisicoes/nesaApi/authenticated";
import "./sidebar.css";
import { useEffect } from "react";

function Sidebar() {

  const navigate = useNavigate();

  // Informacoes do usuário
  const [personData1, setPersonData1] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
    authenticated().then((response) => {
      setPersonData1(response.data);
    });
  }, []);

  return (
    <>
      <aside className="max-sidebar max-comandohover">
        <nav>

          <button  onClick={() => {navigate('/')}}>
            <span>
              <img className="max-sidebar-icon" src={homeIcon} alt="" />
              <span>Home</span>
            </span>
          </button>

          <button  onClick={() => {navigate('/dashboard')}}>
            <span>
              <img className="max-sidebar-icon" src={dashboardIcon} alt="" />
              <span>Dashboard</span>
            </span>
          </button>

          <div className="max-open-subsidebar1">
            <span>
              <img className="max-sidebar-icon" src={iaIcon} alt="" />
              <span className="max-seta">
                <span>Inteligência Artificial</span>
                <img className="max-sidebar-seta" src={setaIcon} alt="" />
              </span>
            </span>

            <aside className="max-subsidebar max-sub1">
              <nav>

                <button  onClick={() => {navigate('/Inspection')}}>
                  <span>
                    <img className="max-sidebar-icon" src={visionIcon} alt="" />
                    <span>Inspeção Visual</span>
                  </span>
                </button>

                <button  onClick={() => {navigate('/Adm')}}>
                  <span>
                    <img className="max-sidebar-icon" src={aiIcon} alt="" />
                    <span>Detecção de Anomalias</span>
                  </span>
                </button>

                <button  onClick={() => {navigate('/automaticDetection')}}>
                  <span>
                    <img className="max-sidebar-icon" src={detectionAutomaticIcon} alt="" />
                    <span>Detecção Automática</span>
                  </span>
                </button>

                <button  onClick={() => {navigate('/models')}}>
                  <span>
                    <img className="max-sidebar-icon" src={modelsIcon} alt="" />
                    <span>Modelos</span>
                  </span>
                </button>

              </nav>
            </aside>

          </div>

          {personData1.is_admin && (<div className="max-open-subsidebar2">
            <span>
              <img className="max-sidebar-icon" src={controlIcon} alt="" />
              <span className="max-seta">
                <span>Painel de Controle</span>
                <img className="max-sidebar-seta" src={setaIcon} alt="" />
              </span>
            </span>

            <aside className="max-subsidebar max-sub2">
              <nav>

                <button  onClick={() => {navigate('/InfoUsuario')}}>
                  <span>
                    <img className="max-sidebar-icon" src={profileIcon} alt="" />
                    <span>Usuários</span>
                  </span>
                </button>

                <button  onClick={() => {navigate('/novaEstrutura')}}>
                  <span>
                    <img className="max-sidebar-icon" src={structureIcon} alt="" />
                    <span>Estruturas</span>
                  </span>
                </button>

                <button  onClick={() => {navigate('/Threshold')}}>
                  <span>
                    <img className="max-sidebar-icon" src={thresholdIcon} alt="" />
                    <span>Limiares</span>
                  </span>
                </button>

              </nav>
            </aside>

          </div>)}

        </nav>
      </aside>



    </>
  )
}

export default Sidebar;