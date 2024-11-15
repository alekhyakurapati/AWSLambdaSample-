import pino from "pino";
import pinoPretty from "pino-pretty";
// import pretty from "pino-pretty";

export const logger = pino(
  {
    name: "ECaaS-Subscriber",
    level: "info",
  },
  pinoPretty()
);
