// Redis
//
// Create a Redic client:
//
//     Create a function reserveSeat, that will take into argument number, and set the key available_seats with the number
//     Create a function getCurrentAvailableSeats, it will return the current number of available seats (by using promisify for Redis)
//     When launching the application, set the number of available to 50
//     Initialize the boolean reservationEnabled to true - it will be turn to false when no seat will be available
//
// Kue queue
//
// Create a Kue queue
// Server
//
// Create an express server listening on the port 1245. (You will start it via: npm run dev 100-seat.js)
//
// Add the route GET /available_seats that returns the number of seat available:
//
// bob@dylan:~$ curl localhost:1245/available_seats ; echo ""
// {"numberOfAvailableSeats":"50"}
// bob@dylan:~$
//
// Add the route GET /reserve_seat that:
//
//     Returns { "status": "Reservation are blocked" } if reservationEnabled is false
//     Creates and queues a job in the queue reserve_seat:
//         Save the job and return:
//             { "status": "Reservation in process" } if no error
//             Otherwise: { "status": "Reservation failed" }
//         When the job is completed, print in the console: Seat reservation job JOB_ID completed
//         When the job failed, print in the console: Seat reservation job JOB_ID failed: ERROR_MESSAGE
//
// bob@dylan:~$ curl localhost:1245/reserve_seat ; echo ""
// {"status":"Reservation in process"}
// bob@dylan:~$
//
// Add the route GET /process that:
//
//     Returns { "status": "Queue processing" } just after:
//     Process the queue reserve_seat (async):
//         Decrease the number of seat available by using getCurrentAvailableSeats and reserveSeat
//         If the new number of available seats is equal to 0, set reservationEnabled to false
//         If the new number of available seats is more or equal than 0, the job is successful
//         Otherwise, fail the job with an Error with the message Not enough seats available
//
// bob@dylan:~$ curl localhost:1245/process ; echo ""
// {"status":"Queue processing"}
// bob@dylan:~$
// bob@dylan:~$ curl localhost:1245/available_seats ; echo ""
// {"numberOfAvailableSeats":"49"}
// bob@dylan:~$
//
// and in the server terminal:
//
// Seat reservation job 52 completed
//
// and you can reserve all seats:
//
// bob@dylan:~$ for n in {1..50}; do curl localhost:1245/reserve_seat ; echo ""; done
// {"status":"Reservation in process"}
// {"status":"Reservation in process"}
// ...
// {"status":"Reservation in process"}
// {"status":"Reservation in process"}
// {"status":"Reservation in process"}
// {"status":"Reservation are blocked"}
// {"status":"Reservation are blocked"}
// {"status":"Reservation are blocked"}
// bob@dylan:~$
//
// Requirements:
//
//     Make sure to use promisify with Redis
//     Make sure to use the await/async keyword to get the value from Redis
//     Make sure the format returned by the web application is always JSON and not text
//     Make sure that only the allowed amount of seats can be reserved
//     Make sure that the main route is displaying the right number of seats

const express = require('express');
const { createClient } = require('redis');
const { createQueue } = require('kue');
const { promisify } = require('util');

const app = express();
const port = 1245;
const client = createClient();
const queue = createQueue();

client.on('connect', () => {
  console.log('Redis client connected to the server');
});

client.on('error', (error) => {
  console.log(`Redis client not connected to the server: ${error}`);
});

function reserveSeat(number) {
  client.set('available_seats', number);
}

async function getCurrentAvailableSeats() {
  const getAsync = promisify(client.get).bind(client);
  const reply = await getAsync('available_seats');
  return reply;
}

app.get('/available_seats', async (_, res) => {
  const numberOfAvailableSeats = await getCurrentAvailableSeats();
  res.json({ numberOfAvailableSeats });
});

let reservationEnabled = true;

app.get('/reserve_seat', async (_, res) => {
  if (!reservationEnabled) {
    res.json({ status: 'Reservation are blocked' });
  } else {
    const job = queue.create('reserve_seat').save((error) => {
      if (!error) {
        res.json({ status: 'Reservation in process' });
      } else {
        res.json({ status: 'Reservation failed' });
      }
    });
    job.on('complete', () => {
      console.log(`Seat reservation job ${job.id} completed`);
    });
    job.on('failed', (errorMessage) => {
      console.log(`Seat reservation job ${job.id} failed: ${errorMessage}`);
    });
  }
});

app.get('/process', async (_, res) => {
  res.json({ status: 'Queue processing' });
  queue.process('reserve_seat', async (_, done) => {
    const currentAvailableSeats = await getCurrentAvailableSeats();
    if (currentAvailableSeats <= 0) {
      reservationEnabled = false;
      done(new Error('Not enough seats available'));
    } else {
      reserveSeat(currentAvailableSeats - 1);
      done();
    }
  });
});

app.listen(port, () => {
  reserveSeat(50);
  console.log(`Server running on port ${port}`);
});
