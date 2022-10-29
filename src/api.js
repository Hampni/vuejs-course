const API_KEY =
  "55d62b0e1bd28190eb185144b5a37cf24fb039206031b9f89f0d7f814e26afd3";
const tickersHandlers = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
const AGGREGATE_INDEX = "5";

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]); //registrated ticker and functions to run
  subscribeToTickerOnWs(ticker); //sending message to localStorage to subscribe for updates
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unSubscribeFromTickerOnWs(ticker);
};

function subscribeToTickerOnWs(ticker) {
  const message = {
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`],
  };
  sendToWebSocket(message);
}

function unSubscribeFromTickerOnWs(ticker) {
  const message = {
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`],
  };
  sendToWebSocket(message);
}

function sendToWebSocket(message) {
  const stringifyedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifyedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifyedMessage);
    },
    { once: true }
  );
}

//recieved answet
socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
  } = JSON.parse(e.data);
  if (type != AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

export const getCoins = () =>
  fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true`);
