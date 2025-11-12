import './Navbar.css';
import ProfileMenu from "../profileMenu/profileMenu";
import Sidebar from "../sidebar/sidebar";
import logoNorteWhite from "./icon/logo_nova_grande.png"
import logoANEEL from "./icon/Logo ANEEL - PDI.png"

function Navbar({ isLogged, setLogged }) {
    return (
      <>
        {isLogged ? 
        <>
          <header className="NavBar">
            <div className="logoNorte">
              <img className="logoNorteImg" src={logoNorteWhite} alt="" />
              <img className="logoNorteImg" src={logoANEEL} alt="" />
            </div>
  
            <div className="bloco2-sidebar" >
              <ProfileMenu setLogged={setLogged} />
            </div>
          </header>
          <Sidebar/> 
        </> : null}
      </>
    )
  }

export default Navbar;