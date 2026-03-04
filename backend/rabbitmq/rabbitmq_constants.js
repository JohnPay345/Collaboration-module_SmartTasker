export const RabbitMQ_Settings = {
  exchanges: [
    {
      "name": "notifications",
      "type": "direct",
      "durable": false
    },
    {
      "name": "chat",
      "type": "direct",
      "durable": true
    }
  ],
  queues: [
    {
      "name": "notifications.push",
      "durable": true
    },
    {
      "name": "chat.deliver",
      "durable": true
    }
  ],
  bindings: [
    {
      "exchange": "notifications",
      "queue": "notifications.push",
      "routingKey": "notifications.push"
    },
    {
      "exchange": "chat",
      "queue": "chat.deliver",
      "routingKey": "chat.deliver"
    }
  ]
}