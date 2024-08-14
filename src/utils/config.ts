export const getConfig = () => {
  const {
    PORT = 8000,
    MONGO_URL,
    JWT_KEY,
    baseUrl,
  } = process.env as {
    [key: string]: string;
  };

  let config = {
    port: PORT,
    baseUrl,
    jwt: {
      jwtKey: JWT_KEY,
    },
    dataBase: {
      mongo: MONGO_URL,
    },
  };

  return config;
};
