const Airtable = require('airtable');
const base = new Airtable({ apiKey: 'pat6NM3o92RovJt3i.7842cbed03eacb709800fb63ee37d194a88836e9b96bb4bd7a2793e2ee0aa138' }).base('app4onBPGCYplMOOm');

async function getCustomerData(cpfCnpj) {
  return new Promise((resolve, reject) => {
    base('Clientes').select({
      filterByFormula: `OR({CPF} = '${cpfCnpj}', {CNPJ} = '${cpfCnpj}')`
    }).firstPage((err, records) => {
      if (err) {
        reject(err);
      } else {
        if (records.length > 0) {
          const record = records[0];
          resolve({
            nome: record.get('Nome do cliente'),
            cpf: record.get('CPF'),
            cnpj: record.get('CNPJ'),
            numero: record.get('Número do cliente'),
          });
        } else {
          resolve(null);
        }
      }
    });
  });
}

module.exports = {
  getCustomerData,
};
