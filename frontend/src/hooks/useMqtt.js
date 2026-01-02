import { useEffect, useRef, useState } from 'react';

// Lightweight MQTT hook for browser (requires broker with WebSocket enabled)
// Usage:
// const { connected, lastMessage, publish, subscribe } = useMqtt({
//   url: 'ws://broker-host:port',
//   options: { clientId: 'dashboard-' + Math.random().toString(16).slice(2) },
//   topics: ['sensors/mq2', 'sensors/mq7', 'sensors/mq135', 'fans/status']
// });

export default function useMqtt({ url, options = {}, topics = [] }) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function connect() {
      try {
        // Dynamic import to avoid bundler polyfill issues
        const mqttLib = await import('mqtt/dist/mqtt.min.js');
        const mqtt = mqttLib.default || mqttLib;
        const client = mqtt.connect(url, options);
        clientRef.current = client;

        client.on('connect', () => {
          if (!isMounted) return;
          setConnected(true);
          // Subscribe initial topics
          if (topics && topics.length) {
            client.subscribe(topics, (err) => {
              if (err) console.error('MQTT subscribe error', err);
            });
          }
        });

        client.on('message', (topic, payload) => {
          if (!isMounted) return;
          const text = payload.toString();
          setLastMessage({ topic, payload: text, ts: Date.now() });
          setMessages((prev) => ({ ...prev, [topic]: text }));
        });

        client.on('error', (err) => {
          console.error('MQTT error', err);
        });

        client.on('close', () => {
          if (!isMounted) return;
          setConnected(false);
        });
      } catch (e) {
        console.error('MQTT init failed', e);
      }
    }

    connect();

    return () => {
      isMounted = false;
      try {
        clientRef.current?.end(true);
      } catch {}
    };
  }, [url]);

  const publish = (topic, message, opts) => {
    clientRef.current?.publish(topic, message, opts);
  };

  const subscribe = (topicOrTopics) => {
    if (!clientRef.current) return;
    clientRef.current.subscribe(topicOrTopics, (err) => {
      if (err) console.error('MQTT subscribe error', err);
    });
  };

  const unsubscribe = (topicOrTopics) => {
    if (!clientRef.current) return;
    clientRef.current.unsubscribe(topicOrTopics, (err) => {
      if (err) console.error('MQTT unsubscribe error', err);
    });
  };

  return { connected, messages, lastMessage, publish, subscribe, unsubscribe };
}
