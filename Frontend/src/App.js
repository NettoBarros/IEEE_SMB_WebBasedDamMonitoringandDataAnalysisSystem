import './App.css';
import React ,{useState}from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/home';
import Cadastrar from './pages/Cadastrar/cadastrar';
import DashBoard from './pages/DashBoard/dashBoard';
import Login from './pages/Login/Login';
import PrivateRoute from './components/PrivateRoute';
import NovaEstrutura from './pages/PainelDeControle/NovaEstrutura/NovaEstrutura'
import InfoUsuario from './pages/PainelDeControle/Usuario/PC_Usuario'
import Adm from './pages/PainelDeControle/Adm/together'
import Threshold from './pages/PainelDeControle/Threshold/Threshold'
import Inspection from './pages/PainelDeControle/Inspection/Inspection'
import ViewInspection from './pages/PainelDeControle/Inspection/ViewInspection/viewInspection';
import Models from './pages/Models/Models'
import AutomaticDetection from './pages/automaticDetection/automaticDetection'


function App() {
  const [logged, setLogged] = useState(false);

  return (
    <>
      <Router>
        <Navbar isLogged={logged} setLogged={setLogged}/>
          <Routes>
            <Route path='/login' element = {<Login isLogged={logged} setLogged={setLogged}/>} />
            <Route path='/' element = {<PrivateRoute setLogged={setLogged}><Home /></PrivateRoute>} />
            <Route path='/cadastrar' element = {<PrivateRoute setLogged={setLogged}><Cadastrar /></PrivateRoute>} />
            <Route path='/dashBoard' element = {<PrivateRoute setLogged={setLogged}><DashBoard /></PrivateRoute>} />
            <Route path='/models' element = {<PrivateRoute setLogged={setLogged}><Models /></PrivateRoute>} />
            <Route path='/automaticDetection' element = {<PrivateRoute setLogged={setLogged}><AutomaticDetection /></PrivateRoute>} />
            <Route path='/novaEstrutura' element = {<PrivateRoute setLogged={setLogged}><NovaEstrutura /></PrivateRoute>} />
            <Route path='/InfoUsuario' element = {<PrivateRoute setLogged={setLogged}><InfoUsuario /></PrivateRoute>} />
            <Route path='/Adm' element = {<PrivateRoute setLogged={setLogged}><Adm /></PrivateRoute>} />
            <Route path='/Threshold' element = {<PrivateRoute setLogged={setLogged}><Threshold /></PrivateRoute>} />
            <Route path='/Inspection' element = {<PrivateRoute setLogged={setLogged}><Inspection /></PrivateRoute>} />
            <Route path='/Inspection/View/:id' element = {<PrivateRoute setLogged={setLogged}><ViewInspection /></PrivateRoute>} />
          </Routes>
      </Router>
    </>
  );
}

export default App;
