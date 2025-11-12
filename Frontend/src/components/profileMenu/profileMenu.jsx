import React, { useEffect, useState } from "react";
import "./profileMenu.css";
import ProfileIconBlue from "./icon/profileIcon-Blue.png";
import ProfileIconWhite from "./icon/profileIcon-White.png";
import ExitIconWhite from "./icon/exitIcon-White.png";
import ExitIconBlue from "./icon/exitIcon-Blue.png";
import ProfileIcon from "./icon/user.png";
import authenticated from "../../services/requisicoes/nesaApi/authenticated";
import redefinePassword from "../../services/requisicoes/nesaApi/postRedefinePassword";
import { useNavigate } from 'react-router-dom';
import Message from "../message/Message";

const ProfileMenu = ({ setLogged }) => {
  const navigate = useNavigate();
  // troca de senha
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showSucess, setShowSucess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit2 = (e) => {
    e.preventDefault();
    redefinePassword(personData.id, {
      old_password: password,
      new_password: newPassword,
    }).then((response) => {
      if (response.status === 200) {
        setIsProfileOpen(!isProfileOpen);
        setShowSucess(true);
        setTimeout(() => {
          setShowSucess(false);
          logout();
        }, 2000);
      } else {
        setShowError(true);
        setTimeout(() => {
          setShowError(false);
        }, 3500);
      }
    });
  };

  // Informacoes do usuário
  const [personData, setPersonData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
    authenticated().then((response) => {
      setPersonData(response.data);
    });
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // hover para a imagem
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  function logout() {
    localStorage.removeItem("JWT");
    setLogged(false);
    navigate('/login');
  }

  return (
    <div className="profile-menu">
      <button className="profileBotao" onClick={toggleMenu}>
        <div>
          <span className="profileMenu-textoNav">
            {personData.first_name} {personData.last_name}
          </span>
          <img className="iconNavbar" src={ProfileIcon} alt="Icone de perfil" />
        </div>
      </button>
      {isMenuOpen && (
        <div>
          <div id="fade-profileMenu" onClick={toggleMenu}></div>
          <div className="dropdown-content-1">
            <a
              id="openUserProfilee"
              onClick={() => {
                toggleProfile();
                toggleMenu();
                setHovered1(false);
              }}
              href="#"
              className="itemProfileMenu"
              onMouseEnter={() => {
                setHovered1(true);
              }}
              onMouseLeave={() => {
                setHovered1(false);
              }}
            >
              <img
                className="svg"
                src={hovered1 ? ProfileIconBlue : ProfileIconWhite}
                alt="Icone de perfil"
              />
              <span>Perfil</span>
            </a>

            <a
              onClick={logout}
              href=""
              className="itemProfileMenu"
              onMouseEnter={() => {
                setHovered2(true);
              }}
              onMouseLeave={() => {
                setHovered2(false);
              }}
            >
              <img
                className="svg"
                src={hovered2 ? ExitIconBlue : ExitIconWhite}
                alt="Icone de sair"
              />
              <span>Sair</span>
            </a>
          </div>
        </div>
      )}
      {isProfileOpen && (
        <div>
          <div id="fadeee" onClick={toggleProfile}></div>
          <div id="modalll">
            <div className="dados">
              <img className="imagem-perfil" src={ProfileIcon} alt="Imagem de perfil"/>
              <div className="informacoes">
                <span className="nome capit">
                  {personData.first_name} {personData.last_name}
                </span>
                <span className="e-mail">{personData.email}</span>
              </div>
              <span className="cargo capit">{personData.role}</span>
            </div>

            <div className="editarSenha">
              <div className="tituloSenha">
                <span className="textoSenha">Editar Senha</span>
                <span className="detalheSenha"></span>
              </div>

              <form onSubmit={handleSubmit2}>
                <div className="inputs">
                  <label htmlFor="input1" className="labelSenha">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    className="inputSenha"
                    id="input1"
                    name="senhaAtual"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="inputs">
                  <label htmlFor="input2" className="labelSenha">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    className="inputSenha"
                    id="input2"
                    name="senhaAtual"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="botaoSenha">
                  <button className="btnn">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Message
        message={"Senha alterada com sucesso!"}
        visible={showSucess}
      />

      <Message
        message={"Erro! Verifique as informações e tente novamente."}
        visible={showError}
        typeMessage={"danger"}
      />


    </div>
  );
};

export default ProfileMenu;
