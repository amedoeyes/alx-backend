import kue from 'kue';

const queue = kue.createQueue();

const job = queue.create('push_notification_code', {
  phoneNumber: '1234567890',
  message: 'This is the code to verify your account',
});

job.on('enqueue', () => {
  console.log(`Notification job created: ${job.id}`);
});

job.on('complete', () => {
  console.log('Notification job completed');
});

job.on('failed', () => {
  console.log('Notification job failed');
});

job.save();
