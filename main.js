const venom = require('venom-bot');
const natural = require('natural');
const { getCustomerData } = require('./airtable');

venom
  .create({
    session: 'session-name' // Nome da sessão
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  let userState = {}; // Objeto para armazenar o estado do usuário

  const options = {
    2: ['1', '2', 'já sou cliente', 'cliente', 'quero consultar preços', 'consultar preços', 'preços', 'catálogos', 'fazer parte', 'melhor empresa'],
    4: ['1', 'pagar semana', '2', 'problemas com o veículo', 'problemas', '3', 'emergência', '4', 'falar com atendente', '5', 'encerrar atendimento'],
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

  function handleStep2(client, from, msg, user) {
    if (msg === '1' || msg.includes('cliente')) {
      client.sendText(from, 'Por favor, digite seu *CPF/CNPJ* para continuar');
      user.step++;
    } else if (msg === '2' || msg.includes('preços') || msg.includes('catálogos') || msg.includes('melhor empresa')) {
      client.sendText(from, 'Ficamos felizes em saber do seu interesse 😍\n\nDigite a opção deseja:\n\n*1* - Motos disponíveis\n*2* - Vi o seu anúncio em alguma plataforma, já estou com o print do anúncio e quero fechar negócio\n*3* - Falar com atendente');
      user.step = 5; // Vai para a etapa de interesse
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function handleStep4(client, from, msg, user) {
    if (msg === '1' || msg.includes('pagar semana')) {
      client.sendText(from, 'Clique no link abaixo para ser direcionado ao site de pagamentos:\n*https://nubank.com.br/cobrar/5hiuf/66816b96-7614-418c-bc0a-ee918e7d45f7*');
      client.sendText(from, 'Após clicar adicione o valor da semana conforme acordado ❤️');
      client.sendText(from, 'Podemos lhe ajudar em algo mais?\nDigite a opção desejada:\n*1* - Sim\n*2* - Não');
      user.step = 6;
      startInactivityTimer(client, from, user); // Inicia o temporizador de inatividade
    } else if (msg === '2' || msg.includes('problemas')) {
      client.sendText(from, `*${user.nome}*, Vamos passar o seu contato para alguém do nosso time.\n Por favor, aguarde...`);
      notifyAdmin(client, from, user.nome, 'problemas com o veículo'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '3' || msg.includes('emergência')) {
      client.sendText(from, 'Lembre-se é de suma importância entrar imediatamente em contato com as autoridades competentes.\n*190 - Polícia Militar*\n*191 - PRF*\n*192 - SAMU*\n*193 - Bombeiros*\nPor favor, aguarde... Vamos passar o seu contato para alguém do nosso time.');
      notifyAdmin(client, from, user.nome, 'emergência'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '4' || msg.includes('atendente')) {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time. Por favor, aguarde...');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento humano -> já é cliente'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '5' || msg.includes('encerrar')) {
      client.sendText(from, `*${user.nome}*\nPapa Tango Aluguel de Motos agradece o seu contato! Volte sempre ❤️🙏`);
      endSession(from); // Encerrar atendimento
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function handleStep5(client, from, msg, user) {
    if (msg === '1' || msg.includes('motos')) {
      client.sendText(from, 'Que maravilha 🤩\nSegue link do nosso catálogo:\n*https://wa.me/p/8185254911577260/558592684035*');
      client.sendText(from, 'Você ficou interessado?\nDigite a opção desejada:\n*1* - Sim\n*2* - Não');
      user.step = 6;
      startInactivityTimer(client, from, user); // Inicia o temporizador de inatividade
    } else if (msg === '2' || msg.includes('anúncio') || msg === '3' || msg.includes('atendente')) {
      client.sendText(from, 'Que maravilha 🤩\nVamos passar o seu contato para alguém do nosso time.\nPor favor, aguarde...');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento humano -> ainda não é cliente'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function handleStep6(client, from, msg, user) {
    if (msg === '1' || msg.includes('sim')) {
      client.sendText(from, `*${user.nome}*, vamos passar o seu contato para alguém do nosso time. Por favor, aguarde...`);
      notifyAdmin(client, from, user.nome, 'solicitou atendimento humano -> parte de pagamentos'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '2' || msg.includes('não')) {
      client.sendText(from, `*${user.nome}*\n\nPapa Tango Aluguel de Motos agradece o seu contato! Volte sempre ❤️🙏`);
      endSession(from); // Encerrar atendimento
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
      endSession(from); // Encerrar atendimento
    }
  }

  function endSession(from) {
    if (userState[from].timer) {
      clearTimeout(userState[from].timer); // Cancela o temporizador se ele existir
    }
    userState[from].paused = true;
    userState[from].pauseTime = Date.now();
    userState[from].timer = setTimeout(() => {
      delete userState[from];
    }, 24 * 60 * 60 * 1000); // O bot reiniciará após 24h 
  }
  
  // função para enviar uma notificação ao telefone do administrador 
  function notifyAdmin(client, from, userName, reason) {
    const adminNumber = '5585992010562@c.us';
    client.sendText(adminNumber, `O usuário ${userName} (número: ${from}) precisa de mais ajuda devido a: ${reason}.`);
  }

  function startInactivityTimer(client, from, user) {
    if (user.timer) {
      clearTimeout(user.timer); // Cancela o temporizador anterior se existir
    }

    user.timer = setTimeout(() => {
      client.sendText(from, `Já que não foi selecionada *nenhuma opção*, estamos encerrando o seu atendimento eletrônico.\n\n*${user.nome}*\n\nPapa Tango Aluguel de Motos agradece o seu contato! Volte sempre ❤️🙏`);
      endSession(from);
    }, 10 * 60 * 1000); // 10 minutos que o bot aguarda o usuário
  }

  client.onMessage(async (message) => {
    const from = message.from;
    const msg = message.body.trim().toLowerCase();
    const quotedMsg = message.quotedMsg ? message.quotedMsg.body.trim().toLowerCase() : null;

    if (!userState[from]) {
      userState[from] = { step: 0, nome: '', cpf: '', timer: null, paused: false, pauseTime: null };
    }

    const user = userState[from];

    if (user.paused) {
      // Se o usuário está pausado, verifica se está dentro das 24 horas
      if (Date.now() - user.pauseTime < 24 * 60 * 60 * 1000) {
        user.paused = false; // Retoma o estado do usuário
        client.sendText(from, 'Como podemos continuar a te ajudar?');
      } else {
        // Se passou das 24 horas, reinicia o atendimento
        delete userState[from];
        client.sendText(from, 'Olá! Eu sou o *Papaleguas*, seu atendente virtual. Seja bem vindo(a) a Papa Tango Aluguel de Motos! É um prazer ter você aqui 😁😍\n\n*Qual o seu nome?*');
        return;
      }
    }

    if (user.step === 0) {
      client.sendText(from, 'Olá! Eu sou o *Papaleguas*, seu atendente virtual. Seja bem vindo(a) a Papa Tango Aluguel de Motos! É um prazer ter você aqui 😁😍\n\n*Qual o seu nome?*');
      user.step++;
    } else if (user.step === 1) {
      user.nome = message.body;
      client.sendText(from, `Olá, *${user.nome}* 🤩\n\nMe conta, você já é nosso cliente?\n\n*1* - Já sou cliente Papa Tango\n*2* - Quero consultar preços, catálogos e fazer parte da melhor empresa de locação de motos 😎`);
      user.step++;
    } else if (user.step === 2) {
      const closestOption = findClosestOption(2, msg) || (quotedMsg && findClosestOption(2, quotedMsg));
      optionHandler[2](client, from, closestOption, user);
    } else if (user.step === 3) {
      user.cpf = message.body;
      const customerData = await getCustomerData(user.cpf);

      if (customerData) {
        client.sendText(from, `Digite uma das opções:\n*1* - Pagar semana\n*2* - Problemas com o veículo\n*3* - Emergência\n*4* - Falar com atendente\n*5* - Encerrar atendimento`);
        user.step++;
      } else {
        client.sendText(from, '*CPF/CNPJ não encontrado.\nPor favor, tente novamente.*');
      }
    } else if (user.step === 4) {
      const closestOption = findClosestOption(4, msg) || (quotedMsg && findClosestOption(4, quotedMsg));
      optionHandler[4](client, from, closestOption, user);
    } else if (user.step === 5) {
      const closestOption = findClosestOption(5, msg) || (quotedMsg && findClosestOption(5, quotedMsg));
      optionHandler[5](client, from, closestOption, user);
    } else if (user.step === 6) {
      const closestOption = findClosestOption(6, msg) || (quotedMsg && findClosestOption(6, quotedMsg));
      optionHandler[6](client, from, closestOption, user);
    }
  });
}
