import express from 'express';
import { createClient } from 'redis';
import { promisify } from 'util';

const app = express();
const client = createClient();
const port = 1245;

const listProducts = [
  {
    itemId: 1,
    itemName: 'Suitcase 250',
    price: 50,
    initialAvailableQuantity: 4,
  },
  {
    itemId: 2,
    itemName: 'Suitcase 450',
    price: 100,
    initialAvailableQuantity: 10,
  },
  {
    itemId: 3,
    itemName: 'Suitcase 650',
    price: 350,
    initialAvailableQuantity: 2,
  },
  {
    itemId: 4,
    itemName: 'Suitcase 1050',
    price: 550,
    initialAvailableQuantity: 5,
  },
];

client.on('connect', () => {
  console.log('Redis client connected to the server');
});

client.on('error', (error) => {
  console.log(`Redis client not connected to the server: ${error}`);
});

function getItemById(itemId) {
  return listProducts.find((product) => product.itemId === itemId);
}

function reserveStockById(itemId, stock) {
  client.set(`item.${itemId}`, stock);
}

async function getCurrentReservedStockById(itemId) {
  const getAsync = promisify(client.get).bind(client);
  const reply = await getAsync(`item.${itemId}`);
  return reply;
}

app.get('/list_products', (_, res) => {
  res.json(listProducts);
});

app.get('/list_products/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const product = getItemById(itemId);
  if (!product) {
    res.json({ status: 'Product not found' });
    return;
  }
  const currentQuantity = await getCurrentReservedStockById(itemId);
  res.json({ ...product, currentQuantity: currentQuantity || 0 });
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const product = getItemById(itemId);
  if (!product) {
    res.json({ status: 'Product not found' });
    return;
  }
  const currentQuantity = await getCurrentReservedStockById(itemId);
  if (currentQuantity >= product.initialAvailableQuantity) {
    res.json({ status: 'Not enough stock available', itemId });
    return;
  }
  reserveStockById(itemId, currentQuantity + 1);
  res.json({ status: 'Reservation confirmed', itemId });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
