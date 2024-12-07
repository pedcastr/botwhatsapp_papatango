const venom = require('venom-bot');
const natural = require('natural');
const { getCustomerData } = require('./airtable');

venom
  .create({
    session: 'session-name'
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  let userState = {};

  const options = {
    2: ['1', '2', 'já sou cliente', 'cliente', 'quero consultar preços', 'consultar preços', 'preços', 'catálogos', 'fazer parte', 'melhor empresa'],
    4: ['1', 'pagar semana', '2', 'problemas com o veículo', 'problemas', '3', 'emergência', '4', 'falar com atendente', '5', 'informar troca de óleo', '6', 'encerrar atendimento',],
    5: ['1', 'motos disponíveis', 'motos', '2', 'anúncio', '3', 'falar com atendente'],
    6: ['1', 'sim', '2', 'não']
  };

  const optionHandler = {
    2: handleStep2,
    4: handleStep4,
    5: handleStep5,
    6: handleStep6
  };

  function findClosestOption(step, input) {
    const optionList = options[step];
    let bestMatch = null;
    let bestDistance = -1;

    optionList.forEach(option => {
      const distance = natural.JaroWinklerDistance(input, option);
      if (distance > bestDistance) {
        bestDistance = distance;
        bestMatch = option;
      }
    });

    return bestMatch;
  }

  async function sendMedia(client, from, mediaPath, caption) {
    await client.sendFile(from, mediaPath, '', caption);
  }

  function handleStep2(client, from, msg, user) {
    if (msg === '1' || msg.includes('cliente')) {
      client.sendText(from, 'Por favor, digite seu *CPF/CNPJ* para continuar');
      user.step++;
      startInactivityTimer(client, from, user);
    } else if (msg === '2' || msg.includes('preços') || msg.includes('catálogos') || msg.includes('melhor empresa') || msg.includes('não sou cliente')) {
      client.sendText(from, 'Ficamos felizes em saber do seu interesse 😍\n\nDigite a opção desejada:\n\n*1* - Motos disponíveis\n*2* - Vi o anúncio de vocês em alguma plataforma, já estou com o print do anúncio e quero fechar negócio\n*3* - Falar com atendente');
      user.step = 5;
      startInactivityTimer(client, from, user);
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function handleStep4(client, from, msg, user) {
    if (msg === '1' || msg.includes('pagar semana')) {
      if (user.valor) {client.sendText(from, `O valor da sua semana de locação é *${user.valor}*`);
      client.sendText(from, 'Clique no link abaixo para ser direcionado ao site de pagamentos:\n\n*https://nubank.com.br/cobrar/5hiuf/66816b96-7614-418c-bc0a-ee918e7d45f7*\n\nApós clicar, adicione o valor da semana');
      client.sendText(from, 'Após realizar o pagamento, por favor, *envie o comprovante bancário*');
      endSession(from);
      notifyAdmin(client, from, user.nome, 'Cliente está para realizar o pagamento da semana');
    } else {
      client.sendText(from, 'Desculpe, ocorreu um erro ao processar os dados. Por favor, aguarde um instante que um atendente(a) irá falar com você');
      endSession(from);
      notifyAdmin(client, from, user.nome, 'ocorreu erro ao puxar as informações do valor da semana do banco de dados e agora o cliente está esperando');
    }
    } else if (msg === '2' || msg.includes('problemas')) {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*');
      notifyAdmin(client, from, user.nome, 'problemas com o veículo');
      endSession(from);
    } else if (msg === '3' || msg.includes('emergência')) {
      client.sendText(from, 'Lembre-se é de suma importância entrar imediatamente em contato com as autoridades competentes.\n\n*190 - Polícia Militar*\n*191 - PRF*\n*192 - SAMU*\n*193 - Bombeiros*');
      notifyAdmin(client, from, user.nome, 'emergência');
      endSession(from);
    } else if (msg === '4' || msg.includes('atendente')) {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> já é cliente');
      endSession(from);
    } else if (msg === '5' || msg.includes('troca de óleo')) {
      client.sendText(from, 'É preciso realizar a troca de óleo da moto a cada *1.000 kms* (deverá ser colocado *óleo de viscosidade 10w30*) conforme cláusula 4.1 do contrato de locação.');
      sendMedia(client, from, './media/clausula-contrato.png', 'Cláusula 4.1 do contrato de locação');
      sendMedia(client, from, './media/troca-oleo.mp4', 'Exemplo de vídeo que precisa ser feito e enviado para nós');
      sendMedia(client, from, './media/foto-recomendacoes.png', 'Recomendações quando for trocar o óleo');
      sendMedia(client, from, './media/oleo-mobil.png', 'Este é o óleo que recomendamos');
      client.sendText(from, '*Envie essas informações abaixo*');
      notifyAdmin(client, from, user.nome, 'Troca de óleo');
      endSession(from);
    } else if (msg === '6' || msg.includes('encerrar')) {
      client.sendText(from, `Papa Tango Aluguel de Motos agradece o seu contato!\nVolte sempre ❤️🙏`);
      endSession(from, true);
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function handleStep5(client, from, msg, user) {
    if (msg === '1' || msg.includes('motos')) {
      client.sendText(from, 'Que maravilha 🤩\nSegue link do nosso catálogo:\n*https://wa.me/c/558592684035*\n\n*Você ficou interessado?*\n\nDigite a opção desejada:\n\n*1* - Sim\n*2* - Não');
      user.step = 6;
      startInactivityTimer(client, from, user);
    } else if (msg === '2' || msg.includes('anúncio')) {
      client.sendText(from, 'Que maravilha 🤩\n\nVamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> anúncio');
      endSession(from);
    } else if (msg === '3' || msg.includes('atendente')) {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> ainda não é cliente');
      endSession(from);
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function handleStep6(client, from, msg, user) {
    if (msg === '1') {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> precisa de ajuda');
      endSession(from);
    } else if (msg === '2') {
      client.sendText(from, `Papa Tango - Aluguel de Motos agradece o seu contato!\nVolte sempre ❤️🙏`);
      endSession(from, true);
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function notifyAdmin(client, from, userName, reason) {
    const adminNumber = '5585992010562@c.us';
    client.sendText(adminNumber, `(número: ${from}) precisa de mais ajuda devido a: ${reason}.`);
  }

  function startInactivityTimer(client, from, user) {
    if (user.timer) {
      clearTimeout(user.timer);
    }

    user.timer = setTimeout(() => {
      client.sendText(from, `Estamos encerrando o seu atendimento eletrônico por tempo de inatividade.\n\nCaso precise entre em contato novamente.\n\n*Papa Tango Aluguel de Motos agradece o seu contato!* ❤️🙏`);
      endSession(from);
    }, 10 * 60 * 1000);
  }

  function endSession(from, restart = false) {
    if (userState[from]?.timer) {
      clearTimeout(userState[from].timer);
    }
    if (restart) {
      userState[from] = { step: 0, nome: '', cpf: '', timer: null, paused: false, pauseTime: null };
    } else {
      userState[from] = { step: 'paused' };
      userState[from].timer = setTimeout(() => {
        delete userState[from];
      }, 5 * 60 * 60 * 1000);
    }
  }

  client.onMessage(async (message) => {
    const from = message.from;
    const msgType = message.type;
    const msgBody = message.body ? message.body.trim().toLowerCase() : null;
    const quotedMsg = message.quotedMsg ? message.quotedMsg.body.trim().toLowerCase() : null;

    if (!userState[from]) {
      userState[from] = { step: 0, nome: '', cpf: '', timer: null, paused: false, pauseTime: null };
    }

    const user = userState[from];

    if (msgType === 'audio' || msgType === 'ptt') {
      await client.sendText(from, 'Desculpe, *não consigo ouvir áudios.* Por favor, digite sua mensagem ou opção desejada!');
      return;
    }

    if (!msgBody) {
      await client.sendText(from, 'Mensagem inválida. Por favor, digite sua mensagem.');
      return;
    }

    if (user.step === 0) {
      client.sendText(from, 'Olá! Eu sou o *Papaleguas*, seu atendente virtual. Seja bem-vindo(a) a Papa Tango Aluguel de Motos! É um prazer ter você aqui 😁😍\n\nMe conta, você já é nosso cliente?\n*1* - Já sou cliente Papa Tango\n*2* - Quero consultar preços, catálogos e fazer parte da melhor empresa de locação de motos 😎');
      user.step = 2;
      startInactivityTimer(client, from, user);
    } else if (user.step === 2) {
      const closestOption = findClosestOption(2, msgBody) || (quotedMsg && findClosestOption(2, quotedMsg));
      optionHandler[2](client, from, closestOption, user);
    } else if (user.step === 3) {
      user.cpf = message.body;

      try {
        const customerData = await getCustomerData(user.cpf);

        if (customerData) {
          user.nome = customerData.nome;
          user.moto = customerData.moto;
          user.placa = customerData.placa;
          user.valor = customerData.valor;

          client.sendText(from, `Localizamos o nome *${user.nome}*, moto alugada *${user.moto}* placa *${user.placa}* com o CPF informado.\n\nVocê confirma que é esta pessoa?\n\n*1* - Sim\n*2* - Não`);
          user.step = 'confirm_name';
        } else {
          client.sendText(from, '*CPF/CNPJ não encontrado.*\n\nPor favor, digite corretamente seu *CPF/CNPJ* para continuar');
          startInactivityTimer(client, from, user);
        }
      } catch (error) {
        console.error(error);
        client.sendText(from, 'Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.');
      }
    } else if (user.step === 'confirm_name') {
      if (msgBody === '1' || msgBody.includes('sim')) {
        client.sendText(from, `Ótimo, *${user.nome}*! Vamos prosseguir com o atendimento.\n\nDigite uma das opções:\n\n*1* - Pagar semana\n*2* - Problemas com o veículo\n*3* - Emergência\n*4* - Falar com atendente\n*5* - Informar troca de óleo\n*6* - Encerrar atendimento`);
        user.step = 4;
        startInactivityTimer(client, from, user);
      } else if (msgBody === '2' || msgBody.includes('não')) {
        client.sendText(from, 'Por favor, digite novamente seu CPF/CNPJ para buscarmos os dados corretos.');
        user.step = 3;
        startInactivityTimer(client, from, user);
      } else {
        client.sendText(from, '*Por favor, digite uma opção válida.*\n\n*1* - Sim\n*2* - Não');
        startInactivityTimer(client, from, user);
      }
    } else if (user.step === 4) {
      const closestOption = findClosestOption(4, msgBody) || (quotedMsg && findClosestOption(4, quotedMsg));
      optionHandler[4](client, from, closestOption, user);
    } else if (user.step === 5) {
      const closestOption = findClosestOption(5, msgBody) || (quotedMsg && findClosestOption(5, quotedMsg));
      optionHandler[5](client, from, closestOption, user);
    } else if (user.step === 6) {
      const closestOption = findClosestOption(6, msgBody) || (quotedMsg && findClosestOption(6, quotedMsg));
      optionHandler[6](client, from, closestOption, user);
    }
  });
}
