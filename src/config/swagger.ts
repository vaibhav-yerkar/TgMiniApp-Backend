import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  schemes: ["http", "https"],
  apis: ["./src/router/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
