import swaggerJSDoc from "swagger-jsdoc";

import { components, paths, tags } from "../docs/openapi.js";

const port = process.env.PORT || 4000;
const localServerUrl = `http://localhost:${port}`;
const configuredServerUrl = process.env.API_BASE_URL || localServerUrl;

const servers = [
  {
    url: configuredServerUrl,
    description: process.env.API_BASE_URL ? "Configured API server" : "Local development server",
  },
  {
    url: localServerUrl,
    description: "Local development server",
  },
].filter(
  (server, index, allServers) =>
    allServers.findIndex((item) => item.url === server.url) === index,
);

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "NFC-Based Fare Collection API",
      version: "1.0.0",
      description:
        "API documentation for an NFC-based fare collection backend system.",
    },
    servers,
    tags,
    components,
    paths,
  },
  apis: ["./src/router/*.js", "./src/controller/*.js", "./src/model/*.js"],
};

const generatedSpec = swaggerJSDoc(options);

export const swaggerSpec = {
  ...generatedSpec,
  tags,
  components,
  paths,
};
