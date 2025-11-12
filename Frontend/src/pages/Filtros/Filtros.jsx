import React from "react";
import '../Filtros/CssFiltro.css'
import '../../components/Modal/Modal.css'


function Filtro2() {


  return (
    <div>
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Filtro
      </button>

      <div class="modal fade " id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header header-modal">
              <h1 class="modal-title fs-5" id="exampleModalLabel">Filtro</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div className="row">
                <div className="row col-3">
                  <div class="p-1 col dropdown">
                    <button class="btn btn-secondary dropdown-toggle drop col" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Barragens
                    </button>
                    <ul class="dropdown-menu">
                      <li><a className="dropdown-item" href="/"> DIC6C </a></li>
                      <li><a className="dropdown-item" href="/"> BVSA </a></li>
                    </ul>
                  </div>

                  <div class="p-1 col dropdown">
                    <button class="btn btn-secondary dropdown-toggle drop col" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Sensores
                    </button>
                    <ul class="dropdown-menu">
                      <li><a className="dropdown-item" href="/"> 1 </a></li>
                      <li><a className="dropdown-item" href="/"> 2 </a></li>
                      <li><a className="dropdown-item" href="/"> 3 </a></li>
                      <li><a className="dropdown-item" href="/"> 4 </a></li>
                      <li><a className="dropdown-item" href="/"> 5 </a></li>
                    </ul>
                  </div>

                </div>
                <div className="col-9">
                  <div class="container row">
                    <div class='col-md-5 p-1'>
                      <div class="form-group">
                        <div class='input-group date' id='datetimepicker6'>
                          <input type='text' class="form-control" />
                          <span class="input-group-addon">
                            <span class="glyphicon glyphicon-calendar"></span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class='col-md-5 p-1'>
                      <div class="form-group">
                        <div class='input-group date' id='datetimepicker7'>
                          <input type='text' class="form-control" />
                          <span class="input-group-addon">
                            <span class="glyphicon glyphicon-calendar"></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sair</button>
              <button type="button" class="btn btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default Filtro2;