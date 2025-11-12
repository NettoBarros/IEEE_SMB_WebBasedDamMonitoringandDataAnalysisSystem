import React, { useState } from "react";
import Treino from "./treino";
import Teste from "./teste";

import './nesa.css';

export default function Together() {
  const [activeTab, setActiveTab] = useState("tab1");

  const handleTab1 = () => {
    setActiveTab("tab1");
  };

  const handleTab2 = () => {
    setActiveTab("tab2");
  };
  return (
    <div className="pcUser-container">
      <div className="pcUser-bloco ">
        <header className="max-header">
          <h1>Detecção de anomalias</h1>
        </header>
        <div className="container-Treino">

          <div className="Tabs">
            <ul className="nav">
              <li
                className={activeTab === "tab1" ? "active" : ""}
                onClick={handleTab1}
              >
                <div className={`gian-AA ${activeTab === "tab1" ? "active" : ""}`}>
                  TREINO
                </div>
              </li>
              <li
                className={activeTab === "tab2" ? "active" : ""}
                onClick={handleTab2}
              >
                <div className={`gian-AA ${activeTab === "tab2" ? "active" : ""}`}>
                  TESTE
                </div>
              </li>
            </ul>

            {activeTab === "tab1" ? <Treino /> : <Teste />}
          </div>
        </div>
      </div>
    </div>
  );
}
