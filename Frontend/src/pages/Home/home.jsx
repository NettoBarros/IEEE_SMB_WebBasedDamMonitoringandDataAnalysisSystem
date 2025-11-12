import "./home.css"
import Monitoramento from "./img/monitoramento- 1.png"
import img1 from "./img/dashIcon3.png"
import img2 from "./img/visionIcon3.png"
import img3 from "./img/machine-learning3.png"
import { useNavigate } from "react-router-dom";

function Home(){

    const navigate = useNavigate();

    return(
        <div className='home'>
            <div className="bloco1-home">
                <p className="texto-home" >Sistema inteligente de monitoramento de barragens e diques baseado em aprendizado profundo de máquina para auxiliar a tomada de decisão de engenheiros especialistas, além de contribuir para manter um elevado grau de saúde das estruturas empreendidas pela Norte Energia S.A (NESA).</p>
                <img className="img-monitoramento" src={Monitoramento} alt="" />
            </div>
            <div className="bloco2-home">
                <div className="cartoes-home">
                    <div onClick={() => {navigate('/dashBoard')}} className="cartao-home">
                        <img className="img-cartao-home" src={img1} alt="" />
                        <span>Dashboard</span>
                    </div>
                    <div onClick={() => {navigate('Inspection')}} className="cartao-home">
                        <img className="img-cartao-home" src={img2} alt="" />
                        <span>Inspeção Visual
                        </span>
                    </div>
                    <div onClick={() => {navigate('/painelControle/Adm')}} className="cartao-home">
                        <img className="img-cartao-home" src={img3} alt="" />
                        <span>Detecção de Anomalias</span>
                    </div>
                </div>
                <p className="texto-home texto-home2">É um sistema robusto e completo que permite ao engenheiro da NESA submeter campanhas de medição, visualizar, filtrar, analisar estatísticas quantitativas e qualitativas, detectar padrões visuais, exportar imagens com gráficos, entre outras funcionalidades. Com o apoio da ciência e mineração de dados aliados ao aprendizado profundo de máquina, o sistema é capaz de fornecer um produto completo de detecção automática de anomalias de interesse da NESA.</p>
            </div>
        </div>
    )
}

export default Home;