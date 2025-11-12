import React, { useEffect, useState } from 'react';
import * as ReactBootStrap from 'react-bootstrap'
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { saveAs } from 'file-saver';

import MyMapComponent from '../../../../components/myMap/myMapComponent';
import VisionLinePlot from '../../../../components/visionLinePlot/visionLinePlot';
import VisionPiePlot from '../../../../components/visionPiePlot/visionPiePlot';
import VisionHistogram from '../../../../components/visionHistogram/visionHistogram';
import VisionTemporalBoxPlot from '../../../../components/visionTemporalBoxPlot/visionTemporalBoxPlot';

import exportIcon from './exportar.png'
import leftIcon from './seta-esquerda.png'
import rightIcon from './seta-direita.png'

import Message from '../../../../components/message/Message';
import BoxPlotVision from '../../../../components/boxPlotVision/boxPlotVision';

import getStructures from '../../../../services/requisicoes/nesaApi/getStructures';

import getVisualInspection from '../../../../services/requisicoes/nesaApi/getVisualInspection';
import getVisualInspectionAlt from '../../../../services/requisicoes/nesaApi/getVisualInspectionsAlt';
import getVisionBoxPlot from '../../../../services/requisicoes/nesaApi/getVisionBoxPlot';
import getVisionLinePlot from '../../../../services/requisicoes/nesaApi/getVisionLinePlot';
import getVisionPiePlot from '../../../../services/requisicoes/nesaApi/getVisionPiePlot';
import getVisionHistogram from '../../../../services/requisicoes/nesaApi/getVisionHistogram';
import getVisionTemporalBoxPlot from '../../../../services/requisicoes/nesaApi/getVisionTemporalBoxPlot';
import getVisionMetric from '../../../../services/requisicoes/nesaApi/getVisionMetric';

import getUploadOrthoimage from '../../../../services/requisicoes/nesaApi/getUploadOrthoimage';

import './viewInspection.css';

