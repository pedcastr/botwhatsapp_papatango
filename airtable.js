// airtable.js
const Airtable = require('airtable');

// Configurando a API e a base do Airtable
const base = new Airtable({
  apiKey: 'pat6NM3o92RovJt3i.7842cbed03eacb709800fb63ee37d194a88836e9b96bb4bd7a2793e2ee0aa138'
}).base('app4onBPGCYplMOOm');

/**
 * Busca os dados do cliente pelo CPF ou CNPJ.
 * @param {string} cpfCnpj - CPF ou CNPJ do cliente.
 * @returns {Promise<{nome: string, cpf: string, cnpj: string, numero: string, endereco: string, moto: string, placa: string, valor: string} | null>} Dados do cliente ou null.
 */
async function getCustomerData(cpfCnpj) {
  return new Promise((resolve, reject) => {
    base('Clientes')
      .select({
        // Filtra por CPF ou CNPJ no Airtable
        filterByFormula: `OR({CPF} = '${cpfCnpj}', {CNPJ} = '${cpfCnpj}')`
      })
      .firstPage((err, records) => {
        if (err) {
          reject(err); // Retorna erro caso aconteça na consulta
        } else {
          if (records.length > 0) {
            const record = records[0];

            // Verificar quais campos estão sendo retornados
            // console.log('Campos retornados:', record.fields);

            resolve({
              nome: record.get('Nome do Cliente') || '',
              cpf: record.get('CPF') || '',
              cnpj: record.get('CNPJ') || '',
              numero: record.get('Número do Cliente') || '',
              endereco: record.get('Endereço do Cliente') || '',
              moto: record.get('Moto Alugada') || '',
              placa: record.get('Placa da Moto') || '',
              valor: record.get('Valor da Semana') || '',
            });
          } else {
            resolve(null); // Caso nenhum registro seja encontrado
          }
        }
      });
  });
}

module.exports = {
  getCustomerData,
};
