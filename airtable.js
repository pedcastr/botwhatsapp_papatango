// airtable.js
const Airtable = require('airtable');

// Configurando a API e a base do Airtable
const base = new Airtable({
  apiKey: 'pat6NM3o92RovJt3i.7842cbed03eacb709800fb63ee37d194a88836e9b96bb4bd7a2793e2ee0aa138'
}).base('app4onBPGCYplMOOm');

/**
 * Busca os dados do cliente pelo CPF ou CNPJ.
 * @param {string} cpfCnpj - CPF ou CNPJ do cliente.
 * @returns {Promise<{nome: string, cpf: string, cnpj: string, numero: string} | null>} Dados do cliente ou null.
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

            //console.log('Campos retornados:', record.fields); // LOG TEMPORÁRIO PARA TESTE

            // Corrigindo o nome da coluna para 'Nome do Cliente'
            resolve({
              nome: record.get('Nome do Cliente'), // Nome correto da coluna no Airtable
              cpf: record.get('CPF'),
              cnpj: record.get('CNPJ'),
              numero: record.get('Número do Cliente'),
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
