import { createClient } from 'redis';

const client = createClient();

client.on('connect', () => {
  console.log('Redis client connected to the server');

  const hash = {
    Portland: 50,
    Seattle: 80,
    'New York': 20,
    Bogota: 20,
    Cali: 40,
    Paris: 2,
  };

  for (const key in hash) {
    client.hset('HolbertonSchools', key, hash[key], (_, reply) => {
      console.log(reply);
    });
  }

  client.hgetall('HolbertonSchools', (_, reply) => {
    console.log(reply);
  });
});

client.on('error', (error) => {
  console.log(`Redis client not connected to the server: ${error}`);
});
