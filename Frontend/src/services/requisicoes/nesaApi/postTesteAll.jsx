import api from "../../api";

export default async function postTesteAll(data, { onResultado, responseServer}) {
    try {
        const response = await api.post(`/nesa/test`, {
            initial_date: data.initial_date,
            final_date: data.final_date,
            outlier: data.outlier,
        }, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            }
        })

        responseServer(response);
        onResultado(false);
        return response;
    } catch (error) {
        responseServer(error);
        onResultado(false);
        console.error('Erro na solicitação:', error);

    }
}