const ViewInspection =  () => {
  const {id} = useParams();
  
  const [attId, setAttId] = useState(id);
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [selectedView2, setSelectedView2] = useState(null);
  const [inspection, setInspection] = useState([])
  const [inspectionList, setInspectionList] = useState([])
  const [uploadOrthoimage, setUploadOrthoimage] = useState();
  const [uploadOrthoimage2, setUploadOrthoimage2] = useState();
  const [visionLinePlotData, setVisionLinePlotData] = useState([]);
  const [visionPiePlotData, setVisionPiePlotData] = useState([]);
  const [visionHistogram, setVisionHistogram] = useState([]);
  const [temporalBoxPlot, setTemporalBoxPlot] = useState([]);
  const [metric, setMetric] = useState([]);

  const [selectStructureFail, setSelectStructureFail] = useState(false);

  const [currentStructureInspections, setCurrentStructureInspections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [boxPlot, setBoxPlot] = useState([]);

  const exportImage = () => {
    fetch(uploadOrthoimage)
      .then(response => response.blob())
      .then(blob => {
        saveAs(blob, 'image.jpg');
      })
      .catch(error => console.error(error));
  }

  const exportImage2 = () => {
    fetch(uploadOrthoimage2)
      .then(response => response.blob())
      .then(blob => {
        saveAs(blob, 'image.jpg');
      })
      .catch(error => console.error(error));
  }

  useEffect(() => {
    const token = localStorage.getItem('JWT');
    if (!token) {
      return;
    }
    getStructures()
      .then(response => {
        setStructures(response.data.map(structure => ({ value: structure.id, label: structure.structure_name })));
      })
      .catch(error => {
        console.error("There was an error!", error);
      });
  }, []);

  
  useEffect(() => {
    const token = localStorage.getItem('JWT');
    if (!token) {
      return;
    }
    
    getVisionBoxPlot(attId)
    .then(response => {
      setBoxPlot(response.data.data);
    })
    .catch(error => {
      console.error("There was an error!", error);
    });

    getVisualInspection(attId)
    .then(response => {
        setInspection(response.data);
        setSelectedStructure({ value: response.data.structure.id, label: response.data.structure.structure_name })
        if (response.data.images === "") {
          return;
        }
        handleSelectView({ value: 'rgb.png', label: 'RGB' });
        handleSelectView2({ value: 'ndvi.png', label: 'NDVI', id: response.data.structure.id});
      })
      .catch(error => {
        console.error("There was an error!", error);
      });

  }, [attId]);
  
  useEffect(() => {
    const token = localStorage.getItem('JWT');
    if (!token || !selectedStructure) { // Verifica se selectedStructure é null
      return;
    }
  
    getVisualInspectionAlt()
    .then(response => {
      const data = response.data;
      
      // Agrupar por estrutura
      const grouped = data.reduce((result, item) => {
        (result[item.structure__structure_name] = result[item.structure__structure_name] || []).push(item);
        return result;
      }, {});
  
      // Ordenar cada grupo por data
      for (let structure in grouped) {
        grouped[structure].sort((a, b) => new Date(a.inspection_date) - new Date(b.inspection_date));
      }
  
      setInspectionList(grouped);
  
      // Encontrar o índice da inspeção atual e a quantidade de inspeções da estrutura atual
      setCurrentStructureInspections(grouped[selectedStructure.label])
      setCurrentIndex(grouped[selectedStructure.label].findIndex(insp => insp.id === inspection.id));
      setCount(grouped[selectedStructure.label].length);
    })
  }, [selectedStructure, inspection.id]); // Adiciona selectedStructure como dependência
  

  const handleSelectChange = selectedOption => {
    if (inspectionList[selectedOption.label] === undefined) {
      setSelectStructureFail(true);
      setTimeout(() => {
          setSelectStructureFail(false);
      }, 1500);
      return;
    }

    setSelectedStructure(selectedOption);
    // Busque a inspeção mais recente da estrutura selecionada e defina como a inspeção atual
    const currentStructure = inspectionList[selectedOption.label];
    setCurrentStructureInspections(currentStructure);
    setAttId(currentStructure[currentStructure.length - 1].id);
    setCount(currentStructure.length);
    setCurrentIndex(currentStructure.length - 1);
  };

  const handleSelectView = selectedOption => {
    setSelectedView(selectedOption);

    getUploadOrthoimage(attId, selectedOption.value)
      .then(response => {
        const blob = new Blob([response.data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);

        setUploadOrthoimage(url);
      })
      .catch(error => {
        console.error("There was an error!", error);
      });
  };

  const handleSelectView2 = selectedOption => {
    setSelectedView2(selectedOption);

    getUploadOrthoimage(attId, selectedOption.value)
      .then(response => {
        const blob = new Blob([response.data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);

        setUploadOrthoimage2(url);
      })
      .catch(error => {
        console.error("There was an error!", error);
      });

    
    getVisionLinePlot(!!selectedOption.id ? selectedOption.id : selectedStructure.value , attId)
      .then(response => {
        setVisionLinePlotData(response.data.data);
      })
      .catch(error => {
        console.error("There was an error!", error);
      });

    getVisionPiePlot(attId, selectedOption.value.replace('.png', ''))
      .then(response => {
        setVisionPiePlotData(response.data.data[0]);
      })
      .catch(error => {
        console.error("There was an error!", error);
      });

    getVisionHistogram(attId, selectedOption.value.replace('.png', ''))
    .then(response => {
      setVisionHistogram(response.data.data[0])
    })
    .catch(error => {
      console.error("There was an error!", error);
    });

    getVisionTemporalBoxPlot(!!selectedOption.id ? selectedOption.id : selectedStructure.value , attId, selectedOption.value.replace('.png', ''))
      .then(response => {
        setTemporalBoxPlot(response.data.data);
      })
      .catch(error => {
        console.error("There was an error!", error);
      });
    
    getVisionMetric(attId)
    .then(response => {
      setMetric(response.data.data[0]);
    })
    .catch(error => {
      console.error("There was an error!", error);
    });
    
  };

  const handlePreviousInspection = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAttId(currentStructureInspections[currentIndex - 1].id);
    }
  };

  const handleNextInspection = () => {
    if (currentIndex < count - 1) {
      setCurrentIndex(currentIndex + 1);
      setAttId(currentStructureInspections[currentIndex + 1].id);
    }
  };

  const viewOptions = [
    {
      label: "Composições de Cor",
      options: [
        { value: 'rgb.png', label: 'RGB' },
        { value: 'cir.png', label: 'CIR' },
      ]
    },
    // {
    //   label: "Machine Learning",
    //   options: [
    //     { value: 'Segmentação', label: 'Segmentação' },
    //     { value: 'Anomalias', label: 'Anomalias' },
    //   ]
    // },
  ];

  const viewOptions2 = [
    {
      label: "Índices de Vegetação",
      options: [
        { value: 'ndvi.png', label: 'NDVI' },
        { value: 'gndvi.png', label: 'GNDVI' },
        // { value: 'LAI', label: 'LAI' },
        { value: 'ndre.png', label: 'NDRE' },
        { value: 'ndwi.png', label: 'NDWI' },
      ]
    },
  ];

  // const exportOptions = [
  //   {
  //     label: "Exportar visualização atual",
  //     options: [
  //       { value: 'Formato .PNG', label: 'Formato .PNG' },
  //       { value: 'Formato .JPG', label: 'Formato .JPG' },
  //       { value: 'Formato .TIFF', label: 'Formato .TIFF' },
  //     ]
  //   },
  //   {
  //     label: "Exportar arquivo original",
  //     options: [
  //       { value: 'Formato .GeoTIFF', label: 'Formato .GeoTIFF' },
  //     ]
  //   },
  // ];

  return (
    <div className="pcUser-container">
      <div className="pcUser-bloco ">
        <div className="container text-center">

          <div className="row colorMaxBlue">
            <div className="col zindexVision">
              <Select 
                className="" 
                options={structures} 
                value={selectedStructure} 
                onChange={handleSelectChange} 
                styles={{
                  option: (provided, state) => ({
                    ...provided,
                    padding: 10,
                    border: '1px solid #d3d3d3',
                    backgroundColor: state.isSelected ? '#078e9c' : 'white',
                    marginBottom: 10,
                  }),
                  control: (provided) => ({
                    ...provided,
                    borderRadius: 0,
                    boxShadow: 'none',
                    color: '#078e9c',
                    height: 64,
                  }),
                  singleValue: (provided) => ({
                    ...provided,
                    color: '#078e9c',
                  }),
                  indicatorSeparator: (provided) => ({
                    ...provided,
                    display: 'none',
                  }),
                  
                }}
              />
            </div>
            <div className="col-6 headerStyleMax">
              Inspeção # {inspection.id}
            </div>

            {inspection.id?
            <div className="col dateControlMax">
              <img className={`max-iconEdit arrowIcon ${currentIndex === 0?"ofuscar":""}`} src={leftIcon} alt="seta esquerda" onClick={handlePreviousInspection} disabled={currentIndex === 0} />
              <span className='timestampInspection'>{new Date(inspection.inspection_date).toLocaleDateString()} {new Date(inspection.inspection_date).toLocaleTimeString()}</span>
              <img className={`max-iconEdit arrowIcon ${currentIndex === count -1?"ofuscar":""}`} src={rightIcon} alt="seta direita" onClick={handleNextInspection} disabled={currentIndex === count - 1} />
            </div>:null}
          </div>
          
          <div className='groupCards'>

            {inspection.id?
              <div className='inspectionCard'>
              <div className='pcUser-container maxcemporc'>
                <div className='pcUser-bloco inspectionCard'>
                    <header className='max-header'>
                        <h3>Inspetor Responsável</h3>
                    </header>
                    <p className='vlwUnicMax'>{inspection.user.first_name} {inspection.user.last_name}</p>

                </div>
              </div>
            </div>:null}
            
            {inspection.id?
            <div className='inspectionCard'>
              <div className='pcUser-container maxcemporc'>
                <div className='pcUser-bloco inspectionCard'>
                    <header className='max-header'>
                        <h3>Cobertura Vegetal Saudável</h3>
                    </header>
                    <p className='vlwUnicMax'>{metric.metric * 100}%</p>
                </div>
              </div>
            </div>:null}

          </div>

          {inspection.images !== "" ? 
          <>
          <div className='pcUser-container maxcemporc'>
            <div className='pcUser-bloco'>
              <header className='max-header selectionMapMax'>
                  <h3>Ortomosaico</h3>
                  <div className='blockMaxSelect'>
                    <Select 
                      className="select-style" 
                      options={viewOptions} 
                      value={selectedView}
                      onChange={handleSelectView} 
                      styles={{
                        option: (provided, state) => ({
                          ...provided,
                          padding: 10,
                          border: '1px solid #d3d3d3',
                          backgroundColor: state.isSelected ? '#078e9c' : 'white',
                          marginBottom: 10,
                        }),
                        control: (provided) => ({
                          ...provided,
                          borderRadius: 0,
                          boxShadow: 'none',
                          color: '#078e9c',
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#078e9c',
                        }),
                        indicatorSeparator: (provided) => ({
                          ...provided,
                          display: 'none',
                        }),
                        
                      }}
                    />
                    {!!uploadOrthoimage ? (
                    <img className='max-iconEdit exportIconMax' src={exportIcon} onClick={exportImage} alt="Exportar" />
                    ) : null}
                    </div>
              </header>
              {!!uploadOrthoimage ? (
                <MyMapComponent uploadOrthoimage={uploadOrthoimage} />
              ) : (
                <div className='loading-div'>
                  <ReactBootStrap.Spinner animation='border' className='loading-icon' />
                </div>
              )} 
            </div>
          </div>
          {!!uploadOrthoimage2 ? (
          <div className='pcUser-container maxcemporc'>
            <div className='pcUser-bloco'>
              <header className='max-header selectionMapMax'>
                  <h3>Evolução da Saúde Vegetal</h3>
              </header>
              <VisionLinePlot data={visionLinePlotData} />
            </div>
          </div>  ) : null}

          {!!uploadOrthoimage2 ? (
          <div className='boxsPlotVision'>
            <div className='visionCards'>
              <div className='pcUser-bloco' style={{ height: '100%' }}>
                <header className='max-header'>
                  <h3>Análise de {!!selectedView2? selectedView2.value.replace('.png', '').toUpperCase() : null} por Categoria</h3>
                </header>
                <VisionPiePlot data={visionPiePlotData} />
              </div>
              </div>

            <div className='visionCards'>
              <div className='pcUser-bloco' style={{ height: '100%' }}>
                <header className='max-header'>
                  <h3>Análise de {!!selectedView2? selectedView2.value.replace('.png', '').toUpperCase() : null} por Histograma</h3>
                </header>
                <VisionHistogram data={visionHistogram} />
              </div>
            </div>
          </div> ) : null}
          
          
          <div className='pcUser-container maxcemporc'>
            <div className='pcUser-bloco'>
              <header className='max-header selectionMapMax'>
                  <h3>Índices de Vegetação</h3>
                  <div className='blockMaxSelect'>
                    <Select 
                      className="select-style" 
                      options={viewOptions2} 
                      value={selectedView2}
                      onChange={handleSelectView2} 
                      styles={{
                        option: (provided, state) => ({
                          ...provided,
                          padding: 10,
                          border: '1px solid #d3d3d3',
                          backgroundColor: state.isSelected ? '#078e9c' : 'white',
                          marginBottom: 10,
                        }),
                        control: (provided) => ({
                          ...provided,
                          borderRadius: 0,
                          boxShadow: 'none',
                          color: '#078e9c',
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#078e9c',
                        }),
                        indicatorSeparator: (provided) => ({
                          ...provided,
                          display: 'none',
                        }),
                        
                      }}
                    />
                    {!!uploadOrthoimage2 ? (
                    <img className='max-iconEdit exportIconMax' src={exportIcon} onClick={exportImage2} alt="Exportar" />
                    ) : null}
                  </div>
              </header>
              {!!uploadOrthoimage2 ? (
                <MyMapComponent uploadOrthoimage={uploadOrthoimage2} />
              ) : (
                <div className='loading-div'>
                  <ReactBootStrap.Spinner animation='border' className='loading-icon' />
                </div>
              )} 
            </div>
          </div>

          <div className='boxsPlotVision'>
            <div className='visionCards'>
              <div className='pcUser-bloco'>
                  <header className='max-header'>
                    <h3>Distribuição dos Índices de Vegetação</h3>
                  </header>
                <BoxPlotVision data={boxPlot} />
              </div>
            </div>

            <div className='visionCards'>
              <div className='pcUser-bloco'>
                  <header className='max-header'>
                    <h3>Distribuição Temporal do Índice {!!selectedView2? selectedView2.value.replace('.png', '').toUpperCase() : null}</h3>
                  </header>
                <VisionTemporalBoxPlot data={temporalBoxPlot} />
              </div>
            </div>
          </div>
          </> : 
          <div className='pcUser-container maxcemporc'>
          <div className='pcUser-bloco'>
              <h3>O ortomosaico da inspeção selecionada não foi submetido</h3>
          </div>
        </div>
          }


          <Message message="A estrutura selecionada não possui inspeções" visible={selectStructureFail} typeMessage="danger" />

        </div>
      </div>
    </div>
  );
};

export default ViewInspection;